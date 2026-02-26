import { offlineStorage } from './offlineStorage';
import type { Todo } from '../types';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  action?: string;
}

export interface QuickStartTask {
  id: string;
  text: string;
  completed: boolean;
  hint: string;
}

// Welcome tour steps
export const WELCOME_TOUR_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to TodoPro! 🎉',
    description: 'Your advanced task management app with offline support, drag-and-drop, and smart categories.',
    icon: '👋',
    action: 'next',
  },
  {
    id: 'add-task',
    title: 'Add Your First Task ➕',
    description: 'Click the input field above and type your first task. You can set priority, category, and due date!',
    icon: '📝',
    action: 'next',
  },
  {
    id: 'categories',
    title: 'Organize with Categories 🏷️',
    description: 'Use categories (Work, Personal, Shopping, Health) to keep tasks organized. Click ⚙️ to access options.',
    icon: '📂',
    action: 'next',
  },
  {
    id: 'priorities',
    title: 'Set Priorities ⚡',
    description: 'Mark tasks as High, Medium, or Low priority. High priority tasks stand out!',
    icon: '🎯',
    action: 'next',
  },
  {
    id: 'drag-drop',
    title: 'Drag to Reorder 🎮',
    description: 'Grab the handle (≡) on any task and drag to reorder. Your custom order is saved!',
    icon: '🚀',
    action: 'next',
  },
  {
    id: 'offline',
    title: 'Works Offline 📴',
    description: 'All your tasks are saved locally. Continue working without internet!',
    icon: '🌐',
    action: 'next',
  },
  {
    id: 'install-app',
    title: 'Install as App 📱',
    description: 'Click "Install" when prompted to add TodoPro to your home screen for quick access.',
    icon: '💾',
    action: 'complete',
  },
];

// Quick-start checklist tasks
export const QUICK_START_TASKS: QuickStartTask[] = [
  {
    id: 'first-task',
    text: 'Add your first task',
    completed: false,
    hint: 'Click the input field and type a task name',
  },
  {
    id: 'categorize',
    text: 'Organize with categories',
    completed: false,
    hint: 'Add a task and assign it to a category (Work, Personal, etc.)',
  },
  {
    id: 'set-priority',
    text: 'Set task priorities',
    completed: false,
    hint: 'Create a High priority task to see it highlighted',
  },
];

// Example todos to pre-populate
export const EXAMPLE_TODOS: Omit<Todo, '_id' | 'createdAt' | 'updatedAt'>[] = [
  {
    text: '📧 Check welcome email for tips',
    completed: false,
    category: 'personal',
    priority: 'high',
    tags: ['getting-started'],
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    order: 0,
  },
  {
    text: '🚀 Set up your first project',
    completed: false,
    category: 'work',
    priority: 'high',
    tags: ['getting-started'],
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // In 2 days
    order: 1,
  },
  {
    text: '🎯 Review your goals for this week',
    completed: false,
    category: 'personal',
    priority: 'medium',
    tags: ['getting-started', 'planning'],
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // In 3 days
    order: 2,
  },
];

export const onboardingService = {
  // Check if user has completed onboarding
  async hasCompletedOnboarding(): Promise<boolean> {
    const metadata = await offlineStorage.getMetadata('onboarding-completed');
    return metadata?.completed === true;
  },

  // Mark onboarding as completed
  async markOnboardingAsCompleted(): Promise<void> {
    await offlineStorage.updateMetadata('onboarding-completed', {
      completed: true,
      completedAt: Date.now(),
    });
  },

  // Get current tour step
  async getCurrentTourStep(): Promise<string> {
    const metadata = await offlineStorage.getMetadata('tour-step');
    return metadata?.step || 'welcome';
  },

  // Update tour step
  async setCurrentTourStep(stepId: string): Promise<void> {
    await offlineStorage.updateMetadata('tour-step', {
      step: stepId,
      updatedAt: Date.now(),
    });
  },

  // Get quick-start progress
  async getQuickStartProgress(): Promise<QuickStartTask[]> {
    const metadata = await offlineStorage.getMetadata('quick-start-progress');
    return metadata?.tasks || QUICK_START_TASKS;
  },

  // Update quick-start task
  async updateQuickStartTask(taskId: string, completed: boolean): Promise<void> {
    const progress = await this.getQuickStartProgress();
    const updated = progress.map(t =>
      t.id === taskId ? { ...t, completed } : t
    );
    await offlineStorage.updateMetadata('quick-start-progress', {
      tasks: updated,
      updatedAt: Date.now(),
    });
  },

  // Check if all quick-start tasks are done
  async isQuickStartComplete(): Promise<boolean> {
    const tasks = await this.getQuickStartProgress();
    return tasks.every(t => t.completed);
  },

  // Create example todos for new user
  async createExampleTodos(): Promise<void> {
    const todos = await offlineStorage.getAllTodos();
    
    // Only create examples if user has no todos
    if (todos.length === 0) {
      const exampleTodosWithIds = EXAMPLE_TODOS.map((todo, index) => ({
        ...todo,
        _id: `example-${index}-${Date.now()}`,
        createdAt: new Date().toISOString(),
      }));

      await offlineStorage.saveTodos(exampleTodosWithIds);
    }
  },

  // Skip onboarding
  async skipOnboarding(): Promise<void> {
    await this.markOnboardingAsCompleted();
    await offlineStorage.updateMetadata('onboarding-skipped', {
      skipped: true,
      skippedAt: Date.now(),
    });
  },

  // Get onboarding status
  async getOnboardingStatus() {
    const completed = await this.hasCompletedOnboarding();
    const currentStep = await this.getCurrentTourStep();
    const quickStartProgress = await this.getQuickStartProgress();
    const quickStartComplete = await this.isQuickStartComplete();

    return {
      completed,
      currentStep,
      quickStartProgress,
      quickStartComplete,
      completionPercentage: Math.round(
        (quickStartProgress.filter(t => t.completed).length / quickStartProgress.length) * 100
      ),
    };
  },

  // Reset onboarding (for testing/demo)
  async resetOnboarding(): Promise<void> {
    await offlineStorage.updateMetadata('onboarding-completed', { completed: false });
    await offlineStorage.updateMetadata('tour-step', { step: 'welcome' });
    await offlineStorage.updateMetadata('quick-start-progress', { tasks: QUICK_START_TASKS });
  },
};
