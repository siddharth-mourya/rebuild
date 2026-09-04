"use client";

import { useRef } from "react";

const BOX_W = 88;
const BOX_H = 132;

export default function CropControl({
  focusX,
  focusY,
  zoom,
  thumbnailUrl,
  thumbnailKind,
  assetWidth,
  assetHeight,
  onChange,
}: {
  focusX: number;
  focusY: number;
  zoom: number;
  thumbnailUrl?: string;
  thumbnailKind?: "image" | "video";
  assetWidth?: number;
  assetHeight?: number;
  onChange: (patch: { focusX?: number; focusY?: number; zoom?: number }) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  function setFromClientPos(clientX: number, clientY: number) {
    const el = boxRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    onChange({ focusX: x, focusY: y });
  }

  // Where the source image actually renders inside the (object-fit: contain) preview box,
  // so the dimmed "trimmed away" overlay can be placed accurately over it.
  let renderedW = BOX_W;
  let renderedH = BOX_H;
  let offsetX = 0;
  let offsetY = 0;
  if (assetWidth && assetHeight) {
    const scale = Math.min(BOX_W / assetWidth, BOX_H / assetHeight);
    renderedW = assetWidth * scale;
    renderedH = assetHeight * scale;
    offsetX = (BOX_W - renderedW) / 2;
    offsetY = (BOX_H - renderedH) / 2;
  }

  // The rectangle that survives the crop (matches the ffmpeg crop math in ffmpegEngine.ts),
  // expressed in the preview box's coordinate space.
  const cropWFrac = 1 / zoom;
  const cropHFrac = 1 / zoom;
  const cropXFrac = focusX * (1 - cropWFrac);
  const cropYFrac = focusY * (1 - cropHFrac);
  const rect = {
    left: offsetX + cropXFrac * renderedW,
    top: offsetY + cropYFrac * renderedH,
    width: cropWFrac * renderedW,
    height: cropHFrac * renderedH,
  };

  return (
    <div className="flex items-center gap-2.5">
      <div
        ref={boxRef}
        onPointerDown={(e) => {
          draggingRef.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          setFromClientPos(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (!draggingRef.current) return;
          setFromClientPos(e.clientX, e.clientY);
        }}
        onPointerUp={() => (draggingRef.current = false)}
        className="relative shrink-0 cursor-crosshair overflow-hidden"
        style={{ width: BOX_W, height: BOX_H, background: "var(--color-surface)", outline: "1px solid var(--color-divider)" }}
      >
        {thumbnailUrl ? (
          thumbnailKind === "video" ? (
            <video
              src={thumbnailUrl}
              className="absolute"
              style={{ left: offsetX, top: offsetY, width: renderedW, height: renderedH }}
              muted
              playsInline
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailUrl}
              alt=""
              className="absolute"
              style={{ left: offsetX, top: offsetY, width: renderedW, height: renderedH }}
            />
          )
        ) : (
          <div className="ph absolute inset-0" />
        )}

        {/* Everything outside this rect (the part the crop trims away) is dimmed via the box-shadow spread trick. */}
        <div
          className="absolute"
          style={{
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            boxShadow: "0 0 0 9999px color-mix(in srgb, var(--color-text) 55%, transparent)",
            border: "1px solid var(--color-accent)",
          }}
        />

        <span
          className="absolute"
          style={{
            left: `${focusX * 100}%`,
            top: `${focusY * 100}%`,
            transform: "translate(-50%, -50%)",
            width: 14,
            height: 14,
            border: "2px solid var(--color-accent)",
            borderRadius: "50%",
            background: "color-mix(in srgb, var(--color-accent) 25%, transparent)",
          }}
        />
      </div>
      <div className="flex-1">
        <p style={{ fontSize: 11.5, margin: "0 0 6px", color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }}>
          Drag the focus point to choose which part of the frame survives the crop. The dimmed area is trimmed away.
        </p>
        <div className="field">
          <label>Zoom — {zoom.toFixed(2)}×</label>
          <input
            type="range"
            min={1}
            max={2.5}
            step={0.01}
            value={zoom}
            onChange={(e) => onChange({ zoom: Number(e.target.value) })}
            style={{ width: "100%", accentColor: "var(--color-accent)" }}
          />
        </div>
      </div>
    </div>
  );
}
