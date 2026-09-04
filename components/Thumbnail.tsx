"use client";

import { useEffect, useRef } from "react";

/** Shows a real image, or a video's first frame — used wherever a hatched placeholder used to stand in. */
export default function Thumbnail({
  url,
  kind,
  className,
  style,
}: {
  url: string | null;
  kind: "image" | "video";
  className?: string;
  style?: React.CSSProperties;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || kind !== "video") return;
    // A freshly-loaded <video> shows nothing until a frame is actually decoded — nudge it to
    // render the very first frame instead of staying blank.
    const onLoadedData = () => {
      if (el.currentTime === 0) el.currentTime = 0.01;
    };
    el.addEventListener("loadeddata", onLoadedData);
    return () => el.removeEventListener("loadeddata", onLoadedData);
  }, [kind, url]);

  if (!url) return <div className={`ph ${className ?? ""}`} style={style} />;

  if (kind === "video") {
    return (
      <video
        ref={videoRef}
        src={url}
        className={className}
        style={{ objectFit: "cover", ...style }}
        muted
        playsInline
        preload="metadata"
      />
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className={className} style={{ objectFit: "cover", ...style }} />;
}
