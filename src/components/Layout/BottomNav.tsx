import { useNavigate, useLocation } from "react-router-dom";
import { MessageCircle, User, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import homeIcon from "@/assets/icons/home-3d.png";
import scienceIcon from "@/assets/icons/science-3d.png";
import studentIcon from "@/assets/icons/student-3d.png";

const tabs = [
  { path: "/dashboard", label: "Home", iconSrc: homeIcon },
  { path: "/courses", label: "Courses", iconSrc: scienceIcon },
  { path: "/my-courses", label: "My Courses", iconSrc: studentIcon },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isTeacher, isAdmin } = useAuth();

  if (isTeacher || isAdmin) return null;

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30 md:hidden">
      <div className="flex items-center justify-around h-14 px-1">
        {tabs.map(({ path, label, iconSrc }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-0.5 flex-1 min-h-[44px] justify-center"
          >
            <img
              src={iconSrc}
              alt={label}
              width={22}
              height={22}
              className={`w-[22px] h-[22px] object-contain transition-all ${!isActive(path) ? "opacity-40 grayscale" : ""}`}
              loading="lazy"
              decoding="async"
            />
            <span className={`text-[9px] font-medium ${isActive(path) ? "text-accent" : "text-muted-foreground"}`}>
              {label}
            </span>
          </button>
        ))}

        <button
          onClick={() => navigate("/downloads")}
          className="flex flex-col items-center gap-0.5 flex-1 min-h-[44px] justify-center"
        >
          <Download
            size={22}
            className={isActive("/downloads") ? "text-accent" : "text-muted-foreground opacity-40"}
          />
          <span className={`text-[9px] font-medium ${isActive("/downloads") ? "text-accent" : "text-muted-foreground"}`}>
            Downloads
          </span>
        </button>

        <button
          onClick={() => navigate("/messages")}
          className="flex flex-col items-center gap-0.5 flex-1 min-h-[44px] justify-center"
        >
          <MessageCircle
            size={22}
            className={isActive("/messages") ? "text-accent" : "text-muted-foreground opacity-40"}
          />
          <span className={`text-[9px] font-medium ${isActive("/messages") ? "text-accent" : "text-muted-foreground"}`}>
            Messages
          </span>
        </button>

        <button
          onClick={() => navigate("/profile")}
          className="flex flex-col items-center gap-0.5 flex-1 min-h-[44px] justify-center"
        >
          <User
            size={22}
            className={isActive("/profile") ? "text-accent" : "text-muted-foreground opacity-40"}
          />
          <span className={`text-[9px] font-medium ${isActive("/profile") ? "text-accent" : "text-muted-foreground"}`}>
            Profile
          </span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
