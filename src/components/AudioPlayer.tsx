import React from 'react';
import { Briefing, Chapter } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Download,
  Car,
  Volume2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface AudioPlayerProps {
  briefing: Briefing;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  activeChapterIndex: number;
  activeChapter?: Chapter;
  onTogglePlay: () => void;
  onSeekTo: (seconds: number) => void;
  onSeekBy: (deltaSeconds: number) => void;
  onSeekToChapter: (chapterId: string) => void;
  onChangePlaybackRate: (rate: number) => void;
  onOpenCarHud: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  briefing,
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  activeChapterIndex,
  activeChapter,
  onTogglePlay,
  onSeekTo,
  onSeekBy,
  onSeekToChapter,
  onChangePlaybackRate,
  onOpenCarHud,
}) => {
  const currentChapter = activeChapter || briefing.chapters[activeChapterIndex] || briefing.chapters[0];
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const handleDownload = () => {
    if (!briefing.fullAudioWavBase64) return;
    const binary = atob(briefing.fullAudioWavBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${briefing.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-briefing.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const hasNextChapter = activeChapterIndex < briefing.chapters.length - 1;
  const hasPrevChapter = activeChapterIndex > 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-6">
      {/* Header bar of Player */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-medium tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Today's Commute Edition</span>
            <span aria-hidden="true">·</span>
            <span className="text-zinc-400 font-normal capitalize">{briefing.style.replace('_', ' ')}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight mt-1 truncate">
            {briefing.title}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">{briefing.headline}</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onOpenCarHud}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
            title="Open Car & Transit HUD Mode"
          >
            <Car className="w-4 h-4" />
            <span>Car Mode</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!briefing.fullAudioWavBase64}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-40"
            title="Download for offline subway commute"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Download WAV</span>
          </button>
        </div>
      </div>

      {/* Currently Playing Chapter Card */}
      {currentChapter && (
        <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
                Segment {activeChapterIndex + 1} of {briefing.chapters.length}
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-zinc-100 mt-0.5">
                {currentChapter.storyTitle}
              </h3>
            </div>

            {/* Simulated subtle frequency visualizer */}
            <div className="flex items-end gap-1 h-5 pt-1 shrink-0" title="Audio stream active">
              {[0.4, 0.8, 0.6, 1.0, 0.5, 0.9, 0.3].map((h, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full bg-amber-400 transition-all duration-200 ${
                    isPlaying ? 'animate-pulse' : 'opacity-30'
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(4, h * 20)}px` : '4px',
                    animationDelay: `${i * 120}ms`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Key takeaways */}
          {currentChapter.keyTakeaways && currentChapter.keyTakeaways.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Key Takeaways:
              </span>
              <ul className="space-y-1">
                {currentChapter.keyTakeaways.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span className="leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Why it matters for your commute/day */}
          {currentChapter.whyItMatters && (
            <div className="pt-2 border-t border-zinc-800/80 flex items-start gap-2 text-xs text-zinc-300">
              <span className="font-semibold text-amber-400 shrink-0">Why It Matters:</span>
              <span className="text-zinc-300 leading-relaxed">{currentChapter.whyItMatters}</span>
            </div>
          )}
        </div>
      )}

      {/* Scrubber Timeline with Chapter Markers */}
      <div className="space-y-2">
        <div className="relative w-full h-3 bg-zinc-950 rounded-full cursor-pointer group flex items-center">
          {/* Background track */}
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={(e) => onSeekTo(parseFloat(e.target.value))}
            className="w-full h-2 bg-transparent accent-amber-500 cursor-pointer z-10 opacity-0"
          />

          {/* Visual track */}
          <div className="absolute inset-0 h-2 my-auto bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-75"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Visual chapter markers on the bar */}
          {briefing.chapters.map((ch, idx) => {
            if (typeof ch.startTimeSeconds !== 'number' || duration <= 0) return null;
            const markerPos = (ch.startTimeSeconds / duration) * 100;
            return (
              <div
                key={ch.id || idx}
                className="absolute top-0 bottom-0 w-0.5 bg-zinc-900/80 z-20 pointer-events-none"
                style={{ left: `${markerPos}%` }}
                title={ch.storyTitle}
              />
            );
          })}
        </div>

        {/* Timers */}
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>{formatTime(currentTime)}</span>
          <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-sans">
            <span>{briefing.chapters.length} Segments</span>
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Transport Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        {/* Playback speed toggle */}
        <div className="flex items-center gap-1 self-center sm:self-auto bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          {[0.8, 1.0, 1.25, 1.5, 2.0].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => onChangePlaybackRate(rate)}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                playbackRate === rate
                  ? 'bg-zinc-800 text-amber-300 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Center Transport Buttons */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 self-center">
          {/* Prev Chapter */}
          <button
            type="button"
            onClick={() => {
              if (hasPrevChapter) {
                onSeekToChapter(briefing.chapters[activeChapterIndex - 1].id);
              }
            }}
            disabled={!hasPrevChapter}
            className="p-2 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 transition-colors"
            title="Previous Story Segment"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Jump 15s Back */}
          <button
            type="button"
            onClick={() => onSeekBy(-15)}
            className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors relative"
            title="Jump 15s Back"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="absolute text-[8px] font-mono font-bold text-zinc-400 top-2.5 left-1/2 -translate-x-1/2">
              15
            </span>
          </button>

          {/* Big Play / Pause */}
          <button
            type="button"
            onClick={onTogglePlay}
            className="w-14 h-14 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center justify-center shadow-lg shadow-amber-500/20 transition-all transform active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current stroke-[2]" />
            ) : (
              <Play className="w-6 h-6 fill-current stroke-[2] ml-0.5" />
            )}
          </button>

          {/* Jump 15s Forward */}
          <button
            type="button"
            onClick={() => onSeekBy(15)}
            className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors relative"
            title="Jump 15s Forward"
          >
            <RotateCw className="w-5 h-5" />
            <span className="absolute text-[8px] font-mono font-bold text-zinc-400 top-2.5 left-1/2 -translate-x-1/2">
              15
            </span>
          </button>

          {/* Next Chapter */}
          <button
            type="button"
            onClick={() => {
              if (hasNextChapter) {
                onSeekToChapter(briefing.chapters[activeChapterIndex + 1].id);
              }
            }}
            disabled={!hasNextChapter}
            className="p-2 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 transition-colors"
            title="Next Story Segment"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Next Up Sneak Peek */}
        <div className="hidden lg:block text-right text-xs max-w-[200px]">
          {hasNextChapter ? (
            <div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Next up:</div>
              <div className="text-zinc-300 font-medium truncate mt-0.5">
                {briefing.chapters[activeChapterIndex + 1]?.storyTitle}
              </div>
            </div>
          ) : (
            <div className="text-zinc-400">Final Segment</div>
          )}
        </div>
      </div>
    </div>
  );
};
