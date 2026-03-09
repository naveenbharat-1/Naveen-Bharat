import { memo } from "react";
import { Star } from "lucide-react";
import testimonialImg from "@/assets/landing/student_success_testimonial.png";

const Testimonials = memo(() => (
  <section className="py-20 bg-muted/30">
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Our Toppers Speak
        </h2>
        <p className="text-muted-foreground text-lg">Real results from real students</p>
      </div>

      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-center">
        {/* Image */}
        <div className="rounded-3xl overflow-hidden shadow-xl border border-border">
          <img
            src={testimonialImg}
            alt="Successful student celebrating results"
            className="w-full h-auto object-cover aspect-[4/3]"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Quote card */}
        <div className="bg-card p-8 rounded-2xl border border-border shadow-lg space-y-4">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-primary text-primary" />
            ))}
          </div>
          <blockquote className="text-foreground text-lg italic leading-relaxed">
            "Sadguru Coaching Classes transformed my preparation. The faculty's dedication and structured approach helped me secure a top rank. I couldn't have done it without them!"
          </blockquote>
          <div>
            <p className="font-semibold text-foreground">Priya Sharma</p>
            <p className="text-muted-foreground text-sm">Board Topper, Class XII — 2025</p>
          </div>
        </div>
      </div>
    </div>
  </section>
));

Testimonials.displayName = "Testimonials";
export default Testimonials;
