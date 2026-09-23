import React from 'react';
import { Radio, Car, Plus, History, Sparkles } from 'lucide-react';

interface HeaderProps {
  onNewBriefing: () => void;
  onOpenCarHud: () => void;
  onOpenArchive: () => void;
  hasActiveBriefing: boolean;
  isGenerating: boolean;
  archiveCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onNewBriefing,
  onOpenCarHud,
  onOpenArchive,
  hasActiveBriefing,
  isGenerating,
  archiveCount,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-zinc-100 text-lg">CommuteCast</span>
              <span className="text-[11px] font-medium text-amber-400/90 tracking-wide uppercase">AI Radio</span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">Personalized commute news briefings & spoken audio</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {archiveCount > 0 && (
            <button
              onClick={onOpenArchive}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
              title="View past commute editions"
            >
              <History className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Saved Editions</span>
              <span className="text-xs text-zinc-400">({archiveCount})</span>
            </button>
          )}

          {hasActiveBriefing && (
            <button
              onClick={onOpenCarHud}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
              title="Open oversized Commuter Car / Transit HUD"
            >
              <Car className="w-4 h-4" />
              <span>Transit HUD</span>
            </button>
          )}

          <button
            onClick={onNewBriefing}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Briefing</span>
          </button>
        </div>
      </div>
    </header>
  );
};
