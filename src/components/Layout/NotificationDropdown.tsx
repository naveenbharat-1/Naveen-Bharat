import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";

interface Notice {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [hasNew, setHasNew] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    const { data } = await supabase
      .from("notices")
      .select("id, title, content, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) {
      setNotices(data);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      setHasNew(data.some((n) => n.created_at > oneDayAgo));
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted relative">
          <Bell className="h-5 w-5" />
          {hasNew && (
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-destructive border-2 border-card" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 bg-popover z-50">
        <div className="p-3 border-b border-border">
          <h4 className="font-semibold text-sm text-foreground">Notifications</h4>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {notices.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">No new notifications</p>
          ) : (
            notices.map((n) => (
              <button
                key={n.id}
                className="w-full text-left p-3 hover:bg-muted transition-colors border-b border-border last:border-0"
                onClick={() => { setOpen(false); navigate("/notices"); }}
              >
                <p className="text-sm font-medium text-foreground line-clamp-1">{n.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{n.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </button>
            ))
          )}
        </div>
        <button
          className="w-full p-2 text-xs text-center text-primary hover:bg-muted transition-colors border-t border-border font-medium"
          onClick={() => { setOpen(false); navigate("/notices"); }}
        >
          View all notices
        </button>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationDropdown;
