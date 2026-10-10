import Navbar        from "@/app/components/Navbar";
import Hero          from "@/app/components/sections/Hero";
import CoffeeGallery from "@/app/components/sections/CoffeeGallery";
import About         from "@/app/components/sections/About";
import Atmosphere    from "@/app/components/sections/Atmosphere";
import MenuPreview   from "@/app/components/sections/MenuPreview";
import BookingCta    from "@/app/components/sections/BookingCta";
import Contacts      from "@/app/components/sections/Contacts";
import Footer        from "@/app/components/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <div className="divider-gold" />
        <CoffeeGallery />
        <div className="divider-gold" />
        <About />
        <div className="divider-gold" />
        <Atmosphere />
        <div className="divider-gold" />
        <MenuPreview />
        <div className="divider-gold" />
        <BookingCta />
        <div className="divider-gold" />
        <Contacts />
      </main>
      <Footer />
    </>
  );
}
