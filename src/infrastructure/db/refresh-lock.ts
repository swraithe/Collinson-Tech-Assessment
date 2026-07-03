import { prisma } from "./prisma.client.js";

const LOCK_TTL_MS = 30_000;
const WAIT_MS = 500;
const MAX_WAIT_ATTEMPTS = 10;

export class RefreshLock {
  async withLock<T>(locationId: string, fn: () => Promise<T>): Promise<T> {
    const acquired = await this.tryAcquire(locationId);

    if (acquired) {
      try {
        return await fn();
      } finally {
        await this.release(locationId);
      }
    }

    for (let i = 0; i < MAX_WAIT_ATTEMPTS; i++) {
      await sleep(WAIT_MS);
      const existing = await this.getValidLock(locationId);
      if (!existing) {
        return fn();
      }
    }

    return fn();
  }

  private async tryAcquire(locationId: string): Promise<boolean> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + LOCK_TTL_MS);

    await prisma.refreshLock.deleteMany({
      where: { locationId, expiresAt: { lt: now } },
    });

    try {
      await prisma.refreshLock.create({
        data: { locationId, lockedAt: now, expiresAt },
      });
      return true;
    } catch {
      return false;
    }
  }

  private async getValidLock(locationId: string) {
    const now = new Date();
    return prisma.refreshLock.findFirst({
      where: { locationId, expiresAt: { gt: now } },
    });
  }

  private async release(locationId: string): Promise<void> {
    await prisma.refreshLock.deleteMany({ where: { locationId } });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const refreshLock = new RefreshLock();
