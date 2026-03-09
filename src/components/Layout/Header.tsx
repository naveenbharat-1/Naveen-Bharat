import { Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import logoIcon from "@/assets/branding/logo_icon_web.png";
import NotificationDropdown from "./NotificationDropdown";
import ProfileAvatar from "@/components/profile/ProfileAvatar";

interface HeaderProps {
  onMenuClick: () => void;
  userName?: string;
}

const Header = ({ onMenuClick, userName }: HeaderProps) => {
  const { user, profile, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const displayName = profile?.fullName ?? userName;

  return (
    <header className="flex items-center justify-between px-4 bg-card border-b border-border sticky top-0 z-40" style={{ paddingTop: 'max(12px, calc(12px + env(safe-area-inset-top)))', paddingBottom: '12px' }}>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="text-foreground hover:bg-muted"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link to="/" className="flex items-center gap-2.5" style={{ padding: '0 4px' }}>
          <img
            src={logoIcon}
            alt="Sadguru Coaching Classes"
            className="h-10 w-10 rounded-full object-contain"
            width={40}
            height={40}
          />
          {!isMobile && (
            <span className="font-semibold text-lg text-foreground">
              Sadguru Coaching Classes
            </span>
          )}
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <NotificationDropdown />
        {isAuthenticated ? (
          <Link to="/profile">
            <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted relative">
              <ProfileAvatar
                avatarUrl={profile?.avatarUrl ?? null}
                fullName={displayName}
                userId={user?.id}
                size="sm"
              />
            </Button>
          </Link>
        ) : (
          <Link to="/login">
            <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
