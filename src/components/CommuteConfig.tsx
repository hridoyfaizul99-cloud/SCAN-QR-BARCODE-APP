import React, { useState } from 'react';
import { CommuterProfile, CommuteStyle } from '../types';
import { Clock, Users, Briefcase, Volume2, Sparkles, Play, Loader2 } from 'lucide-react';

interface CommuteConfigProps {
  durationMinutes: number;
  onChangeDuration: (minutes: number) => void;
  style: CommuteStyle;
  onChangeStyle: (style: CommuteStyle) => void;
  profile: CommuterProfile;
  onChangeProfile: (profile: CommuterProfile) => void;
  voiceA: string;
  onChangeVoiceA: (voice: string) => void;
  voiceB: string;
  onChangeVoiceB: (voice: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  canGenerate: boolean;
}

const AVAILABLE_VOICES = [
  { id: 'Puck', name: 'Puck', desc: 'Energetic, upbeat & engaging' },
  { id: 'Kore', name: 'Kore', desc: 'Warm, clear & articulate' },
  { id: 'Fenrir', name: 'Fenrir', desc: 'Crisp, dynamic & focused' },
  { id: 'Zephyr', name: 'Zephyr', desc: 'Smooth, calm NPR tone' },
  { id: 'Charon', name: 'Charon', desc: 'Deep, resonant & authoritative' },
];

const PRESET_ROLES = [
  'Software Engineer',
  'Product Manager',
  'Finance & Investor',
  'Healthcare & Science',
  'Operations & Business',
  'General Curious Commuter',
];

const INTEREST_TAGS = [
  'Artificial Intelligence',
  'Clean Energy',
  'Urban Transit',
  'Global Markets',
  'Space & Science',
  'Workplace Trends',
  'Health Tech',
];

export const CommuteConfig: React.FC<CommuteConfigProps> = ({
  durationMinutes,
  onChangeDuration,
  style,
  onChangeStyle,
  profile,
  onChangeProfile,
  voiceA,
  onChangeVoiceA,
  voiceB,
  onChangeVoiceB,
  onGenerate,
  isGenerating,
  canGenerate,
}) => {
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [customRoleInput, setCustomRoleInput] = useState('');

  const handlePreviewVoice = async (voiceName: string) => {
    if (previewingVoice) return;
    setPreviewingVoice(voiceName);

    try {
      const res = await fetch('/api/preview-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceName,
          text: `Good morning! This is ${voiceName} with your CommuteCast news briefing. Ready for today's stories?`,
        }),
      });

      const data = await res.json();
      if (data.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        audio.play();
      }
    } catch (err) {
      console.error('Voice preview failed:', err);
    } finally {
      setPreviewingVoice(null);
    }
  };

  const toggleInterest = (interest: string) => {
    const current = profile.interests || [];
    if (current.includes(interest)) {
      onChangeProfile({
        ...profile,
        interests: current.filter((i) => i !== interest),
      });
    } else {
      onChangeProfile({
        ...profile,
        interests: [...current, interest],
      });
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" />
          <span>Commute Personalization</span>
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Tailor timing, editorial framing, and voice anchors for your daily ride.
        </p>
      </div>

      {/* 1. Target Duration */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
          1. Commute Duration: <span className="text-amber-400 font-bold normal-case text-sm">{durationMinutes} minutes</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {[
            { mins: 3, label: '3 min', desc: 'Espresso Dash' },
            { mins: 5, label: '5 min', desc: 'Subway Hop' },
            { mins: 10, label: '10 min', desc: 'City Transit' },
            { mins: 15, label: '15 min', desc: 'Express Rail' },
          ].map((item) => (
            <button
              key={item.mins}
              type="button"
              onClick={() => onChangeDuration(item.mins)}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                durationMinutes === item.mins
                  ? 'bg-amber-500/10 border-amber-500 text-zinc-100 ring-1 ring-amber-500/50'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <div className="text-sm font-semibold">{item.label}</div>
              <div className="text-[10px] text-zinc-400 truncate">{item.desc}</div>
            </button>
          ))}
        </div>

        {/* Fine-grain slider */}
        <div className="flex items-center gap-3 bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800">
          <span className="text-xs text-zinc-400 font-mono">1m</span>
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={durationMinutes}
            onChange={(e) => onChangeDuration(Number(e.target.value))}
            className="flex-1 accent-amber-500 cursor-pointer"
          />
          <span className="text-xs text-zinc-400 font-mono">20m</span>
        </div>
      </div>

      {/* 2. Broadcast Style */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
          2. Broadcast Presentation Style
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            {
              id: 'podcast_duo',
              title: 'Alex & Sam (Podcast Co-Hosts)',
              desc: 'Engaging two-speaker dialogue, natural banter & insightful chemistry.',
              badge: 'Multi-Voice TTS',
            },
            {
              id: 'npr_anchor',
              title: 'NPR-Style Morning Anchor',
              desc: 'Thoughtful, articulate, measured storytelling with deep context.',
              badge: 'Single Anchor',
            },
            {
              id: 'executive_summary',
              title: 'Executive Morning Briefing',
              desc: 'Crisp, bottom-line upfront, market and strategic implications.',
              badge: 'Executive',
            },
            {
              id: 'casual_commute',
              title: 'Upbeat Commuter Radio',
              desc: 'Friendly, punchy, energized transitions for your morning drive.',
              badge: 'Drive Time',
            },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onChangeStyle(s.id as CommuteStyle)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                style === s.id
                  ? 'bg-amber-500/10 border-amber-500 text-zinc-100 ring-1 ring-amber-500/50'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-zinc-200">{s.title}</span>
                  <span className="text-[10px] text-amber-400 font-mono">{s.badge}</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{s.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Voice Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            3. Gemini AI Voice
          </label>
          <span className="text-[11px] text-zinc-400">gemini-3.8-flash-tts</span>
        </div>

        {style === 'podcast_duo' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Host A */}
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-zinc-300">Host 1 (Alex)</span>
                <button
                  type="button"
                  onClick={() => handlePreviewVoice(voiceA)}
                  disabled={Boolean(previewingVoice)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 disabled:opacity-50"
                >
                  {previewingVoice === voiceA ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Play className="w-2.5 h-2.5" />
                  )}
                  <span>Sample</span>
                </button>
              </div>
              <select
                value={voiceA}
                onChange={(e) => onChangeVoiceA(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-200 p-2 focus:outline-none focus:border-amber-500"
              >
                {AVAILABLE_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} - {v.desc}
                  </option>
                ))}
              </select>
            </div>

            {/* Host B */}
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-zinc-300">Host 2 (Sam)</span>
                <button
                  type="button"
                  onClick={() => handlePreviewVoice(voiceB)}
                  disabled={Boolean(previewingVoice)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 disabled:opacity-50"
                >
                  {previewingVoice === voiceB ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Play className="w-2.5 h-2.5" />
                  )}
                  <span>Sample</span>
                </button>
              </div>
              <select
                value={voiceB}
                onChange={(e) => onChangeVoiceB(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-200 p-2 focus:outline-none focus:border-amber-500"
              >
                {AVAILABLE_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} - {v.desc}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-300">Anchor Voice</span>
              <button
                type="button"
                onClick={() => handlePreviewVoice(voiceA)}
                disabled={Boolean(previewingVoice)}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 disabled:opacity-50"
              >
                {previewingVoice === voiceA ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-2.5 h-2.5" />
                )}
                <span>Listen Sample</span>
              </button>
            </div>
            <select
              value={voiceA}
              onChange={(e) => onChangeVoiceA(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-200 p-2 focus:outline-none focus:border-amber-500"
            >
              {AVAILABLE_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} - {v.desc}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 4. Commuter Lens & Profession */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
          4. Commuter Perspective & Role
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {PRESET_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => onChangeProfile({ ...profile, role })}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                profile.role === role
                  ? 'bg-amber-500 text-zinc-950 font-semibold shadow-sm'
                  : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Custom Role Input */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Or enter custom role (e.g. Urban Architect, Teacher, Founder)..."
            value={customRoleInput}
            onChange={(e) => setCustomRoleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customRoleInput.trim()) {
                e.preventDefault();
                onChangeProfile({ ...profile, role: customRoleInput.trim() });
                setCustomRoleInput('');
              }
            }}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
          {customRoleInput.trim() && (
            <button
              type="button"
              onClick={() => {
                onChangeProfile({ ...profile, role: customRoleInput.trim() });
                setCustomRoleInput('');
              }}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-xl font-medium"
            >
              Set
            </button>
          )}
        </div>

        {/* Key Interests */}
        <div>
          <span className="block text-[11px] text-zinc-400 mb-1.5">
            Highlight Angles in Audio Briefing:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {INTEREST_TAGS.map((tag) => {
              const active = (profile.interests || []).includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleInterest(tag)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    active
                      ? 'bg-zinc-800 text-amber-300 border border-amber-500/40'
                      : 'bg-zinc-950 border border-zinc-800/80 text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  {active ? `✓ ${tag}` : `+ ${tag}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Generation Action Button */}
      <div className="pt-2 border-t border-zinc-800">
        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
          className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Audio Briefing with Gemini...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate My Commute Briefing ({durationMinutes} min)</span>
            </>
          )}
        </button>
        {!canGenerate && (
          <p className="text-[11px] text-center text-zinc-400 mt-2">
            Add at least one article to your queue above to generate your audio summary.
          </p>
        )}
      </div>
    </div>
  );
};
