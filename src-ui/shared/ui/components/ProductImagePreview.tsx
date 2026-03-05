import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { ProductEntity } from "@/shared/bindings/ProductEntity";

function normalizeImages(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((s) => s.trim());
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
  }
  return [];
}

export function ProductImagePreview({ product }: { product: ProductEntity }) {
  const raw = (product as any).image_paths as unknown;
  const images = React.useMemo(() => normalizeImages(raw), [raw]);
  const firstImage = images[0];

  const [hover, setHover] = React.useState(false);
  const [preferTop, setPreferTop] = React.useState(true);
  const [isFullscreenOpen, setIsFullscreenOpen] = React.useState(false);

  const anchorRef = React.useRef<HTMLDivElement | null>(null);

  // координаты для portal-превью (fixed)
  const [pos, setPos] = React.useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  React.useEffect(() => {
    if (!hover) return;

    const el = anchorRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();

    const PREVIEW_H = 260;
    const GAP = 12;

    const spaceTop = rect.top;
    const spaceBottom = window.innerHeight - rect.bottom;

    const canTop = spaceTop >= PREVIEW_H + GAP;
    const canBottom = spaceBottom >= PREVIEW_H + GAP;

    let topPreferred = true;
    if (canTop) topPreferred = true;
    else if (canBottom) topPreferred = false;
    else topPreferred = spaceTop > spaceBottom;

    setPreferTop(topPreferred);

    setPos({
      left: rect.left + rect.width / 2,
      top: topPreferred ? rect.top : rect.bottom,
      width: rect.width,
      height: rect.height,
    });
  }, [hover]);

  // если скроллят список — обновляем позицию, чтобы превью не “улетало”
  React.useEffect(() => {
    if (!hover) return;

    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();

      const PREVIEW_H = 260;
      const GAP = 12;

      const spaceTop = rect.top;
      const spaceBottom = window.innerHeight - rect.bottom;

      const canTop = spaceTop >= PREVIEW_H + GAP;
      const canBottom = spaceBottom >= PREVIEW_H + GAP;

      let topPreferred = preferTop;
      if (canTop) topPreferred = true;
      else if (canBottom) topPreferred = false;
      else topPreferred = spaceTop > spaceBottom;

      setPreferTop(topPreferred);

      setPos({
        left: rect.left + rect.width / 2,
        top: topPreferred ? rect.top : rect.bottom,
        width: rect.width,
        height: rect.height,
      });
    };

    window.addEventListener("scroll", update, true); // важно: true, чтобы ловить скролл внутри контейнеров
    window.addEventListener("resize", update);


    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [hover, preferTop]);

  if (!firstImage) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
        <span className="text-xs">—</span>
      </div>
    );
  }

  const src = convertFileSrc(firstImage);

  React.useEffect(() => {
  if (!isFullscreenOpen) return;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsFullscreenOpen(false);
    }
  };

  document.body.style.overflow = "hidden";
  window.addEventListener("keydown", onKeyDown);

  return () => {
    document.body.style.overflow = "";
    window.removeEventListener("keydown", onKeyDown);
  };
}, [isFullscreenOpen]);


  return (
    <>
      <div
        ref={anchorRef}
        className="relative"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={product.name ?? "preview"}
          onClick={(e) => {
            e.stopPropagation();
            setIsFullscreenOpen(true);
          }}
          className="h-10 w-10 cursor-zoom-in rounded-md border object-cover"
        />
      </div>

      {/* HOVER PREVIEW через PORTAL (не режется overflow) */}
      {hover && pos && typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: pos.left,
              top: pos.top,
              transform: "translateX(-50%)",
              zIndex: 99999, // выше всех
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                transform: preferTop ? "translateY(-12px)" : "translateY(12px)",
              }}
            >
              <div className="h-[260px] w-[260px] overflow-hidden rounded-xl border bg-background shadow-2xl">
                <img
                  src={src}
                  alt="preview-large"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* FULLSCREEN */}
      {isFullscreenOpen &&
  typeof document !== "undefined" &&
  createPortal(
    <div
      className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/90"
      onClick={() => setIsFullscreenOpen(false)}
    >
      <button
        onClick={() => setIsFullscreenOpen(false)}
        className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white hover:bg-black"
      >
        <X className="h-6 w-6" />
      </button>

      <img
        src={src}
        alt="fullscreen"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[95vh] max-w-[95vw] object-contain"
      />
    </div>,
    document.body
  )}

    </>
  );
}
