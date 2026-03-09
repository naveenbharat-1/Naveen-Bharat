import { memo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import materialsImg from "@/assets/landing/study_materials_showcase.png";

const StudyMaterials = memo(() => (
  <section className="py-20 bg-background">
    <div className="container mx-auto px-4">
      <div className="relative rounded-3xl overflow-hidden shadow-xl border border-border">
        <img
          src={materialsImg}
          alt="Curated study materials and books"
          className="w-full h-auto object-cover aspect-[21/9] md:aspect-[3/1]"
          loading="lazy"
          decoding="async"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent flex items-center">
          <div className="p-8 md:p-14 max-w-lg space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Premium Study Materials
            </h2>
            <p className="text-muted-foreground text-lg">
              Carefully curated notes, practice papers, and reference books — everything you need to ace your exams.
            </p>
            <Link to="/books">
              <Button size="lg" className="gap-2">
                Browse Resources <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>
));

StudyMaterials.displayName = "StudyMaterials";
export default StudyMaterials;
