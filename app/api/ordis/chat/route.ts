import { NextRequest, NextResponse } from 'next/server';
import { executeGeminiOrdisChat } from '@/lib/ordis/gemini';
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
      plan: 'paid',
      user: { id: 'u_commander', name: 'Commander', email: 'commander@cursis.io', role: 'Owner' },
      workspace: { name: 'Cursis Workspace', plan: 'Enterprise Pro ($1B Tier)' },
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

    const userApiKey = body.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const model = body.model || 'gemini-2.5-flash';

    let result;
    let engineSource: 'gemini' | 'local_fallback' = 'local_fallback';

    if (userApiKey && userApiKey.trim() !== '' && userApiKey !== 'PLACEHOLDER') {
      try {
        result = await executeGeminiOrdisChat(message, history, state, { apiKey: userApiKey, model });
        engineSource = 'gemini';
      } catch (err) {
        console.warn('Gemini chat execution error, failing over to local engine:', err);
        result = executeOrdisCommand(message, state);
        engineSource = 'local_fallback';
      }
    } else {
      result = executeOrdisCommand(message, state);
      engineSource = 'local_fallback';
    }

    // Record audit trail if possible
    try {
      const auditCol = await getCollection<AuditLogEntry>('audit_logs');
      if (auditCol) {
        await auditCol.insertOne({
          id: 'aud_chat_' + Date.now(),
          workspaceId: state.activeWorkspace?.id || 'ws_cursis_main',
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
