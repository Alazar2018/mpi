import { useEffect, useState, useCallback, useRef } from 'react';

interface TimeCounterProps {
  initialTime?: number;
  isRunning?: boolean;
  className?: string;
  showHours?: boolean;
  formatTime?: (seconds: number) => string;
}
export const TimeCounter = ({
  initialTime = 0,
  isRunning = false,
  className = '',
  showHours = true,
  formatTime,
  ...props
}: TimeCounterProps) => {
  const defaultFormatTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (showHours) {
      return [
        hrs.toString().padStart(2, '0'),
        mins.toString().padStart(2, '0'),
        secs.toString().padStart(2, '0')
      ].join(':');
    } else {
      const totalMins = Math.floor(seconds / 60);
      return [
        totalMins.toString().padStart(2, '0'),
        secs.toString().padStart(2, '0')
      ].join(':');
    }
  }, [showHours]);
  
  const timeFormatter = formatTime || defaultFormatTime;

  const [elapsedSeconds, setElapsedSeconds] = useState(initialTime);
  const animationRef = useRef<number | null>(null);
  const lastTimestamp = useRef<number | undefined>(undefined);
  const accumulatedTime = useRef<number>(initialTime);

  const updateTimer = useCallback((timestamp: number) => {
    if (lastTimestamp.current === undefined) {
      lastTimestamp.current = timestamp;
    }
    
    const deltaTime = Math.floor((timestamp - lastTimestamp.current) / 1000);
    if (deltaTime >= 1) {
      accumulatedTime.current += deltaTime;
      setElapsedSeconds(accumulatedTime.current);
      lastTimestamp.current = timestamp;
    }
    
    animationRef.current = requestAnimationFrame(updateTimer);
  }, []);

  useEffect(() => {
    if (isRunning) {
      lastTimestamp.current = undefined;
      animationRef.current = requestAnimationFrame(updateTimer);
    } else if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isRunning, updateTimer]);

  useEffect(() => {
    setElapsedSeconds(initialTime);
    accumulatedTime.current = initialTime;
  }, [initialTime]);

  return (
    <span className={`font-mono font-bold ${className}`} {...props}>
      {timeFormatter(elapsedSeconds)}
    </span>
  );
};

export default TimeCounter;
