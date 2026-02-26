import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, X, CheckCircle } from 'lucide-react';
import { onboardingService, WELCOME_TOUR_STEPS } from '../services/onboarding';

interface WelcomeTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const WelcomeTour: React.FC<WelcomeTourProps> = ({ isOpen, onClose, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = WELCOME_TOUR_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === WELCOME_TOUR_STEPS.length - 1;
  const isFirstStep = currentStepIndex === 0;

  useEffect(() => {
    if (isOpen) {
      onboardingService.setCurrentTourStep(currentStep.id);
    }
  }, [currentStepIndex, currentStep.id, isOpen]);

  const handleNext = () => {
    if (isLastStep) {
      onboardingService.markOnboardingAsCompleted();
      onComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = async () => {
    await onboardingService.skipOnboarding();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md mx-4 bg-[var(--card-bg)] rounded-2xl shadow-2xl border border-[var(--border-primary)] animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-secondary)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentStep.icon}</span>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{currentStep.title}</h2>
          </div>
          <button
            onClick={handleSkip}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
            {currentStep.description}
          </p>

          {/* Progress indicator */}
          <div className="flex gap-1 mb-6">
            {WELCOME_TOUR_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  index <= currentStepIndex
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                    : 'bg-[var(--border-secondary)]'
                }`}
              />
            ))}
          </div>

          <p className="text-xs text-[var(--text-muted)] text-center mb-6">
            Step {currentStepIndex + 1} of {WELCOME_TOUR_STEPS.length}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-secondary)] flex items-center justify-between gap-3">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              isFirstStep
                ? 'text-[var(--text-muted)] cursor-not-allowed opacity-50'
                : 'text-[var(--text-secondary)] border border-[var(--border-secondary)] hover:bg-[var(--hover-bg)]'
            }`}
          >
            <ChevronLeft size={16} />
            Back
          </button>

          <button
            onClick={handleSkip}
            className="px-4 py-2 rounded-lg font-medium text-sm text-[var(--text-secondary)] border border-[var(--border-secondary)] hover:bg-[var(--hover-bg)] transition-all duration-200"
          >
            Skip Tour
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg transition-all duration-200"
          >
            {isLastStep ? (
              <>
                <CheckCircle size={16} />
                Complete
              </>
            ) : (
              <>
                Next
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeTour;
