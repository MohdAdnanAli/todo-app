import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { onboardingService, QUICK_START_TASKS, type QuickStartTask } from '../services/onboarding';

interface QuickStartChecklistProps {
  onComplete?: () => void;
}

const QuickStartChecklist: React.FC<QuickStartChecklistProps> = ({ onComplete }) => {
  const [tasks, setTasks] = useState<QuickStartTask[]>(QUICK_START_TASKS);
  const [isExpanded, setIsExpanded] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const savedTasks = await onboardingService.getQuickStartProgress();
      setTasks(savedTasks);
      setLoading(false);
    } catch (error) {
      console.error('Error loading quick-start tasks:', error);
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentState: boolean) => {
    const newState = !currentState;
    await onboardingService.updateQuickStartTask(taskId, newState);
    
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId ? { ...t, completed: newState } : t
      )
    );

    // Check if all tasks are complete
    const allComplete = tasks.every(t => 
      t.id === taskId ? newState : t.completed
    );

    if (allComplete && onComplete) {
      onComplete();
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const completionPercentage = Math.round((completedCount / tasks.length) * 100);

  if (loading) {
    return null;
  }

  return (
    <div className="mb-6 animate-fade-in">
      <div
        className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20 overflow-hidden"
      >
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-4 flex items-center justify-between hover:bg-indigo-500/5 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20" />
              <Zap size={20} className="text-indigo-500" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-[var(--text-primary)]">Quick Start Checklist</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                {completedCount} of {tasks.length} completed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Progress ring */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-[var(--border-secondary)]"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="2"
                  strokeDasharray={`${(completionPercentage / 100) * 125.6} 125.6`}
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%">
                    <stop offset="0%" stopColor="#667eea" />
                    <stop offset="100%" stopColor="#764ba2" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute text-xs font-semibold text-indigo-500">
                {completionPercentage}%
              </span>
            </div>

            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>

        {/* Tasks list */}
        {isExpanded && (
          <div className="px-4 py-3 border-t border-indigo-500/10 space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-indigo-500/5 transition-colors group"
              >
                <button
                  onClick={() => handleToggleTask(task.id, task.completed)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    task.completed
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 border-indigo-500'
                      : 'border-[var(--border-secondary)] hover:border-indigo-500'
                  }`}
                >
                  {task.completed && <Check size={16} className="text-white" />}
                </button>

                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium text-sm ${
                      task.completed
                        ? 'line-through text-[var(--text-muted)]'
                        : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {task.text}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    💡 {task.hint}
                  </p>
                </div>
              </div>
            ))}

            {completedCount === tasks.length && (
              <div className="mt-4 p-3 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-lg text-center">
                <p className="text-sm font-semibold text-emerald-600">
                  🎉 You've completed the quick start! Ready to master TodoPro?
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickStartChecklist;
