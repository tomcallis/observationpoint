import Hero from "@/components/sections/Hero";
import Highlights from "@/components/sections/Highlights";
import Gallery from "@/components/sections/Gallery";
import Availability from "@/components/sections/Availability";
import FAQ from "@/components/sections/FAQ";
import Location from "@/components/sections/Location";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <main>
      <Hero />
      <Highlights />
      <Gallery />
      <Availability />
      <FAQ />
      <Location />
      <Contact />
    </main>
  );
}
