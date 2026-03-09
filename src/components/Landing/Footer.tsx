import { useMemo } from "react";
import { Link } from "react-router-dom";
import logoIcon from "@/assets/branding/logo_primary_web.png";
import SocialLinks from "./SocialLinks";

const Footer = () => {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer className="bg-card border-t border-border py-12" style={{ paddingBottom: 'max(3rem, env(safe-area-inset-bottom))' }}>
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src={logoIcon} 
                 alt="Sadguru Coaching Classes" 
                className="h-11 w-11 rounded-full object-contain"
                width={44}
                height={44}
                loading="lazy"
                decoding="async"
                style={{ opacity: 0.9 }}
              />
              <span className="font-bold text-xl text-foreground">Sadguru Coaching Classes</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Nurturing young minds through joyful learning experiences.
            </p>
            <SocialLinks />
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link></li>
              <li><Link to="/courses" className="text-muted-foreground hover:text-primary transition-colors">Courses</Link></li>
              <li><Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>info@sadgurucoaching.com</li>
              <li>+91 98765 43210</li>
              <li>New Delhi, India</li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">School Hours</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Monday - Friday</li>
              <li>8:00 AM - 3:00 PM</li>
              <li>Saturday: 9 AM - 12 PM</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          © {currentYear} Sadguru Coaching Classes. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
