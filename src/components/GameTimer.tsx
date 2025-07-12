import { useState, useEffect, useRef, useCallback } from "react";
import TimeCounter from "./TimeCounter";

interface GameTimerProps {
  cacheKey: string;
  autoStart?: boolean;
  className?: string;
}

function GameTimer({
  cacheKey,
  autoStart = false,
  className = "",
}: GameTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  const updateTimer = useCallback((timestamp: number) => {
    if (!lastUpdateTimeRef.current) {
      lastUpdateTimeRef.current = timestamp;
    }
    
    const delta = timestamp - lastUpdateTimeRef.current;
    if (delta >= 1000) {
      setElapsedSeconds(prev => prev + Math.floor(delta / 1000));
      lastUpdateTimeRef.current = timestamp - (delta % 1000);
    }
    
    animationRef.current = requestAnimationFrame(updateTimer);
  }, []);

  const startTimer = useCallback(() => {
    if (animationRef.current === null) {
      lastUpdateTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(updateTimer);
      setIsRunning(true);
    }
  }, [updateTimer]);

  const stopTimer = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      setIsRunning(false);
    }
  }, []);

  const toggleTimer = useCallback(() => {
    if (isRunning) {
      stopTimer();
    } else {
      startTimer();
    }
  }, [isRunning, startTimer, stopTimer]);

  useEffect(() => {
    const now = Date.now();
    const savedTimer = localStorage.getItem(`timer_${cacheKey}`);
    const savedStoppedTime = localStorage.getItem(`stoppedTime_${cacheKey}`);

    if (savedTimer && savedStoppedTime) {
      const stoppedTime = JSON.parse(savedStoppedTime);
      const savedTime = JSON.parse(savedTimer);
      const timeDiff = now - stoppedTime;
      const newSavedTime = savedTime + timeDiff;
      setElapsedSeconds(Math.floor((now - newSavedTime) / 1000));
      if (autoStart) {
        startTimer();
      }
    } else if (savedTimer) {
      setElapsedSeconds(Math.floor((now - JSON.parse(savedTimer)) / 1000));
      if (autoStart) {
        startTimer();
      }
    } else {
      localStorage.setItem(`timer_${cacheKey}`, `${now}`);
    }

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [autoStart, cacheKey, startTimer]);

  useEffect(() => {
    if (isRunning) {
      localStorage.setItem(`timer_${cacheKey}`, `${Date.now() - elapsedSeconds * 1000}`);
      localStorage.removeItem(`stoppedTime_${cacheKey}`);
    } else {
      localStorage.setItem(`stoppedTime_${cacheKey}`, `${Date.now()}`);
    }
  }, [isRunning, elapsedSeconds, cacheKey]);

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <span className="font-bold text-[13px]">Game Time</span>
      <TimeCounter 
        initialTime={elapsedSeconds}
        isRunning={isRunning}
        className="text-4xl"
      />
      <div className="flex gap-2">
        <button
          onClick={toggleTimer}
          className="px-4 py-2 text-sm rounded bg-blue-10 text-secondary transition-colors"
          aria-label={isRunning ? "Pause timer" : "Start timer"}
        >
          {isRunning ? "Pause" : "Resume"}
        </button>
      </div>
    </div>
  );
}

export default GameTimer;
