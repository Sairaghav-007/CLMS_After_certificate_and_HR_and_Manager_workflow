import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings as SettingsIcon,
  FastForward,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/utils';
import { useAutoSave } from '@/shared/hooks';

interface SecureVideoPlayerProps {
  url: string;
  onProgress: (position: number, duration: number) => void;
  onComplete: () => void;
  lastPosition?: number;
}

export interface SecureVideoPlayerHandle {
  getCurrentTime: () => number;
  seekTo: (time: number) => void;
}

export const SecureVideoPlayer = forwardRef<SecureVideoPlayerHandle, SecureVideoPlayerProps>(
  ({ url, onProgress, onComplete, lastPosition = 0 }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const [maxWatchedTime, setMaxWatchedTime] = useState(lastPosition);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsView, setSettingsView] = useState<'main' | 'quality' | 'speed'>('main');
    
    const [qualityLevels, setQualityLevels] = useState<{ id: number; height: number }[]>([]);
    const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 for auto
    const [autoQualityLabel, setAutoQualityLabel] = useState<string>('Auto');
    const [qualityToast, setQualityToast] = useState<string | null>(null);

    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      getCurrentTime: () => videoRef.current?.currentTime || 0,
      seekTo: (time: number) => {
        if (videoRef.current && time <= maxWatchedTime) {
          videoRef.current.currentTime = time;
          setCurrentTime(time);
        }
      }
    }));

    // Initialize HLS
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      setIsPlaying(false);
      setCurrentTime(0);
      setMaxWatchedTime(lastPosition);

      // Simple mp4 detection fallback
      const isMp4 = url.toLowerCase().endsWith('.mp4') || !url.includes('.m3u8');

      if (!isMp4 && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hlsRef.current = hls;

        hls.loadSource(url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          setQualityLevels(data.levels.map((l, i) => ({ id: i, height: l.height })));
          if (lastPosition > 0) {
            video.currentTime = lastPosition;
          }
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          const level = hls.levels[data.level];
          if (hls.autoLevelEnabled) {
            setAutoQualityLabel(`Auto (${level.height}p)`);
          }
        });

        return () => {
          hls.destroy();
        };
      } else {
        // Fallback for native mp4/hls (Safari / generic mp4)
        video.src = url;
        video.load();
        const onMetadata = () => {
          setDuration(video.duration);
          if (lastPosition > 0) {
            video.currentTime = lastPosition;
          }
        };
        video.addEventListener('loadedmetadata', onMetadata);
        return () => {
          video.removeEventListener('loadedmetadata', onMetadata);
        };
      }
    }, [url, lastPosition]);

    // Auto-save progress every 15 seconds
    useAutoSave(() => {
      if (videoRef.current && isPlaying) {
        onProgress(videoRef.current.currentTime, videoRef.current.duration);
      }
    }, 15000);

    const togglePlay = () => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
        } else {
          videoRef.current.play().then(() => {
            setIsPlaying(true);
          }).catch(err => console.error("Playback failed: ", err));
        }
      }
    };

    const handleTimeUpdate = () => {
      if (videoRef.current) {
        const time = videoRef.current.currentTime;
        setCurrentTime(time);
        
        if (time > maxWatchedTime) {
          setMaxWatchedTime(time);
        }

        if (time >= videoRef.current.duration - 0.5 && videoRef.current.duration > 0) {
          onComplete();
        }
      }
    };

    const handleLoadedMetadata = () => {
      if (videoRef.current) {
        setDuration(videoRef.current.duration);
      }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value);
      if (time <= maxWatchedTime && videoRef.current) {
        videoRef.current.currentTime = time;
        setCurrentTime(time);
      }
    };

    const skip = (amount: number) => {
      if (videoRef.current) {
        const newTime = videoRef.current.currentTime + amount;
        if (amount < 0 || newTime <= maxWatchedTime) {
          videoRef.current.currentTime = Math.max(0, Math.min(newTime, duration));
        }
      }
    };

    const toggleMute = () => {
      if (videoRef.current) {
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
      }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setVolume(val);
      if (videoRef.current) {
        videoRef.current.volume = val;
        setIsMuted(val === 0);
      }
    };

    const toggleFullscreen = () => {
      if (videoRef.current?.parentElement?.requestFullscreen) {
        videoRef.current.parentElement.requestFullscreen();
      }
    };

    const changeQuality = (levelId: number) => {
      if (hlsRef.current) {
        hlsRef.current.currentLevel = levelId;
        setCurrentQuality(levelId);
        const label = levelId === -1 ? 'Auto' : `${qualityLevels.find(q => q.id === levelId)?.height}p`;
        showQualityToast(`Quality changed to ${label}`);
        setIsSettingsOpen(false);
      }
    };

    const showQualityToast = (message: string) => {
      setQualityToast(message);
      setTimeout(() => setQualityToast(null), 3000);
    };

    const formatTime = (time: number) => {
      if (isNaN(time)) return '0:00';
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying && !isSettingsOpen) setShowControls(false);
      }, 3000);
    };

    const speeds = [0.5, 1, 1.25, 1.5, 2];

    return (
      <div 
        className="relative group bg-black rounded-2xl overflow-hidden aspect-video shadow-2xl flex items-center justify-center w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && !isSettingsOpen && setShowControls(false)}
      >
        <video
          ref={videoRef}
          className="w-full h-full"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={() => {
            if (isSettingsOpen) setIsSettingsOpen(false);
            else togglePlay();
          }}
          playsInline
        />

        {/* Quality Toast */}
        <AnimatePresence>
          {qualityToast && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute top-10 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 z-50 pointer-events-none"
            >
              <p className="text-xs font-bold text-white/90">{qualityToast}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay controls */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 transition-opacity duration-300 flex flex-col justify-end",
          showControls || isSettingsOpen ? "opacity-100" : "opacity-0"
        )}>
          {/* Top Info */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
              <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest">Enterprise Stream Active</p>
            </div>
            
            <button 
              onClick={() => {
                setSettingsView('main');
                setIsSettingsOpen(!isSettingsOpen);
              }}
              className="p-3 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:scale-110 transition-all cursor-pointer"
            >
              <SettingsIcon size={20} className={cn(isSettingsOpen && "rotate-90 transition-transform")} />
            </button>
          </div>

          {!isPlaying && !isSettingsOpen && (
            <button 
              onClick={togglePlay}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-primary-600/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform z-10 cursor-pointer"
            >
              <Play className="w-8 h-8 fill-current translate-x-1" />
            </button>
          )}

          {/* Settings Menu Modal */}
          <AnimatePresence>
            {isSettingsOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 20 }}
                className="absolute bottom-24 right-6 w-72 bg-surface-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl z-40 overflow-hidden text-left"
              >
                {settingsView === 'main' && (
                  <div className="space-y-1">
                    <div className="px-4 py-3 border-b border-white/5 mb-1">
                      <p className="text-white font-bold text-sm">Player Settings</p>
                    </div>
                    {qualityLevels.length > 0 && (
                      <button 
                        onClick={() => setSettingsView('quality')}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 text-sm text-white/80 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Maximize size={18} className="text-white/40" />
                          <span>Quality</span>
                        </div>
                        <div className="flex items-center gap-2 text-primary-400 font-bold text-xs uppercase">
                          {currentQuality === -1 ? autoQualityLabel : `${qualityLevels.find(q => q.id === currentQuality)?.height}p`}
                          <ChevronRight size={14} />
                        </div>
                      </button>
                    )}
                    <button 
                      onClick={() => setSettingsView('speed')}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 text-sm text-white/80 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <FastForward size={18} className="text-white/40" />
                        <span>Playback Speed</span>
                      </div>
                      <div className="flex items-center gap-2 text-primary-400 font-bold text-xs uppercase">
                        {playbackSpeed}x
                        <ChevronRight size={14} />
                      </div>
                    </button>
                    <div className="px-4 py-3 text-[10px] text-white/40 border-t border-white/5 mt-2 flex items-center gap-2">
                       <Info size={12} />
                       Sequential Learning Enforced
                    </div>
                  </div>
                )}

                {settingsView === 'quality' && (
                  <div className="space-y-1">
                    <button 
                      onClick={() => setSettingsView('main')}
                      className="w-full text-left px-4 py-3 border-b border-white/5 mb-1 flex items-center gap-2 cursor-pointer"
                    >
                       <ChevronRight size={14} className="rotate-180" />
                       <p className="text-white font-bold text-sm">Quality</p>
                    </button>
                    <button 
                      onClick={() => changeQuality(-1)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 text-sm transition-colors text-white/80 cursor-pointer"
                    >
                      <span>Auto</span>
                      {currentQuality === -1 && <Check size={16} className="text-primary-500" />}
                    </button>
                    {qualityLevels.map((lvl) => (
                      <button 
                        key={lvl.id}
                        onClick={() => changeQuality(lvl.id)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 text-sm transition-colors text-white/80 cursor-pointer"
                      >
                        <span>{lvl.height}p</span>
                        {currentQuality === lvl.id && <Check size={16} className="text-primary-500" />}
                      </button>
                    ))}
                  </div>
                )}

                {settingsView === 'speed' && (
                  <div className="space-y-1">
                    <button 
                      onClick={() => setSettingsView('main')}
                      className="w-full text-left px-4 py-3 border-b border-white/5 mb-1 flex items-center gap-2 cursor-pointer"
                    >
                       <ChevronRight size={14} className="rotate-180" />
                       <p className="text-white font-bold text-sm">Playback Speed</p>
                    </button>
                    {speeds.map((s) => (
                      <button 
                        key={s}
                        onClick={() => {
                          setPlaybackSpeed(s);
                          if (videoRef.current) videoRef.current.playbackRate = s;
                          setIsSettingsOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 text-sm transition-colors text-white/80 cursor-pointer"
                      >
                        <span>{s}x</span>
                        {playbackSpeed === s && <Check size={16} className="text-primary-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-6 space-y-4">
            {/* Progress Bar */}
            <div className="relative group/progress h-2 flex items-center cursor-pointer">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full opacity-0 z-20 cursor-pointer"
              />
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative backdrop-blur-sm">
                 <div 
                  className="absolute top-0 bottom-0 bg-white/20 rounded-full z-0 transition-all duration-300" 
                  style={{ width: `${(maxWatchedTime / (duration || 1)) * 100}%` }}
                />
                <div 
                  className="absolute top-0 bottom-0 bg-primary-500 rounded-full z-10 shadow-[0_0_15px_rgba(var(--primary-500),0.5)]" 
                  style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button onClick={togglePlay} className="text-white hover:text-primary-400 transition-all hover:scale-110 cursor-pointer">
                  {isPlaying ? <Pause size={24} /> : <Play size={24} className="fill-current" />}
                </button>
                
                <div className="flex items-center gap-4">
                  <button onClick={() => skip(-10)} className="text-white/60 hover:text-white transition-colors cursor-pointer">
                    <RotateCcw size={20} />
                  </button>
                  <button 
                    onClick={() => skip(10)} 
                    disabled={currentTime + 10 > maxWatchedTime}
                    className="text-white/60 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <RotateCw size={20} />
                  </button>
                </div>

                <div className="flex items-center gap-3 group/volume">
                  <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors cursor-pointer">
                    {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <div className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-300">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-16 accent-primary-500"
                    />
                  </div>
                </div>

                <span className="text-xs text-white/60 font-bold tabular-nums tracking-wider uppercase">
                  {formatTime(currentTime)} <span className="mx-1 text-white/20">/</span> {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleFullscreen} 
                  className="p-3 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  <Maximize size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Seeking restriction tooltip */}
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl">
          <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest text-center">
            Sequential mode active • cannot seek ahead
          </p>
        </div>
      </div>
    );
  }
);

SecureVideoPlayer.displayName = 'SecureVideoPlayer';
