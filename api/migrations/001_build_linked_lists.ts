import mongoose from 'mongoose';
import { Todo } from '../models/Todo';
import { logger } from '../utils/logger';
import { connectDB } from '../utils/database';

/**
 * ONE-TIME MIGRATION: Build linked list pointers from existing `order` field
 * Run: ts-node api/migrations/001_build_linked_lists.ts
 * 
 * Before: todos have order: [3,1,4,2] but nextTodoId/prevTodoId = null
 * After:  head(1)→(4)→(3)→(2), prev pointers reverse
 */

async function migrateLinkedLists() {
  await connectDB();
  
  // Process users one-by-one to avoid memory issues
  const db = mongoose.connection.db || mongoose.connection.getClient()?.db() || mongoose.connection.db();
  const users = await db
    .collection('users')
    .find({}, { projection: { _id: 1 } })
    .toArray();

  logger.info(`Migrating ${users.length} users...`);

  let totalTodos = 0;
  for (const user of users) {
    const userId = user._id;
    
    // Get todos sorted by order (stable)
    const todos = await Todo.find({ user: userId })
      .sort({ order: 1, createdAt: -1 })  // Stable sort
      .select('_id order')
      .lean();

    if (todos.length === 0) continue;

    logger.info(`Processing user ${userId} (${todos.length} todos)`);

    const session = await Todo.startSession();
    try {
      await session.withTransaction(async () => {
        // Clear existing links
        await Todo.updateMany(
          { user: userId },
          { $set: { nextTodoId: null, prevTodoId: null } },
          { session }
        );

        // Rebuild chain: todos[0] → todos[1] → ... → todos[n-1]
        for (let i = 0; i < todos.length; i++) {
          const currentId = todos[i]._id;
          const prevId = i > 0 ? todos[i-1]._id : null;
          const nextId = i < todos.length - 1 ? todos[i+1]._id : null;

          await Todo.updateOne(
            { _id: currentId },
            { 
              $set: { 
                prevTodoId: prevId,
                nextTodoId: nextId 
              } 
            },
            { session }
          );
        }
      });
      logger.info(`✅ Migrated user ${userId}: ${todos.length} todos linked`);
      totalTodos += todos.length;
    } catch (err) {
      logger.error(`❌ Migration failed for user ${userId}:`, err);
    } finally {
      session.endSession();
    }
  }

  logger.info(`🎉 Migration complete! Total todos linked: ${totalTodos}`);
  process.exit(0);
}

// Run migration
migrateLinkedLists().catch(err => {
  logger.error('Migration failed:', err);
  process.exit(1);
});

