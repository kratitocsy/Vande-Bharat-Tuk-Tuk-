import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rider login",
  description: "Sign in to see ride requests in Khajuraho.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/rider" },
};

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
