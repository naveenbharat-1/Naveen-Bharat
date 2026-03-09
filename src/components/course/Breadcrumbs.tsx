import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  segments: BreadcrumbSegment[];
  className?: string;
}

/**
 * PW-style Breadcrumbs - Sticky navigation chain
 * Last item is always bold (current page)
 */
export const Breadcrumbs = ({ segments, className }: BreadcrumbsProps) => {
  return (
    <nav 
      className={cn(
        "flex items-center gap-1 text-xs sm:text-sm overflow-x-auto whitespace-nowrap py-2 px-3 sm:px-4 bg-background/95 backdrop-blur border-b scrollbar-none",
        className
      )}
      aria-label="Breadcrumb"
    >
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        
        return (
          <div key={index} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
            {isLast || !segment.href ? (
              <span 
                className={cn(
                  "text-foreground",
                  isLast ? "font-semibold" : "text-muted-foreground"
                )}
              >
                {segment.label}
              </span>
            ) : (
              <Link
                to={segment.href}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {segment.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
