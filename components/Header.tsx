"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoMark } from "./Logo";
import { PhoneIcon } from "./Icons";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/config";

const NAV = [
  { href: "/#book", label: "Ride" },
  { href: "/#how", label: "How it works" },
  { href: "/#places", label: "Explore Khajuraho" },
  { href: "/#rides", label: "Tours" },
  { href: "/#safety", label: "Safety" },
  { href: "/#faq", label: "Help" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onResize = () => window.innerWidth > 920 && setOpen(false);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-[100] border-b transition ${
        scrolled ? "border-line bg-cream/90 backdrop-blur-md" : "border-transparent bg-cream/70 backdrop-blur-sm"
      }`}
    >
      <div className="container-x flex h-[70px] items-center gap-2 sm:h-[78px]">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-display text-[0.92rem] font-semibold sm:gap-2.5 sm:text-[1.15rem]" aria-label="Indo Tuk Tuk home">
          <span className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-green-deep sm:h-[40px] sm:w-[40px] sm:rounded-xl">
            <LogoMark />
          </span>
          <span>
            Indo<strong className="ml-1 text-green">Tuk Tuk</strong>
          </span>
        </Link>

        <nav
          aria-label="Main navigation"
          className={`${
            open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0 lg:visible lg:translate-y-0 lg:opacity-100"
          } fixed inset-x-4 top-[78px] z-[99] flex flex-col rounded-2xl border border-line bg-cream p-2.5 shadow-2xl transition lg:static lg:ml-9 lg:flex-row lg:items-center lg:gap-6 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3.5 text-base font-medium text-ink-soft transition hover:bg-cream-2 hover:text-ink lg:px-0 lg:py-1 lg:text-[0.92rem] lg:hover:bg-transparent"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
          <a
            href={PHONE_HREF}
            aria-label={`Call Mahi on ${PHONE_DISPLAY} to book directly`}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#f0b72a] bg-sun px-3 py-2 text-left transition hover:bg-[#ffd05c] sm:gap-2.5 sm:px-4 sm:py-2"
          >
            <PhoneIcon className="h-[17px] w-[17px] shrink-0 sm:h-5 sm:w-5" />
            <span className="grid text-[0.82rem] font-bold leading-[1.1] tracking-[0.01em] sm:text-[0.95rem] max-[340px]:hidden">
              <small className="hidden text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-[#6a4b00] sm:block">Call Mahi to book</small>
              {PHONE_DISPLAY}
            </span>
          </a>
          <Link href="/#book" className="btn btn-dark hidden sm:inline-flex">
            Book online
          </Link>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="grid h-[38px] w-[38px] place-items-center rounded-xl border border-line bg-paper lg:hidden"
          >
            <span className="relative block h-[2px] w-[18px] bg-ink before:absolute before:-top-[6px] before:left-0 before:h-[2px] before:w-[18px] before:bg-ink after:absolute after:top-[6px] after:left-0 after:h-[2px] after:w-[18px] after:bg-ink" />
          </button>
        </div>
      </div>
    </header>
  );
}
