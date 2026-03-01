import { useState } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight,
  FolderOpen,
  Calendar,
  Sparkles,
  Share2,
  Gift,
  Code,
  Zap,
  Palette,
  Users,
  Brain,
  Trophy,
  Focus,
  Heart,
  Mail,
  Bell,
  Flame
} from 'lucide-react';

interface PremiumFeature {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const premiumFeatures: PremiumFeature[] = [
  {
    id: 1,
    icon: <FolderOpen size={64} />,
    title: 'Folder Customization',
    description: 'Organize your tasks into custom folders with personalized icons and colors. Create folders like Work, Personal, Projects, or any category that fits your workflow.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 2,
    icon: <Calendar size={64} />,
    title: 'Due Dates & Smart Sorting',
    description: 'Add due dates to your tasks and let us automatically sort them by deadline. Never miss a priority again with deadline-soonest-first sorting.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 3,
    icon: <Sparkles size={64} />,
    title: 'Beautiful Toast Notifications',
    description: 'Get elegant, animated toast notifications for success and error messages. Stay informed with style - beautiful dismissals and slide-in animations.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 4,
    icon: <Share2 size={64} />,
    title: 'Public Shareable Lists',
    description: 'Share your productivity setup with the world! Generate public links to showcase how you organize your life and inspire others.',
    color: 'from-indigo-500 to-blue-500'
  },
  {
    id: 5,
    icon: <Gift size={64} />,
    title: 'Referral Program',
    description: 'Invite friends and earn rewards! Get exclusive features and badges for every friend who joins. Build your network of productivity champions.',
    color: 'from-rose-500 to-red-500'
  },
  {
    id: 6,
    icon: <Code size={64} />,
    title: 'Embed Widget',
    description: 'Add a "Add this task to your Todo App" widget to any website. Perfect for bloggers, developers, and content creators.',
    color: 'from-orange-500 to-amber-500'
  },
  {
    id: 7,
    icon: <Zap size={64} />,
    title: 'Unlimited Tasks (Free)',
    description: 'No more limits! Create as many tasks as you need, completely free. Your productivity should never be constrained by arbitrary limits.',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: 8,
    icon: <Palette size={64} />,
    title: 'Unlimited Themes',
    description: 'Access hundreds of beautiful themes and color schemes. Express yourself with complete customization of your workspace appearance.',
    color: 'from-violet-500 to-purple-500'
  },
  {
    id: 9,
    icon: <Users size={64} />,
    title: 'Unlimited Sharing',
    description: 'Share unlimited lists with unlimited people. Collaborate without boundaries - family, friends, or teams can all access your shared tasks.',
    color: 'from-teal-500 to-cyan-500'
  },
  {
    id: 10,
    icon: <Brain size={64} />,
    title: 'AI-Powered Task Breakdown',
    description: 'Let AI analyze your tasks and suggest breakdowns, smart priorities, and optimal scheduling based on your work patterns.',
    color: 'from-cyan-500 to-blue-500'
  },
  {
    id: 11,
    icon: <Trophy size={64} />,
    title: 'Gamification System',
    description: 'Earn points, unlock levels, and collect badges as you complete tasks. Stay motivated with streaks, achievements, and progress tracking.',
    color: 'from-amber-500 to-yellow-500'
  },
  {
    id: 12,
    icon: <Focus size={64} />,
    title: 'Focus Mode + Pomodoro',
    description: 'Built-in Pomodoro timer with focus mode. Block distractions, set work intervals, and take productive breaks to maximize your output.',
    color: 'from-red-500 to-rose-500'
  },
  {
    id: 13,
    icon: <Users size={64} />,
    title: 'Shared Team Lists',
    description: 'Collaborate with family or team members on shared lists. Assign tasks, track progress together, and sync in real-time.',
    color: 'from-emerald-500 to-green-500'
  },
  {
    id: 14,
    icon: <Heart size={64} />,
    title: 'Mood & Energy Tracking',
    description: 'Track your mood and energy levels with each task. Get insights over time to understand your productivity patterns and optimize your schedule.',
    color: 'from-pink-500 to-rose-500'
  },
  {
    id: 15,
    icon: <Mail size={64} />,
    title: 'Email Summaries',
    description: 'Receive daily or weekly email summaries: "You completed 12 tasks this week!" Stay motivated with progress updates delivered to your inbox.',
    color: 'from-blue-500 to-indigo-500'
  },
  {
    id: 16,
    icon: <Bell size={64} />,
    title: 'Push Notifications',
    description: 'Get instant push notifications on your devices for task reminders, deadlines, and collaboration updates. Never miss a due date again.',
    color: 'from-green-500 to-teal-500'
  },
  {
    id: 17,
    icon: <Flame size={64} />,
    title: 'Streaks & Freeze Tokens',
    description: 'Keep your streaks visible on the dashboard. Freeze tokens let you maintain your streak even on days when you can\'t complete tasks.',
    color: 'from-orange-500 to-red-500'
  }
];

interface PremiumFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PremiumFeaturesModal: React.FC<PremiumFeaturesModalProps> = ({
  isOpen,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex(prev => prev === 0 ? premiumFeatures.length - 1 : prev - 1);
  };

  const goToNext = () => {
    setCurrentIndex(prev => prev === premiumFeatures.length - 1 ? 0 : prev + 1);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (!isOpen) return null;

  const currentFeature = premiumFeatures[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="
          w-full max-w-2xl max-h-[90vh] overflow-hidden
          bg-[var(--bg-primary)] rounded-3xl
          border border-[var(--border-secondary)]
          shadow-[0_25px_50px_rgba(0,0,0,0.4)]
          animate-fade-in
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-secondary)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
              <Zap size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Premium Features
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Coming soon to elevate your productivity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-all duration-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Carousel Content */}
        <div className="p-8">
          {/* Feature Display */}
          <div className="text-center mb-8">
            {/* Icon */}
            <div className={`
              inline-flex items-center justify-center w-32 h-32 rounded-3xl mb-6
              bg-gradient-to-br ${currentFeature.color}
              shadow-lg transform transition-all duration-300 hover:scale-110
            `}>
              <div className="text-white">
                {currentFeature.icon}
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold mb-3 text-[var(--text-primary)]">
              {currentFeature.title}
            </h3>

            {/* Description */}
            <p className="text-[var(--text-muted)] leading-relaxed max-w-md mx-auto">
              {currentFeature.description}
            </p>
          </div>

          {/* Navigation Dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {premiumFeatures.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`
                  w-2.5 h-2.5 rounded-full transition-all duration-300
                  ${index === currentIndex 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 w-8' 
                    : 'bg-[var(--border-secondary)] hover:bg-[var(--text-muted)]'
                  }
                `}
              />
            ))}
          </div>

          {/* Arrow Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={goToPrevious}
              className="
                p-3 rounded-xl bg-[var(--hover-bg)] 
                text-[var(--text-primary)] 
                hover:bg-[var(--bg-secondary)] 
                transition-all duration-200
                hover:scale-110 active:scale-95
              "
            >
              <ChevronLeft size={24} />
            </button>

            {/* Progress Indicator */}
            <div className="text-sm text-[var(--text-muted)]">
              {currentIndex + 1} / {premiumFeatures.length}
            </div>

            <button
              onClick={goToNext}
              className="
                p-3 rounded-xl bg-[var(--hover-bg)] 
                text-[var(--text-primary)] 
                hover:bg-[var(--bg-secondary)] 
                transition-all duration-200
                hover:scale-110 active:scale-95
              "
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-secondary)] bg-[var(--bg-secondary)] rounded-b-3xl">
          <p className="text-center text-sm text-[var(--text-muted)]">
            🚀 We're working hard to bring these features to life!
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumFeaturesModal;

