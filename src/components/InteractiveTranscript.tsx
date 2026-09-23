import React, { useState } from 'react';
import { Briefing, Chapter } from '../types';
import { Play, Copy, Check, FileText, ListOrdered, Sparkles, Volume2 } from 'lucide-react';

interface InteractiveTranscriptProps {
  briefing: Briefing;
  activeChapterIndex: number;
  isPlaying: boolean;
  onSeekToChapter: (chapterId: string) => void;
}

function formatTime(seconds?: number): string {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const InteractiveTranscript: React.FC<InteractiveTranscriptProps> = ({
  briefing,
  activeChapterIndex,
  isPlaying,
  onSeekToChapter,
}) => {
  const [viewMode, setViewMode] = useState<'chapters' | 'script'>('chapters');
  const [copied, setCopied] = useState(false);

  const handleCopySummary = () => {
    let text = `${briefing.title}\n${briefing.headline}\n\nExecutive Overview:\n${briefing.executiveSummary}\n\n`;

    briefing.chapters.forEach((ch, idx) => {
      text += `\n--- Story ${idx + 1}: ${ch.storyTitle} ---\n`;
      if (ch.keyTakeaways) {
        text += `Takeaways:\n${ch.keyTakeaways.map((t) => `• ${t}`).join('\n')}\n`;
      }
      if (ch.whyItMatters) {
        text += `Why It Matters: ${ch.whyItMatters}\n`;
      }
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100 tracking-tight">Briefing Notes & Audio Chapters</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Click any story segment to jump playback directly to that topic.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented view switcher */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setViewMode('chapters')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'chapters'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Chapters</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('script')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'script'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Spoken Script</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-300 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors"
            title="Copy briefing takeaways to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Executive Overview Box */}
      <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
          Executive Digest
        </span>
        <p className="text-xs sm:text-sm text-zinc-300 mt-1 leading-relaxed">
          {briefing.executiveSummary}
        </p>
      </div>

      {/* Chapters View */}
      {viewMode === 'chapters' && (
        <div className="space-y-3">
          {briefing.chapters.map((chapter, index) => {
            const isActive = index === activeChapterIndex;
            return (
              <div
                key={chapter.id || index}
                onClick={() => onSeekToChapter(chapter.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span
                      className={`text-xs font-mono font-bold mt-0.5 px-2 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-amber-500 text-zinc-950'
                          : 'bg-zinc-900 text-zinc-400 group-hover:text-zinc-200'
                      }`}
                    >
                      {formatTime(chapter.startTimeSeconds)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4
                        className={`text-sm font-semibold tracking-tight leading-snug ${
                          isActive ? 'text-amber-300' : 'text-zinc-200 group-hover:text-white'
                        }`}
                      >
                        {chapter.storyTitle}
                      </h4>
                      {chapter.originalArticleTitle && (
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                          Source: {chapter.originalArticleTitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1">
                    {isActive && isPlaying ? (
                      <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1.5 animate-pulse">
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Playing</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-400 group-hover:text-amber-400 flex items-center gap-1 transition-colors">
                        <Play className="w-3 h-3" />
                        <span>Jump</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Key Takeaways */}
                {chapter.keyTakeaways && chapter.keyTakeaways.length > 0 && (
                  <ul className="mt-3 space-y-1 pl-1 border-t border-zinc-800/60 pt-2.5">
                    {chapter.keyTakeaways.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Why it matters */}
                {chapter.whyItMatters && (
                  <div className="mt-2 text-xs text-zinc-400">
                    <span className="text-amber-400 font-medium">Why it matters: </span>
                    <span>{chapter.whyItMatters}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Spoken Script View */}
      {viewMode === 'script' && (
        <div className="space-y-4">
          {briefing.chapters.map((chapter, chIdx) => {
            const isActive = chIdx === activeChapterIndex;
            return (
              <div
                key={chapter.id || chIdx}
                className={`p-4 rounded-xl border ${
                  isActive ? 'bg-amber-500/5 border-amber-500/40' : 'bg-zinc-950/60 border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800/80">
                  <span className="text-xs font-semibold text-zinc-200">
                    Story {chIdx + 1}: {chapter.storyTitle}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSeekToChapter(chapter.id)}
                    className="text-[11px] font-mono text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <Play className="w-2.5 h-2.5" />
                    <span>{formatTime(chapter.startTimeSeconds)}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {chapter.dialogue.map((line, lineIdx) => {
                    const isSpeakerAlex = line.speaker === 'Alex';
                    const isSpeakerSam = line.speaker === 'Sam';
                    return (
                      <div key={lineIdx} className="text-xs space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold ${
                              isSpeakerAlex
                                ? 'text-amber-400'
                                : isSpeakerSam
                                ? 'text-sky-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {line.speaker}:
                          </span>
                          {line.style && (
                            <span className="text-[10px] text-zinc-400 italic">({line.style})</span>
                          )}
                        </div>
                        <p className="text-zinc-300 leading-relaxed pl-3 border-l border-zinc-800">
                          {line.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
