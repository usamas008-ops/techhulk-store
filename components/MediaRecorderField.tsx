"use client";

import { useEffect, useRef, useState } from "react";
import { MEDIA_LIMITS, MEDIA_TYPES, baseMime, type MediaKind } from "@/lib/testimonials";

// Record a voice message or a short video right in the browser, or pick a
// file instead. Recording here is the better path: the browser encodes at a
// modest bitrate (about 10 MB a minute of video) in a format every phone can
// play, whereas a gallery video from an iPhone can be huge and in HEVC.

const CANDIDATES: Record<MediaKind, string[]> = {
  video: ["video/mp4;codecs=avc1,mp4a", "video/mp4", "video/webm;codecs=vp8,opus", "video/webm"],
  audio: ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"],
};

const pickMime = (kind: MediaKind) =>
  typeof MediaRecorder === "undefined" ? "" : CANDIDATES[kind].find((t) => MediaRecorder.isTypeSupported(t)) || "";

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function durationOf(file: File, kind: MediaKind): Promise<number> {
  return new Promise((resolve) => {
    const el = document.createElement(kind);
    const url = URL.createObjectURL(file);
    el.preload = "metadata";
    el.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(el.duration); };
    el.onerror = () => { URL.revokeObjectURL(url); resolve(NaN); };
    el.src = url;
  });
}

export default function MediaRecorderField({
  kind,
  file,
  onChange,
}: {
  kind: MediaKind;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const maxSeconds = kind === "video" ? MEDIA_LIMITS.videoSeconds : MEDIA_LIMITS.audioSeconds;
  const maxBytes = kind === "video" ? MEDIA_LIMITS.videoBytes : MEDIA_LIMITS.audioBytes;
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const live = useRef<HTMLVideoElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTracks = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  useEffect(() => () => stopTracks(), []);
  useEffect(() => {
    if (!file) return setPreviewUrl("");
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const start = async () => {
    setError("");
    const mimeType = pickMime(kind);
    if (!navigator.mediaDevices?.getUserMedia || !mimeType) {
      return setError("This browser cannot record. Choose a file instead.");
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia(
        kind === "video"
          ? { audio: true, video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } } }
          : { audio: true }
      );
    } catch {
      return setError(`Allow ${kind === "video" ? "camera and microphone" : "the microphone"} in your browser to record.`);
    }
    if (kind === "video" && live.current) {
      live.current.srcObject = stream.current;
      live.current.play().catch(() => {});
    }
    const chunks: Blob[] = [];
    const rec = new MediaRecorder(stream.current, {
      mimeType,
      videoBitsPerSecond: 1_200_000,
      audioBitsPerSecond: 64_000,
    });
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      stopTracks();
      setRecording(false);
      const type = baseMime(rec.mimeType || mimeType);
      const ext = MEDIA_TYPES[type]?.ext || (kind === "video" ? "webm" : "webm");
      onChange(new File(chunks, `recording.${ext}`, { type }));
    };
    recorder.current = rec;
    rec.start(1000);
    setSeconds(0);
    setRecording(true);
    timer.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= maxSeconds) recorder.current?.state === "recording" && recorder.current.stop();
        return s + 1;
      });
    }, 1000);
  };

  const stop = () => recorder.current?.state === "recording" && recorder.current.stop();

  const choose = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;
    setError("");
    const known = MEDIA_TYPES[baseMime(picked.type)];
    if (!known || known.kind !== kind) return setError(`That file type is not supported. Try recording here instead.`);
    if (picked.size > maxBytes) return setError(`The file is over ${Math.round(maxBytes / 1024 / 1024)} MB. Record a shorter one here instead.`);
    const secs = await durationOf(picked, kind);
    if (Number.isFinite(secs) && secs > maxSeconds + 2) return setError(`Please keep it under ${clock(maxSeconds)}.`);
    onChange(picked);
  };

  const btn = "rounded-[12px] px-4 py-2.5 text-[13px] font-bold";

  return (
    <div>
      {kind === "video" && (
        <video
          ref={live}
          muted
          playsInline
          className={`${recording ? "block" : "hidden"} mb-3 aspect-[3/4] w-full max-w-xs rounded-[16px] bg-black object-cover`}
        />
      )}

      {recording ? (
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 text-[13px] font-bold text-sale">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-sale" />
            Recording {clock(seconds)} / {clock(maxSeconds)}
          </span>
          <button type="button" onClick={stop} className={`${btn} bg-onyx text-white`}>Stop</button>
        </div>
      ) : file && previewUrl ? (
        <div className="space-y-3">
          {kind === "video" ? (
            <video src={previewUrl} controls playsInline className="aspect-[3/4] w-full max-w-xs rounded-[16px] bg-black object-contain" />
          ) : (
            <audio src={previewUrl} controls className="w-full max-w-sm" />
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { onChange(null); start(); }} className={`${btn} border-2 border-onyx text-onyx`}>Record again</button>
            <button type="button" onClick={() => onChange(null)} className={`${btn} text-slate hover:text-onyx`}>Remove</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={start} className={`${btn} inline-flex items-center gap-2 bg-sale text-white`}>
            <span className="h-2.5 w-2.5 rounded-full bg-white" />
            {kind === "video" ? "Record a video" : "Record a voice message"}
          </button>
          <label className="cursor-pointer text-[13px] font-semibold text-royal hover:underline">
            or choose a file
            <input type="file" accept={kind === "video" ? "video/*" : "audio/*"} onChange={choose} className="sr-only" />
          </label>
          <span className="w-full text-[12px] text-slate">Up to {clock(maxSeconds)}.</span>
        </div>
      )}

      {error && <p className="mt-2 text-[13px] text-sale">{error}</p>}
    </div>
  );
}
