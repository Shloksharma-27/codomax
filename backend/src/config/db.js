import mongoose from 'mongoose';
import dns from 'node:dns';

// Ensure SRV records for MongoDB Atlas clusters resolve cleanly across all network environments
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Use default OS DNS if setServers is restricted
}

export async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ MONGO_URI is not set in environment variables. Check your .env file.');
    process.exit(1);
  }

  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error(`⚠️ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected.');
    });

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB initial connection error: ${error.message}`);
    process.exit(1);
  }
}
