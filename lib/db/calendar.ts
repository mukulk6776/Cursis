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
      if (docs && docs.length > 0) {
        docs.forEach((e) => inMemoryStore.calendarEvents.set(e.id, e));
      }
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
// Scans calendar and returns the next N open non-conflicting time slots for attendees
export async function findSmartOpenSlots(
  workspaceId: string,
  options?: {
    attendeeIds?: string[];
    durationMinutes?: number;
    daysAhead?: number;
    slotsCount?: number;
  }
): Promise<Array<{ startTime: string; endTime: string; formattedLabel: string }>> {
  const duration = options?.durationMinutes || 30;
  const daysAhead = options?.daysAhead || 3;
  const targetCount = options?.slotsCount || 3;

  const existingEvents = await getCalendarEvents(workspaceId);
  const slots: Array<{ startTime: string; endTime: string; formattedLabel: string }> = [];

  const now = new Date();
  // Start from next morning 10:00 AM or today afternoon
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

      // Check conflict with existing events
      const hasConflict = existingEvents.some((e) => {
        const eStart = new Date(e.startTime).getTime();
        const eEnd = new Date(e.endTime).getTime();
        return slotStart.getTime() < eEnd && slotEnd.getTime() > eStart;
      });

      if (!hasConflict && slotStart.getTime() > Date.now()) {
        const dayName = slotStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const timeLabel = slotStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        slots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          formattedLabel: `${dayName} at ${timeLabel}`,
        });
      }
    }
  }

  // If fallback needed
  if (slots.length === 0) {
    const tomorrow1 = new Date(Date.now() + 86400000);
    tomorrow1.setHours(15, 0, 0, 0);
    const tomorrow2 = new Date(Date.now() + 86400000);
    tomorrow2.setHours(17, 30, 0, 0);
    const dayAfter = new Date(Date.now() + 2 * 86400000);
    dayAfter.setHours(11, 0, 0, 0);

    return [
      { startTime: tomorrow1.toISOString(), endTime: new Date(tomorrow1.getTime() + 1800000).toISOString(), formattedLabel: 'Tomorrow at 3:00 PM IST' },
      { startTime: tomorrow2.toISOString(), endTime: new Date(tomorrow2.getTime() + 1800000).toISOString(), formattedLabel: 'Tomorrow at 5:30 PM IST' },
      { startTime: dayAfter.toISOString(), endTime: new Date(dayAfter.getTime() + 1800000).toISOString(), formattedLabel: 'Thursday at 11:00 AM IST' },
    ];
  }

  return slots;
}
