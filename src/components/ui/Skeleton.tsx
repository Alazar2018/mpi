import { useEffect, useRef } from 'react';

interface SkeletonProps {
  className?: string;
  pulse?: boolean;
  children?: React.ReactNode;
}

export function Skeleton({ 
  className = '', 
  pulse = true,
  children 
}: SkeletonProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !pulse) return;
    
    const element = ref.current;
    element.style.animation = 'skeleton-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite';
    
    return () => {
      element.style.animation = '';
    };
  }, [pulse]);

  return (
    <div 
      ref={ref}
      className={`bg-gray-200 rounded ${className}`}
    >
      {children}
    </div>
  );
}

// Global styles for the skeleton animation
export const SkeletonStyles = () => (
  <style>{`
    @keyframes skeleton-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `}</style>
);

export default Skeleton;