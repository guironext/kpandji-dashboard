"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, SwitchCamera, VideoOff, X } from "lucide-react";

export async function requestCarCamera(
  facingMode: "environment" | "user" = "environment"
): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("NO_CAMERA");
  }
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: { ideal: facingMode },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
  });
}

export default function CameraCapture({
  initialStream,
  onCapture,
  onCancel,
  onStreamChange,
  onNativeFallback,
}: {
  initialStream: MediaStream;
  onCapture: (file: File) => void;
  onCancel: () => void;
  onStreamChange?: (stream: MediaStream) => void;
  onNativeFallback?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [canSwitch, setCanSwitch] = useState(false);

  const attachStream = useCallback(async (stream: MediaStream) => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    await video.play().catch(() => undefined);
  }, []);

  useEffect(() => {
    attachStream(initialStream);

    const video = videoRef.current;
    let cancelled = false;
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        if (!cancelled) {
          setCanSwitch(devices.filter((d) => d.kind === "videoinput").length > 1);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      if (video) video.srcObject = null;
    };
  }, [initialStream, attachStream]);

  const handleSwitchCamera = async () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setSwitching(true);
    setError(null);
    try {
      const nextStream = await requestCarCamera(next);
      await attachStream(nextStream);
      onStreamChange?.(nextStream);
      setFacingMode(next);
    } catch {
      setError("Impossible de changer de caméra.");
    } finally {
      setSwitching(false);
    }
  };

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    setCapturing(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas indisponible");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Capture impossible"))),
          "image/jpeg",
          0.92
        );
      });

      const file = new File([blob], `defaut-vehicule-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      onCapture(file);
    } catch {
      setError("La capture a échoué. Réessayez.");
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
      <div className="relative aspect-[4/3] w-full bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />

        {switching && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
            <Loader2 className="h-7 w-7 animate-spin text-white" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/90 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
              <VideoOff className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-white">{error}</p>
            {onNativeFallback && (
              <Button
                type="button"
                size="sm"
                className="rounded-xl bg-rose-500 font-semibold text-white hover:bg-rose-600"
                onClick={onNativeFallback}
              >
                Ouvrir l&apos;appareil photo
              </Button>
            )}
          </div>
        )}

        {!error && (
          <div className="pointer-events-none absolute inset-x-8 inset-y-6 rounded-xl border-2 border-white/30" />
        )}
      </div>

      <div className="flex items-center justify-between gap-2 bg-slate-900 px-3 py-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-xl text-slate-300 hover:bg-white/10 hover:text-white"
          onClick={onCancel}
        >
          <X className="mr-1.5 h-4 w-4" />
          Annuler
        </Button>

        <Button
          type="button"
          disabled={!!error || capturing || switching}
          className="h-12 w-12 rounded-full bg-white p-0 text-slate-900 shadow-lg hover:bg-rose-100 disabled:opacity-40"
          onClick={handleCapture}
          aria-label="Prendre la photo"
        >
          {capturing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Camera className="h-5 w-5" />
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!canSwitch || !!error || switching}
          className="rounded-xl text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-30"
          onClick={handleSwitchCamera}
        >
          <SwitchCamera className="mr-1.5 h-4 w-4" />
          Inverser
        </Button>
      </div>
    </div>
  );
}
