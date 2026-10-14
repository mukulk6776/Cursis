import { inMemoryStore } from './store';
import { Meeting, Task } from './types';
import { createTask } from './tasks';
import { getWorkspaceTeam } from './team';
import { getCollection } from '@/lib/mongodb';

export async function getMeetings(workspaceId: string): Promise<Meeting[]> {
  try {
    const col = await getCollection<Meeting>('meetings');
    if (col) {
      const docs = await col.find({ workspaceId }).sort({ scheduledAt: -1 }).toArray();
      docs.forEach((m) => inMemoryStore.meetings.set(m.id, m));
      return docs;
    }
  } catch (e) {
    console.warn('MongoDB getMeetings notice:', e);
  }

  return Array.from(inMemoryStore.meetings.values())
    .filter((m) => m.workspaceId === workspaceId)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
}

export async function getMeetingById(id: string): Promise<Meeting | null> {
  const mem = inMemoryStore.meetings.get(id);
  if (mem) return mem;

  try {
    const col = await getCollection<Meeting>('meetings');
    if (col) {
      const found = await col.findOne({ id });
      if (found) {
        inMemoryStore.meetings.set(id, found);
        return found;
      }
    }
  } catch (e) {
    console.warn('MongoDB getMeetingById notice:', e);
  }

  return null;
}

export async function createMeeting(workspaceId: string, data: Partial<Meeting>): Promise<Meeting> {
  if (data.id) {
    const existing = inMemoryStore.meetings.get(data.id);
    if (existing) {
      const err: any = new Error(`Meeting with ID ${data.id} already exists`);
      err.statusCode = 409;
      throw err;
    }
  }

  const id = data.id || `mtg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const title = data.title || data.name || 'Untitled Meeting';
  const scheduledAt = data.scheduledAt || new Date().toISOString();
  const platform = data.platform || 'google_meet';

  const meeting: Meeting = {
    id,
    workspaceId,
    projectId: data.projectId,
    title,
    name: title,
    platform,
    meetingUrl: data.meetingUrl?.trim() || '',
    scheduledAt,
    date: data.date || scheduledAt.split('T')[0],
    time: data.time || (scheduledAt.includes('T') ? scheduledAt.split('T')[1].substring(0, 5) : '10:00'),
    durationMinutes: data.durationMinutes || data.duration || 30,
    duration: data.duration || data.durationMinutes || 30,
    hostId: data.hostId || 'usr_owner_default',
    hostName: data.hostName || 'Host',
    attendees: data.attendees || data.participants || [],
    participants: data.participants || data.attendees || [],
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

  try {
    const col = await getCollection<Meeting>('meetings');
    if (col) {
      await col.insertOne(meeting);
    }
  } catch (e) {
    console.warn('MongoDB insert meeting notice:', e);
  }

  return meeting;
}

export async function deleteMeeting(id: string): Promise<boolean> {
  const deletedMem = inMemoryStore.meetings.delete(id);
  let deletedMongo = false;
  try {
    const col = await getCollection<Meeting>('meetings');
    if (col) {
      const res = await col.deleteOne({ id });
      deletedMongo = res.deletedCount > 0;
    }
  } catch (e) {
    console.warn('MongoDB delete meeting notice:', e);
  }
  return deletedMem || deletedMongo;
}

export async function updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting | null> {
  const existing = inMemoryStore.meetings.get(id);
  if (!existing) return null;

  // Protect immutable identifiers: id, workspaceId, hostId, createdAt
  const { id: _id, workspaceId: _wsId, hostId: _hostId, createdAt: _createdAt, ...allowedUpdates } = updates as any;

  const title = allowedUpdates.title || allowedUpdates.name || existing.title;
  const scheduledAt = allowedUpdates.scheduledAt || existing.scheduledAt;

  const updated: Meeting = {
    ...existing,
    ...allowedUpdates,
    id: existing.id,
    workspaceId: existing.workspaceId,
    hostId: existing.hostId,
    createdAt: existing.createdAt,
    title,
    name: title,
    date: allowedUpdates.date || (scheduledAt ? scheduledAt.split('T')[0] : existing.date),
    time: allowedUpdates.time || (scheduledAt && scheduledAt.includes('T') ? scheduledAt.split('T')[1].substring(0, 5) : existing.time),
    updatedAt: new Date().toISOString(),
  };

  inMemoryStore.meetings.set(id, updated);

  try {
    const col = await getCollection<Meeting>('meetings');
    if (col) {
      await col.updateOne({ id, workspaceId: existing.workspaceId }, { $set: updated });
    }
  } catch (e) {
    console.warn('MongoDB update meeting notice:', e);
  }

  return updated;
}


// Ordis Engine: Turn meeting into summary, auto-tasks, and follow-up draft
export async function processMeetingWithOrdis(
  meetingId: string,
  workspaceId: string
): Promise<{ meeting: Meeting; createdTasks: Task[] }> {
  const meeting = await getMeetingById(meetingId);
  if (!meeting) throw new Error('Meeting not found');

  // 1. Summary from genuine notes or transcript
  if (!meeting.summary) {
    if (meeting.notes?.trim()) {
      meeting.summary = meeting.notes.trim();
    } else if (meeting.transcript?.trim()) {
      meeting.summary = meeting.transcript.trim().slice(0, 500);
    } else {
      meeting.summary = 'No meeting notes or transcript recorded.';
    }
  }

  // 2. Only create tasks for explicit action items provided that do not have tasks yet
  const createdTasks: Task[] = [];
  const existingActionItems = meeting.actionItems || [];
  const updatedActionItems = [];

  for (const item of existingActionItems) {
    if (item.createdTaskId) {
      updatedActionItems.push(item);
      continue;
    }
    const task = await createTask(workspaceId, {
      projectId: meeting.projectId,
      title: item.text,
      description: `Action item from meeting: "${meeting.title}"`,
      assigneeId: item.assigneeId,
      assigneeName: item.assigneeName,
      dueDate: item.dueDate || new Date(Date.now() + 2 * 86400000).toISOString(),
      priority: 'high',
      tags: ['Meeting-Action-Item'],
    });

    createdTasks.push(task);
    updatedActionItems.push({
      ...item,
      createdTaskId: task.id,
    });
  }
  meeting.actionItems = updatedActionItems;

  // 3. Generate Follow-Up Email Draft if attendees exist
  if (!meeting.followUpEmailDraft && meeting.attendees?.length > 0) {
    const validRecipients = meeting.attendees.filter((a) => a.includes('@'));
    if (validRecipients.length > 0) {
      meeting.followUpEmailDraft = {
        to: validRecipients,
        subject: `Follow-up: ${meeting.title}`,
        body: `Hi Team,\n\nNotes from our meeting "${meeting.title}":\n\n${meeting.summary}\n\n${
          createdTasks.length > 0
            ? 'Action Items:\n' + createdTasks.map((t) => `- ${t.title} (${t.assigneeName || 'Unassigned'})`).join('\n')
            : ''
        }\n\nBest regards,\n${meeting.hostName || 'Meeting Host'}`,
        status: 'draft',
      };
    }
  }

  meeting.processedByOrdis = true;
  meeting.updatedAt = new Date().toISOString();
  inMemoryStore.meetings.set(meetingId, meeting);

  try {
    const col = await getCollection<Meeting>('meetings');
    if (col) {
      await col.updateOne({ id: meetingId }, { $set: meeting }, { upsert: true });
    }
  } catch (e) {
    console.warn('MongoDB processMeetingWithOrdis notice:', e);
  }

  return { meeting, createdTasks };
}
