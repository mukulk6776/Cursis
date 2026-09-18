import { NextRequest, NextResponse } from 'next/server';
import { executeGroqOrdisChat, resolveGroqApiKey } from '@/lib/ordis/groq';
import { executeOrdisCommand, OrdisContextState } from '@/lib/ordis/engine';
import { getCollection } from '@/lib/mongodb';
import { AuditLogEntry } from '@/lib/db/types';
import { getAuthenticatedUser } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    // Require authentication — prevents unauthenticated LLM calls and identity spoofing
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const message = body.message || body.prompt || body.command || body.text;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Chat message or prompt is required' },
        { status: 400 }
      );
    }

    const history = Array.isArray(body.history) ? body.history : [];

    // Build state from the authenticated user — never trust client-supplied identity
    const state: OrdisContextState = {
      ...(body.state || {}),
      user: {
        id: authUser.uid,
        name: authUser.displayName,
        email: authUser.email,
        role: authUser.role,
      },
    };

    // Fill in workspace defaults if not provided by client
    if (!state.workspace) {
      state.workspace = { name: 'Cursis Workspace', plan: 'Cursis Standard' };
    }
    if (!state.activeWorkspace) {
      state.activeWorkspace = {
        id: authUser.workspaceId || `ws_${authUser.uid}`,
        name: state.workspace.name,
        role: authUser.role,
      } as any;
    }
    if (!state.ordisSettings) {
      state.ordisSettings = {
        mode: 'proactive',
        tone: 'friendly',
        briefingTime: '09:00',
        proactiveScanner: true,
        morningBriefing: true,
        allowTaskCreation: true,
        allowMeetingScheduling: true,
        allowWorkloadRebalancing: true,
      };
    }

    // Use server-side API key only — never accept key from client body
    const groqKey = resolveGroqApiKey();
    const model = typeof body.model === 'string' && body.model && !body.model.startsWith('gemini')
      ? body.model
      : 'openai/gpt-oss-20b';

    let result;
    let engineSource: 'groq' | 'local_fallback' = 'local_fallback';

    if (groqKey) {
      try {
        result = await executeGroqOrdisChat(message, history, state, { apiKey: groqKey, model });
        engineSource = 'groq';
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        console.warn('Groq chat execution notice, using workspace engine fallback:', errMsg);
        result = executeOrdisCommand(message, state);
        engineSource = 'local_fallback';
      }
    } else {
      result = executeOrdisCommand(message, state);
      engineSource = 'local_fallback';
    }

    const targetWsId = state.activeWorkspace?.id && state.activeWorkspace.id !== 'ws_default' && state.activeWorkspace.id !== 'ws_public'
      ? state.activeWorkspace.id
      : authUser.workspaceId || 'ws_cursis_main';

    // Persist any created or updated entities directly to MongoDB collections
    if (result?.stateMutations) {
      const m = result.stateMutations;

      // 1. Created Task
      if (m.createdTask) {
        try {
          const col = await getCollection<any>('tasks');
          if (col) {
            const rawTask = m.createdTask as any;
            const taskDoc = {
              id: m.createdTask.id,
              workspaceId: targetWsId,
              title: m.createdTask.name || rawTask.title || 'Untitled Task',
              description: m.createdTask.description || '',
              status: m.createdTask.status === 'completed' ? 'done' : (m.createdTask.status || 'todo'),
              priority: m.createdTask.priority || 'high',
              assigneeId: m.createdTask.assignee || rawTask.assigneeId || undefined,
              dueDate: m.createdTask.deadline ? new Date(m.createdTask.deadline).toISOString() : new Date(Date.now() + 3 * 86400000).toISOString(),
              tags: m.createdTask.tags || ['AI-Dispatched'],
              subtasks: m.createdTask.subtasks || [],
              creatorId: authUser.uid,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await col.updateOne({ id: taskDoc.id }, { $set: taskDoc }, { upsert: true });
          }
        } catch (e) {
          console.warn('Ordis MongoDB persist task notice:', e);
        }
      }

      // 2. Updated Tasks
      if (Array.isArray(m.updatedTasks)) {
        try {
          const col = await getCollection<any>('tasks');
          if (col) {
            for (const ut of m.updatedTasks) {
              const mappedStatus = ut.status === 'completed' ? 'done' : ut.status;
              await col.updateOne(
                { id: ut.id, workspaceId: targetWsId },
                { $set: { status: mappedStatus, updatedAt: new Date().toISOString() } }
              );
            }
          }
        } catch (e) {
          console.warn('Ordis MongoDB update tasks notice:', e);
        }
      }

      // 3. Created Project
      if (m.createdProject) {
        try {
          const col = await getCollection<any>('projects');
          if (col) {
            const rawProj = m.createdProject as any;
            const projDoc = {
              id: m.createdProject.id,
              workspaceId: targetWsId,
              name: m.createdProject.name,
              description: m.createdProject.desc || rawProj.description || '',
              budget: 25000,
              deadline: m.createdProject.deadline || new Date(Date.now() + 30 * 86400000).toISOString(),
              health: 'on_track',
              progressPercent: 0,
              ownerId: authUser.uid,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await col.updateOne({ id: projDoc.id }, { $set: projDoc }, { upsert: true });
          }
        } catch (e) {
          console.warn('Ordis MongoDB persist project notice:', e);
        }
      }

      // 4. Created Meeting / Calendar Event
      if (m.createdMeeting) {
        try {
          const col = await getCollection<any>('meetings');
          if (col) {
            const mtgDoc = {
              id: m.createdMeeting.id,
              workspaceId: targetWsId,
              title: m.createdMeeting.name || m.createdMeeting.title,
              date: m.createdMeeting.date,
              time: m.createdMeeting.time,
              platform: m.createdMeeting.platform || 'google_meet',
              meetingUrl: m.createdMeeting.meetingUrl || 'https://meet.google.com/cursis-ai-sync',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await col.updateOne({ id: mtgDoc.id }, { $set: mtgDoc }, { upsert: true });
          }

          // Also persist into calendar_events collection
          const calCol = await getCollection<any>('calendar_events');
          if (calCol) {
            const calDoc = {
              id: `evt_${m.createdMeeting.id}`,
              workspaceId: targetWsId,
              title: m.createdMeeting.name || m.createdMeeting.title,
              description: m.createdMeeting.agenda || '',
              startTime: new Date().toISOString(),
              endTime: new Date(Date.now() + 3600000).toISOString(),
              allDay: false,
              attendeeIds: [authUser.uid],
              meetLink: m.createdMeeting.meetingUrl || '',
              type: 'meeting',
              createdAt: new Date().toISOString(),
            };
            await calCol.updateOne({ id: calDoc.id }, { $set: calDoc }, { upsert: true });
          }
        } catch (e) {
          console.warn('Ordis MongoDB persist meeting notice:', e);
        }
      }

      // 5. Created Team Member Invitation & Profile
      if (m.createdInvitation) {
        try {
          const invCol = await getCollection<any>('invitations');
          if (invCol) {
            const invDoc = {
              ...m.createdInvitation,
              workspaceId: targetWsId,
              createdAt: m.createdInvitation.sentAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await invCol.updateOne({ id: invDoc.id }, { $set: invDoc }, { upsert: true });
          }
        } catch (e) {
          console.warn('Ordis MongoDB persist invitation notice:', e);
        }
      }

      if (m.createdEmployee) {
        try {
          const empCol = await getCollection<any>('employees');
          if (empCol) {
            const empDoc = {
              ...m.createdEmployee,
              workspaceId: targetWsId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await empCol.updateOne({ id: empDoc.id }, { $set: empDoc }, { upsert: true });
          }
        } catch (e) {
          console.warn('Ordis MongoDB persist employee notice:', e);
        }
      }

      // 6. Created Document
      if (m.createdDocument) {
        try {
          const col = await getCollection<any>('documents');
          if (col) {
            await col.updateOne(
              { id: m.createdDocument.id },
              { $set: { ...m.createdDocument, workspaceId: targetWsId } },
              { upsert: true }
            );
          }
        } catch (e) {}
      }

      // 7. Created Automation
      if (m.createdAutomation) {
        try {
          const col = await getCollection<any>('automations');
          if (col) {
            await col.updateOne(
              { id: m.createdAutomation.id },
              { $set: { ...m.createdAutomation, workspaceId: targetWsId } },
              { upsert: true }
            );
          }
        } catch (e) {}
      }
    }

    // Record audit trail
    try {
      const auditCol = await getCollection<AuditLogEntry>('audit_logs');
      if (auditCol) {
        await auditCol.insertOne({
          id: `aud_chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          workspaceId: targetWsId,
          actorType: 'ordis_assisted',
          actorId: authUser.uid,
          actorName: authUser.displayName,
          action: 'ordis.chat.message',
          targetType: 'ordis_copilot',
          targetId: message.substring(0, 40),
          details: { message, source: engineSource, model },
          isRollbackable: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch {
      // Non-blocking telemetry
    }

    return NextResponse.json({
      success: true,
      data: result,
      source: engineSource,
      model: engineSource === 'groq' ? model : 'ordis-deterministic-v2',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal error in Ordis Chatbot service',
      },
      { status: 500 }
    );
  }
}
