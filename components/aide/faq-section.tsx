"use client";

import { useState } from "react";

export interface VideoItem {
  title: string;
  src: string;
  description?: string;
}

export interface FaqItem {
  question: string;
  answer: React.ReactNode;
  video?: VideoItem;
}

export interface FaqSectionProps {
  title: string;
  faqs: FaqItem[];
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-ink-100 border border-ink-100 rounded-lg overflow-hidden">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-ink-50 transition-colors"
          >
            <span className="text-t-sm font-medium text-ink-900 pr-4">{item.question}</span>
            <ChevronIcon open={openIndex === i} />
          </button>
          {openIndex === i && (
            <div className="px-4 pb-4 pt-1 text-t-sm text-ink-600 leading-relaxed border-t border-ink-100 bg-ink-50/40 space-y-3">
              {item.video && (
                <div className="rounded-lg border border-ink-100 overflow-hidden">
                  <video
                    src={item.video.src}
                    controls
                    preload="metadata"
                    className="w-full aspect-video bg-ink-100"
                  />
                  {item.video.description && (
                    <div className="px-3 py-2">
                      <p className="text-t-xs text-ink-500">{item.video.description}</p>
                    </div>
                  )}
                </div>
              )}
              <div>{item.answer}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function FaqSection({ title, faqs }: FaqSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-h-sm font-semibold text-ink-900">{title}</h2>
      <FaqAccordion items={faqs} />
    </section>
  );
}
