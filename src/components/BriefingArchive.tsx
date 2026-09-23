import React from 'react';
import { Briefing } from '../types';
import { Play, Trash2, X, Clock, Calendar, Radio } from 'lucide-react';

interface BriefingArchiveProps {
  archive: Briefing[];
  onSelectBriefing: (briefing: Briefing) => void;
  onDeleteBriefing: (id: string) => void;
  onClose: () => void;
  activeBriefingId?: string;
}

export const BriefingArchive: React.FC<BriefingArchiveProps> = ({
  archive,
  onSelectBriefing,
  onDeleteBriefing,
  onClose,
  activeBriefingId,
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Saved Commute Editions</h3>
              <p className="text-xs text-zinc-400">Stored on your device for offline replay</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto flex-1 divide-y divide-zinc-800/80">
          {archive.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-sm">
              No saved editions yet. Your generated briefings will appear here.
            </div>
          ) : (
            archive.map((item) => {
              const isActive = item.id === activeBriefingId;
              const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className={`py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isActive ? 'opacity-100' : 'opacity-90'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        <span>{dateStr}</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>{item.estimatedMinutes} min</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.chapters.length} stories</span>
                    </div>

                    <h4 className="text-sm font-semibold text-zinc-200 truncate">{item.title}</h4>
                    <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{item.headline}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectBriefing(item);
                        onClose();
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-amber-500 text-zinc-950 shadow-sm'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isActive ? 'Current' : 'Play'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteBriefing(item.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                      title="Delete edition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
