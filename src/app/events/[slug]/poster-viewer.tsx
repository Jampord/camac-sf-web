"use client";

import { useRef, useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// The event poster, and a full-screen viewer for it (UI redesign). Canva posters are portrait
// and full of small print, so older readers need it big: tap the poster to fill the screen,
// then pinch or tap again to zoom in, and close with the large ✕ (or Escape).
// Before the page is interactive the poster is a plain link to the full image, so a tap always
// shows it one way or the other.

type Props = {
  alt: string;
  /** The page's image: Cloudinary sizes, made on the server. */
  src: string;
  srcSet: string;
  /** The viewer's image, large enough to read the small print. */
  fullSrc: string;
};

export function PosterViewer({ alt, src, srcSet, fullSrc }: Props) {
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  function openViewer(e: React.MouseEvent) {
    // Ctrl/Cmd-click still opens the image in a new tab, like any link.
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    setZoomed(false);
    setOpen(true);
  }

  /** Zoom in on the spot that was tapped, or back out. */
  function toggleZoom(e: React.MouseEvent<HTMLElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width;
    const y = (e.clientY - box.top) / box.height;
    setZoomed((wasZoomed) => {
      if (!wasZoomed) {
        requestAnimationFrame(() => {
          const el = scroller.current;
          if (!el) return;
          el.scrollLeft = x * el.scrollWidth - el.clientWidth / 2;
          el.scrollTop = y * el.scrollHeight - el.clientHeight / 2;
        });
      }
      return !wasZoomed;
    });
  }

  return (
    <figure className="flex flex-col items-center gap-2 self-center">
      <a href={fullSrc} onClick={openViewer} className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary resizes it; next/image would resize twice */}
        <img
          src={src}
          srcSet={srcSet}
          sizes="(min-width: 42rem) 40rem, 100vw"
          alt={alt}
          className="max-h-[70vh] w-auto cursor-zoom-in rounded-xl border object-contain"
        />
      </a>
      <figcaption className="text-muted-foreground">Tap the poster to see it full size</figcaption>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Popup className="fixed inset-0 z-50 flex flex-col bg-black text-white outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 motion-reduce:animate-none">
            <div className="flex items-center gap-3 px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-3">
              <DialogPrimitive.Title className="min-w-0 flex-1 truncate text-lg font-semibold">
                {alt}
              </DialogPrimitive.Title>
              <DialogPrimitive.Close
                aria-label="Close the poster"
                className="grid size-14 shrink-0 place-items-center rounded-full bg-white text-black outline-none focus-visible:ring-4 focus-visible:ring-white/60"
              >
                <XIcon className="size-8" aria-hidden />
              </DialogPrimitive.Close>
            </div>

            {/* pinch-zoom: the phone's own pinch works here; panning scrolls when zoomed in. */}
            <div
              ref={scroller}
              className="min-h-0 flex-1 touch-pan-x touch-pan-y touch-pinch-zoom overflow-auto"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
              <img
                src={fullSrc}
                alt=""
                onClick={toggleZoom}
                className={cn(
                  "select-none",
                  zoomed
                    ? "max-w-none cursor-zoom-out w-[200%] sm:w-[150%]"
                    : "size-full cursor-zoom-in object-contain p-2",
                )}
              />
            </div>

            <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <p className="text-white/80">Pinch, or tap the poster, to zoom.</p>
              <button
                type="button"
                onClick={() => setZoomed((z) => !z)}
                className="flex h-12 shrink-0 items-center gap-2 rounded-full border-2 border-white px-5 font-semibold outline-none focus-visible:ring-4 focus-visible:ring-white/60"
              >
                {zoomed ? <ZoomOutIcon className="size-5" aria-hidden /> : <ZoomInIcon className="size-5" aria-hidden />}
                {zoomed ? "Zoom out" : "Zoom in"}
              </button>
            </div>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </figure>
  );
}
