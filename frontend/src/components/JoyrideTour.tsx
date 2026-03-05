import React, { useState, useCallback, useRef } from 'react';
import ReactJoyride, { STATUS, type CallBackProps, type Step } from 'react-joyride';
import { onboardingService, WELCOME_TOUR_STEPS } from '../services/onboarding';

interface JoyrideTourProps {
  isOpen: boolean;
  onClose?: () => void;
  onComplete: () => void;
}

// Convert onboarding steps to Joyride format
const convertStepsToJoyride = (steps: typeof WELCOME_TOUR_STEPS): Step[] => {
  return steps.map((step) => ({
    target: 'body' as const,
    content: (
      <div className="p-2">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{step.icon}</span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white m-0">
            {step.title}
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 m-0 leading-relaxed">
          {step.description}
        </p>
      </div>
    ),
    placement: 'center' as const,
    disableBeacon: true,
  }));
};

const JOYRIDE_STEPS: Step[] = convertStepsToJoyride(WELCOME_TOUR_STEPS);

const JoyrideTour: React.FC<JoyrideTourProps> = ({ isOpen, onClose: _onClose, onComplete }) => {
  const [run, setRun] = useState(isOpen);
  const [stepIndex, setStepIndex] = useState(0);
  const joyrideRef = useRef<{ index: number; skip: () => void }>(null);

  // Handle joyride events
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, index } = data;

    // Update onboarding service with current step
    if (type === 'step:after' && index < WELCOME_TOUR_STEPS.length) {
      const currentStep = WELCOME_TOUR_STEPS[index];
      onboardingService.setCurrentTourStep(currentStep.id);
      setStepIndex(index + 1);
    }

    // Handle tour completion
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      if (status === STATUS.FINISHED) {
        onboardingService.markOnboardingAsCompleted();
      } else {
        onboardingService.skipOnboarding();
      }
      onComplete();
    }
  }, [onComplete]);

  // Update run state when isOpen changes
  React.useEffect(() => {
    setRun(isOpen);
    if (isOpen) {
      setStepIndex(0);
    }
  }, [isOpen]);

  // Custom locale for the tour
  const joyrideLocale = {
    last: 'Complete',
    next: 'Next',
    skip: 'Skip',
    back: 'Back',
  };

  if (!isOpen) {
    return null;
  }

  return (
    <ReactJoyride
      ref={joyrideRef as any}
      steps={JOYRIDE_STEPS}
      run={run}
      stepIndex={stepIndex}
      continuous
      showSkipButton
      showProgress
      callback={handleJoyrideCallback}
      locale={joyrideLocale}
      floaterProps={{
        disableAnimation: true,
      }}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#6366f1',
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          arrowColor: '#ffffff',
          textColor: '#1f2937',
          overlayColor: 'rgba(0, 0, 0, 0.6)',
          beaconSize: 36,
        },
        tooltip: {
          borderRadius: 12,
        },
        tooltipContent: {
          padding: 20,
        },
        buttonNext: {
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 500,
          padding: '10px 20px',
        },
        buttonBack: {
          marginRight: 10,
        },
        buttonSkip: {
          color: '#9ca3af',
          fontSize: 14,
        },
      }}
    />
  );
};

export default JoyrideTour;

