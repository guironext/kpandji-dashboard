//import { PrismaClient } from "@/generated/prisma";

import { PrismaClient } from "./generated/prisma";
import { config } from "dotenv";

// Ensure environment variables are loaded before PrismaClient initialization
config();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined}

// Prisma 6 reads DATABASE_URL from environment variables (defined in schema.prisma)
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: [
    { emit: 'event', level: 'error' },
    ...(process.env.NODE_ENV === "development" 
      ? [{ emit: 'event', level: 'warn' }, { emit: 'stdout', level: 'error' }, { emit: 'stdout', level: 'warn' }]
      : [{ emit: 'stdout', level: 'error' }]
    ),
  ],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Handle connection errors and reconnect
prisma.$on('error', (e: unknown) => {
  console.error('Prisma Client Error:', e);
});

// Handle warnings in development
if (process.env.NODE_ENV === "development") {
  prisma.$on('warn', (e: unknown) => {
    console.warn('Prisma Client Warning:', e);
  });
}

// Ensure connection is active before queries
async function ensureConnection() {
  try {
    await prisma.$connect();
  } catch (error) {
    console.error('Failed to connect to database:', error);
    // Try to reconnect after a delay
    setTimeout(async () => {
      try {
        await prisma.$disconnect();
        await prisma.$connect();
        console.log('Database reconnected successfully');
      } catch (reconnectError) {
        console.error('Failed to reconnect:', reconnectError);
      }
    }, 2000);
  }
}

// Initialize connection
if (process.env.NODE_ENV !== "production") {
  ensureConnection();
}

// Add connection retry logic
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

// Helper function to execute queries with retry logic
export async function executeWithRetry<T>(
  query: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await query();
    } catch (error: unknown) {
      lastError = error;
      
      // Check if it's a connection error
      const isConnectionError = 
        (error instanceof Error && (
          error.message.includes('connection') ||
          error.message.includes('ConnectionReset') ||
          error.message.includes('closed by the remote host')
        )) ||
        (typeof error === 'object' && error !== null && 'code' in error && 
         (error.code === 'P1001' || error.code === 'P1017' || error.code === 'P1008'));
      
      if (isConnectionError && attempt < maxRetries) {
        console.warn(`Database connection error (attempt ${attempt}/${maxRetries}), retrying...`);
        // Try to reconnect
        try {
          await prisma.$disconnect();
          await prisma.$connect();
        } catch (reconnectError) {
          console.error('Failed to reconnect:', reconnectError);
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
}

