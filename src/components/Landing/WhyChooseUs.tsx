import { memo } from "react";
import { CheckCircle } from "lucide-react";
import classroomImg from "@/assets/landing/classroom_interaction.png";

const points = [
  "Experienced & Dedicated Faculty",
  "Small Batch Sizes for Personal Attention",
  "Regular Tests & Performance Tracking",
  "Doubt-Clearing Sessions Every Week",
  "Comprehensive Study Material Provided",
  "Proven Track Record of Top Results",
];

const WhyChooseUs = memo(() => (
  <section className="py-20 bg-background">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        {/* Image */}
        <div className="rounded-3xl overflow-hidden shadow-xl border border-border">
          <img
            src={classroomImg}
            alt="Teacher interacting with students in classroom"
            className="w-full h-auto object-cover aspect-[4/3]"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Content */}
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Why Choose Sadhguru Coaching?
          </h2>
          <p className="text-muted-foreground text-lg">
            We combine traditional teaching values with modern methodology to deliver results that matter.
          </p>
          <ul className="space-y-4">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <span className="text-foreground font-medium">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
));

WhyChooseUs.displayName = "WhyChooseUs";
export default WhyChooseUs;
