/**
 * Database Connection Test Script
 * Run with: npx tsx scripts/test-db-connection.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  
  try {
    // Test 1: Simple query
    console.log('Test 1: Checking database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful!\n');

    // Test 2: Count records
    console.log('Test 2: Counting records in Commande table...');
    const commandeCount = await prisma.commande.count();
    console.log(`✅ Found ${commandeCount} commandes\n`);

    // Test 3: Check if database URL is set
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      // Mask password in URL for security
      const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
      console.log(`📋 Database URL: ${maskedUrl}`);
      console.log(`   Host: ${new URL(dbUrl).hostname}`);
      console.log(`   Port: ${new URL(dbUrl).port || '5432 (default)'}\n`);
    } else {
      console.log('⚠️  DATABASE_URL environment variable is not set!\n');
    }

    console.log('✅ All connection tests passed!');
  } catch (error: any) {
    console.error('\n❌ Database connection failed!\n');
    console.error('Error details:');
    console.error('Message:', error.message);
    console.error('Code:', error.code || 'N/A');
    
    if (error.message?.includes('Can\'t reach database server')) {
      console.error('\n💡 Troubleshooting steps:');
      console.error('1. Check if your Neon database is paused');
      console.error('   → Go to https://console.neon.tech and check your database status');
      console.error('   → If paused, click "Resume" to wake it up');
      console.error('2. Verify your DATABASE_URL is correct');
      console.error('   → Check your .env file');
      console.error('   → Ensure the connection string is valid');
      console.error('3. Check your network connection');
      console.error('   → Ensure you can reach the Neon servers');
      console.error('4. Verify database credentials');
      console.error('   → Check if your database password has expired');
      console.error('   → Regenerate connection string if needed');
    } else if (error.code === 'P1001') {
      console.error('\n💡 This is a connection timeout error.');
      console.error('   Your database might be paused or unreachable.');
      console.error('   Check your Neon dashboard: https://console.neon.tech');
    } else if (error.code === 'P1017') {
      console.error('\n💡 Database server closed the connection.');
      console.error('   This might indicate the database is paused or restarting.');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
