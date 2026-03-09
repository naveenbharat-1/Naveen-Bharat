import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, Check, MessageCircle } from "lucide-react";
import sadguruLogo from "@/assets/branding/logo_icon_web.png";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}

const ShareModal = ({ open, onOpenChange, title = "Share this lesson" }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = window.location.href;
  const shareText = `Check out this lesson on Sadguru Coaching Classes!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <img src={sadguruLogo} alt="Sadguru Coaching Classes" className="h-8 w-8 rounded" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Copy Link */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12"
            onClick={handleCopyLink}
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
            <span>{copied ? "Copied!" : "Copy Link"}</span>
          </Button>

          {/* WhatsApp */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12 hover:bg-green-50 hover:border-green-300"
            onClick={handleWhatsAppShare}
          >
            <MessageCircle className="h-5 w-5 text-green-600" />
            <span>Share on WhatsApp</span>
          </Button>

          {/* Facebook */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12 hover:bg-blue-50 hover:border-blue-300"
            onClick={handleFacebookShare}
          >
            <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Share on Facebook</span>
          </Button>

          {/* Twitter/X */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12 hover:bg-gray-100"
            onClick={handleTwitterShare}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>Share on X (Twitter)</span>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Share this lesson with your friends!
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
