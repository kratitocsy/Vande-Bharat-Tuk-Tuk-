import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track your rider",
  description: "See where your Indo Tuk Tuk rider is.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/track" },
};

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
