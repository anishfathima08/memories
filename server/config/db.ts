import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

export const prisma = new PrismaClient();

export async function checkDbConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Increase MySQL max_allowed_packet dynamically to allow large video/audio base64 data transfers
    try {
      await prisma.$executeRawUnsafe("SET GLOBAL max_allowed_packet = 524288000");
      console.log('🚀 Successfully set MySQL max_allowed_packet to 500MB');
    } catch (packetErr) {
      console.warn('⚠️ Warning: Failed to set GLOBAL max_allowed_packet dynamically. If uploads of large video/audio fail, please set max_allowed_packet in your mysql configuration file (my.ini or my.cnf).', packetErr);
    }

    // Disconnect so that all subsequent lazy-loaded pool connections inherit the 500MB global packet size
    await prisma.$disconnect();
  } catch (err) {
    console.error('❌ Database connection failed');
    console.error(err);
    process.exit(1);
  }
}