import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { inMemoryStore } from '@/lib/db/store';
import { SimulationItem } from '@/lib/db/types';

export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || authUser.workspaceId;

    let simulations = Array.from(inMemoryStore.simulations.values()).filter((s) => s.workspaceId === workspaceId);

    // If empty, generate shadow mode mock simulations demonstrating what Ordis would do
    if (simulations.length === 0) {
      const mock1: SimulationItem = {
        id: `sim_${Date.now()}_1`,
        workspaceId,
        triggeredBy: 'Inbound Contact Form from Apex Robotics (11:15 PM)',
        actionPlanned: 'Auto-send introductory email with 3 open calendar slots and create CRM record in Won stage',
        predictedOutcome: '100% immediate response SLA achieved without manual intervention',
        confidenceScore: 96,
        simulatedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      };

      const mock2: SimulationItem = {
        id: `sim_${Date.now()}_2`,
        workspaceId,
        triggeredBy: 'Task "Brand Guidelines" detected at 20% completion with 24h deadline',
        actionPlanned: 'Auto-reassign asset compilation subtask to Priya Mehta (35% bandwidth)',
        predictedOutcome: 'Deadline protected with zero delivery delay',
        confidenceScore: 92,
        simulatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      };

      inMemoryStore.simulations.set(mock1.id, mock1);
      inMemoryStore.simulations.set(mock2.id, mock2);
      simulations = [mock1, mock2];
    }

    return NextResponse.json({ simulations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
