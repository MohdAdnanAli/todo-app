import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const event = e as BeforeInstallPromptEvent;
      event.preventDefault();
      setDeferredPrompt(event);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowPrompt(false);
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error('Install prompt error:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 max-w-sm animate-fade-in z-50">
      <div
        className="p-4 rounded-xl shadow-xl border backdrop-blur-md"
        style={{
          background: 'rgba(var(--bg-secondary-rgb), 0.95)',
          borderColor: 'var(--border-primary)',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex-shrink-0">
            <Download size={20} className="text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-1">
              Install TodoPro
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Get instant access to your todos offline with our app. Works seamlessly on your device.
            </p>

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white
                  hover:shadow-lg transition-all duration-200 active:scale-95"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-[var(--border-secondary)] text-[var(--text-secondary)]
                  hover:bg-[var(--hover-bg)] transition-all duration-200"
              >
                Later
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
