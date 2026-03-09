import { memo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import gradImg from "@/assets/landing/graduation_success.png";

const GraduationBanner = memo(() => (
  <section className="relative overflow-hidden">
    <img
      src={gradImg}
      alt="Students celebrating graduation"
      className="w-full h-auto object-cover aspect-[21/9] md:aspect-[3/1]"
      loading="lazy"
      decoding="async"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent flex items-end justify-center pb-10 md:pb-16 text-center px-4">
      <div className="space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          Join Our Legacy of Success
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Thousands of students have achieved their dreams with us. Your journey starts today.
        </p>
        <Link to="/signup">
          <Button size="lg" className="gap-2">
            Enroll Now <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  </section>
));

GraduationBanner.displayName = "GraduationBanner";
export default GraduationBanner;
