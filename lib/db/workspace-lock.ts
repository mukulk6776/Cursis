import { AsyncLocalStorage } from 'node:async_hooks';

interface WorkspaceLockContext {
  heldWorkspaces: Set<string>;
}

const lockContext = new AsyncLocalStorage<WorkspaceLockContext>();

class WorkspaceLockManager {
  private queues = new Map<string, Promise<void>>();

  /**
   * Executes an asynchronous task exclusively for a given workspace.
   * Tasks targeting the same workspace are queued and executed sequentially (FIFO).
   * Tasks targeting different workspaces execute concurrently in parallel.
   * Re-entrant calls within the same asynchronous call stack execute immediately without deadlocking.
   */
  async withWorkspaceLock<T>(
    workspaceId: string | null | undefined,
    fn: () => Promise<T>
  ): Promise<T> {
    const key = (workspaceId || 'ws_default').trim();
    const context = lockContext.getStore();

    // Re-entrancy guard: if current execution chain already holds this workspace lock, proceed directly
    if (context && context.heldWorkspaces.has(key)) {
      return await fn();
    }

    const previousPromise = this.queues.get(key) || Promise.resolve();

    let releaseLock!: () => void;
    const currentPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    // Chain our lock to the queue tail
    const queueTail = previousPromise.catch(() => {}).then(() => currentPromise);
    this.queues.set(key, queueTail);

    // Wait for prior operations on this workspace to settle
    await previousPromise.catch(() => {});

    const updatedHeld = new Set(context?.heldWorkspaces || []);
    updatedHeld.add(key);

    try {
      return await lockContext.run({ heldWorkspaces: updatedHeld }, fn);
    } finally {
      releaseLock();
      // Clean up idle workspace queue from Map to prevent memory leaks
      if (this.queues.get(key) === queueTail) {
        this.queues.delete(key);
      }
    }
  }
}

export const workspaceLockManager = new WorkspaceLockManager();

export async function withWorkspaceLock<T>(
  workspaceId: string | null | undefined,
  fn: () => Promise<T>
): Promise<T> {
  return workspaceLockManager.withWorkspaceLock(workspaceId, fn);
}
