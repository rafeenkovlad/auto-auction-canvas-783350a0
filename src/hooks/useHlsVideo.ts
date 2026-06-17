import { useEffect, useRef } from "react";

/**
 * Attach an HLS or native video source to a <video>. Returns a ref to assign.
 * Uses dynamic import of hls.js only when needed.
 */
export function useHlsVideo(url: string | null | undefined, isHls: boolean) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || !url) return;

    if (!isHls) {
      video.src = url.includes("#") ? url : `${url}#t=0.1`;
      return;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      return;
    }

    let cancelled = false;
    let hls: { destroy: () => void } | undefined;
    import("hls.js").then(({ default: Hls }) => {
      if (cancelled) return;
      if (Hls.isSupported()) {
        const instance = new Hls({ maxBufferLength: 1 });
        instance.loadSource(url);
        instance.attachMedia(video);
        hls = instance;
      } else {
        video.src = url;
      }
    });
    return () => {
      cancelled = true;
      if (hls) hls.destroy();
    };
  }, [url, isHls]);

  return ref;
}
