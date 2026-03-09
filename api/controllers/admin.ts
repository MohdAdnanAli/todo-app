
import type { Request, Response } from 'express';
import { User } from '../models/User';
import { Todo } from '../models/Todo';
import { logger } from '../utils/logger';
import { healthCheck } from '../utils/database';

/**
 * Admin Controller - Full backend management
 * All routes are protected by adminProtect middleware
 */

interface AdminRequest extends Request {
  user?: { id: string; email: string };
}

// ───────────────────────────────────────────────
// Dashboard & Stats
// ───────────────────────────────────────────────

/**
 * Get comprehensive dashboard statistics - OPTIMIZED with single aggregation pipeline
 */
export const getDashboardStats = async (req: AdminRequest, res: Response) => {
  try {
    // Use single aggregation pipeline for all stats - much faster than individual queries
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [userStats, todoStats, activeUsersResult] = await Promise.all([
      // Single aggregation for all user stats
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
          }
        }
      ]),
      // Single aggregation for all todo stats
      Todo.aggregate([
        {
          $group: {
            _id: null,
            totalTodos: { $sum: 1 },
            completedTodos: { $sum: { $cond: ['$completed', 1, 0] } },
          }
        }
      ]),
      // Active users in last 7 days
      User.countDocuments({ lastLoginAt: { $gte: sevenDaysAgo } }),
    ]);

    const totalUsers = userStats[0]?.totalUsers || 0;
    const totalTodos = todoStats[0]?.totalTodos || 0;
    const completedTodos = todoStats[0]?.completedTodos || 0;
    const pendingTodos = totalTodos - completedTodos;

    // Get todo completion rate
    const completionRate = totalTodos > 0 
      ? Math.round((completedTodos / totalTodos) * 100) 
      : 0;

    // Get recent users - lean query with projection
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('email displayName createdAt lastLoginAt')
      .lean();

    res.json({
      stats: {
        totalUsers,
        totalTodos,
        completedTodos,
        pendingTodos,
        completionRate,
        activeUsers: activeUsersResult,
      },
      recentUsers,
    });
  } catch (err) {
    logger.error('[Admin] getDashboardStats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// ───────────────────────────────────────────────
// User Management
// ───────────────────────────────────────────────

/**
 * Get all users with pagination and filters
 */
export const getAllUsers = async (req: AdminRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
      ];
    }

    // Execute query with pagination - use lean() for faster queries
    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-password -emailVerificationToken -passwordResetToken -__v')
        .lean(),
      User.countDocuments(query),
    ]);

    // Get todo counts using aggregation for better performance (single query instead of N+1)
    const userIds = users.map((u: any) => u._id);
    const todoStats = await Todo.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: '$user', total: { $sum: 1 }, completed: { $sum: { $cond: ['$completed', 1, 0] } } } }
    ]);

    // Create a map for quick lookup
    const todoStatsMap = new Map(todoStats.map((stat: any) => [stat._id.toString(), stat]));

    // Map users with their todo counts
    const usersWithCounts = users.map((user: any) => {
      const stats = todoStatsMap.get(user._id.toString()) || { total: 0, completed: 0 };
      return {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        todoCount: stats.total,
        completedCount: stats.completed,
        completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      };
    });

    res.json({
      users: usersWithCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error('[Admin] getAllUsers error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

/**
 * Get single user details with all their todos
 */
export const getUserDetails = async (req: AdminRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password -emailVerificationToken -passwordResetToken -__v')
      .lean();
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const todos = await Todo.find({ user: userId })
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();

    // Use single reduce pass instead of two filter passes for efficiency
    const todoStats = todos.reduce((acc: { completed: number; pending: number }, t: any) => {
      if (t.completed) acc.completed++;
      else acc.pending++;
      return acc;
    }, { completed: 0, pending: 0 });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      todos: {
        total: todos.length,
        completed: todoStats.completed,
        pending: todoStats.pending,
        items: todos,
      },
    });
  } catch (err) {
    logger.error('[Admin] getUserDetails error:', err);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
};

/**
 * Update user profile (admin can modify any field)
 */
export const updateUser = async (req: AdminRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { displayName, bio, avatar, emailVerified } = req.body;

    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (emailVerified !== undefined) updateData.emailVerified = emailVerified;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-password -emailVerificationToken -passwordResetToken -__v').lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user });
  } catch (err) {
    logger.error('[Admin] updateUser error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

/**
 * Delete a user and all their data
 */
export const deleteUser = async (req: AdminRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user?.id) {
      return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }

    // Delete all todos for this user
    await Todo.deleteMany({ user: userId });

    // Delete the user
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User and all associated data deleted successfully' });
  } catch (err) {
    logger.error('[Admin] deleteUser error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// ───────────────────────────────────────────────
// Todo Management
// ───────────────────────────────────────────────

/**
 * Get all todos across all users
 */
export const getAllTodos = async (req: AdminRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const completed = req.query.completed as string;
    const search = req.query.search as string || '';

    const query: any = {};
    if (completed !== undefined && completed !== 'all') {
      query.completed = completed === 'true';
    }
    if (search) {
      query.text = { $regex: search, $options: 'i' };
    }

    const [todos, total] = await Promise.all([
      Todo.find(query)
        .populate('user', 'email displayName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-__v')
        .lean(),
      Todo.countDocuments(query),
    ]);

    res.json({
      todos: todos.map((todo: any) => ({
        _id: todo._id,
        text: todo.text,
        completed: todo.completed,
        category: todo.category,
        priority: todo.priority,
        createdAt: todo.createdAt,
        updatedAt: todo.updatedAt,
        user: todo.user ? {
          id: todo.user._id,
          email: todo.user.email,
          displayName: todo.user.displayName,
        } : null,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error('[Admin] getAllTodos error:', err);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
};

/**
 * Delete any todo
 */
export const deleteTodo = async (req: AdminRequest, res: Response) => {
  try {
    const { todoId } = req.params;

    const todo = await Todo.findByIdAndDelete(todoId);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted successfully' });
  } catch (err) {
    logger.error('[Admin] deleteTodo error:', err);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
};

/**
 * Delete multiple todos
 */
export const deleteMultipleTodos = async (req: AdminRequest, res: Response) => {
  try {
    const { todoIds } = req.body;

    if (!Array.isArray(todoIds) || todoIds.length === 0) {
      return res.status(400).json({ error: 'No todo IDs provided' });
    }

    const result = await Todo.deleteMany({ _id: { $in: todoIds } });

    res.json({ 
      message: `${result.deletedCount} todos deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    logger.error('[Admin] deleteMultipleTodos error:', err);
    res.status(500).json({ error: 'Failed to delete todos' });
  }
};

// ───────────────────────────────────────────────
// System Health
// ───────────────────────────────────────────────

/**
 * Get system health information
 */
export const getSystemHealth = async (req: AdminRequest, res: Response) => {
  try {
    // Use the new enhanced health check from database utility
    const healthResult = await healthCheck();
    
    res.json({
      status: healthResult.status,
      timestamp: new Date().toISOString(),
      database: {
        state: healthResult.details.connectionState,
        isConnected: healthResult.details.isConnected,
        databaseName: healthResult.details.databaseName,
        collections: healthResult.details.collections,
        avgDocumentSize: healthResult.details.avgDocumentSize,
        dataSize: healthResult.details.dataSize,
        storageSize: healthResult.details.storageSize,
        responseTime: healthResult.responseTime,
        ...(healthResult.errors && { errors: healthResult.errors }),
      },
      uptime: process.uptime ? `${Math.floor(process.uptime())}s` : 'N/A',
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (err) {
    logger.error('[Admin] getSystemHealth error:', err);
    res.status(500).json({ error: 'Failed to get system health' });
  }
};

