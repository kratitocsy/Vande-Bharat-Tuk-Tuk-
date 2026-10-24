import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="section">
        <div className="container-x max-w-[640px] text-center">
          <p className="eyebrow justify-center">Page not found</p>
          <h1 className="mb-4 mt-4 text-5xl font-bold">Wrong turn.</h1>
          <p className="mb-8 text-ink-soft">We could not find that page. Let&apos;s get you back on the road.</p>
          <Link href="/" className="btn btn-dark">Back to home</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
