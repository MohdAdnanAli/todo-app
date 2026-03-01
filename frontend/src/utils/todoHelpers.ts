import type { TodoCategory, TodoPriority } from '../types';

// ============================================
// SHARED CONSTANTS - Centralized for consistency
// ============================================

export const CATEGORY_COLORS: Record<TodoCategory, string> = {
  work: '#818cf8',
  personal: '#f43f5e',
  shopping: '#fb923c',
  health: '#34d399',
  other: '#94a3b8',
};

export const PRIORITY_COLORS: Record<TodoPriority, { bg: string; border: string; label: string }> = {
  low: { bg: 'rgba(156, 163, 175, 0.15)', border: '#9ca3af', label: 'Low' },
  medium: { bg: 'rgba(234, 179, 8, 0.15)', border: '#eab308', label: 'Med' },
  high: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', label: 'High' },
};

export const CATEGORIES: { value: TodoCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'health', label: 'Health' },
  { value: 'other', label: 'Other' },
];

export const PRIORITIES: { value: TodoPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

// ============================================
// SMART ICON COLOR LOGIC
// ============================================

/**
 * Determine icon color based on todo text, completion status, and category
 * Uses smart keyword detection as fallback
 */
export function getIconColor(todoText: string, isCompleted: boolean, category?: TodoCategory): string {
  // Completed items always use muted gray
  if (isCompleted) return '#9ca3af';
  
  // Use category color if available
  if (category && CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];

  // Smart keyword detection for auto-categorization
  const lowerText = todoText.toLowerCase();
  
  if (lowerText.includes('work') || lowerText.includes('meeting') || lowerText.includes('project') || 
      lowerText.includes('deadline') || lowerText.includes('office')) return '#818cf8';
      
  if (lowerText.includes('buy') || lowerText.includes('shopping') || lowerText.includes('order') || 
      lowerText.includes('grocery')) return '#fb923c';
      
  if (lowerText.includes('health') || lowerText.includes('doctor') || lowerText.includes('medicine') || 
      lowerText.includes('fitness') || lowerText.includes('gym') || lowerText.includes('workout')) return '#f43f5e';
      
  if (lowerText.includes('bill') || lowerText.includes('payment') || lowerText.includes('money') || 
      lowerText.includes('budget') || lowerText.includes('tax')) return '#34d399';
      
  if (lowerText.includes('travel') || lowerText.includes('trip') || lowerText.includes('flight') || 
      lowerText.includes('vacation')) return '#22d3ee';
      
  if (lowerText.includes('study') || lowerText.includes('learn') || lowerText.includes('course') || 
      lowerText.includes('homework') || lowerText.includes('exam')) return '#c084fc';
      
  if (lowerText.includes('code') || lowerText.includes('programming') || lowerText.includes('computer') || 
      lowerText.includes('server')) return '#94a3b8';
      
  if (lowerText.includes('urgent') || lowerText.includes('important') || lowerText.includes('asap')) return '#fbbf24';
  
  // Default to work color
  return '#818cf8';
}

// ============================================
// DATE FORMATTING HELPERS
// ============================================

/**
 * Format due date to a human-readable string
 * Returns null if no due date
 */
export function formatDueDate(dueDate?: string | null): string | null {
  if (!dueDate) return null;
  
  try {
    return new Date(dueDate).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return null;
  }
}

// ============================================
// STABLE KEY GENERATOR
// ============================================

/**
 * Generate a stable key for todo items
 * Prefers using a combination that won't cause React to unmount/remount
 */
export function getTodoKey(todo: { _id: string; text?: string; updatedAt?: string }, index: number): string {
  return `${todo._id}-${index}`;
}

// ============================================
// FILTER PRESETS
// ============================================

export type FilterPreset = 'all' | 'active' | 'completed';

export const FILTER_PRESETS: { value: FilterPreset; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

