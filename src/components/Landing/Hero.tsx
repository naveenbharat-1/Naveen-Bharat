import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/landing/hero_banner_coaching_center.png";

// Data Structure
export interface HeroData {
  title: string;
  subtitle: string;
  cta_text: string;
}

export interface HeroStat {
  stat_key: string;
  stat_value: string;
}

interface HeroProps {
  data: HeroData | null;
  stats?: HeroStat[];
}

// Memoized Hero component for performance
const Hero = memo(({ data, stats = [] }: HeroProps) => {
  const studentCount = stats.find(s => s.stat_key === 'students')?.stat_value || '500+';
  const courseCount = stats.find(s => s.stat_key === 'courses')?.stat_value || '50+';
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-16 md:py-24 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div className="text-center lg:text-left space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>UP & State Board | Classes 9-12</span>
            </div>

            {/* Dynamic Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
              {data?.title || "Welcome to Sadguru Coaching Classes"}
            </h1>

            {/* Subheading */}
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 font-medium tracking-wide">
              India's Most Affordable Learning Platform
            </p>

            {/* Dynamic Subtitle */}
            <p className="text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0">
              {data?.subtitle || "Join Sadguru Coaching Classes for world-class education."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto min-w-[160px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-md hover:shadow-lg transition-all duration-200 font-semibold px-6 py-3">
                  {data?.cta_text || "Get Started"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-6">
              <div className="bg-card rounded-2xl px-6 py-4 shadow-md border border-border text-center min-w-[110px]">
                <div className="text-3xl font-bold text-primary">{studentCount}</div>
                <div className="text-sm font-medium text-muted-foreground">Students</div>
              </div>
              <div className="bg-card rounded-2xl px-6 py-4 shadow-md border border-border text-center min-w-[110px]">
                <div className="text-3xl font-bold text-primary">{courseCount}</div>
                <div className="text-sm font-medium text-muted-foreground">Courses</div>
              </div>
            </div>
          </div>

          {/* Image with lazy loading */}
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src={heroImage} 
                alt="Learning" 
                className="w-full h-auto"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

Hero.displayName = "Hero";

export default Hero;
