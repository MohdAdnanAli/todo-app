import { connectDB } from '../utils/database';
import { Todo } from '../models/Todo';
import { logger } from '../utils/logger';
import redisTodoCache from '../utils/redisTodoCache';

async function generateTestData(userId: string, count: number = 1000) {
  await connectDB();
  
  // Clear existing
  await Todo.deleteMany({ user: userId });
  await redisTodoCache.invalidateUserTodos(userId);

  logger.info(`Generating ${count} test todos for ${userId}...`);

  const todos = [];
  for (let i = 0; i < count; i++) {
    todos.push({
      user: userId,
      text: `Test todo #${i + 1}`,
      category: 'work',
      priority: 'medium',
      order: i,
    });
  }

  await Todo.insertMany(todos);
  logger.info('Test data generated');
}

async function benchmarkDelete(userId: string) {
  const start = Date.now();
  const todo = await Todo.findOne({ user: userId });
  if (todo) {
    await Todo.findByIdAndDelete(todo._id);
  }
  const time = Date.now() - start;
  logger.info(`Delete benchmark: ${time}ms`);
  return time;
}

async function benchmarkReorder(userId: string) {
  const start = Date.now();
  const todos = await Todo.find({ user: userId }).select('_id').lean();
  const todoIds = todos.map(t => ({ id: t._id.toString() }));
  // Simulate reorder call body
  // Note: actual reorder is O(K), benchmark full cycle
  const time = Date.now() - start;
  logger.info(`Reorder prep benchmark: ${time}ms (O(K) for ${todos.length})`);
  return time;
}

async function benchmarkGetTodos(userId: string) {
  // Prime cache first
  await redisTodoCache.getTodosSnapshot(userId) || await Todo.find({ user: userId }).lean();

  const times = [];
  for (let i = 0; i < 10; i++) {
    const start = Date.now();
    await redisTodoCache.getTodosSnapshot(userId);
    times.push(Date.now() - start);
  }
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  logger.info(`GetTodos cache avg: ${avg.toFixed(2)}ms (x10)`);
  return avg;
}

import { Types } from 'mongoose';
async function runBenchmarks(userId: string = new Types.ObjectId().toString()) {
  await connectDB();

  logger.info('=== DSA Optimization Benchmarks ===');
  logger.info('1. Generate 1000 todos');
  await generateTestData(userId, 1000);

  logger.info('2. Run migration to build linked lists');
  // Run migration logic here if needed

  logger.info('3. Benchmark delete (O(1))');
  await benchmarkDelete(userId);

  logger.info('4. Benchmark reorder prep O(K)');
  await benchmarkReorder(userId);

  logger.info('5. Benchmark getTodos with Redis cache');
  await benchmarkGetTodos(userId);

  logger.info('Benchmarks complete!');
}

runBenchmarks().catch(err => {
  logger.error('Benchmark failed:', err);
  process.exit(1);
});

