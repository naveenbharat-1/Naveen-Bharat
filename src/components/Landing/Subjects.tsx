import { memo } from "react";
import { Calculator, FlaskConical, BookOpen, Monitor, Palette } from "lucide-react";
import scienceDna from "@/assets/landing/science_visualization_dna.png";

const subjects = [
  {
    name: "Maths",
    icon: Calculator,
    bg: "bg-blue-100 dark:bg-blue-900/30",
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    name: "Science",
    icon: FlaskConical,
    bg: "bg-green-100 dark:bg-green-900/30",
    color: "text-green-600 dark:text-green-400",
  },
  {
    name: "English",
    icon: BookOpen,
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    color: "text-yellow-600 dark:text-yellow-500",
  },
  {
    name: "Computer",
    icon: Monitor,
    bg: "bg-purple-100 dark:bg-purple-900/30",
    color: "text-purple-600 dark:text-purple-400",
  },
  {
    name: "Arts",
    icon: Palette,
    bg: "bg-pink-100 dark:bg-pink-900/30",
    color: "text-pink-600 dark:text-pink-400",
  },
];

const Subjects = memo(() => (
  <section className="py-16 bg-background relative overflow-hidden">
    {/* Decorative DNA image */}
    <img
      src={scienceDna}
      alt=""
      aria-hidden="true"
      className="absolute -right-20 top-0 w-64 h-64 object-contain opacity-10 pointer-events-none hidden lg:block"
      loading="lazy"
    />

    <div className="container mx-auto px-4">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Streams We Offer
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Comprehensive coaching across all major academic streams
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
        {subjects.map(({ name, icon: Icon, bg, color }) => (
          <div
            key={name}
            className="bg-card rounded-2xl p-6 shadow-md border border-border flex flex-col items-center gap-3 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-default"
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${bg}`}>
              <Icon className={`w-8 h-8 ${color}`} strokeWidth={1.8} />
            </div>
            <span className="text-sm font-semibold text-foreground">{name}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
));

Subjects.displayName = "Subjects";
export default Subjects;
