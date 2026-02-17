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
}, {
  timestamps: true,
});

export const Todo = model('Todo', todoSchema);