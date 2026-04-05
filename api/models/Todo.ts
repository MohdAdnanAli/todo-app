import { Schema, model, Types } from 'mongoose';

// ============================================
// Todo Schema Definition
// ============================================

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
  nextTodoId: {
    type: Types.ObjectId,
    ref: 'Todo',
    default: null,
    index: true,
  },
  prevTodoId: {
    type: Types.ObjectId,
    ref: 'Todo',
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

// ============================================
// Optimized Compound Indexes
// ============================================

// Primary compound index for most common queries (Linked List optimized)
todoSchema.index({ user: 1, nextTodoId: 1 });
todoSchema.index({ user: 1, prevTodoId: 1 });
todoSchema.index({ user: 1, order: 1 }); // Legacy
todoSchema.index({ user: 1, completed: 1 });
todoSchema.index({ user: 1, category: 1 });
todoSchema.index({ user: 1, dueDate: 1 });
todoSchema.index({ user: 1, priority: 1 });
todoSchema.index({ completed: 1, createdAt: -1 });
todoSchema.index({ category: 1, priority: 1 });
todoSchema.index({ user: 1, category: 1, completed: 1 });
todoSchema.index({ createdAt: -1 });
todoSchema.index({ updatedAt: -1 });
todoSchema.index({ text: 'text' });
todoSchema.index({ user: 1, text: 1 }, { unique: true });

// ============================================
// Virtuals
// ============================================

todoSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate) return false;
  return new Date(this.dueDate) < new Date() && !this.completed;
});

todoSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

todoSchema.set('toJSON', { virtuals: true });
todoSchema.set('toObject', { virtuals: true });

// ============================================
// Pre-save Middleware
// ============================================

todoSchema.pre('save', function(next) {
  if (this.text) {
    this.text = this.text.trim();
  }
  
  if (this.tags && Array.isArray(this.tags)) {
    this.tags = this.tags.map((tag: string) => tag.trim().toLowerCase()).filter((tag: string) => tag.length > 0);
  }
  
  next();
});

// ============================================
// Export Model
// ============================================

export const Todo = model('Todo', todoSchema);

export default Todo;

