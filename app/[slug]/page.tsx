import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BookingForm } from "@/components/BookingForm";
import { FaqList, faqJsonLd } from "@/components/Faq";
import { CheckIcon, PhoneIcon } from "@/components/Icons";
import { SEO_PAGES, getSeoPage } from "@/lib/seo-pages";
import { PHONE_DISPLAY, PHONE_E164, PHONE_HREF, SITE_NAME, SITE_URL } from "@/lib/config";

export const dynamicParams = false;

export function generateStaticParams() {
  return SEO_PAGES.map((p) => ({ slug: p.path.slice(1) }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getSeoPage(`/${slug}`);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: { title: `${page.title} | ${SITE_NAME}`, description: page.description, url: page.path, type: "article" },
    twitter: { title: page.title, description: page.description },
  };
}

export default async function LandingPage({ params }: Props) {
  const { slug } = await params;
  const page = getSeoPage(`/${slug}`);
  if (!page) notFound();

  const related = page.related.map((p) => getSeoPage(p)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const url = `${SITE_URL}${page.path}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: page.h1,
      description: page.description,
      url,
      serviceType: "Auto rickshaw ride",
      areaServed: { "@type": "City", name: "Khajuraho" },
      provider: { "@id": `${SITE_URL}/#business`, "@type": "LocalBusiness", name: SITE_NAME, telephone: PHONE_E164 },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: page.h1, item: url },
      ],
    },
    faqJsonLd(page.faqs),
  ];

  return (
    <>
      <Header />
      <main id="main">
        {jsonLd.map((d, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />
        ))}

        <section id="book" className="relative overflow-hidden pb-14 pt-8 sm:pt-10 lg:pb-20">
          <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,#ffe39a_0%,transparent_65%)] opacity-60" />
          <div className="container-x relative">
            <nav aria-label="Breadcrumb" className="mb-6 text-[0.82rem] text-muted">
              <Link href="/" className="hover:text-green">Home</Link> <span aria-hidden>/</span> <span className="text-ink-soft">{page.eyebrow}</span>
            </nav>
            <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
              <div className="min-w-0">
                <p className="eyebrow">{page.eyebrow}</p>
                <h1 className="mb-4 mt-4 text-[clamp(2rem,5.5vw,3.5rem)] font-bold leading-[1.02]">{page.h1}</h1>
                <p className="max-w-[540px] text-[1.05rem] leading-relaxed text-ink-soft">{page.lead}</p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <a href={PHONE_HREF} className="btn btn-sun">
                    <PhoneIcon className="h-4 w-4" /> Call Mahi {PHONE_DISPLAY}
                  </a>
                  <span className="text-sm text-muted">or send a request below</span>
                </div>
              </div>
              <BookingForm initialTrip={page.trip} initialDropoff={page.dropoff} idPrefix="lp-" />
            </div>
          </div>
        </section>

        <section className="section border-y border-line bg-paper" aria-label={page.h1}>
          <div className="container-x grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div className="grid max-w-[640px] content-start gap-5 text-[1.02rem] leading-[1.75] text-ink-soft">
              {page.body.map((para) => (
                <p key={para.slice(0, 24)}>{para}</p>
              ))}
              <div className="mt-2 rounded-3xl bg-cream p-6">
                <h2 className="mb-3 text-xl font-bold tracking-tight text-ink">{page.tipsTitle}</h2>
                <ul className="grid gap-3 text-[0.95rem]">
                  {page.tips.map((t) => (
                    <li key={t} className="flex items-start gap-3">
                      <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-green text-paper">
                        <CheckIcon className="h-3 w-3" />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <aside className="grid content-start gap-4" aria-label={page.highlightsTitle}>
              <h2 className="text-2xl font-bold tracking-tight">{page.highlightsTitle}</h2>
              {page.highlights.map((h) => (
                <article key={h.title} className="card bg-cream p-5">
                  <h3 className="mb-1.5 text-[1.05rem] font-bold tracking-tight">{h.title}</h3>
                  <p className="text-[0.9rem] leading-relaxed text-ink-soft">{h.text}</p>
                </article>
              ))}
            </aside>
          </div>
        </section>

        <section className="section" aria-labelledby="lp-faq">
          <div className="container-x grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <p className="eyebrow">Questions</p>
              <h2 id="lp-faq" className="mt-3.5 text-[clamp(1.9rem,3vw,2.6rem)] font-bold">Good to know</h2>
              <p className="mt-4 max-w-[340px] text-[0.95rem] leading-relaxed text-ink-soft">
                Something else? Call Mahi on {PHONE_DISPLAY} and ask.
              </p>
            </div>
            <FaqList faqs={page.faqs} />
          </div>
        </section>

        {related.length > 0 && (
          <section className="pb-20" aria-label="More trips">
            <div className="container-x">
              <h2 className="mb-5 text-2xl font-bold tracking-tight">More from Khajuraho</h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <li key={r.path}>
                    <Link href={r.path} className="card block h-full p-5 transition hover:-translate-y-1 hover:border-green/35 hover:shadow-soft">
                      <span className="label">{r.eyebrow}</span>
                      <strong className="mt-1.5 block font-display text-lg leading-snug tracking-tight">{r.h1}</strong>
                      <span className="mt-2 block text-sm text-ink-soft">{r.lead}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
