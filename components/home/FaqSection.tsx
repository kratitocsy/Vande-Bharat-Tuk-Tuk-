import Link from "next/link";
import { FaqList, faqJsonLd } from "../Faq";
import { ArrowIcon } from "../Icons";
import { HOME_FAQS } from "@/lib/seo-pages";
import { PHONE_DISPLAY } from "@/lib/config";

export function FaqSection() {
  return (
    <section id="faq" className="section bg-paper border-t border-line" aria-labelledby="faq-title">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(HOME_FAQS)) }} />
      <div className="container-x grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">Questions</p>
          <h2 id="faq-title" className="mb-4 mt-3.5 text-[clamp(2rem,3.4vw,2.8rem)] font-bold">
            Before you hop in.
          </h2>
          <p className="mb-6 max-w-[340px] text-[0.95rem] leading-relaxed text-ink-soft">
            Can&apos;t find what you need? Call Mahi on {PHONE_DISPLAY}, or send a request and ask when they call.
          </p>
          <Link href="/#book" className="btn btn-outline">
            Book a ride <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>
        <FaqList faqs={HOME_FAQS} />
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section className="pb-20 pt-4 md:pb-24" aria-label="Book a ride">
      <div className="container-x">
        <div className="flex flex-wrap items-center justify-between gap-7 overflow-hidden rounded-[30px] bg-sun bg-[radial-gradient(rgb(11_47_39/0.14)_1.3px,transparent_1.3px)] [background-size:24px_24px] p-8 sm:p-12">
          <div>
            <p className="eyebrow">Ready when you are</p>
            <h2 className="mt-3 max-w-[500px] text-[clamp(1.8rem,3vw,2.4rem)] font-bold">Your Indo Tuk Tuk is one call away.</h2>
          </div>
          <Link href="/#book" className="btn btn-dark">
            Book a ride <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
