import type { Faq } from "@/lib/seo-pages";

export function FaqList({ faqs, firstOpen = true }: { faqs: Faq[]; firstOpen?: boolean }) {
  return (
    <div className="grid">
      {faqs.map((f, i) => (
        <details key={f.q} open={firstOpen && i === 0} className="group border-b border-line py-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[1.02rem] font-semibold transition hover:text-green group-open:text-green [&::-webkit-details-marker]:hidden">
            {f.q}
            <span aria-hidden className="relative h-[22px] w-[22px] shrink-0 rounded-full border border-line before:absolute before:left-1/2 before:top-1/2 before:h-px before:w-2.5 before:-translate-x-1/2 before:bg-current after:absolute after:left-1/2 after:top-1/2 after:h-2.5 after:w-px after:-translate-y-1/2 after:bg-current group-open:after:hidden" />
          </summary>
          <p className="max-w-[560px] pb-5 text-[0.93rem] leading-relaxed text-ink-soft">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function faqJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
