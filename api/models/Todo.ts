import { Schema, model, Types } from 'mongoose';

const todoSchema = new Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
    index: 'text',
  },
  completed: {
    type: Boolean,
    default: false,
    index: true,
  },
  user: {
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  category: {
    type: String,
    enum: ['work', 'personal', 'shopping', 'health', 'other'],
    default: 'other',
    index: true,
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50,
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    index: true,
  },
  dueDate: {
    type: Date,
    default: null,
    index: true,
  },
  order: {
    type: Number,
    default: 0,
    index: true,
  },
  participants: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String },
  }],
}, {
  timestamps: true,
});

// Compound indexes for efficient querying
todoSchema.index({ user: 1, order: 1 });
todoSchema.index({ user: 1, completed: 1 });
todoSchema.index({ user: 1, category: 1 });
todoSchema.index({ user: 1, dueDate: 1 });
todoSchema.index({ completed: 1, createdAt: -1 });
todoSchema.index({ category: 1, priority: 1 });
todoSchema.index({ createdAt: -1 });
todoSchema.index({ updatedAt: -1 });

export const Todo = model('Todo', todoSchema);
