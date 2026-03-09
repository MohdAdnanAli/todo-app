import { useState, useEffect, useCallback } from 'react';
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
  Flame,
  Star,
  Sparkles as SparklesIcon,
  Rocket,
  Layers,
  Infinity
} from 'lucide-react';

interface PremiumFeature {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  glowColor: string;
}

const premiumFeatures: PremiumFeature[] = [
  {
    id: 1,
    icon: <FolderOpen size={28} />,
    title: 'Folder Customization',
    description: 'Organize your tasks into custom folders with personalized icons and colors. Create folders like Work, Personal, Projects, or any category that fits your workflow.',
    color: 'from-blue-500 to-cyan-500',
    glowColor: 'shadow-blue-500/25'
  },
  {
    id: 2,
    icon: <Calendar size={28} />,
    title: 'Due Dates & Smart Sorting',
    description: 'Add due dates to your tasks and let us automatically sort them by deadline. Never miss a priority again with deadline-soonest-first sorting.',
    color: 'from-green-500 to-emerald-500',
    glowColor: 'shadow-green-500/25'
  },
  {
    id: 3,
    icon: <Sparkles size={28} />,
    title: 'Beautiful Toast Notifications',
    description: 'Get elegant, animated toast notifications for success and error messages. Stay informed with style - beautiful dismissals and slide-in animations.',
    color: 'from-purple-500 to-pink-500',
    glowColor: 'shadow-purple-500/25'
  },
  {
    id: 4,
    icon: <Share2 size={28} />,
    title: 'Public Shareable Lists',
    description: 'Share your productivity setup with the world! Generate public links to showcase how you organize your life and inspire others.',
    color: 'from-indigo-500 to-blue-500',
    glowColor: 'shadow-indigo-500/25'
  },
  {
    id: 5,
    icon: <Gift size={28} />,
    title: 'Referral Program',
    description: 'Invite friends and earn rewards! Get exclusive features and badges for every friend who joins. Build your network of productivity champions.',
    color: 'from-rose-500 to-red-500',
    glowColor: 'shadow-rose-500/25'
  },
  {
    id: 6,
    icon: <Code size={28} />,
    title: 'Embed Widget',
    description: 'Add a "Add this task to your Todo App" widget to any website. Perfect for bloggers, developers, and content creators.',
    color: 'from-orange-500 to-amber-500',
    glowColor: 'shadow-orange-500/25'
  },
  {
    id: 7,
    icon: <Infinity size={28} />,
    title: 'Unlimited Tasks (Free)',
    description: 'No more limits! Create as many tasks as you need, completely free. Your productivity should never be constrained by arbitrary limits.',
    color: 'from-yellow-500 to-orange-500',
    glowColor: 'shadow-yellow-500/25'
  },
  {
    id: 8,
    icon: <Palette size={28} />,
    title: 'Unlimited Themes',
    description: 'Access hundreds of beautiful themes and color schemes. Express yourself with complete customization of your workspace appearance.',
    color: 'from-violet-500 to-purple-500',
    glowColor: 'shadow-violet-500/25'
  },
  {
    id: 9,
    icon: <Users size={28} />,
    title: 'Unlimited Sharing',
    description: 'Share unlimited lists with unlimited people. Collaborate without boundaries - family, friends, or teams can all access your shared tasks.',
    color: 'from-teal-500 to-cyan-500',
    glowColor: 'shadow-teal-500/25'
  },
  {
    id: 10,
    icon: <Brain size={28} />,
    title: 'AI-Powered Task Breakdown',
    description: 'Let AI analyze your tasks and suggest breakdowns, smart priorities, and optimal scheduling based on your work patterns.',
    color: 'from-cyan-500 to-blue-500',
    glowColor: 'shadow-cyan-500/25'
  },
  {
    id: 11,
    icon: <Trophy size={28} />,
    title: 'Gamification System',
    description: 'Earn points, unlock levels, and collect badges as you complete tasks. Stay motivated with streaks, achievements, and progress tracking.',
    color: 'from-amber-500 to-yellow-500',
    glowColor: 'shadow-amber-500/25'
  },
  {
    id: 12,
    icon: <Focus size={28} />,
    title: 'Focus Mode + Pomodoro',
    description: 'Built-in Pomodoro timer with focus mode. Block distractions, set work intervals, and take productive breaks to maximize your output.',
    color: 'from-red-500 to-rose-500',
    glowColor: 'shadow-red-500/25'
  },
  {
    id: 13,
    icon: <Layers size={28} />,
    title: 'Shared Team Lists',
    description: 'Collaborate with family or team members on shared lists. Assign tasks, track progress together, and sync in real-time.',
    color: 'from-emerald-500 to-green-500',
    glowColor: 'shadow-emerald-500/25'
  },
  {
    id: 14,
    icon: <Heart size={28} />,
    title: 'Mood & Energy Tracking',
    description: 'Track your mood and energy levels with each task. Get insights over time to understand your productivity patterns and optimize your schedule.',
    color: 'from-pink-500 to-rose-500',
    glowColor: 'shadow-pink-500/25'
  },
  {
    id: 15,
    icon: <Mail size={28} />,
    title: 'Email Summaries',
    description: 'Receive daily or weekly email summaries: "You completed 12 tasks this week!" Stay motivated with progress updates delivered to your inbox.',
    color: 'from-blue-500 to-indigo-500',
    glowColor: 'shadow-blue-500/25'
  },
  {
    id: 16,
    icon: <Bell size={28} />,
    title: 'Push Notifications',
    description: 'Get instant push notifications on your devices for task reminders, deadlines, and collaboration updates. Never miss a due date again.',
    color: 'from-green-500 to-teal-500',
    glowColor: 'shadow-green-500/25'
  },
  {
    id: 17,
    icon: <Flame size={28} />,
    title: 'Streaks & Freeze Tokens',
    description: 'Keep your streaks visible on the dashboard. Freeze tokens let you maintain your streak even on days when you can\'t complete tasks.',
    color: 'from-orange-500 to-red-500',
    glowColor: 'shadow-orange-500/25'
  }
];

interface PremiumFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Animated Circular Progress Component
const CircularProgress = ({ progress, size = 80, strokeWidth = 6 }: { progress: number; size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-[var(--border-secondary)]"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ feature, isActive }: { feature: PremiumFeature; isActive: boolean }) => {
  return (
    <div 
      className={`
        transition-all duration-500 ease-out transform
        ${isActive 
          ? 'opacity-100 translate-x-0 scale-100' 
          : 'opacity-0 absolute top-0 left-0 translate-x-10 scale-95 pointer-events-none'
        }
      `}
    >
      {/* Icon Container */}
      <div className="flex justify-center mb-3 sm:mb-6">
        <div className={`
          relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl 
          bg-gradient-to-br ${feature.color}
          flex items-center justify-center
          shadow-xl ${feature.glowColor}
          transform transition-all duration-300 hover:scale-110 hover:rotate-3
          animate-pulse-subtle
        `}>
          <div className="text-white">
            {feature.icon}
          </div>
          {/* Sparkle effects */}
          <div className="absolute -top-2 -right-2">
            <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white/80 animate-bounce" />
          </div>
        </div>
      </div>
      
      {/* Title */}
      <h3 className="text-base sm:text-xl font-bold text-center mb-2 text-[var(--text-primary)]">
        {feature.title}
      </h3>
      
      {/* Description */}
      <p className="text-xs sm:text-sm text-center text-[var(--text-muted)] leading-relaxed max-w-xs mx-auto">
        {feature.description}
      </p>
    </div>
  );
};

export const PremiumFeaturesModal: React.FC<PremiumFeaturesModalProps> = ({
  isOpen,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const goToPrevious = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(prev => prev === 0 ? premiumFeatures.length - 1 : prev - 1);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating]);

  const goToNext = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(prev => prev === premiumFeatures.length - 1 ? 0 : prev + 1);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating]);

  const goToSlide = useCallback((index: number) => {
    if (isAnimating || index === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToPrevious, goToNext, onClose]);

  // Show confetti on last slide
  useEffect(() => {
    if (currentIndex === premiumFeatures.length - 1) {
      setShowConfetti(true);
    } else {
      setShowConfetti(false);
    }
  }, [currentIndex]);

  if (!isOpen) return null;

  const currentFeature = premiumFeatures[currentIndex];
  const progress = ((currentIndex + 1) / premiumFeatures.length) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-20px',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div className={`w-3 h-3 rounded-sm bg-gradient-to-r ${['from-red-500 to-pink-500', 'from-blue-500 to-cyan-500', 'from-green-500 to-emerald-500', 'from-yellow-500 to-orange-500', 'from-purple-500 to-pink-500'][i % 5]}`} />
            </div>
          ))}
        </div>
      )}

      <div
        className="
          w-full max-w-2xl sm:max-w-3xl mx-2 sm:mx-4 max-h-[90vh] overflow-hidden
          bg-[var(--bg-primary)] rounded-2xl sm:rounded-3xl
          border border-[var(--border-secondary)]
          shadow-[0_25px_80px_rgba(0,0,0,0.5)]
          animate-fade-in
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-[var(--border-secondary)]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
              <Zap size={18} className="sm:w-6 sm:h-6 text-white animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                Premium Features
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                {currentIndex + 1} of {premiumFeatures.length} features
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-all duration-200 hover:rotate-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* Main Content */}
        <div className="p-3 sm:p-6">
          {/* Feature Display */}
          <div className="min-h-[200px] sm:min-h-[260px] flex items-center justify-center">
            <FeatureCard 
              feature={currentFeature} 
              isActive={true} 
            />
          </div>

          {/* Progress Section */}
          <div className="mt-4 sm:mt-6">
            {/* Circular Progress */}
            <div className="flex justify-center mb-3 sm:mb-4">
              <CircularProgress progress={progress} />
            </div>
            
            {/* Navigation Dots - Thumbnail Style */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-3 sm:mb-4 flex-wrap px-2">
              {premiumFeatures.map((feature, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`
                    flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg transition-all duration-300
                    flex items-center justify-center
                    ${index === currentIndex 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white scale-110 shadow-lg shadow-indigo-500/30' 
                      : 'bg-[var(--hover-bg)] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:scale-105'
                    }
                  `}
                  title={feature.title}
                >
                  <div className="scale-50 sm:scale-60">
                    {feature.icon}
                  </div>
                </button>
              ))}
            </div>

            {/* Arrow Navigation */}
            <div className="flex items-center justify-between px-2 sm:px-4">
              <button
                onClick={goToPrevious}
                disabled={isAnimating}
                className="
                  p-2 sm:p-3 rounded-xl bg-[var(--hover-bg)] 
                  text-[var(--text-primary)] 
                  hover:bg-gradient-to-r hover:from-indigo-500/20 hover:to-purple-500/20
                  transition-all duration-200
                  hover:scale-110 active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  group
                "
              >
                <ChevronLeft size={20} className="sm:w-6 sm:h-6 group-hover:-translate-x-1 transition-transform" />
              </button>

              <div className="flex items-center gap-1 sm:gap-2">
                <Star size={12} className="sm:w-4 sm:h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-xs sm:text-sm font-medium text-[var(--text-muted)]">
                  {currentIndex === premiumFeatures.length - 1 ? '🎉 All features to be unlocked!' : 'Swipe or use arrow keys to explore'}
                </span>
                <Star size={12} className="sm:w-4 sm:h-4 text-yellow-500 fill-yellow-500" />
              </div>

              <button
                onClick={goToNext}
                disabled={isAnimating}
                className="
                  p-2 sm:p-3 rounded-xl bg-[var(--hover-bg)] 
                  text-[var(--text-primary)] 
                  hover:bg-gradient-to-r hover:from-indigo-500/20 hover:to-purple-500/20
                  transition-all duration-200
                  hover:scale-110 active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  group
                "
              >
                <ChevronRight size={20} className="sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-5 border-t border-[var(--border-secondary)] bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-5 rounded-b-2xl sm:rounded-b-3xl">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <Rocket size={14} className="sm:w-[18px] sm:h-[18px] text-indigo-500" />
            <p className="text-center text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
              🚀 We're working hard to bring these features to life!
            </p>
            <Rocket size={14} className="sm:w-[18px] sm:h-[18px] text-purple-500" />
          </div>
        </div>
      </div>
      
      {/* Custom animations */}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
        @keyframes pulse-subtle {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default PremiumFeaturesModal;

