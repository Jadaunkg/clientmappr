import 'dotenv/config.js';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import logger from '../src/utils/logger.js';

const hasFlag = (name) => process.argv.includes(`--${name}`);

const getArgValue = (name, fallback) => {
  const prefixed = `--${name}=`;
  const arg = process.argv.find((entry) => entry.startsWith(prefixed));
  return arg ? arg.slice(prefixed.length) : fallback;
};

const runCommand = (command, args = []) => {
  const result = spawnSync(command, args, {
    stdio: 'pipe',
    encoding: 'utf-8',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const stderr = result.stderr || result.stdout || 'Unknown error';
    throw new Error(`${command} failed: ${stderr.trim()}`);
  }

  return result.stdout;
};

const ensureCommand = (command) => {
  runCommand(command, ['--version']);
};

const ensureDirectory = (directoryPath) => {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
};

const buildBackupFilePath = (backupDir) => {
  const datePart = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(backupDir, `clientmapr-backup-${datePart}.dump`);
};

const main = async () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const backupDir = getArgValue('backup-dir', process.env.DB_BACKUP_DIR || path.join(process.cwd(), 'backups'));
  const restore = hasFlag('restore');
  const backupFile = buildBackupFilePath(backupDir);

  ensureDirectory(backupDir);
  ensureCommand('pg_dump');
  ensureCommand('pg_restore');

  logger.info('Starting backup rehearsal', {
    backupDir,
    backupFile,
    restore,
  });

  runCommand('pg_dump', [
    '--format=custom',
    '--no-owner',
    '--no-privileges',
    '--file',
    backupFile,
    databaseUrl,
  ]);

  const listOutput = runCommand('pg_restore', ['--list', backupFile]);
  logger.info('Backup artifact validation passed', {
    listPreview: listOutput.split('\n').slice(0, 5).join(' | '),
  });

  if (restore) {
    runCommand('pg_restore', [
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-privileges',
      '--dbname',
      databaseUrl,
      backupFile,
    ]);

    logger.info('Restore rehearsal completed successfully', { backupFile });
  } else {
    logger.info('Restore rehearsal skipped (dry run). Pass --restore to execute restore.', {
      backupFile,
    });
  }

  process.stdout.write(`${JSON.stringify({ backupFile, restoreExecuted: restore }, null, 2)}\n`);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error('Backup rehearsal failed', { message: error.message });
    process.exit(1);
  });
