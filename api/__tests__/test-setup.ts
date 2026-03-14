import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

mongoose.set('strictQuery', false);

// In-memory MongoDB for tests - no external DB needed
let mongod: MongoMemoryServer | null = null;

declare global {
  var mongod: MongoMemoryServer | undefined;
}

export {} // Make it a module

export const setupTestDB = async () => {
  if (!global.mongod) {
    global.mongod = await MongoMemoryServer.create({
      instance: {
        port: 0,  // Dynamic port to avoid conflicts
        dbName: 'todo-test',
      },
    });
  }
  const mongod = global.mongod as MongoMemoryServer;
  const uri = mongod.getUri();
  process.env.TEST_DB_URI = uri;
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = 'test-jwt-secret';
  
  await mongoose.connect(uri);
  console.log('🧪 In-memory MongoDB ready:', uri);
};

export const teardownTestDB = async () => {
  try {
    await mongoose.disconnect();
  } catch {}
  if (global.mongod) {
    try {
      await global.mongod.stop();
    } catch {}
  }
  delete process.env.TEST_DB_URI;
  delete process.env.MONGODB_URI;
};

