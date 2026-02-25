import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Show prompt after 3 seconds if not installed
    if (!standalone) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback: Show browser-specific instructions
      alert('To install:\n\nChrome/Edge: Click the install icon in the address bar\niOS Safari: Tap Share > Add to Home Screen\nAndroid: Tap menu > Install app');
    }
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-4 z-50 animate-in slide-in-from-bottom">
      <button onClick={() => setShowPrompt(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <Download className="w-5 h-5 text-primary mt-1" />
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Download app for better experience</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Install our app for quick access and offline support</p>
          <Button onClick={handleInstall} size="sm" className="w-full">
            Install App
          </Button>
        </div>
      </div>
    </div>
  );
};
