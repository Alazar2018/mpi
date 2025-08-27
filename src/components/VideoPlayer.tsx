import { useState, useRef, useEffect } from 'react';
import { useLearn } from '@/hooks/useLearn';
import type { Video } from '@/service/learn.server';

interface VideoPlayerProps {
  courseId: string;
  video: Video;
  onProgressUpdate?: (progress: number) => void;
}

export default function VideoPlayer({ courseId, video, onProgressUpdate }: VideoPlayerProps) {
  const { startVideo, finishVideo } = useLearn();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
      setCurrentTime(0);
    };

    const handleTimeUpdate = () => {
      const currentTime = videoElement.currentTime;
      const duration = videoElement.duration;
      
      setCurrentTime(currentTime);
      
      if (duration > 0) {
        const progressPercent = (currentTime / duration) * 100;
        setProgress(progressPercent);
        onProgressUpdate?.(progressPercent);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      if (!hasStarted) {
        handleVideoStart();
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      handleVideoComplete();
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, [video, hasStarted, onProgressUpdate]);

  const handleVideoStart = async () => {
    try {
      await startVideo(courseId, video._id);
      setHasStarted(true);
    } catch (error) {
      console.error('Failed to start video:', error);
    }
  };

  const handleVideoComplete = async () => {
    try {
      await finishVideo(courseId, video._id, Math.floor(currentTime));
    } catch (error) {
      console.error('Failed to complete video:', error);
    }
  };

  const togglePlayPause = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play();
    }
  };

  const seekTo = (time: number) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.currentTime = time;
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full rounded-lg shadow-lg"
          controls={false}
          poster={video.thumbnail}
        >
          <source src={video.url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Custom Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          {/* Progress Bar */}
          <div className="w-full bg-gray-600 rounded-full h-2 mb-3">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlayPause}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              <div className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="text-sm">
              {Math.round(progress)}% Complete
            </div>
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div className="mt-4">
        <h3 className="text-xl font-semibold mb-2">{video.title}</h3>
        <p className="text-gray-600 mb-3">{video.description}</p>
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>Duration: {formatTime(duration)}</span>
          <span>Status: {video.status}</span>
          {video.completed && <span className="text-green-600">✓ Completed</span>}
        </div>
      </div>
    </div>
  );
}
