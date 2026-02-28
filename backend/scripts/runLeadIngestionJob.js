import 'dotenv/config.js';
import { enqueueLeadFetchJob, startLeadIngestionQueue, shutdownLeadIngestionQueue } from '../src/jobs/leadIngestionQueue.js';

const query = process.argv[2] || 'plumbers in Austin';

async function main() {
  try {
    startLeadIngestionQueue();
    const jobId = await enqueueLeadFetchJob({ query });

    // eslint-disable-next-line no-console
    console.log(`Lead ingestion fetch job queued with id: ${jobId}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to enqueue lead ingestion job:', error.message);
    process.exitCode = 1;
  } finally {
    setTimeout(async () => {
      await shutdownLeadIngestionQueue();
    }, 1000);
  }
}

main();
