"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";

type HeroImageProps = {
  src: string;
  alt: string;
};

export function HeroImage({ src, alt }: HeroImageProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full cursor-zoom-in overflow-hidden rounded-xl border-2 border-[var(--primary)] bg-[var(--surface)] shadow-2xl md:origin-center md:scale-[1.2]"
        aria-label="Expand hero image"
        aria-haspopup="dialog"
      >
        <Image
          src={src}
          alt={alt}
          width={800}
          height={600}
          priority
          className="h-auto w-full object-cover"
        />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          onClick={() => setOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
        >
          <div
            className="relative max-h-[90vh] max-w-[95vw] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <span id={titleId} className="sr-only">
              Expanded hero image
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted)] hover:text-[var(--text)]"
              aria-label="Close image preview"
              ref={closeRef}
            >
              Close
            </button>
            <img
              src={src}
              alt={alt}
              className="max-h-[80vh] w-auto max-w-[90vw] rounded-lg object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
