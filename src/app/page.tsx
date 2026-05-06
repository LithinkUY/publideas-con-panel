import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ServicesSlider from "@/components/ServicesSlider";
import ProcessSection from "@/components/ProcessSection";
import Footer from "@/components/Footer";

export default function Home() {
    return (
        <main>
            <Header />
            <HeroSection />
            <ProcessSection />
            <ServicesSlider />
            <Footer />
        </main>
    );
}
