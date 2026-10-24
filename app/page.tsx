import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/home/Hero";
import { RideTabs } from "@/components/home/RideTabs";
import { HowItWorks, Places, Safety, SectionHead, Why } from "@/components/home/Sections";
import { Partner } from "@/components/home/Partner";
import { CtaBand, FaqSection } from "@/components/home/FaqSection";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <section id="rides" className="section" aria-labelledby="rides-title">
          <div className="container-x">
            <SectionHead
              id="rides-title"
              eyebrow="Rides & tours"
              title="One tuk tuk. Every way to see Khajuraho."
              sub="Hop across town, catch your flight or train, or keep a rider for the day. Pick a ride and your rider calls you to agree the price. One auto takes up to 3 people."
            />
            <RideTabs />
          </div>
        </section>
        <HowItWorks />
        <Why />
        <Safety />
        <Places />
        <Partner />
        <FaqSection />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
