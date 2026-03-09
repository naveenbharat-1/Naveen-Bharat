import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import BottomNav from "@/components/Layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, User, Mail, Shield, LogOut, Loader2, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import AvatarUploadModal from "@/components/profile/AvatarUploadModal";

const Profile = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [nameInput, setNameInput] = useState("");
  const [mobileInput, setMobileInput] = useState("");
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const { role } = useAuth();

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data, error } = await supabase
        .from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (error) throw error;

      if (data) {
        setProfile(data);
        setNameInput(data.full_name || "");
        setMobileInput(data.mobile || "");
      } else {
        const newProfile = { id: user.id, email: user.email, full_name: user.user_metadata?.full_name || "" };
        setProfile(newProfile);
        setNameInput(newProfile.full_name);
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    try {
      const { error } = await supabase
        .from('profiles').update({ full_name: nameInput, mobile: mobileInput }).eq('id', profile.id);
      if (error) throw error;
      toast.success("Profile updated successfully!");
      setProfile({ ...profile, full_name: nameInput, mobile: mobileInput });
      setIsEditing(false);
    } catch (error: any) {
      toast.error("Failed to update profile");
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen(true)} />

      <div className="bg-primary px-4 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-primary-foreground hover:bg-primary-foreground/10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-primary-foreground">Profile</h1>
      </div>

      <main className="flex-1 p-4 space-y-6 pb-20 md:pb-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center py-6">
          <div className="relative">
            <ProfileAvatar
              avatarUrl={profile.avatar_url}
              fullName={profile.full_name}
              userId={profile.id}
              size="md"
              onClick={() => setAvatarModalOpen(true)}
            />
            <Button
              size="icon"
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
              onClick={() => setAvatarModalOpen(true)}
            >
              <User className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="mt-4 text-xl font-bold text-foreground">{profile.full_name || "No Name"}</h2>
          <p className="text-sm text-muted-foreground capitalize">{role || "User"}</p>
        </div>

        {/* Avatar Upload Modal */}
        <AvatarUploadModal
          isOpen={avatarModalOpen}
          onClose={() => setAvatarModalOpen(false)}
          userId={profile.id}
          currentAvatarUrl={profile.avatar_url}
          fullName={profile.full_name}
          onUploadComplete={(url) => {
            setProfile({ ...profile, avatar_url: url });
          }}
        />

        {/* Profile Info */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" /> Full Name
              </Label>
              <Input id="name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} disabled={!isEditing} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" /> Mobile Number
              </Label>
              <Input id="mobile" type="tel" value={mobileInput} onChange={(e) => setMobileInput(e.target.value)} disabled={!isEditing} placeholder="Enter mobile number" className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" /> Email
              </Label>
              <Input id="email" value={profile.email || ""} disabled className="bg-muted border-border" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" /> Role
              </Label>
              <div className="h-10 px-3 py-2 rounded-md bg-muted border border-border text-sm text-muted-foreground capitalize">
                {role || "member"}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => { setNameInput(profile.full_name); setMobileInput(profile.mobile || ""); setIsEditing(false); }} className="flex-1">Cancel</Button>
                <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/90">Save Changes</Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full">Edit Profile</Button>
            )}
          </div>
        </div>

        <Button onClick={handleLogout} variant="outline" className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground gap-2">
          <LogOut className="h-5 w-5" /> Sign Out
        </Button>
      </main>
      <BottomNav />
    </div>
  );
};

export default Profile;
