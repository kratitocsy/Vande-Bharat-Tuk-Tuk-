"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const SRC = "/audio/grace-of-the-ancient-stones.mp3";
const VOLUME = 0.3;
const KEY = "indo-music"; // "off" once the visitor pauses it
const DONE_KEY = "indo-music-done"; // set when the track has played to the end in this visit

function readPref() {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
function playedThisSession() {
  try {
    return window.sessionStorage.getItem(DONE_KEY) === "1";
  } catch {
    return false;
  }
}
function savePref(value: "on" | "off") {
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    // private mode: the choice just lasts for this visit
  }
}

/**
 * Soft background music that starts as the site opens and plays once to the end.
 * Browsers only allow sound after the visitor has interacted with the page, so if the browser
 * refuses at first, it starts on the first tap or key press. A button pauses and resumes it.
 * If someone pauses it, it stays quiet on their next visit.
 */
export function MusicPlayer() {
  const pathname = usePathname();
  const hidden = pathname.startsWith("/rider"); // keep riders' work screen quiet
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fade = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const wantsMusic = useRef(true);
  const wasPlayingBeforeHide = useRef(false);

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio(SRC);
      audio.loop = false;
      audio.preload = "auto";
      audio.volume = 0;
      audio.addEventListener("ended", () => {
        setPlaying(false);
        try {
          window.sessionStorage.setItem(DONE_KEY, "1");
        } catch {
          // fine: it may play again on the next page load
        }
      });
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  const fadeTo = useCallback((target: number, ms: number, done?: () => void) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (fade.current) window.clearInterval(fade.current);
    const start = audio.volume;
    const began = performance.now();
    fade.current = window.setInterval(() => {
      const t = Math.min(1, (performance.now() - began) / ms);
      audio.volume = start + (target - start) * t;
      if (t >= 1) {
        if (fade.current) window.clearInterval(fade.current);
        fade.current = null;
        done?.();
      }
    }, 50);
  }, []);

  const start = useCallback(async () => {
    const audio = ensureAudio();
    try {
      audio.muted = false;
      await audio.play();
      setPlaying(true);
      fadeTo(VOLUME, 1800);
      return true;
    } catch {
      return false; // the browser wants a tap first
    }
  }, [ensureAudio, fadeTo]);

  // Browsers always allow silent playback, so the track starts at once, muted, and the sound
  // comes up on the visitor's first tap or key press.
  const startMuted = useCallback(async () => {
    const audio = ensureAudio();
    try {
      audio.muted = true;
      await audio.play();
      setPlaying(true);
      return true;
    } catch {
      audio.muted = false;
      return false;
    }
  }, [ensureAudio]);

  const unmute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return false;
    audio.muted = false;
    if (audio.paused) return false;
    fadeTo(VOLUME, 1800);
    return true;
  }, [fadeTo]);

  const pause = useCallback(() => {
    setPlaying(false);
    fadeTo(0, 400, () => audioRef.current?.pause()); // pausing keeps the place, so Play carries on
  }, [fadeTo]);

  // Start on the first tap, click or key press.
  useEffect(() => {
    if (hidden) return;
    wantsMusic.current = readPref() !== "off" && !playedThisSession();
    if (!wantsMusic.current) return;

    let started = false;
    const events = ["pointerdown", "keydown", "touchend", "click"] as const;
    const cleanup = () => events.forEach((e) => window.removeEventListener(e, onFirst));
    async function onFirst() {
      if (started) return;
      started = true;
      cleanup();
      if (!wantsMusic.current) return;
      if (!unmute()) await start();
    }
    events.forEach((e) => window.addEventListener(e, onFirst, { passive: true }));

    // Some browsers allow it straight away (for example after earlier visits).
    start().then((ok) => {
      if (ok) {
        started = true;
        cleanup();
      } else if (!started) {
        startMuted();
      }
    });
    return cleanup;
  }, [hidden, start, startMuted, unmute]);

  // Pause while the tab is in the background.
  useEffect(() => {
    const onVisibility = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.hidden) {
        wasPlayingBeforeHide.current = !audio.paused;
        audio.pause();
      } else if (wasPlayingBeforeHide.current && wantsMusic.current) {
        audio.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Stop on screens where it does not belong.
  useEffect(() => {
    if (hidden && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setPlaying(false);
    }
  }, [hidden]);

  useEffect(
    () => () => {
      if (fade.current) window.clearInterval(fade.current);
      audioRef.current?.pause();
    },
    [],
  );

  if (hidden) return null;

  async function toggle() {
    if (playing) {
      wantsMusic.current = false;
      savePref("off");
      pause();
    } else {
      wantsMusic.current = true;
      savePref("on");
      const audio = ensureAudio();
      if (audio.ended) audio.currentTime = 0; // play again from the start after it finished
      await start();
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={playing}
      aria-label={playing ? "Pause background music" : "Play background music"}
      title={playing ? "Pause music" : "Play music"}
      className="fixed bottom-4 right-4 z-[150] grid h-11 w-11 place-items-center rounded-full border border-line bg-paper/95 text-ink shadow-lg backdrop-blur transition hover:scale-105 hover:bg-sun sm:bottom-6 sm:right-6"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
        <path d="M9 18V6l10-2v12" />
        <circle cx="6.5" cy="18" r="2.5" />
        <circle cx="16.5" cy="16" r="2.5" />
        {!playing && <path d="M3 3l18 18" strokeWidth="2.2" />}
      </svg>
      {playing && <span aria-hidden className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#12846a] ring-2 ring-paper" />}
    </button>
  );
}
