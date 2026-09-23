import { useState, useEffect, useRef, useCallback } from 'react';
import { Briefing, Chapter } from '../types';

export function useAudioPlayer(briefing: Briefing | null) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize or update audio source when briefing changes
  useEffect(() => {
    if (!briefing?.fullAudioWavBase64) {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    // Convert Base64 to Blob URL
    try {
      const binaryString = atob(briefing.fullAudioWavBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      setAudioUrl(url);
      setCurrentTime(0);
      setActiveChapterIndex(0);

      // Create or configure audio element
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      const audio = audioRef.current;
      audio.src = url;
      audio.playbackRate = playbackRate;
      audio.load();

      // Estimate initial duration from metadata or briefing
      if (briefing.actualDurationSeconds) {
        setDuration(briefing.actualDurationSeconds);
      }

      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (e) {
      console.error('Failed to parse briefing audio blob:', e);
    }
  }, [briefing]);

  // Handle audio element events and updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      } else if (briefing?.actualDurationSeconds) {
        setDuration(briefing.actualDurationSeconds);
      }
    };

    const onTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);

      // Determine active chapter
      if (briefing?.chapters && briefing.chapters.length > 0) {
        let matchedIndex = 0;
        for (let i = 0; i < briefing.chapters.length; i++) {
          const ch = briefing.chapters[i];
          const start = ch.startTimeSeconds ?? 0;
          const end = start + (ch.durationSeconds ?? 0);
          if (time >= start && (i === briefing.chapters.length - 1 || time < end)) {
            matchedIndex = i;
            break;
          }
        }
        setActiveChapterIndex(matchedIndex);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(audio.duration || 0);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [briefing]);

  // Update MediaSession metadata for Car & Bluetooth controls
  useEffect(() => {
    if (!('mediaSession' in navigator) || !briefing) return;

    const currentChapter = briefing.chapters?.[activeChapterIndex];
    const trackTitle = currentChapter ? currentChapter.storyTitle : briefing.title;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: trackTitle,
      artist: 'CommuteCast AI Briefing',
      album: briefing.title,
    });

    navigator.mediaSession.setActionHandler('play', () => {
      play();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      pause();
    });
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      seekBy(-(details.seekOffset || 15));
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      seekBy(details.seekOffset || 15);
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (activeChapterIndex > 0) {
        seekToChapter(briefing.chapters[activeChapterIndex - 1].id);
      }
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (activeChapterIndex < briefing.chapters.length - 1) {
        seekToChapter(briefing.chapters[activeChapterIndex + 1].id);
      }
    });

    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
      }
    };
  }, [briefing, activeChapterIndex]);

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.warn('Audio play request interrupted or prevented:', err);
      });
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seekTo = useCallback(
    (seconds: number) => {
      if (audioRef.current) {
        const clamped = Math.max(0, Math.min(seconds, duration || 9999));
        audioRef.current.currentTime = clamped;
        setCurrentTime(clamped);
      }
    },
    [duration]
  );

  const seekBy = useCallback(
    (deltaSeconds: number) => {
      if (audioRef.current) {
        const target = audioRef.current.currentTime + deltaSeconds;
        seekTo(target);
      }
    },
    [seekTo]
  );

  const seekToChapter = useCallback(
    (chapterId: string) => {
      if (!briefing || !briefing.chapters) return;
      const chapter = briefing.chapters.find((c) => c.id === chapterId);
      if (chapter && typeof chapter.startTimeSeconds === 'number') {
        seekTo(chapter.startTimeSeconds);
        play();
      }
    },
    [briefing, seekTo, play]
  );

  const changePlaybackRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    activeChapterIndex,
    activeChapter: briefing?.chapters?.[activeChapterIndex] as Chapter | undefined,
    play,
    pause,
    togglePlay,
    seekTo,
    seekBy,
    seekToChapter,
    changePlaybackRate,
  };
}
