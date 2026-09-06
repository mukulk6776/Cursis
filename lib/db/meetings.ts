import { inMemoryStore } from './store';
import { Meeting, Task } from './types';
import { createTask } from './tasks';
import { getWorkspaceTeam } from './team';

export async function getMeetings(workspaceId: string): Promise<Meeting[]> {
  return Array.from(inMemoryStore.meetings.values())
    .filter((m) => m.workspaceId === workspaceId)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
}

export async function getMeetingById(id: string): Promise<Meeting | null> {
  return inMemoryStore.meetings.get(id) || null;
}

export async function createMeeting(workspaceId: string, data: Partial<Meeting>): Promise<Meeting> {
  const id = `mtg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const title = data.title || data.name || 'Untitled Meeting';
  const scheduledAt = data.scheduledAt || new Date().toISOString();
  const platform = data.platform || 'google_meet';
  const defaultUrl = platform === 'zoom'
    ? 'https://zoom.us/j/new'
    : platform === 'teams'
    ? 'https://teams.microsoft.com'
    : 'https://meet.google.com/new';

  const meeting: Meeting = {
    id,
    workspaceId,
    projectId: data.projectId,
    title,
    name: title,
    platform,
    meetingUrl: data.meetingUrl?.trim() || defaultUrl,
    scheduledAt,
    date: data.date || scheduledAt.split('T')[0],
    time: data.time || (scheduledAt.includes('T') ? scheduledAt.split('T')[1].substring(0, 5) : '10:00'),
    durationMinutes: data.durationMinutes || data.duration || 30,
    duration: data.duration || data.durationMinutes || 30,
    hostId: data.hostId || 'usr_owner_demo',
    hostName: data.hostName || 'Host',
    attendees: data.attendees || data.participants || ['founder@cursis.ai'],
    participants: data.participants || data.attendees || ['founder@cursis.ai'],
    status: data.status || 'scheduled',
    agenda: data.agenda || '',
    transcript: data.transcript,
    notes: data.notes || '',
    summary: data.summary,
    actionItems: data.actionItems || [],
    followUpEmailDraft: data.followUpEmailDraft,
    processedByOrdis: Boolean(data.processedByOrdis),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  inMemoryStore.meetings.set(id, meeting);

  // If meeting has a transcript/notes and is not processed yet, automatically process it!
  if ((data.transcript || data.notes) && !data.processedByOrdis) {
    await processMeetingWithOrdis(id, workspaceId);
  }

  return meeting;
}

export async function updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting | null> {
  const existing = inMemoryStore.meetings.get(id);
  if (!existing) return null;

  const title = updates.title || updates.name || existing.title;
  const scheduledAt = updates.scheduledAt || existing.scheduledAt;

  const updated: Meeting = {
    ...existing,
    ...updates,
    title,
    name: title,
    date: updates.date || (scheduledAt ? scheduledAt.split('T')[0] : existing.date),
    time: updates.time || (scheduledAt && scheduledAt.includes('T') ? scheduledAt.split('T')[1].substring(0, 5) : existing.time),
    updatedAt: new Date().toISOString(),
  };

  inMemoryStore.meetings.set(id, updated);
  return updated;
}

export async function deleteMeeting(id: string): Promise<boolean> {
  return inMemoryStore.meetings.delete(id);
}

// Ordis Engine: Turn meeting into summary, auto-tasks, and follow-up draft
export async function processMeetingWithOrdis(
  meetingId: string,
  workspaceId: string
): Promise<{ meeting: Meeting; createdTasks: Task[] }> {
  const meeting = inMemoryStore.meetings.get(meetingId);
  if (!meeting) throw new Error('Meeting not found');

  const team = await getWorkspaceTeam(workspaceId);

  // 1. Generate Intelligent Summary
  if (!meeting.summary) {
    meeting.summary = meeting.notes
      ? `Summary based on notes: ${meeting.notes.slice(0, 150)}...`
      : `Meeting concluded covering scope alignment, deliverables, and timeline milestones. Aligned on execution velocity and client deliverables.`;
  }

  // 2. Extract Action Items & Assign Tasks Automatically
  const createdTasks: Task[] = [];
  const primaryAssignee = team[0] || { id: meeting.hostId || 'usr_host', displayName: 'Meeting Host' };
  const secondaryAssignee = team[1] || primaryAssignee;

  const actionItemsData = meeting.actionItems.length > 0
    ? meeting.actionItems
    : [
        {
          id: `ai_${Date.now()}_1`,
          text: `Prepare action items and deliverable specifications for "${meeting.title}"`,
          assigneeName: primaryAssignee.displayName,
          assigneeId: primaryAssignee.id,
          dueDate: new Date(Date.now() + 86400000).toISOString(),
        },
        {
          id: `ai_${Date.now()}_2`,
          text: `Follow up with meeting participants on milestones and deliverables`,
          assigneeName: secondaryAssignee.displayName,
          assigneeId: secondaryAssignee.id,
          dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
        },
      ];

  meeting.actionItems = [];

  for (const item of actionItemsData) {
    const task = await createTask(workspaceId, {
      projectId: meeting.projectId,
      title: item.text,
      description: `Auto-generated by Ordis from meeting: "${meeting.title}"`,
      assigneeId: item.assigneeId,
      assigneeName: item.assigneeName,
      dueDate: item.dueDate || new Date(Date.now() + 2 * 86400000).toISOString(),
      priority: 'high',
      tags: ['Meeting-Generated', 'Ordis-Automated'],
    });

    createdTasks.push(task);

    meeting.actionItems.push({
      ...item,
      createdTaskId: task.id,
    });
  }

  // 3. Generate Ready Follow-Up Email Draft
  if (!meeting.followUpEmailDraft) {
    meeting.followUpEmailDraft = {
      to: meeting.attendees.filter((a) => a.includes('@') && !a.endsWith('@cursis.ai')),
      subject: `Follow-up: ${meeting.title} — Summary & Action Items`,
      body: `Hi Team,\n\nThank you for the productive call today regarding ${meeting.title}.\n\nKey Summary:\n${meeting.summary}\n\nAction Items & Owners:\n${createdTasks.map((t) => `- ${t.title} (Assigned to ${t.assigneeName || 'Team'})`).join('\n')}\n\nEverything is underway.\n\nBest regards,\nCursis Team`,
      status: 'draft',
    };
  }

  meeting.processedByOrdis = true;
  inMemoryStore.meetings.set(meetingId, meeting);

  return { meeting, createdTasks };
}
