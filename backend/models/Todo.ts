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
    index: true,           // faster queries when filtering by user
  },
}, {
  timestamps: true,
});

export const Todo = model('Todo', todoSchema);