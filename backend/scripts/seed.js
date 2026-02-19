/**
 * Database Seed Script
 * Populates local database with test data for development
 * 
 * Usage:
 *   npm run seed:dev
 * 
 * This script:
 * - Creates test users
 * - Creates test interactions
 * - Creates test exports
 * - Clears data if --clean flag is passed
 */

import 'dotenv/config.js';
import { createClient } from '@supabase/supabase-js';
import logger from '../src/utils/logger.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const isDev = process.env.NODE_ENV === 'development';
const shouldClean = process.argv.includes('--clean');

/**
 * Test users to seed
 */
const testUsers = [
  {
    id: 'testuid00001xxxxxxxxx0001001',  // Exactly 28 chars
    email: 'developer@clientmapr.dev',
    full_name: 'Developer User',
    phone_number: '+1234567890',
    avatar_url: 'https://ui-avatars.com/api/?name=Developer+User',
    subscription_tier: 'professional',
    status: 'active',
    email_verified: true,
    last_login: new Date().toISOString(),
  },
  {
    id: 'testuid00002xxxxxxxxx0002002',  // Exactly 28 chars
    email: 'tester@clientmapr.dev',
    full_name: 'Tester User',
    phone_number: '+9876543210',
    avatar_url: 'https://ui-avatars.com/api/?name=Tester+User',
    subscription_tier: 'starter',
    status: 'active',
    email_verified: true,
    last_login: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'testuid00003xxxxxxxxx0003003',  // Exactly 28 chars
    email: 'freemium@clientmapr.dev',
    full_name: 'Freemium User',
    phone_number: null,
    avatar_url: null,
    subscription_tier: 'free_trial',
    status: 'active',
    email_verified: false,
    last_login: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * Clean database tables
 */
async function cleanDatabase() {
  try {
    logger.info('🧹 Cleaning database tables...');

    // Delete in order of foreign key dependencies
    await supabase.from('exports').delete().neq('id', '');
    await supabase.from('interactions').delete().neq('id', '');
    await supabase.from('subscriptions').delete().neq('id', '');
    await supabase.from('users').delete().neq('id', '');

    logger.info('✅ Database cleaned');
  } catch (error) {
    logger.error('Error cleaning database:', error);
    throw error;
  }
}

/**
 * Seed test users
 */
async function seedUsers() {
  try {
    logger.info('👥 Seeding test users...');

    const { data, error } = await supabase.from('users').insert(testUsers).select();

    if (error) {
      logger.error('Error seeding users:', error);
      throw error;
    }

    logger.info(`✅ Seeded ${data.length} users`);
    return data;
  } catch (error) {
    logger.error('Error seeding users:', error);
    throw error;
  }
}

/**
 * Seed test interactions
 */
async function seedInteractions(users) {
  try {
    logger.info('🔗 Seeding test interactions...');

    // Get some test leads first
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id')
      .limit(5);

    if (leadsError || !leads || leads.length === 0) {
      logger.warn('No leads found, skipping interactions seeding');
      return;
    }

    const interactions = [];
    const statuses = ['not_contacted', 'contacted', 'qualified', 'rejected', 'won'];

    // Create interactions for each user with random leads
    for (const user of users.slice(0, 2)) {
      for (const lead of leads.slice(0, 3)) {
        interactions.push({
          user_id: user.id,
          lead_id: lead.id,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          notes: `Test interaction for ${user.email}`,
          interaction_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    const { data, error } = await supabase.from('interactions').insert(interactions).select();

    if (error) {
      logger.error('Error seeding interactions:', error);
      throw error;
    }

    logger.info(`✅ Seeded ${data.length} interactions`);
  } catch (error) {
    logger.error('Error seeding interactions:', error);
    // Don't throw - interactions are optional
  }
}

/**
 * Seed test exports
 */
async function seedExports(users) {
  try {
    logger.info('📊 Seeding test exports...');

    const exports = [];
    const formats = ['csv', 'excel', 'json'];
    const statuses = ['completed', 'completed', 'pending', 'failed'];

    for (const user of users) {
      for (let i = 0; i < 2; i++) {
        exports.push({
          user_id: user.id,
          format: formats[Math.floor(Math.random() * formats.length)],
          file_name: `export-${Date.now()}-${i}.${formats[i % 3]}`,
          file_path: `/uploads/exports/export-${Date.now()}-${i}.${formats[i % 3]}`,
          record_count: Math.floor(Math.random() * 1000) + 10,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          error_message: null,
        });
      }
    }

    const { data, error } = await supabase.from('exports').insert(exports).select();

    if (error) {
      logger.error('Error seeding exports:', error);
      throw error;
    }

    logger.info(`✅ Seeded ${data.length} exports`);
  } catch (error) {
    logger.error('Error seeding exports:', error);
    // Don't throw - exports are optional
  }
}

/**
 * Main seed function
 */
async function main() {
  try {
    if (!isDev) {
      logger.error('❌ Seeding only allowed in development mode');
      process.exit(1);
    }

    logger.info('🌱 Starting database seeding...');

    if (shouldClean) {
      await cleanDatabase();
    }

    const users = await seedUsers();
    await seedInteractions(users);
    await seedExports(users);

    logger.info('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
main();
