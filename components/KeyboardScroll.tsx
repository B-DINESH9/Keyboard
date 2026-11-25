"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

const TOTAL_FRAMES = 120;
const FOG_BG_COLOR = "#BBBEC1";

function getFramePath(index: number): string {
  const clamped = Math.max(0, Math.min(TOTAL_FRAMES - 1, index));
  return `/frames/frame_${clamped}_delay-0.04s.webp`;
}

export default function KeyboardScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(
    new Array(TOTAL_FRAMES).fill(null)
  );
  const lastDrawnFrameRef = useRef<number>(-1);
  const rafIdRef = useRef<number | null>(null);
  const targetFrameRef = useRef<number>(0);

  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 380,
    damping: 38,
    mass: 0.25,
    restDelta: 0.0005,
  });

  // Beat 1: 0% Scroll (Centered) — "Dinesh Keyboard." / "Engineered clarity."
  const beat1Opacity = useTransform(scrollYProgress, [0, 0.08, 0.16], [1, 1, 0]);
  const beat1Y = useTransform(scrollYProgress, [0, 0.08, 0.16], [0, 0, -10]);

  // Beat 2: 25% Scroll (Left aligned) — "Built for Precision." / "Every detail, measured."
  const beat2Opacity = useTransform(
    scrollYProgress,
    [0.17, 0.24, 0.35, 0.43],
    [0, 1, 1, 0]
  );
  const beat2Y = useTransform(
    scrollYProgress,
    [0.17, 0.24, 0.35, 0.43],
    [10, 0, 0, -10]
  );

  // Beat 3: 60% Scroll (Right aligned) — "Layered Engineering." / "See what’s inside."
  const beat3Opacity = useTransform(
    scrollYProgress,
    [0.48, 0.56, 0.72, 0.8],
    [0, 1, 1, 0]
  );
  const beat3Y = useTransform(
    scrollYProgress,
    [0.48, 0.56, 0.72, 0.8],
    [10, 0, 0, -10]
  );

  // Beat 4: 90% Scroll (Centered CTA) — "Assembled. Ready." / "Scroll back to replay."
  const beat4Opacity = useTransform(scrollYProgress, [0.83, 0.9, 1], [0, 1, 1]);
  const beat4Y = useTransform(scrollYProgress, [0.83, 0.9, 1], [10, 0, 0]);

  const drawFrame = useCallback((frameIndex: number, force = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const clampedIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIndex));
    if (!force && clampedIndex === lastDrawnFrameRef.current) return;

    const img = imagesRef.current[clampedIndex];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const cssWidth = canvas.width / dpr;
    const cssHeight = canvas.height / dpr;
    if (cssWidth <= 0 || cssHeight <= 0) return;

    ctx.fillStyle = FOG_BG_COLOR;
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = cssWidth / cssHeight;

    let drawWidth: number;
    let drawHeight: number;
    if (canvasAspect > imgAspect) {
      drawHeight = cssHeight;
      drawWidth = drawHeight * imgAspect;
    } else {
      drawWidth = cssWidth;
      drawHeight = drawWidth / imgAspect;
    }

    const offsetX = (cssWidth - drawWidth) / 2;
    const offsetY = (cssHeight - drawHeight) / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    lastDrawnFrameRef.current = clampedIndex;
  }, []);

  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const nextWidth = Math.max(1, Math.round(rect.width * dpr));
    const nextHeight = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
    }

    const ctx = canvas.getContext("2d", { alpha: false });
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    if (lastDrawnFrameRef.current >= 0) {
      drawFrame(lastDrawnFrameRef.current, true);
    } else if (isReady) {
      drawFrame(targetFrameRef.current, true);
    }
  }, [drawFrame, isReady]);

  // Preload all 120 WebP frames cleanly before starting interactive playback
  useEffect(() => {
    let isCancelled = false;
    let settled = 0;

    const onImageSettled = () => {
      if (isCancelled) return;
      settled += 1;
      setLoadedCount(settled);
      if (settled >= TOTAL_FRAMES) {
        setIsReady(true);
      }
    };

    for (let i = 0; i < TOTAL_FRAMES; i += 1) {
      const img = new Image();
      img.decoding = "async";
      img.onload = async () => {
        try {
          if (typeof img.decode === "function") {
            await img.decode();
          }
        } catch {
          // Image already loaded; safe to proceed even if decode rejects
        }
        imagesRef.current[i] = img;
        onImageSettled();
      };
      img.onerror = () => {
        onImageSettled();
      };
      img.src = getFramePath(i);
    }

    return () => {
      isCancelled = true;
    };
  }, []);

  // Size canvas on mount and keep responsive on resize / DPR change
  useEffect(() => {
    syncCanvasSize();
    const canvas = canvasRef.current;
    let resizeObserver: ResizeObserver | null = null;

    if (canvas && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        syncCanvasSize();
      });
      resizeObserver.observe(canvas);
    }

    window.addEventListener("resize", syncCanvasSize);
    return () => {
      window.removeEventListener("resize", syncCanvasSize);
      resizeObserver?.disconnect();
    };
  }, [syncCanvasSize]);

  // Draw initial frame immediately once sequence finishes preloading
  useEffect(() => {
    if (!isReady) return;
    syncCanvasSize();
    const initialProgress = smoothProgress.get();
    const initialFrame = Math.max(
      0,
      Math.min(TOTAL_FRAMES - 1, Math.round(initialProgress * (TOTAL_FRAMES - 1)))
    );
    targetFrameRef.current = initialFrame;
    drawFrame(initialFrame, true);
  }, [isReady, syncCanvasSize, smoothProgress, drawFrame]);

  // Map scroll progress (0 -> 1) to frame (0 -> 119) via requestAnimationFrame
  useMotionValueEvent(smoothProgress, "change", (latest) => {
    if (!isReady) return;
    const clampedProgress = Math.max(0, Math.min(1, latest));
    const frameIndex = Math.max(
      0,
      Math.min(TOTAL_FRAMES - 1, Math.round(clampedProgress * (TOTAL_FRAMES - 1)))
    );
    targetFrameRef.current = frameIndex;

    if (frameIndex === lastDrawnFrameRef.current) return;
    if (rafIdRef.current !== null) return;

    rafIdRef.current = window.requestAnimationFrame(() => {
      rafIdRef.current = null;
      drawFrame(targetFrameRef.current);
    });
  });

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const progressPct = Math.round((loadedCount / TOTAL_FRAMES) * 100);

  return (
    <section
      ref={containerRef}
      aria-label="Dinesh Keyboard Scrollytelling Showcase"
      className="relative h-[400vh] w-full bg-[#BBBEC1]"
    >
      {/* Loading overlay while frames preload */}
      {!isReady && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#BBBEC1] px-6 transition-opacity duration-500"
        >
          <div className="flex flex-col items-center gap-4">
            <div
              className="h-7 w-7 animate-spin rounded-full border-[1.5px] border-black/15 border-t-black/75"
              aria-hidden="true"
            />
            <p className="text-sm font-medium tracking-tight text-black/60">
              Loading Dinesh sequence...
            </p>
            <div className="h-[1.5px] w-36 overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full bg-black/60 transition-[width] duration-150 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sticky 100vh Stage */}
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden bg-[#BBBEC1]">
        <canvas
          ref={canvasRef}
          className={`block h-full w-full transition-opacity duration-500 ${
            isReady ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Beat 1: 0% Scroll — Centered above product silhouette */}
        <motion.div
          style={{ opacity: beat1Opacity, y: beat1Y }}
          className="pointer-events-none absolute inset-x-0 top-[9vh] z-10 flex flex-col items-center px-6 text-center md:top-[5.5vh]"
        >
          <h1 className="text-4xl font-semibold tracking-tight text-black/90 sm:text-5xl md:text-6xl">
            Dinesh Keyboard.
          </h1>
          <p className="mt-2 text-base font-normal tracking-tight text-black/60 sm:text-lg md:text-xl">
            Engineered clarity.
          </p>
        </motion.div>

        {/* Beat 2: 25% Scroll — Left aligned outside central product area */}
        <motion.div
          style={{ opacity: beat2Opacity, y: beat2Y }}
          className="pointer-events-none absolute left-6 right-6 top-[10vh] z-10 text-left sm:left-10 md:right-auto md:top-[10vh] md:max-w-[260px] lg:left-14 lg:max-w-[300px]"
        >
          <h2 className="text-3xl font-semibold tracking-tight text-black/90 sm:text-4xl lg:text-5xl lg:leading-[1.06]">
            Built for Precision.
          </h2>
          <p className="mt-2.5 text-base font-normal tracking-tight text-black/60 sm:text-lg">
            Every detail, measured.
          </p>
        </motion.div>

        {/* Beat 3: 60% Scroll — Right aligned cleanly outside exploded layer stack */}
        <motion.div
          style={{ opacity: beat3Opacity, y: beat3Y }}
          className="pointer-events-none absolute left-6 right-6 top-[10vh] z-10 text-right sm:right-10 md:left-auto md:top-auto md:bottom-[10vh] md:max-w-[260px] lg:right-14 lg:max-w-[300px]"
        >
          <h2 className="text-3xl font-semibold tracking-tight text-black/90 sm:text-4xl lg:text-5xl lg:leading-[1.06]">
            Layered Engineering.
          </h2>
          <p className="mt-2.5 text-base font-normal tracking-tight text-black/60 sm:text-lg">
            See what’s inside.
          </p>
        </motion.div>

        {/* Beat 4: 90% Scroll — Centered CTA cleanly positioned out of center */}
        <motion.div
          style={{ opacity: beat4Opacity, y: beat4Y }}
          className="pointer-events-none absolute inset-x-0 bottom-[8vh] z-10 flex flex-col items-center px-6 text-center md:bottom-auto md:top-[5.5vh]"
        >
          <h2 className="text-4xl font-semibold tracking-tight text-black/90 sm:text-5xl md:text-6xl">
            Assembled. Ready.
          </h2>
          <button
            type="button"
            onClick={handleScrollToTop}
            className="pointer-events-auto mt-3 inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.05] px-4 py-1.5 text-sm font-medium tracking-tight text-black/70 transition-colors hover:border-black/25 hover:bg-black/[0.1] hover:text-black/90 sm:text-base"
          >
            <span>Scroll back to replay.</span>
            <span aria-hidden="true" className="text-xs">
              ↑
            </span>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
