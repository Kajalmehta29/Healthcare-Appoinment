import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || '';
let redisConnection: Redis | null = null;

let emailRetryQueue: Queue | null = null;
let medicationReminderQueue: Queue | null = null;
let appointmentReminderQueue: Queue | null = null;

if (REDIS_URL) {
  console.log(`Connecting to Redis for background jobs at: ${REDIS_URL}`);
  try {
    redisConnection = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
    });

    redisConnection.on('error', (err) => {
      console.warn('Redis connection failed. Background jobs will use the in-memory fallback simulator.', err.message);
      redisConnection = null;
    });

    emailRetryQueue = new Queue('email-retry', { connection: redisConnection });
    medicationReminderQueue = new Queue('medication-reminder', { connection: redisConnection });
    appointmentReminderQueue = new Queue('appointment-reminder', { connection: redisConnection });
  } catch (error: any) {
    console.warn('Failed to initialize BullMQ with Redis. Falling back to in-memory queues:', error.message);
  }
} else {
  console.log('REDIS_URL is not set in environment. Running background jobs in in-memory simulator mode.');
}

/**
 * Queue jobs dispatcher
 */
export const dispatchJob = async (
  queueName: 'email-retry' | 'medication-reminder' | 'appointment-reminder',
  jobName: string,
  data: any,
  opts?: { delay?: number; repeat?: any }
) => {
  // If Redis & BullMQ are available, use them
  if (redisConnection) {
    try {
      if (queueName === 'email-retry' && emailRetryQueue) {
        await emailRetryQueue.add(jobName, data, {
          attempts: 5,
          backoff: { type: 'exponential', delay: 5000 },
          ...opts,
        });
        return;
      }
      if (queueName === 'medication-reminder' && medicationReminderQueue) {
        await medicationReminderQueue.add(jobName, data, opts);
        return;
      }
      if (queueName === 'appointment-reminder' && appointmentReminderQueue) {
        await appointmentReminderQueue.add(jobName, data, opts);
        return;
      }
    } catch (err: any) {
      console.warn(`BullMQ dispatch failed for queue ${queueName}:`, err.message);
    }
  }

  // In-Memory Simulation Fallback (runs in background thread via setTimeout)
  const delayMs = opts?.delay || 0;
  console.log(`[IN-MEMORY QUEUE SIMULATOR] Scheduled job "${jobName}" on queue "${queueName}" with delay ${delayMs}ms`);

  setTimeout(async () => {
    try {
      const { processJob } = await import('./worker');
      await processJob(queueName, jobName, data);
    } catch (error) {
      console.error(`Error executing in-memory job "${jobName}":`, error);
    }
  }, delayMs);
};
