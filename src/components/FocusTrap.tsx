import { useEffect, useRef, type ReactNode } from 'react';

interface FocusTrapProps {
  children: ReactNode;
  isActive?: boolean;
  className?: string;
}

export const FocusTrap = ({
  children,
  isActive = true,
  className = '',
}: FocusTrapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<Element | null>(null);

  useEffect(() => {
    if (!isActive) return;

    previousFocus.current = document.activeElement;

    const focusableElements = containerRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements?.[0];
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (!containerRef.current) return;

      const focusableElements = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));

      if (!focusableElements.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocus.current instanceof HTMLElement) {
        previousFocus.current.focus();
      }
    };
  }, [isActive]);

  return (
    <div autoFocus tabIndex={0} ref={containerRef} className={className}>
      {children}
    </div>
  );
};

export default FocusTrap;
