import { NextRequest, NextResponse } from 'next/server';
import { executeGeminiOrdisChat, resolveGeminiApiKey } from '@/lib/ordis/gemini';
import { executeOrdisCommand, OrdisContextState } from '@/lib/ordis/engine';
import { getCollection } from '@/lib/mongodb';
import { AuditLogEntry } from '@/lib/db/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = body.message || body.prompt || body.command || body.text;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Chat message or prompt is required' },
        { status: 400 }
      );
    }

    const history = Array.isArray(body.history) ? body.history : [];
    const state: OrdisContextState = body.state || {
      user: { id: 'u_commander', name: 'Commander', email: 'commander@cursis.io', role: 'Owner' },
      workspace: { name: 'Cursis Workspace', plan: 'Cursis Standard' },
      activeWorkspace: { id: 'ws_cursis_main', name: 'Cursis Workspace', role: 'owner' } as any,
      employees: [],
      projects: [],
      tasks: [],
      meetings: [],
      notifications: [],
      activity: [],
      automations: [],
      documents: [],
      crm: { deals: [], contacts: [] } as any,
      integrations: [],
      webhooks: [],
      apiKeys: [],
      workspaceSettings: {} as any,
      teamSettings: {} as any,
      notificationSettings: {} as any,
      meetingCalendarSettings: {} as any,
      ordisSettings: {
        mode: 'proactive',
        tone: 'friendly',
        briefingTime: '09:00',
        proactiveScanner: true,
        morningBriefing: true,
        allowTaskCreation: true,
        allowMeetingScheduling: true,
        allowWorkloadRebalancing: true,
      },
    };

    // Always try server-side env fallback (.env.local) when client-provided key is empty
    const userApiKey = resolveGeminiApiKey(body.apiKey) || resolveGeminiApiKey();
    let model = body.model || 'gemini-3.6-flash';
    if (
      typeof model !== 'string' ||
      model.includes('2.5') ||
      model.includes('2.0') ||
      model.includes('1.5') ||
      model.includes('3.7') ||
      !['gemini-3.6-flash', 'gemini-3.8-flash'].includes(model)
    ) {
      model = 'gemini-3.6-flash';
    }

    let result;
    let engineSource: 'gemini' | 'local_fallback' = 'local_fallback';

    if (userApiKey) {
      try {
        result = await executeGeminiOrdisChat(message, history, state, { apiKey: userApiKey, model });
        engineSource = 'gemini';
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        console.error('Gemini chat execution error:', errMsg);
        return NextResponse.json({
          success: true,
          data: {
            responseText: `**⚠️ Gemini API Error**\n\n${errMsg}\n\nPlease check your API key and billing at [ai.google.dev](https://ai.google.dev).`,
            suggestedFollowUps: ['Try again', 'Check API key status'],
          },
          source: 'error',
          model: model,
          error: errMsg,
        });
      }
    } else {
      return NextResponse.json({
        success: true,
        data: {
          responseText: '**⚠️ No Gemini API Key Found**\n\nNo API key is configured. Please add your `GEMINI_API_KEY` to `.env.local` or set it in Settings.',
          suggestedFollowUps: ['How do I set up my API key?'],
        },
        source: 'error',
        model: 'none',
        error: 'No API key configured',
      });
    }

    const targetWsId = state.activeWorkspace?.id && state.activeWorkspace.id !== 'ws_default' && state.activeWorkspace.id !== 'ws_public'
      ? state.activeWorkspace.id
      : 'ws_cursis_main';

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
              creatorId: state.user?.id || 'usr_ai',
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
                { id: ut.id },
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
              ownerId: state.user?.id || 'usr_ai',
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
              attendeeIds: [state.user?.id || 'usr_ai'],
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

    // Record audit trail if possible
    try {
      const auditCol = await getCollection<AuditLogEntry>('audit_logs');
      if (auditCol) {
        await auditCol.insertOne({
          id: 'aud_chat_' + Date.now(),
          workspaceId: targetWsId,
          actorType: 'ordis_assisted',
          actorId: state.user?.id || 'usr_ai',
          actorName: state.user?.name || 'User',
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
      model: engineSource === 'gemini' ? model : 'ordis-deterministic-v2',
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
