import React, { useEffect } from 'react';
import { Briefing, Chapter } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  X,
  Volume2,
  Gauge,
} from 'lucide-react';

interface CarHudModalProps {
  briefing: Briefing;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  activeChapterIndex: number;
  activeChapter?: Chapter;
  onTogglePlay: () => void;
  onSeekBy: (deltaSeconds: number) => void;
  onSeekToChapter: (chapterId: string) => void;
  onChangePlaybackRate: (rate: number) => void;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const CarHudModal: React.FC<CarHudModalProps> = ({
  briefing,
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  activeChapterIndex,
  activeChapter,
  onTogglePlay,
  onSeekBy,
  onSeekToChapter,
  onChangePlaybackRate,
  onClose,
}) => {
  const currentChapter = activeChapter || briefing.chapters[activeChapterIndex] || briefing.chapters[0];
  const hasNextChapter = activeChapterIndex < briefing.chapters.length - 1;
  const hasPrevChapter = activeChapterIndex > 0;
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  // Global keyboard shortcuts while in Car Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onSeekBy(-15);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onSeekBy(15);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePlay, onSeekBy, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-amber-400 font-mono font-bold">
              Transit & Car HUD
            </span>
            <div className="text-xs text-zinc-400">Safe large touch controls</div>
          </div>
        </div>

        {/* Speed toggle & close */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const rates = [1.0, 1.25, 1.5, 1.75];
              const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
              onChangePlaybackRate(rates[nextIdx]);
            }}
            className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-mono font-semibold text-amber-300 active:scale-95"
          >
            {playbackRate}x
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white active:scale-95 transition-colors"
            title="Exit Car Mode (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Focus Center */}
      <div className="max-w-3xl mx-auto w-full text-center space-y-6 my-auto">
        <div className="text-xs sm:text-sm font-mono uppercase tracking-widest text-zinc-400">
          Story {activeChapterIndex + 1} of {briefing.chapters.length}
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
          {currentChapter?.storyTitle}
        </h1>

        {currentChapter?.whyItMatters && (
          <p className="text-base sm:text-xl text-amber-300/90 max-w-2xl mx-auto font-medium">
            "{currentChapter.whyItMatters}"
          </p>
        )}

        {/* Big Progress Bar */}
        <div className="w-full space-y-2 pt-4">
          <div className="h-4 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-amber-500 transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-base font-mono text-zinc-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Next Story indicator */}
        {hasNextChapter && (
          <div className="text-sm text-zinc-400">
            Next: <span className="text-zinc-200">{briefing.chapters[activeChapterIndex + 1].storyTitle}</span>
          </div>
        )}
      </div>

      {/* Giant Bottom Transport Controls */}
      <div className="max-w-xl mx-auto w-full flex items-center justify-between gap-4">
        {/* Skip Previous Story */}
        <button
          type="button"
          onClick={() => {
            if (hasPrevChapter) {
              onSeekToChapter(briefing.chapters[activeChapterIndex - 1].id);
            }
          }}
          disabled={!hasPrevChapter}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
          title="Previous Story"
        >
          <SkipBack className="w-7 h-7 sm:w-9 sm:h-9" />
        </button>

        {/* 15s Back */}
        <button
          type="button"
          onClick={() => onSeekBy(-15)}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex flex-col items-center justify-center active:scale-95 transition-all"
          title="Jump 15s Back"
        >
          <RotateCcw className="w-6 h-6 sm:w-7 sm:h-7" />
          <span className="text-[10px] font-mono font-bold mt-1">-15s</span>
        </button>

        {/* Giant Play/Pause Button */}
        <button
          type="button"
          onClick={onTogglePlay}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center justify-center shadow-2xl shadow-amber-500/30 active:scale-95 transition-all cursor-pointer"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-12 h-12 fill-current stroke-[2]" />
          ) : (
            <Play className="w-12 h-12 fill-current stroke-[2] ml-1.5" />
          )}
        </button>

        {/* 15s Forward */}
        <button
          type="button"
          onClick={() => onSeekBy(15)}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex flex-col items-center justify-center active:scale-95 transition-all"
          title="Jump 15s Forward"
        >
          <RotateCw className="w-6 h-6 sm:w-7 sm:h-7" />
          <span className="text-[10px] font-mono font-bold mt-1">+15s</span>
        </button>

        {/* Skip Next Story */}
        <button
          type="button"
          onClick={() => {
            if (hasNextChapter) {
              onSeekToChapter(briefing.chapters[activeChapterIndex + 1].id);
            }
          }}
          disabled={!hasNextChapter}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
          title="Next Story"
        >
          <SkipForward className="w-7 h-7 sm:w-9 sm:h-9" />
        </button>
      </div>
    </div>
  );
};
