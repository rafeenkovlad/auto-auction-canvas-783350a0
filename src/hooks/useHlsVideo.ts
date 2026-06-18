import { useEffect, useRef } from "react";

/**
 * Attach an HLS or native video source to a <video>. Returns a ref to assign.
 * Uses dynamic import of hls.js only when needed.
 *
 * Also forces a seek to ~0.1s after metadata loads so that the very first
 * frame is rendered as a poster-like thumbnail (Safari/iOS often refuses to
 * paint the frame at t=0 with preload="metadata").
 */
export function useHlsVideo(url: string | null | undefined, isHls: boolean) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || !url) return;

    const seekToFirstFrame = () => {
      try {
        if (video.readyState >= 1 && video.duration > 0.2 && video.currentTime < 0.05) {
          video.currentTime = 0.1;
        }
      } catch {
        /* noop */
      }
    };
    video.addEventListener("loadedmetadata", seekToFirstFrame);

    let cancelled = false;
    let hls: { destroy: () => void } | undefined;

    if (!isHls) {
      // Append a media fragment so browsers that ignore loadedmetadata seek
      // still get a non-zero start time and decode the first frame.
      video.src = url.includes("#") ? url : `${url}#t=0.1`;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
    } else {
      import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (Hls.isSupported()) {
          const instance = new Hls({ maxBufferLength: 4 });
          instance.loadSource(url);
          instance.attachMedia(video);
          hls = instance;
        } else {
          video.src = url;
        }
      });
    }

    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", seekToFirstFrame);
      if (hls) hls.destroy();
    };
  }, [url, isHls]);

  return ref;
}
