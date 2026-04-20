import { useEffect } from 'react';

interface KeyboardShortcuts {
  onSave?: () => void;
  onApplyTax?: () => void;
  onQuit?: () => void;
}

export const useGlobalKeyboardShortcuts = ({ onSave, onApplyTax, onQuit }: KeyboardShortcuts) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        onSave?.();
      } else if (e.key === 'F4') {
        e.preventDefault();
        onApplyTax?.();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onQuit?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave, onApplyTax, onQuit]);
};
