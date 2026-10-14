import { inMemoryStore } from './store';
import { CalendarEvent } from './types';
import { getCollection } from '@/lib/mongodb';

export async function getCalendarEvents(
  workspaceId: string,
  filter?: { startDate?: string; endDate?: string; attendeeId?: string }
): Promise<CalendarEvent[]> {
  try {
    const col = await getCollection<CalendarEvent>('calendar_events');
    if (col) {
      const docs = await col.find({ workspaceId }).toArray();
      // Authoritative DB read: update inMemoryStore cache
      docs.forEach((e) => inMemoryStore.calendarEvents.set(e.id, e));
      return docs
        .filter((evt) => {
          if (filter?.startDate && new Date(evt.endTime).getTime() < new Date(filter.startDate).getTime()) return false;
          if (filter?.endDate && new Date(evt.startTime).getTime() > new Date(filter.endDate).getTime()) return false;
          if (filter?.attendeeId && !evt.attendeeIds.includes(filter.attendeeId)) return false;
          return true;
        })
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }
  } catch (e) {
    console.warn('MongoDB getCalendarEvents notice:', e);
  }

  return Array.from(inMemoryStore.calendarEvents.values())
    .filter((evt) => {
      if (evt.workspaceId !== workspaceId) return false;
      if (filter?.startDate && new Date(evt.endTime).getTime() < new Date(filter.startDate).getTime()) return false;
      if (filter?.endDate && new Date(evt.startTime).getTime() > new Date(filter.endDate).getTime()) return false;
      if (filter?.attendeeId && !evt.attendeeIds.includes(filter.attendeeId)) return false;
      return true;
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

export async function createCalendarEvent(workspaceId: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
  const id = data.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const event: CalendarEvent = {
    id,
    workspaceId,
    title: data.title || 'Untitled Event',
    description: data.description || '',
    startTime: data.startTime || new Date(Date.now() + 86400000).toISOString(),
    endTime: data.endTime || new Date(Date.now() + 86400000 + 1800000).toISOString(),
    allDay: data.allDay || false,
    attendeeIds: data.attendeeIds || ['usr_owner_default'],
    attendeeEmails: data.attendeeEmails || [],
    location: data.location || 'General Event',
    meetLink: data.meetLink || '',
    type: data.type || 'event',
    linkedTaskId: data.linkedTaskId,
    linkedProjectId: data.linkedProjectId,
    createdAt: new Date().toISOString(),
  };

  inMemoryStore.calendarEvents.set(id, event);

  try {
    const col = await getCollection<CalendarEvent>('calendar_events');
    if (col) {
      await col.updateOne({ id }, { $set: event }, { upsert: true });
    }
  } catch (e) {
    console.warn('MongoDB insert calendar event notice:', e);
  }

  return event;
}

export async function getCalendarEventById(id: string): Promise<CalendarEvent | null> {
  const mem = inMemoryStore.calendarEvents.get(id);
  if (mem) return mem;

  try {
    const col = await getCollection<CalendarEvent>('calendar_events');
    if (col) {
      const found = await col.findOne({ id });
      if (found) {
        inMemoryStore.calendarEvents.set(id, found);
        return found;
      }
    }
  } catch (e) {
    console.warn('MongoDB getCalendarEventById notice:', e);
  }

  return null;
}

export async function deleteCalendarEvent(id: string): Promise<boolean> {
  const memDeleted = inMemoryStore.calendarEvents.delete(id);
  let mongoDeleted = false;
  try {
    const col = await getCollection<CalendarEvent>('calendar_events');
    if (col) {
      const res = await col.deleteOne({ id });
      mongoDeleted = res.deletedCount > 0;
    }
  } catch (e) {
    console.warn('MongoDB delete calendar event notice:', e);
  }
  return memDeleted || mongoDeleted;
}

// Ordis Smart Slot Finder Algorithm
// Scans calendar and meetings, returning verified open non-conflicting time slots for attendees
export async function findSmartOpenSlots(
  workspaceId: string,
  options?: {
    attendeeIds?: string[];
    durationMinutes?: number;
    daysAhead?: number;
    slotsCount?: number;
    timezone?: string;
  }
): Promise<Array<{ startTime: string; endTime: string; formattedLabel: string }>> {
  const duration = options?.durationMinutes || 30;
  const daysAhead = options?.daysAhead || 3;
  const targetCount = options?.slotsCount || 3;
  const timezone = options?.timezone || 'UTC';

  const existingEvents = await getCalendarEvents(workspaceId);
  let existingMeetings: any[] = [];
  try {
    const { getMeetings } = await import('./meetings');
    existingMeetings = await getMeetings(workspaceId);
  } catch {}

  const slots: Array<{ startTime: string; endTime: string; formattedLabel: string }> = [];

  const now = new Date();
  const checkDate = new Date(now);
  if (checkDate.getHours() >= 17) {
    checkDate.setDate(checkDate.getDate() + 1);
    checkDate.setHours(10, 0, 0, 0);
  } else {
    checkDate.setHours(Math.max(10, checkDate.getHours() + 2), 0, 0, 0);
  }

  const preferredHours = [10, 11, 14, 15, 16, 17]; // 10 AM, 11 AM, 2 PM, 3 PM, 4 PM, 5 PM

  for (let day = 0; day < daysAhead; day++) {
    if (slots.length >= targetCount) break;

    const currentDay = new Date(checkDate);
    currentDay.setDate(checkDate.getDate() + day);

    // Skip Sundays
    if (currentDay.getDay() === 0) continue;

    for (const hour of preferredHours) {
      if (slots.length >= targetCount) break;

      const slotStart = new Date(currentDay);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + duration * 60000);

      // Check conflict with calendar events
      const hasCalendarConflict = existingEvents.some((e) => {
        const eStart = new Date(e.startTime).getTime();
        const eEnd = new Date(e.endTime).getTime();
        const timeOverlap = slotStart.getTime() < eEnd && slotEnd.getTime() > eStart;
        if (!timeOverlap) return false;
        if (options?.attendeeIds && options.attendeeIds.length > 0) {
          return e.attendeeIds?.some((att) => options.attendeeIds!.includes(att));
        }
        return true;
      });

      // Check conflict with meetings
      const hasMeetingConflict = existingMeetings.some((m) => {
        if (!m.date || !m.time) return false;
        try {
          const mStart = new Date(`${m.date}T${m.time}:00`).getTime();
          const mDur = m.duration || m.durationMinutes || 30;
          const mEnd = mStart + mDur * 60000;
          const timeOverlap = slotStart.getTime() < mEnd && slotEnd.getTime() > mStart;
          if (!timeOverlap) return false;
          if (options?.attendeeIds && options.attendeeIds.length > 0) {
            const participants = m.participants || m.attendees || [];
            return participants.some((att: string) => options.attendeeIds!.includes(att));
          }
          return true;
        } catch {
          return false;
        }
      });

      if (!hasCalendarConflict && !hasMeetingConflict && slotStart.getTime() > Date.now()) {
        let dayName = '';
        let timeLabel = '';
        try {
          dayName = slotStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: timezone });
          timeLabel = slotStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: timezone });
        } catch {
          dayName = slotStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          timeLabel = slotStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        }
        slots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          formattedLabel: `${dayName} at ${timeLabel}`,
        });
      }
    }
  }

  return slots;
}

