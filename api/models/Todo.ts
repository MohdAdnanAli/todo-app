import { Schema, model, Types } from 'mongoose';

const todoSchema = new Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  completed: {
    type: Boolean,
    default: false,
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
  },
  dueDate: {
    type: Date,
    default: null,
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

// Compound index for efficient querying by user and order
todoSchema.index({ user: 1, order: 1 });

export const Todo = model('Todo', todoSchema);