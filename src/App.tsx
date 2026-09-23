import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ArticleQueue } from './components/ArticleQueue';
import { CommuteConfig } from './components/CommuteConfig';
import { AudioPlayer } from './components/AudioPlayer';
import { InteractiveTranscript } from './components/InteractiveTranscript';
import { CarHudModal } from './components/CarHudModal';
import { BriefingArchive } from './components/BriefingArchive';
import { Article, Briefing, CommuterProfile, CommuteStyle } from './types';
import { SAMPLE_ARTICLES } from './data/sampleArticles';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { Radio, Sparkles, Loader2, AlertCircle, Headphones, Car, ShieldAlert } from 'lucide-react';

const STORAGE_KEY_BRIEFINGS = 'commutecast_briefings_v1';
const STORAGE_KEY_PROFILE = 'commutecast_profile_v1';

export default function App() {
  // Start with 2 pre-selected sample articles for instant delightful experience
  const [articles, setArticles] = useState<Article[]>([
    SAMPLE_ARTICLES[0],
    SAMPLE_ARTICLES[1],
  ]);

  const [durationMinutes, setDurationMinutes] = useState<number>(5);
  const [style, setStyle] = useState<CommuteStyle>('podcast_duo');
  const [voiceA, setVoiceA] = useState<string>('Puck');
  const [voiceB, setVoiceB] = useState<string>('Kore');

  const [profile, setProfile] = useState<CommuterProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      role: 'Software Engineer',
      industry: 'Technology',
      interests: ['Artificial Intelligence', 'Clean Energy', 'Urban Transit'],
    };
  });

  const [archive, setArchive] = useState<Briefing[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BRIEFINGS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [currentBriefing, setCurrentBriefing] = useState<Briefing | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BRIEFINGS);
      if (saved) {
        const list = JSON.parse(saved);
        if (list.length > 0) return list[0];
      }
    } catch {}
    return null;
  });

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCarHudOpen, setIsCarHudOpen] = useState<boolean>(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState<boolean>(false);

  // Audio Player Hook
  const player = useAudioPlayer(currentBriefing);

  // Save profile changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    } catch {}
  }, [profile]);

  // Save archive changes
  const saveToArchive = (briefing: Briefing) => {
    setArchive((prev) => {
      const updated = [briefing, ...prev.filter((b) => b.id !== briefing.id)].slice(0, 10);
      try {
        localStorage.setItem(STORAGE_KEY_BRIEFINGS, JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage limit reached for audio storage:', e);
      }
      return updated;
    });
  };

  const deleteFromArchive = (id: string) => {
    setArchive((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_BRIEFINGS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (currentBriefing?.id === id) {
      setCurrentBriefing(null);
    }
  };

  // Article queue actions
  const handleAddArticle = (article: Article) => {
    setArticles((prev) => {
      if (prev.some((a) => a.id === article.id)) return prev;
      return [...prev, article];
    });
  };

  const handleRemoveArticle = (id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  const handleTogglePriority = (id: string) => {
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, priority: a.priority === 'high' ? 'normal' : 'high' } : a))
    );
  };

  const handleClearQueue = () => {
    setArticles([]);
  };

  // Generate Audio Briefing
  const handleGenerateBriefing = async () => {
    if (articles.length === 0 || isGenerating) return;

    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationStep('Synthesizing news articles with Gemini 3.8 Flash...');

    try {
      // Step status simulation for reassurance
      const stepTimer1 = setTimeout(() => {
        setGenerationStep('Writing personalized commuter script & dialogue...');
      }, 1800);

      const stepTimer2 = setTimeout(() => {
        setGenerationStep(
          style === 'podcast_duo'
            ? 'Generating multi-speaker spoken audio with Gemini 3.8 Flash TTS...'
            : 'Generating broadcast audio with Gemini 3.8 Flash TTS...'
        );
      }, 4500);

      const res = await fetch('/api/generate-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles,
          commuteDuration: durationMinutes,
          commuterProfile: profile,
          style,
          voiceA,
          voiceB,
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate briefing');
      }

      const newBriefing: Briefing = data.briefing;
      setCurrentBriefing(newBriefing);
      saveToArchive(newBriefing);

      // Scroll smoothly to player
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Generation error:', err);
      setErrorMessage(err.message || 'Unable to generate audio summary. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      <Header
        onNewBriefing={() => {
          window.scrollTo({ top: 400, behavior: 'smooth' });
        }}
        onOpenCarHud={() => setIsCarHudOpen(true)}
        onOpenArchive={() => setIsArchiveOpen(true)}
        hasActiveBriefing={Boolean(currentBriefing?.fullAudioWavBase64)}
        isGenerating={isGenerating}
        archiveCount={archive.length}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Error Banner */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold">Generation Issue</h4>
              <p className="text-xs text-red-300 mt-0.5">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-red-400 hover:text-red-200"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Generation In-Progress Overlay Banner */}
        {isGenerating && (
          <div className="p-6 rounded-2xl bg-zinc-900/90 border border-amber-500/40 shadow-2xl flex flex-col items-center justify-center text-center space-y-3 animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Crafting Your Commute Briefing</h3>
              <p className="text-xs text-amber-300 font-mono mt-1">{generationStep}</p>
            </div>
            <p className="text-[11px] text-zinc-400 max-w-md">
              Gemini is distilling your articles into spoken chapters and generating natural audio with voice acting.
            </p>
          </div>
        )}

        {/* Active Audio Player Section */}
        {currentBriefing && (
          <div className="space-y-6">
            <AudioPlayer
              briefing={currentBriefing}
              isPlaying={player.isPlaying}
              currentTime={player.currentTime}
              duration={player.duration}
              playbackRate={player.playbackRate}
              activeChapterIndex={player.activeChapterIndex}
              activeChapter={player.activeChapter}
              onTogglePlay={player.togglePlay}
              onSeekTo={player.seekTo}
              onSeekBy={player.seekBy}
              onSeekToChapter={player.seekToChapter}
              onChangePlaybackRate={player.changePlaybackRate}
              onOpenCarHud={() => setIsCarHudOpen(true)}
            />

            <InteractiveTranscript
              briefing={currentBriefing}
              activeChapterIndex={player.activeChapterIndex}
              isPlaying={player.isPlaying}
              onSeekToChapter={player.seekToChapter}
            />
          </div>
        )}

        {/* Hero Banner when no briefing is active yet */}
        {!currentBriefing && (
          <div className="relative rounded-2xl p-6 sm:p-10 border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 overflow-hidden">
            <div className="max-w-2xl space-y-3 relative z-10">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Commute Audio Newsroom</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Turn your morning news into a personalized commute podcast.
              </h1>
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                Feed in articles, set your travel time, and let Gemini craft an engaging audio broadcast with dual-speaker hosts, key takeaways, and why it matters to your workday.
              </p>
            </div>
          </div>
        )}

        {/* Queue and Commute Customizer Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7">
            <ArticleQueue
              articles={articles}
              onAddArticle={handleAddArticle}
              onRemoveArticle={handleRemoveArticle}
              onTogglePriority={handleTogglePriority}
              onClearQueue={handleClearQueue}
              targetDurationMinutes={durationMinutes}
            />
          </div>

          <div className="lg:col-span-5">
            <CommuteConfig
              durationMinutes={durationMinutes}
              onChangeDuration={setDurationMinutes}
              style={style}
              onChangeStyle={setStyle}
              profile={profile}
              onChangeProfile={setProfile}
              voiceA={voiceA}
              onChangeVoiceA={setVoiceA}
              voiceB={voiceB}
              onChangeVoiceB={setVoiceB}
              onGenerate={handleGenerateBriefing}
              isGenerating={isGenerating}
              canGenerate={articles.length > 0}
            />
          </div>
        </div>
      </main>

      {/* Oversized Car & Transit HUD View */}
      {isCarHudOpen && currentBriefing && (
        <CarHudModal
          briefing={currentBriefing}
          isPlaying={player.isPlaying}
          currentTime={player.currentTime}
          duration={player.duration}
          playbackRate={player.playbackRate}
          activeChapterIndex={player.activeChapterIndex}
          activeChapter={player.activeChapter}
          onTogglePlay={player.togglePlay}
          onSeekBy={player.seekBy}
          onSeekToChapter={player.seekToChapter}
          onChangePlaybackRate={player.changePlaybackRate}
          onClose={() => setIsCarHudOpen(false)}
        />
      )}

      {/* Saved Briefings Archive Modal */}
      {isArchiveOpen && (
        <BriefingArchive
          archive={archive}
          onSelectBriefing={(b) => setCurrentBriefing(b)}
          onDeleteBriefing={deleteFromArchive}
          onClose={() => setIsArchiveOpen(false)}
          activeBriefingId={currentBriefing?.id}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CommuteCast — Spoken Audio Briefings for Commuters</span>
          <div className="flex items-center gap-2">
            <span>Powered by Gemini 3.8 Flash & Gemini 3.8 Flash TTS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
