import { Navbar } from './home/NavBar';
import { Hero } from './home/Hero';
import { StatsSection } from './home/Stats';
import { FeaturesSection } from './home/Features';
import { CTASection } from './home/Cta';
import { Footer } from './home/Footer';

type HomeProps = {
  onNavigate: (path: string) => void;
  onOpenBook: (bookId: string) => void;
};

export function Home({ onNavigate, onOpenBook }: HomeProps) {
  return (
    <div className="min-h-screen bg-whitez">
      <Navbar onNavigate={onNavigate} />
      <Hero onNavigate={onNavigate} onOpenBook={onOpenBook} />
      <StatsSection />
      <FeaturesSection  />
      <CTASection onNavigate={onNavigate} />
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
