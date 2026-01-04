"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";

type GalleryImage = {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
};

const galleryImages: GalleryImage[] = [
  {
    src: "/teacher_creates.jpg",
    alt: "Teacher creating an assessment",
    title: "1. Teacher Creates",
    subtitle: "Upload materials, set rubric, generate questions",
  },
  {
    src: "/student_responds.jpg",
    alt: "Student recording an oral response",
    title: "2. Student Responds",
    subtitle: "Record by voice, any device, anywhere",
  },
  {
    src: "/teacher_reviews.jpg",
    alt: "Teacher reviewing student submissions",
    title: "3. Teacher Reviews",
    subtitle: "AI scores, teacher verifies, intervene where needed",
  },
];

export function FeatureGallery() {
  const [active, setActive] = useState<GalleryImage | null>(null);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (active) closeRef.current?.focus();
  }, [active]);

  return (
    <>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {galleryImages.map((image) => (
          <button
            key={image.src}
            type="button"
            onClick={() => setActive(image)}
            className="group rounded-xl border border-[#E2E8F0] bg-white p-4 text-left shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            aria-haspopup="dialog"
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={800}
              height={600}
              className="aspect-[4/3] w-full rounded-lg object-cover"
            />
            <p className="mt-4 text-center text-sm font-medium text-[#1E293B]">{image.title}</p>
            <p className="mt-2 text-center text-xs text-[#64748B]">{image.subtitle}</p>
            <p className="mt-3 text-center text-[11px] uppercase tracking-[0.18em] text-[#475569] group-hover:text-[#334155]">
              Click to expand
            </p>
          </button>
        ))}
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          onClick={() => setActive(null)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setActive(null);
          }}
        >
          <div
            className="relative max-h-[90vh] max-w-[95vw] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <span id={titleId} className="sr-only">
              Expanded gallery image
            </span>
            <button
              type="button"
              onClick={() => setActive(null)}
              className="absolute right-3 top-3 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted)] hover:text-[var(--text)]"
              aria-label="Close image preview"
              ref={closeRef}
            >
              Close
            </button>
            <img
              src={active.src}
              alt={active.alt}
              className="max-h-[80vh] w-auto max-w-[90vw] rounded-lg object-contain"
            />
            <div className="mt-3 text-center text-sm text-[var(--muted)]">{active.title}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
