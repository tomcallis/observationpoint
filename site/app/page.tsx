import Hero from "@/components/sections/Hero";
import Highlights from "@/components/sections/Highlights";
import Gallery from "@/components/sections/Gallery";
import Reviews from "@/components/sections/Reviews";
import Availability from "@/components/sections/Availability";
import Booking from "@/components/sections/Booking";
import Location from "@/components/sections/Location";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <main>
      <Hero />
      <Highlights />
      <Gallery />
      <Reviews />
      <Availability />
      <Booking />
      <Location />
      <Contact />
    </main>
  );
}
