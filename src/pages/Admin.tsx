import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea"; 
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Upload, Video, FileText, Users, CreditCard, CheckCircle, XCircle, Clock,
  BarChart3, Trash2, Plus, BookOpen, ExternalLink, ShieldAlert, Search,
  Download, Filter, RefreshCw, ChevronDown, Eye, IndianRupee, Loader2, ClipboardCheck, Library, Calendar,
  GraduationCap, UserCheck, UserX, Radio, ImageIcon, MessageSquare, Monitor, Smartphone, LogOut
} from "lucide-react";

import ContentDrillDown from "@/components/admin/ContentDrillDown";
import SocialLinksManager from "@/components/admin/SocialLinksManager";
import HeroBannerManager from "@/components/admin/HeroBannerManager";

// Types for users list
interface UserWithRole {
  id: string;
  full_name: string | null;
  email: string | null;
  mobile: string | null;
  created_at: string | null;
  role: string | null;
}

const Admin = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const activeTab = searchParams.get("tab") || "payments";
  const setActiveTab = (tab: string) => setSearchParams({ tab }, { replace: true });
  
  // -- DATA STATES --
  const [payments, setPayments] = useState<any[]>([]);
  const [razorpayPayments, setRazorpayPayments] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [roleChanging, setRoleChanging] = useState<Record<string, boolean>>({});
  const [statsData, setStatsData] = useState({
    totalStudents: 0,
    totalCourses: 0,
    pendingPayments: 0,
    activeEnrollments: 0,
    totalRevenue: 0,
    activeSessions: 0,
  });

  // -- SESSIONS STATE --
  const [sessionsList, setSessionsList] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [terminatingSession, setTerminatingSession] = useState<string | null>(null);

  // -- SEARCH & FILTER STATES (Notion-like) --
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [courseSearch, setCourseSearch] = useState("");
  const [lessonSearch, setLessonSearch] = useState("");
  const [lessonTypeFilter, setLessonTypeFilter] = useState<"all" | "VIDEO" | "PDF" | "DPP" | "NOTES" | "TEST">("all");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "student" | "teacher" | "admin">("all");
  const [teacherSearch, setTeacherSearch] = useState("");

  // -- COURSE CREATION STATE --
  const [newCourse, setNewCourse] = useState({
    title: "", description: "", price: "", grade: "",
  });
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // -- UPLOAD STATE --
  const [uploadType, setUploadType] = useState<"video" | "pdf" | "dpp" | "notes" | "test">("video");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [pendingChapterId, setPendingChapterId] = useState<string | null>(null);
  const [chaptersList, setChaptersList] = useState<any[]>([]);
  const [uploadMode, setUploadMode] = useState<"link" | "file">("link");
  const [contentDescription, setContentDescription] = useState("");
  const [watermarkText, setWatermarkText] = useState("Sadguru Coaching Classes");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // -- LIBRARY FILTER STATE --
  const [libraryLessons, setLibraryLessons] = useState<any[]>([]);
  const [libraryTypeFilter, setLibraryTypeFilter] = useState<"all" | "VIDEO" | "PDF" | "DPP" | "NOTES" | "TEST">("all");
  const [libraryCourseFilter, setLibraryCourseFilter] = useState<string>("all");
  
  // -- INLINE EDIT STATE --
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [editCourseData, setEditCourseData] = useState({ title: "", description: "", price: "", grade: "" });
  const [editThumbnailFile, setEditThumbnailFile] = useState<File | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLessonData, setEditLessonData] = useState<{
    title: string; video_url: string; lecture_type: string; chapter_id: string;
    description: string; position: string; is_locked: boolean; thumbnail_url: string;
  }>({ title: "", video_url: "", lecture_type: "VIDEO", chapter_id: "", description: "", position: "0", is_locked: false, thumbnail_url: "" });

  // Library/Notes state
  const [materialsList, setMaterialsList] = useState<any[]>([]);
  const [notesList, setNotesList] = useState<any[]>([]);
  const [newMaterial, setNewMaterial] = useState({ title: "", description: "", file_url: "", course_id: "" });
  const [materialFileType, setMaterialFileType] = useState<"PDF" | "NOTES" | "DPP">("PDF");
  const [newNote, setNewNote] = useState({ title: "", pdf_url: "", lesson_id: "" });
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editMaterialData, setEditMaterialData] = useState({ title: "", description: "", file_url: "" });
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteData, setEditNoteData] = useState({ title: "", pdf_url: "" });
  const [noteFile, setNoteFile] = useState<File | null>(null);

  // Admin access protection with email verification
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please login to access admin panel");
      navigate("/admin/login");
    } else if (!authLoading && user && !isAdmin) {
      toast.error("Access denied. Admin privileges required.");
      navigate("/dashboard");
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchDashboardData();
    }
  }, [user, isAdmin]);

  // Fetch chapters when selected course changes
  useEffect(() => {
    const fetchChapters = async () => {
      if (!selectedCourse) { setChaptersList([]); return; }
      const { data } = await supabase
        .from('chapters')
        .select('*')
        .eq('course_id', Number(selectedCourse))
        .order('position', { ascending: true });
      setChaptersList(data || []);
    };
    fetchChapters();
  }, [selectedCourse]);

  // Auto-select pending chapter once chaptersList loads
  useEffect(() => {
    if (pendingChapterId && chaptersList.length > 0) {
      const found = chaptersList.find(ch => ch.id === pendingChapterId);
      if (found) {
        setSelectedChapter(pendingChapterId);
      }
      setPendingChapterId(null);
    }
  }, [chaptersList, pendingChapterId]);

  // --- 1. FETCH DATA ---
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // A. Fetch Courses
      const { data: coursesData } = await supabase.from('courses').select('*');
      if (coursesData) setCoursesList(coursesData);

      // B. Fetch Manual UPI Payments
      let paymentQuery = supabase
        .from('payment_requests')
        .select(`*, courses (title), profiles (full_name, email)`)
        .order('created_at', { ascending: false });
      if (paymentStatusFilter !== "all") {
        paymentQuery = paymentQuery.eq('status', paymentStatusFilter);
      }
      const { data: payData, error: payError } = await paymentQuery;
      if (payData) setPayments(payData);
      if (payError) console.error("Payment Fetch Error:", payError);

      // B2. Fetch Razorpay Payments
      const { data: rzpData } = await supabase
        .from('razorpay_payments')
        .select(`*, courses (title)`)
        .order('created_at', { ascending: false });
      if (rzpData) setRazorpayPayments(rzpData);

      // C. Fetch Lessons
      const { data: lessonData } = await supabase
        .from('lessons')
        .select(`*, courses (title)`).order('created_at', { ascending: false });
      if (lessonData) setLessons(lessonData);

      // D. Fetch Users with Roles (join profiles and user_roles)
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*');
      
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (profilesData) {
        const usersWithRoles: UserWithRole[] = profilesData.map(profile => ({
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          mobile: profile.mobile,
          created_at: profile.created_at,
          role: rolesData?.find(r => r.user_id === profile.id)?.role || null
        }));
        setUsersList(usersWithRoles);
      }

      // E. Stats - Count students from user_roles table
      const { count: studentCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');
      
      const { count: enrollCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true });
      
      const { count: pendingCount } = await supabase
        .from('payment_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // F. Calculate Total Revenue from approved manual + completed Razorpay payments
      const { data: approvedPayments } = await supabase
        .from('payment_requests')
        .select('amount')
        .eq('status', 'approved');
      const { data: completedRzp } = await supabase
        .from('razorpay_payments')
        .select('amount')
        .eq('status', 'completed');
      
      const manualRevenue = approvedPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const rzpRevenue = completedRzp?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const totalRevenue = manualRevenue + rzpRevenue;

      // G. Pre-fetch library data so it's ready when tab is opened
      fetchLibraryData();

      // H. Count active sessions
      const { count: sessionsCount } = await supabase
        .from("user_sessions")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      setStatsData({
        totalStudents: studentCount || 0,
        totalCourses: coursesData?.length || 0,
        pendingPayments: pendingCount || 0,
        activeEnrollments: enrollCount || 0,
        totalRevenue,
        activeSessions: sessionsCount || 0,
      });

    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // --- ROLE MANAGEMENT ---
  const handleChangeRole = async (userId: string, newRole: string) => {
    setRoleChanging(prev => ({ ...prev, [userId]: true }));
    try {
      // Delete existing role then insert new one (upsert on user_id conflict)
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: newRole as "admin" | "teacher" | "student" }, { onConflict: 'user_id' });
      if (error) throw error;
      // Update local state immediately
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success("Role updated successfully");
    } catch (err: any) {
      toast.error("Failed to update role: " + (err?.message || "Unknown error"));
    } finally {
      setRoleChanging(prev => ({ ...prev, [userId]: false }));
    }
  };

  // --- FILTERED DATA (Notion-like search) ---
  // Unified payments: merge manual UPI + Razorpay into one list
  const allPaymentsUnified = useMemo(() => {
    const manual = payments.map(p => ({
      ...p,
      _method: 'upi' as const,
      _key: `upi-${p.id}`,
      _displayName: p.profiles?.full_name || p.sender_name || p.user_name || 'Unknown',
      _email: p.profiles?.email || '',
      _course: p.courses?.title || 'Unknown Course',
      _amount: p.amount,
      _status: p.status,
      _date: p.created_at,
    }));
    const rzp = razorpayPayments.map(p => ({
      ...p,
      _method: 'razorpay' as const,
      _key: `rzp-${p.id}`,
      _displayName: 'Online Payment',
      _email: '',
      _course: p.courses?.title || 'Unknown Course',
      _amount: p.amount,
      _status: p.status,
      _date: p.created_at,
    }));
    return [...manual, ...rzp].sort((a, b) => new Date(b._date).getTime() - new Date(a._date).getTime());
  }, [payments, razorpayPayments]);

  const filteredPayments = useMemo(() => {
    const searchLower = paymentSearch.toLowerCase();
    return allPaymentsUnified.filter(p => {
      const matchesSearch = !searchLower || 
        p._displayName.toLowerCase().includes(searchLower) ||
        p._email.toLowerCase().includes(searchLower) ||
        p._course.toLowerCase().includes(searchLower) ||
        (p.transaction_id?.toLowerCase().includes(searchLower)) ||
        (p.razorpay_payment_id?.toLowerCase().includes(searchLower));
      const matchesStatus = paymentStatusFilter === "all" || p._status === paymentStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [allPaymentsUnified, paymentSearch, paymentStatusFilter]);

  const filteredCourses = useMemo(() => {
    return coursesList.filter(c => 
      c.title?.toLowerCase().includes(courseSearch.toLowerCase()) ||
      c.grade?.toLowerCase().includes(courseSearch.toLowerCase())
    );
  }, [coursesList, courseSearch]);

  const filteredLessons = useMemo(() => {
    return lessons.filter(l => {
      const matchesSearch = l.title?.toLowerCase().includes(lessonSearch.toLowerCase()) ||
        l.courses?.title?.toLowerCase().includes(lessonSearch.toLowerCase());
      const matchesType = lessonTypeFilter === "all" || l.lecture_type === lessonTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [lessons, lessonSearch, lessonTypeFilter]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const matchesSearch = 
        u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.mobile?.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [usersList, userSearch, userRoleFilter]);

  // Teacher management computed lists
  const activeTeachers = useMemo(() =>
    usersList.filter(u => u.role === 'teacher'),
  [usersList]);

  const promotableStudents = useMemo(() =>
    usersList.filter(u => (u.role === 'student' || !u.role) &&
      (u.full_name?.toLowerCase().includes(teacherSearch.toLowerCase()) ||
       u.email?.toLowerCase().includes(teacherSearch.toLowerCase()))
    ),
  [usersList, teacherSearch]);

  // --- EXPORT TO CSV ---
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    const headers = Object.keys(data[0]).filter(k => !k.includes('id') && typeof data[0][k] !== 'object');
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(h => {
          const val = row[h];
          if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
          return val ?? '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(`Exported ${data.length} records`);
  };

  // --- 2. PAYMENT APPROVAL LOGIC (MAIN) ---
  const handleApprovePayment = async (paymentRequest: any) => {
    if(!confirm(`Approve payment of ₹${paymentRequest.amount} for ${paymentRequest.sender_name}?`)) return;

    try {
      // Step A: Update Payment Status
      const { error: updateError } = await supabase
        .from('payment_requests')
        .update({ status: 'approved' })
        .eq('id', paymentRequest.id);

      if (updateError) throw updateError;

      // Step B: Upsert enrollment — safe against duplicates at DB level
      const { error: enrollError } = await supabase
        .from('enrollments')
        .upsert(
          { user_id: paymentRequest.user_id, course_id: paymentRequest.course_id, status: 'active' },
          { onConflict: 'user_id,course_id', ignoreDuplicates: true }
        );
      if (enrollError) throw enrollError;

      toast.success("Payment Approved & Course Unlocked!");
      fetchDashboardData();

    } catch (error: any) {
      toast.error("Approval Error: " + error.message);
    }
  };

  // --- 3. PAYMENT REJECTION LOGIC ---
  const handleRejectPayment = async (paymentId: number) => {
    if(!confirm("Are you sure you want to REJECT this payment?")) return;
    
    try {
      const { error } = await supabase
        .from('payment_requests')
        .update({ status: 'rejected' })
        .eq('id', paymentId);

      if (error) throw error;
      toast.error("Payment request rejected.");
      fetchDashboardData();
    } catch (error: any) {
      toast.error("Error rejecting: " + error.message);
    }
  };

  // --- 4. COURSE MANAGEMENT ---
  const handleCreateCourse = async () => {
    if (!newCourse.title || !newCourse.price || !newCourse.grade) return toast.error("Fill all fields");
    try {
      setIsCreatingCourse(true);
      
      let thumbnailUrl = "https://placehold.co/600x400/png";
      
      if (thumbnailFile) {
        const fileExt = thumbnailFile.name.split('.').pop();
        const fileName = `course_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('content')
          .upload(`thumbnails/${fileName}`, thumbnailFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from('content')
          .getPublicUrl(`thumbnails/${fileName}`);
        thumbnailUrl = publicUrl;
      }
      
      const { error } = await supabase.from('courses').insert({
        title: newCourse.title,
        description: newCourse.description,
        price: parseFloat(newCourse.price),
        grade: newCourse.grade,
        image_url: thumbnailUrl,
        thumbnail_url: thumbnailUrl,
      });
      if (error) throw error;
      toast.success("Course Created!");
      setNewCourse({ title: "", description: "", price: "", grade: "" });
      setThumbnailFile(null);
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsCreatingCourse(false);
    }
  };

  const handleDeleteCourse = async (id: number) => {
    if (!confirm("Delete course? This will remove all lessons too!")) return;
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success("Course deleted"); fetchDashboardData(); }
  };

  // --- 5. CONTENT UPLOAD (with chapter, link/file toggle) ---
  const handleContentUpload = async () => {
    if (!videoTitle || !selectedCourse) return toast.error("Fill title and select course");
    
    setIsUploading(true);
    try {
      let contentUrl = "";
      
      if (uploadMode === "file" && pdfFile) {
        const fileExt = pdfFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const isVideo = uploadType === "video";
        const bucket = isVideo ? 'course-videos' : 'content';
        const filePath = `lessons/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, pdfFile);
        
        if (uploadError) throw uploadError;
        
        if (isVideo) {
          // Private bucket: get signed URL
          const { data: signedData, error: signError } = await supabase.storage
            .from(bucket)
            .createSignedUrl(filePath, 86400 * 365); // 1 year
          if (signError) throw signError;
          contentUrl = signedData.signedUrl;
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);
          contentUrl = publicUrl;
        }
      } else {
        contentUrl = videoUrl;
      }

      if (!contentUrl) return toast.error("Provide a URL or upload a file");

      const lectureTypeMap: Record<string, string> = {
        video: "VIDEO",
        pdf: "PDF",
        dpp: "DPP",
        notes: "NOTES",
        test: "TEST",
      };

      const insertData: any = {
        course_id: parseInt(selectedCourse),
        title: videoTitle,
        video_url: contentUrl,
        lecture_type: lectureTypeMap[uploadType],
        description: contentDescription || `${uploadType.toUpperCase()} content`,
        is_locked: true,
      };
      
      if (selectedChapter) {
        insertData.chapter_id = selectedChapter;
      }

      const { error } = await supabase.from('lessons').insert(insertData);
      
      if (error) throw error;
      toast.success("Content Added!");
      setVideoTitle(""); 
      setVideoUrl(""); 
      setSelectedCourse("");
      setSelectedChapter("");
      setContentDescription("");
      setPdfFile(null);
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if(!confirm("Delete lesson?")) return;
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if(!error) { toast.success("Deleted"); fetchDashboardData(); }
  };

  // --- INLINE EDIT: Course ---
  const handleEditCourse = (course: any) => {
    setEditingCourseId(course.id);
    setEditCourseData({
      title: course.title || "",
      description: course.description || "",
      price: String(course.price || ""),
      grade: course.grade || "",
    });
    setEditThumbnailFile(null);
  };

  const handleSaveCourseEdit = async () => {
    if (!editingCourseId) return;
    
    let thumbnailUrl: string | undefined;
    if (editThumbnailFile) {
      const fileExt = editThumbnailFile.name.split('.').pop();
      const fileName = `course_${editingCourseId}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('content').upload(`thumbnails/${fileName}`, editThumbnailFile);
      if (uploadError) { toast.error(uploadError.message); return; }
      const { data: { publicUrl } } = supabase.storage.from('content').getPublicUrl(`thumbnails/${fileName}`);
      thumbnailUrl = publicUrl;
    }

    const updateData: any = {
      title: editCourseData.title,
      description: editCourseData.description,
      price: parseFloat(editCourseData.price) || 0,
      grade: editCourseData.grade,
    };
    if (thumbnailUrl) {
      updateData.image_url = thumbnailUrl;
      updateData.thumbnail_url = thumbnailUrl;
    }

    const { error } = await supabase.from('courses').update(updateData).eq('id', editingCourseId);
    if (error) toast.error(error.message);
    else { toast.success("Course updated!"); setEditingCourseId(null); setEditThumbnailFile(null); fetchDashboardData(); }
  };

  // --- INLINE EDIT: Lesson (ALL parameters) ---
  const handleEditLesson = (lesson: any) => {
    setEditingLessonId(lesson.id);
    setEditLessonData({
      title: lesson.title || "",
      video_url: lesson.video_url || "",
      lecture_type: lesson.lecture_type || "VIDEO",
      chapter_id: lesson.chapter_id || "",
      description: lesson.description || "",
      position: String(lesson.position || 0),
      is_locked: lesson.is_locked || false,
      thumbnail_url: lesson.thumbnail_url || "",
    });
    // Fetch chapters for lesson's course
    if (lesson.course_id) {
      supabase.from('chapters').select('*').eq('course_id', lesson.course_id).order('position').then(({ data }) => {
        setChaptersList(data || []);
      });
    }
  };

  const handleSaveLessonEdit = async () => {
    if (!editingLessonId) return;
    const { error } = await supabase.from('lessons').update({
      title: editLessonData.title,
      video_url: editLessonData.video_url,
      lecture_type: editLessonData.lecture_type,
      chapter_id: editLessonData.chapter_id || null,
      description: editLessonData.description || null,
      position: parseInt(editLessonData.position) || 0,
      is_locked: editLessonData.is_locked,
    }).eq('id', editingLessonId);
    if (error) toast.error(error.message);
    else { toast.success("Lesson updated!"); setEditingLessonId(null); fetchDashboardData(); }
  };

  // --- Library & Notes CRUD ---
  const fetchLibraryData = async () => {
    const { data: mats } = await supabase.from('materials').select('*, courses(title)').order('created_at', { ascending: false });
    if (mats) setMaterialsList(mats);
    const { data: nts } = await supabase.from('notes').select('*, lessons(title)').order('created_at', { ascending: false });
    if (nts) setNotesList(nts);
    // Also fetch lessons for unified library view
    const { data: lessonItems } = await supabase.from('lessons').select('*, courses(title)').order('created_at', { ascending: false });
    if (lessonItems) setLibraryLessons(lessonItems);
  };

  // Filtered unified library items
  const filteredLibraryLessons = useMemo(() => {
    return libraryLessons.filter(l => {
      const matchesType = libraryTypeFilter === "all" || l.lecture_type === libraryTypeFilter;
      const matchesCourse = libraryCourseFilter === "all" || String(l.course_id) === libraryCourseFilter;
      return matchesType && matchesCourse;
    });
  }, [libraryLessons, libraryTypeFilter, libraryCourseFilter]);

  const handleCreateMaterial = async () => {
    if (!newMaterial.title || !newMaterial.file_url) return toast.error("Title and URL required");
    const { error } = await supabase.from('materials').insert({
      title: newMaterial.title,
      description: newMaterial.description || null,
      file_url: newMaterial.file_url,
      file_type: materialFileType,
      course_id: newMaterial.course_id ? parseInt(newMaterial.course_id) : null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Material added!"); setNewMaterial({ title: "", description: "", file_url: "", course_id: "" }); setMaterialFileType("PDF"); fetchLibraryData(); }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm("Delete this material?")) return;
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (!error) { toast.success("Deleted"); fetchLibraryData(); }
  };

  const handleSaveMaterialEdit = async () => {
    if (!editingMaterialId) return;
    const { error } = await supabase.from('materials').update({
      title: editMaterialData.title, description: editMaterialData.description, file_url: editMaterialData.file_url,
    }).eq('id', editingMaterialId);
    if (error) toast.error(error.message);
    else { toast.success("Updated!"); setEditingMaterialId(null); fetchLibraryData(); }
  };

  const handleCreateNote = async () => {
    if (!newNote.title || !newNote.pdf_url) return toast.error("Title and PDF URL required");
    const { error } = await supabase.from('notes').insert({
      title: newNote.title,
      pdf_url: newNote.pdf_url,
      lesson_id: newNote.lesson_id || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Note added!"); setNewNote({ title: "", pdf_url: "", lesson_id: "" }); fetchLibraryData(); }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("Delete this note?")) return;
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (!error) { toast.success("Deleted"); fetchLibraryData(); }
  };

  const handleSaveNoteEdit = async () => {
    if (!editingNoteId) return;
    const { error } = await supabase.from('notes').update({
      title: editNoteData.title, pdf_url: editNoteData.pdf_url,
    }).eq('id', editingNoteId);
    if (error) toast.error(error.message);
    else { toast.success("Updated!"); setEditingNoteId(null); fetchLibraryData(); }
  };

  // Fetch all active sessions (admin view)
  const fetchSessionsData = async () => {
    setSessionsLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_sessions")
        .select("id, session_token, user_id, device_type, user_agent, last_active_at, logged_in_at, is_active")
        .eq("is_active", true)
        .order("last_active_at", { ascending: false });
      if (!error && data) setSessionsList(data);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleForceLogout = async (sessionToken: string, targetUserId: string) => {
    if (!confirm("Force logout this session?")) return;
    setTerminatingSession(sessionToken);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/manage-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: "terminate", session_token: sessionToken }),
      });
      if (res.ok) {
        toast.success("Session terminated");
        setSessionsList(prev => prev.filter(s => s.session_token !== sessionToken));
        setStatsData(prev => ({ ...prev, activeSessions: Math.max(0, prev.activeSessions - 1) }));
      } else {
        toast.error("Failed to terminate session");
      }
    } finally {
      setTerminatingSession(null);
    }
  };

  // Stats UI Config with tab navigation targets
  const stats = [
    { label: "Total Students", value: statsData.totalStudents, icon: Users, color: "text-blue-600 bg-blue-100", tab: "users" },
    { label: "Total Revenue", value: `₹${statsData.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: "text-emerald-600 bg-emerald-100", tab: "payments" },
    { label: "Total Courses", value: statsData.totalCourses, icon: BookOpen, color: "text-green-600 bg-green-100", tab: "courses" },
    { label: "Pending Payments", value: statsData.pendingPayments, icon: Clock, color: "text-orange-600 bg-orange-100", tab: "payments" },
    { label: "Active Sessions", value: statsData.activeSessions, icon: Monitor, color: "text-cyan-600 bg-cyan-100", tab: "sessions" },
  ];


  // Role badge helper
  const getRoleBadge = (role: string | null) => {
    switch(role) {
      case 'admin': return <Badge className="bg-red-100 text-red-700 border-red-200">Admin</Badge>;
      case 'teacher': return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Teacher</Badge>;
      case 'student': return <Badge className="bg-green-100 text-green-700 border-green-200">Student</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-700 border-gray-200">No Role</Badge>;
    }
  };

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return <Badge className="bg-green-100 text-green-700 border-green-200">Approved</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-700 border-red-200">Rejected</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>;
    }
  };

  // Show loading or access denied
  // Loading state with timeout indicator
  const [loadTimeout, setLoadTimeout] = useState(false);
  
  useEffect(() => {
    if (authLoading) {
      const timer = setTimeout(() => setLoadTimeout(true), 8000);
      return () => clearTimeout(timer);
    } else {
      setLoadTimeout(false);
    }
  }, [authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-500">
            {loadTimeout ? "Taking longer than expected..." : "Loading..."}
          </p>
          {loadTimeout && (
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 text-primary hover:underline text-sm font-medium"
            >
              Refresh Page
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-500 mb-6">You need admin privileges to access this page.</p>
            <Button onClick={() => navigate("/admin/login")} className="w-full">
              Go to Admin Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        
        {/* Title with Refresh */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500">Manage your academy operations securely.</p>
          </div>
          <Button variant="outline" onClick={fetchDashboardData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className={`border-none shadow-sm ${stat.tab ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
              onClick={() => { if (stat.tab) setActiveTab(stat.tab); }}
            >
              <CardContent className="p-4 flex items-center gap-4 min-w-0">
                <div className={`p-3 rounded-xl shrink-0 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500 font-medium truncate">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* TABS SECTION */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v === 'library') fetchLibraryData(); if (v === 'sessions') fetchSessionsData(); }} className="w-full space-y-6">
          <TabsList className="bg-card p-1 border rounded-lg w-full overflow-x-auto scrollbar-hide flex flex-nowrap h-auto gap-0.5">
            <TabsTrigger value="payments" className="py-2 min-h-[44px] shrink-0">Payments <Badge variant="destructive" className="ml-2">{statsData.pendingPayments}</Badge></TabsTrigger>
            <TabsTrigger value="users" className="py-2 min-h-[44px] shrink-0">Users</TabsTrigger>
            <TabsTrigger value="teachers" className="py-2 min-h-[44px] shrink-0 flex items-center gap-1"><GraduationCap className="h-4 w-4" />Teachers</TabsTrigger>
            <TabsTrigger value="courses" className="py-2 min-h-[44px] shrink-0">Courses</TabsTrigger>
            <TabsTrigger value="content" className="py-2 min-h-[44px] shrink-0">Content</TabsTrigger>
            <TabsTrigger value="upload" className="py-2 min-h-[44px] shrink-0">Upload</TabsTrigger>
            <TabsTrigger value="schedule" className="py-2 min-h-[44px] shrink-0"><Calendar className="h-4 w-4 mr-1" />Schedule</TabsTrigger>
            <TabsTrigger value="library" className="py-2 min-h-[44px] shrink-0"><Library className="h-4 w-4 mr-1" />Library</TabsTrigger>
            <TabsTrigger value="social" className="py-2 min-h-[44px] shrink-0"><ExternalLink className="h-4 w-4 mr-1" />Social</TabsTrigger>
            <TabsTrigger value="live" className="py-2 min-h-[44px] shrink-0 gap-1 text-destructive data-[state=active]:text-destructive"><Radio className="h-4 w-4" />Live</TabsTrigger>
            <TabsTrigger value="banners" className="py-2 min-h-[44px] shrink-0 gap-1"><ImageIcon className="h-4 w-4" />Banners</TabsTrigger>
            <TabsTrigger value="doubts" className="py-2 min-h-[44px] shrink-0 gap-1"><MessageSquare className="h-4 w-4" />Doubts</TabsTrigger>
            <TabsTrigger value="sessions" className="py-2 min-h-[44px] shrink-0 gap-1"><Monitor className="h-4 w-4" />Sessions</TabsTrigger>
          </TabsList>

          {/* --- TAB 1: UNIFIED PAYMENTS --- */}
          <TabsContent value="payments">
            {/* Revenue stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Card className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold text-primary">₹{statsData.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Manual + Razorpay</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Manual UPI</p>
                <p className="text-xl font-bold">₹{payments.filter(p=>p.status==='approved').reduce((s,p)=>s+(p.amount||0),0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{payments.filter(p=>p.status==='approved').length} approved</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Razorpay</p>
                <p className="text-xl font-bold">₹{razorpayPayments.filter(p=>p.status==='completed').reduce((s,p)=>s+(p.amount||0),0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{razorpayPayments.filter(p=>p.status==='completed').length} completed</p>
              </Card>
            </div>
            <Card className="border shadow-sm">
              <CardHeader className="bg-orange-50/50 border-b pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <ShieldAlert className="h-5 w-5" />
                    All Payments ({filteredPayments.length})
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search name, UTR, course..." value={paymentSearch} onChange={(e) => setPaymentSearch(e.target.value)} className="pl-9" />
                    </div>
                    <Select value={paymentStatusFilter} onValueChange={(v: any) => setPaymentStatusFilter(v)}>
                      <SelectTrigger className="w-[130px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => exportToCSV(filteredPayments.map(p => ({
                      method: p._method === 'razorpay' ? 'Razorpay' : 'UPI Manual',
                      name: p._displayName, course: p._course,
                      amount: p._amount, status: p._status, date: p._date,
                      ref: p.transaction_id || p.razorpay_payment_id || '',
                    })), 'payments')}>
                      <Download className="h-4 w-4 mr-1" /> Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {filteredPayments.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3 opacity-20" />
                      <p className="text-muted-foreground">No payments found.</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredPayments.map((req) => (
                        <div key={req._key} className="p-4 md:p-5 hover:bg-muted/30 transition-colors flex flex-col md:flex-row gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-foreground">{req._course}</h3>
                                  {getStatusBadge(req._status)}
                                  <Badge variant={req._method === 'razorpay' ? 'default' : 'outline'} className="text-xs">
                                    {req._method === 'razorpay' ? '💳 Razorpay' : '📱 UPI Manual'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {req._method === 'razorpay'
                                    ? `Order: ${req.razorpay_order_id?.slice(-8) || '—'}`
                                    : `${req._displayName} · ${req._email || '—'}`}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-base px-3 py-1 shrink-0">₹{req._amount}</Badge>
                            </div>
                            {req._method === 'upi' && (
                              <div className="bg-blue-50 dark:bg-blue-950/20 p-2 rounded-lg text-xs space-y-1 border border-blue-100 dark:border-blue-900">
                                <p className="flex justify-between"><span className="text-blue-600 font-medium">Sender:</span><span className="font-bold">{req.sender_name || '—'}</span></p>
                                <p className="flex justify-between"><span className="text-blue-600 font-medium">UTR:</span><span className="font-mono font-bold">{req.transaction_id || '—'}</span></p>
                              </div>
                            )}
                            {req._method === 'razorpay' && req.razorpay_payment_id && (
                              <div className="bg-primary/5 p-2 rounded-lg text-xs border border-primary/10">
                                <p>Payment ID: <span className="font-mono">{req.razorpay_payment_id}</span></p>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">{new Date(req._date).toLocaleString('en-IN')}</p>
                          </div>
                          {/* Actions — only for manual UPI pending */}
                          {req._method === 'upi' && (
                            <div className="flex flex-col gap-2 min-w-[180px]">
                              {req.screenshot_url && (
                                <a href="#" onClick={async (e) => {
                                  e.preventDefault();
                                  const { data, error } = await supabase.storage.from('receipts').createSignedUrl(req.screenshot_url, 3600);
                                  if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                                  else if (error) toast.error('Could not load screenshot');
                                }}>
                                  <Button variant="outline" className="w-full" size="sm"><Eye className="h-4 w-4 mr-2" />View Screenshot</Button>
                                </a>
                              )}
                              {req._status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprovePayment(req)}>
                                    <CheckCircle className="h-4 w-4 mr-1" />Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleRejectPayment(req.id)}>
                                    <XCircle className="h-4 w-4 mr-1" />Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- TAB 2: USERS (with search & role filter) --- */}
          <TabsContent value="users">
            <Card className="border shadow-sm">
              <CardHeader className="bg-blue-50/50 border-b pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Users className="h-5 w-5" />
                    Registered Users ({usersList.length})
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Search by name, email, phone..." 
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="pl-9 bg-white"
                      />
                    </div>
                    {/* Role Filter */}
                    <Select value={userRoleFilter} onValueChange={(v: any) => setUserRoleFilter(v)}>
                      <SelectTrigger className="w-[130px] bg-white">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* Export */}
                    <Button variant="outline" size="sm" onClick={() => exportToCSV(filteredUsers.map(u => ({
                      full_name: u.full_name,
                      email: u.email,
                      mobile: u.mobile,
                      role: u.role,
                      created_at: u.created_at
                    })), 'users')}>
                      <Download className="h-4 w-4 mr-1" /> Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-blue-500 mx-auto mb-3 opacity-20" />
                      <p className="text-muted-foreground">No users found.</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredUsers.map((u) => (
                        <div key={u.id} className="p-4 md:p-5 hover:bg-muted/40 transition-colors flex items-center gap-4">
                          {/* Avatar */}
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base flex-shrink-0">
                            {u.full_name?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate text-sm">
                              {u.full_name || 'Unnamed User'}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            {u.mobile && (
                              <p className="text-xs text-muted-foreground/70">{u.mobile}</p>
                            )}
                          </div>
                          
                          {/* Role Selector */}
                          <div className="shrink-0">
                            <Select
                              value={u.role || 'student'}
                              onValueChange={(v) => handleChangeRole(u.id, v)}
                              disabled={roleChanging[u.id]}
                            >
                              <SelectTrigger className="w-28 h-8 text-xs">
                                {roleChanging[u.id]
                                  ? <span className="text-muted-foreground">Saving…</span>
                                  : <SelectValue />
                                }
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="teacher">Teacher</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Joined Date */}
                          <div className="text-right text-xs text-muted-foreground hidden md:block shrink-0">
                            <p>Joined</p>
                            <p className="font-medium text-foreground/70">
                              {new Date(u.created_at).toLocaleDateString('en-IN', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- TAB: TEACHERS (Role Management) --- */}
          <TabsContent value="teachers">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Card 1: Active Teachers */}
              <Card className="border shadow-sm">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="flex items-center gap-2 text-emerald-700">
                    <UserCheck className="h-5 w-5" />
                    Active Teachers ({activeTeachers.length})
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">These users can access Students &amp; Attendance in the sidebar.</p>
                </CardHeader>
                <CardContent className="pt-4">
                  {activeTeachers.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No teachers assigned yet.</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] pr-2">
                      <div className="space-y-2">
                        {activeTeachers.map(teacher => (
                          <div key={teacher.id} className="flex items-center justify-between p-3 rounded-lg border bg-emerald-50/40 hover:bg-emerald-50 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-emerald-700 font-bold text-sm">
                                  {(teacher.full_name || teacher.email || "?")[0].toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{teacher.full_name || "Unnamed"}</p>
                                <p className="text-xs text-muted-foreground truncate">{teacher.email}</p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive border-destructive/30 hover:bg-destructive/10 flex-shrink-0 ml-2"
                              disabled={roleChanging[teacher.id]}
                              onClick={() => handleChangeRole(teacher.id, 'student')}
                            >
                              {roleChanging[teacher.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : <><UserX className="h-3 w-3 mr-1" />Revoke</>}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Card 2: Promote to Teacher */}
              <Card className="border shadow-sm">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <GraduationCap className="h-5 w-5" />
                    Assign Teacher Role
                  </CardTitle>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students by name or email..."
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {promotableStudents.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">{teacherSearch ? "No students match your search." : "No students available."}</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] pr-2">
                      <div className="space-y-2">
                        {promotableStudents.map(student => (
                          <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                <span className="text-foreground font-bold text-sm">
                                  {(student.full_name || student.email || "?")[0].toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{student.full_name || "Unnamed"}</p>
                                <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="flex-shrink-0 ml-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                              disabled={roleChanging[student.id]}
                              onClick={() => handleChangeRole(student.id, 'teacher')}
                            >
                              {roleChanging[student.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : <><GraduationCap className="h-3 w-3 mr-1" />Make Teacher</>}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* --- TAB 3: COURSES (with search & export) --- */}
          <TabsContent value="courses">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Create Course</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={newCourse.title} onChange={(e) => setNewCourse({...newCourse, title: e.target.value})} placeholder="Class 10 Science" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={newCourse.description} onChange={(e) => setNewCourse({...newCourse, description: e.target.value})} placeholder="Details..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price (₹)</Label>
                      <Input type="number" value={newCourse.price} onChange={(e) => setNewCourse({...newCourse, price: e.target.value})} placeholder="499" />
                    </div>
                    <div className="space-y-2">
                      <Label>Grade</Label>
                      <Input value={newCourse.grade} onChange={(e) => setNewCourse({...newCourse, grade: e.target.value})} placeholder="10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Course Thumbnail</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="thumbnail-upload"
                      />
                      <label htmlFor="thumbnail-upload" className="cursor-pointer">
                        {thumbnailFile ? (
                          <div className="flex items-center justify-center gap-2 text-green-600">
                            <Eye className="h-5 w-5" />
                            <span className="font-medium text-sm">{thumbnailFile.name}</span>
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm">
                            <Upload className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                            <p>Click to upload thumbnail image</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleCreateCourse} disabled={isCreatingCourse}>
                    {isCreatingCourse ? <Clock className="animate-spin mr-2"/> : <Plus className="mr-2 h-4 w-4"/>} Create Course
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Course List</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => exportToCSV(filteredCourses.map(c => ({
                      title: c.title,
                      description: c.description,
                      price: c.price,
                      grade: c.grade,
                      created_at: c.created_at
                    })), 'courses')}>
                      <Download className="h-4 w-4 mr-1" /> Export
                    </Button>
                  </div>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Search courses..." 
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[350px]">
                    <div className="space-y-3">
                      {filteredCourses.map((c) => (
                        <div key={c.id} className="p-3 border rounded-lg bg-white space-y-2">
                          {editingCourseId === c.id ? (
                            <div className="space-y-2">
                              <Input value={editCourseData.title} onChange={(e) => setEditCourseData({...editCourseData, title: e.target.value})} placeholder="Title" />
                              <Textarea value={editCourseData.description} onChange={(e) => setEditCourseData({...editCourseData, description: e.target.value})} placeholder="Description" rows={2} />
                              <div className="grid grid-cols-2 gap-2">
                                <Input value={editCourseData.price} onChange={(e) => setEditCourseData({...editCourseData, price: e.target.value})} placeholder="Price" type="number" />
                                <Input value={editCourseData.grade} onChange={(e) => setEditCourseData({...editCourseData, grade: e.target.value})} placeholder="Grade" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Thumbnail</Label>
                                <div className="border border-dashed rounded p-2 text-center">
                                  <input type="file" accept="image/*" onChange={(e) => setEditThumbnailFile(e.target.files?.[0] || null)} className="hidden" id={`edit-thumb-${c.id}`} />
                                  <label htmlFor={`edit-thumb-${c.id}`} className="cursor-pointer text-xs text-muted-foreground">
                                    {editThumbnailFile ? editThumbnailFile.name : (c.thumbnail_url ? "Change thumbnail" : "Upload thumbnail")}
                                  </label>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleSaveCourseEdit}><CheckCircle className="h-3 w-3 mr-1" /> Save</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingCourseId(null)}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-semibold">{c.title}</p>
                                <p className="text-xs text-muted-foreground">₹{c.price} • Grade {c.grade}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button size="icon" variant="ghost" className="text-blue-500 hover:bg-blue-50" onClick={() => handleEditCourse(c)}>
                                  <Eye className="h-4 w-4"/>
                                </Button>
                                <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteCourse(c.id)}>
                                  <Trash2 className="h-4 w-4"/>
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {filteredCourses.length === 0 && (
                        <p className="text-center text-gray-400 py-10">No courses found.</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* --- TAB 3: CONTENT (Drill-down: Course > Chapter > Lessons) --- */}
          <TabsContent value="content">
            <ContentDrillDown
              coursesList={coursesList}
              onNavigateToUpload={(courseId, chapterId) => {
                setSelectedCourse(courseId);
                if (chapterId) setPendingChapterId(chapterId);
                setActiveTab("upload");
              }}
              onRefresh={fetchDashboardData}
            />
          </TabsContent>

          {/* --- TAB 4: UPLOAD (with chapter, link/file toggle, description) --- */}
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload New Material</CardTitle>
                {/* Upload context breadcrumb */}
                {selectedCourse && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2 flex-wrap">
                    <span className="font-medium text-foreground">Target:</span>
                    <span>{coursesList.find(c => c.id.toString() === selectedCourse)?.title || "Unknown Course"}</span>
                    {selectedChapter && chaptersList.find(ch => ch.id === selectedChapter) && (
                      <>
                        <span className="mx-1">›</span>
                        <span>{chaptersList.find(ch => ch.id === selectedChapter)?.title}</span>
                      </>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Content Type Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <Button variant={uploadType==="video"?"default":"outline"} onClick={()=>{setUploadType("video"); setUploadMode("link");}} className="flex-1">
                    <Video className="h-4 w-4 mr-2" /> Lecture
                  </Button>
                  <Button variant={uploadType==="pdf"?"default":"outline"} onClick={()=>setUploadType("pdf")} className="flex-1">
                    <FileText className="h-4 w-4 mr-2" /> PDF
                  </Button>
                  <Button variant={uploadType==="dpp"?"default":"outline"} onClick={()=>setUploadType("dpp")} className="flex-1">
                    <FileText className="h-4 w-4 mr-2" /> DPP
                  </Button>
                  <Button variant={uploadType==="notes"?"default":"outline"} onClick={()=>setUploadType("notes")} className="flex-1">
                    <BookOpen className="h-4 w-4 mr-2" /> Notes
                  </Button>
                  <Button variant={uploadType==="test"?"default":"outline"} onClick={()=>{setUploadType("test"); setUploadMode("link");}} className="flex-1">
                    <ClipboardCheck className="h-4 w-4 mr-2" /> Test
                  </Button>
                </div>
                
                {/* Title */}
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input value={videoTitle} onChange={(e)=>setVideoTitle(e.target.value)} placeholder="Content Title" />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea value={contentDescription} onChange={(e)=>setContentDescription(e.target.value)} placeholder="Brief description of this content..." rows={2} />
                </div>

                {/* Link vs File Toggle (for non-video types) */}
                {uploadType !== "video" && uploadType !== "test" && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant={uploadMode==="link"?"default":"outline"} onClick={()=>setUploadMode("link")}>
                      <ExternalLink className="h-3 w-3 mr-1" /> Paste Link
                    </Button>
                    <Button size="sm" variant={uploadMode==="file"?"default":"outline"} onClick={()=>setUploadMode("file")}>
                      <Upload className="h-3 w-3 mr-1" /> Upload File
                    </Button>
                  </div>
                )}

                {/* URL Input */}
                {(uploadMode === "link" || uploadType === "video" || uploadType === "test") && (
                  <div className="space-y-2">
                    <Label>
                      {uploadType === "video" ? "Video URL (YouTube/Vimeo/Archive.org/Drive)" : 
                       uploadType === "test" ? "Test URL (External Link)" : 
                       "Content URL (Google Drive / External Link)"}
                    </Label>
                    <Input value={videoUrl} onChange={(e)=>setVideoUrl(e.target.value)} placeholder="https://..." />
                  </div>
                )}

                {/* File Upload */}
                {uploadMode === "file" && uploadType !== "test" && (
                  <div className="space-y-2">
                    <Label>{uploadType === "video" ? "Video File" : uploadType === "dpp" ? "DPP File" : uploadType === "notes" ? "Notes File" : "PDF File"}</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept={uploadType === "video" ? ".mp4,.webm,.mov,.avi" : ".pdf,.doc,.docx"}
                        onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        {pdfFile ? (
                          <div className="flex items-center justify-center gap-2 text-green-600">
                            <FileText className="h-6 w-6" />
                            <span className="font-medium">{pdfFile.name}</span>
                          </div>
                        ) : (
                          <div className="text-gray-500">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p>Click to upload file</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                {/* Video Preview */}
                {uploadType === "video" && videoUrl && (() => {
                  const extractYouTubeId = (url: string): string | null => {
                    const patterns = [
                      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
                      /^([a-zA-Z0-9_-]{11})$/,
                    ];
                    for (const pattern of patterns) {
                      const match = url.match(pattern);
                      if (match) return match[1];
                    }
                    return null;
                  };
                  const youtubeId = extractYouTubeId(videoUrl);
                  
                  if (youtubeId) {
                    return (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-green-600">
                          <Eye className="h-4 w-4" />
                          Live Preview
                        </Label>
                        <div className="relative rounded-lg overflow-hidden border-2 border-green-200 bg-black">
                          <div className="aspect-video">
                            <iframe
                              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1`}
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              className="w-full h-full border-0"
                              title="Video Preview"
                            />
                          </div>
                          <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                            🔒 Ghost Mode
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Course Selection */}
                <div className="space-y-2">
                  <Label>Select Course *</Label>
                  <Select value={selectedCourse} onValueChange={(v) => { setSelectedCourse(v); setSelectedChapter(""); }}>
                    <SelectTrigger><SelectValue placeholder="Select Course" /></SelectTrigger>
                    <SelectContent>
                      {coursesList.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Chapter Selection (shown when course is selected and chapters exist) */}
                {selectedCourse && chaptersList.length > 0 && (
                  <div className="space-y-2">
                    <Label>Select Chapter (Optional)</Label>
                    <Select value={selectedChapter || "__none__"} onValueChange={(v) => setSelectedChapter(v === "__none__" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="No Chapter (Root Level)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No Chapter (Root Level)</SelectItem>
                        {chaptersList.map(ch => <SelectItem key={ch.id} value={ch.id}>{ch.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Watermark */}
                <div className="space-y-2">
                  <Label>Watermark Text</Label>
                  <Input value={watermarkText} onChange={(e)=>setWatermarkText(e.target.value)} placeholder="Sadguru Coaching Classes" />
                </div>

                <Button className="w-full" onClick={handleContentUpload} disabled={isUploading}>
                  {isUploading ? <Clock className="animate-spin mr-2"/> : <Upload className="mr-2 h-4 w-4"/>} 
                  Publish Content
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- TAB 6: SCHEDULE --- */}
          <TabsContent value="schedule">
            <Card className="border shadow-sm">
              <CardHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Lecture Schedule
                  </CardTitle>
                  <Button onClick={() => navigate('/admin/schedule')} className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Open Full Schedule
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center py-8">
                  Manage upcoming lecture schedules, create new sessions, and share meeting links with students.
                </p>
                <div className="flex justify-center gap-3 flex-wrap">
                  <Button variant="outline" onClick={() => navigate('/admin/schedule')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create & Manage Schedules
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/admin/quiz')} className="gap-2">
                    <ClipboardCheck className="h-4 w-4" />
                    Quiz Manager (DPP &amp; Tests)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- TAB 7: LIBRARY & NOTES --- */}
          <TabsContent value="library">
            {/* Unified Content Library */}
            <Card className="mb-6">
              <CardHeader className="border-b pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Library className="h-5 w-5 text-primary" />
                    All Uploaded Content ({filteredLibraryLessons.length})
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={libraryTypeFilter} onValueChange={(v: any) => setLibraryTypeFilter(v)}>
                      <SelectTrigger className="w-[130px] bg-white">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="VIDEO">Video</SelectItem>
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="DPP">DPP</SelectItem>
                        <SelectItem value="NOTES">Notes</SelectItem>
                        <SelectItem value="TEST">Test</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={libraryCourseFilter} onValueChange={(v) => setLibraryCourseFilter(v)}>
                      <SelectTrigger className="w-[180px] bg-white">
                        <SelectValue placeholder="All Courses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        {coursesList.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  {filteredLibraryLessons.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">No content found.</div>
                  ) : (
                    <div className="divide-y">
                      {filteredLibraryLessons.map((l: any) => (
                        <div key={l.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{l.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {l.courses?.title || "No course"} • <Badge variant="outline" className="text-xs">{l.lecture_type || "VIDEO"}</Badge>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {l.video_url && (
                              <a href={l.video_url} target="_blank" rel="noopener noreferrer">
                                <Button size="icon" variant="ghost"><ExternalLink className="h-4 w-4" /></Button>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Materials Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Materials (PDF / Links)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                    <Input value={newMaterial.title} onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})} placeholder="Material title *" />

                    {/* File Type Selector */}
                    <Select value={materialFileType} onValueChange={(v) => setMaterialFileType(v as "PDF" | "NOTES" | "DPP")}>
                      <SelectTrigger><SelectValue placeholder="File Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PDF">📄 PDF</SelectItem>
                        <SelectItem value="NOTES">📝 Notes</SelectItem>
                        <SelectItem value="DPP">📋 DPP</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {/* Upload Mode Toggle */}
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant={!pdfFile ? "default" : "outline"} onClick={() => setPdfFile(null)}>
                        <ExternalLink className="h-3 w-3 mr-1" /> Paste Link
                      </Button>
                      <Button size="sm" variant={pdfFile ? "default" : "outline"} onClick={() => {
                        document.getElementById('library-file-upload')?.click();
                      }}>
                        <Upload className="h-3 w-3 mr-1" /> Upload File
                      </Button>
                    </div>

                    {/* Link Input */}
                    {!pdfFile && (
                      <Input value={newMaterial.file_url} onChange={(e) => setNewMaterial({...newMaterial, file_url: e.target.value})} placeholder="Google Drive / Supabase Storage URL" />
                    )}

                    {/* File Upload */}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      id="library-file-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setPdfFile(file);
                      }}
                    />
                    {pdfFile && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded border text-sm">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-medium truncate">{pdfFile.name}</span>
                        <Button size="sm" variant="ghost" className="ml-auto h-6 text-destructive" onClick={() => setPdfFile(null)}>✕</Button>
                      </div>
                    )}

                    <Textarea value={newMaterial.description} onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})} placeholder="Description (optional)" rows={2} />
                    <Select value={newMaterial.course_id || "__none__"} onValueChange={(v) => setNewMaterial({...newMaterial, course_id: v === "__none__" ? "" : v})}>
                      <SelectTrigger><SelectValue placeholder="Link to Course (optional)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No Course</SelectItem>
                        {coursesList.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="w-full" onClick={async () => {
                      if (pdfFile) {
                        // Upload to Supabase storage first
                        const fileExt = pdfFile.name.split('.').pop();
                        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                        const filePath = `materials/${fileName}`;
                        const { error: uploadError } = await supabase.storage.from('content').upload(filePath, pdfFile);
                        if (uploadError) { toast.error(uploadError.message); return; }
                        const { data: { publicUrl } } = supabase.storage.from('content').getPublicUrl(filePath);
                        await supabase.from('materials').insert({
                          title: newMaterial.title,
                          description: newMaterial.description || null,
                          file_url: publicUrl,
                          file_type: materialFileType,
                          course_id: newMaterial.course_id ? parseInt(newMaterial.course_id) : null,
                        });
                        toast.success("Material uploaded!");
                        setPdfFile(null);
                        setNewMaterial({ title: "", description: "", file_url: "", course_id: "" });
                        setMaterialFileType("PDF");
                        fetchLibraryData();
                      } else {
                        handleCreateMaterial();
                      }
                    }}>
                      <Plus className="h-3 w-3 mr-1" /> {pdfFile ? `Upload & Add ${materialFileType}` : `Add ${materialFileType}`}
                    </Button>
                  </div>

                  <ScrollArea className="h-[350px]">
                    <div className="space-y-2">
                      {materialsList.map((m) => (
                        <div key={m.id} className="p-3 border rounded bg-white">
                          {editingMaterialId === m.id ? (
                            <div className="space-y-2">
                              <Input value={editMaterialData.title} onChange={(e) => setEditMaterialData({...editMaterialData, title: e.target.value})} />
                              <Input value={editMaterialData.file_url} onChange={(e) => setEditMaterialData({...editMaterialData, file_url: e.target.value})} />
                              <Textarea value={editMaterialData.description} onChange={(e) => setEditMaterialData({...editMaterialData, description: e.target.value})} rows={2} />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleSaveMaterialEdit}><CheckCircle className="h-3 w-3 mr-1" /> Save</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingMaterialId(null)}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{m.title}</p>
                                <p className="text-xs text-muted-foreground">{m.courses?.title || "No course"} • {m.file_type}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button size="icon" variant="ghost" onClick={() => { setEditingMaterialId(m.id); setEditMaterialData({ title: m.title, description: m.description || "", file_url: m.file_url }); }}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="text-red-400" onClick={() => handleDeleteMaterial(m.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {materialsList.length === 0 && <p className="text-center text-muted-foreground py-8">No materials yet.</p>}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Notes Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                    <Input value={newNote.title} onChange={(e) => setNewNote({...newNote, title: e.target.value})} placeholder="Note title" />
                    
                    {/* Upload Mode Toggle for Notes */}
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant={!noteFile ? "default" : "outline"} onClick={() => setNoteFile(null)}>
                        <ExternalLink className="h-3 w-3 mr-1" /> Paste Link
                      </Button>
                      <Button size="sm" variant={noteFile ? "default" : "outline"} onClick={() => {
                        document.getElementById('note-file-upload')?.click();
                      }}>
                        <Upload className="h-3 w-3 mr-1" /> Upload PDF
                      </Button>
                    </div>

                    {!noteFile && (
                      <Input value={newNote.pdf_url} onChange={(e) => setNewNote({...newNote, pdf_url: e.target.value})} placeholder="PDF URL" />
                    )}

                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      id="note-file-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setNoteFile(file);
                      }}
                    />
                    {noteFile && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200 text-sm text-green-700">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium truncate">{noteFile.name}</span>
                        <Button size="sm" variant="ghost" className="ml-auto h-6 text-red-500" onClick={() => setNoteFile(null)}>✕</Button>
                      </div>
                    )}

                    <Select value={newNote.lesson_id || "__none__"} onValueChange={(v) => setNewNote({...newNote, lesson_id: v === "__none__" ? "" : v})}>
                      <SelectTrigger><SelectValue placeholder="Link to Lesson (optional)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No Lesson</SelectItem>
                        {lessons.slice(0, 50).map(l => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="w-full" onClick={async () => {
                      if (noteFile) {
                        if (!newNote.title) { toast.error("Note title is required"); return; }
                        const fileExt = noteFile.name.split('.').pop();
                        const fileName = `notes/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                        const { error: uploadError } = await supabase.storage.from('content').upload(fileName, noteFile);
                        if (uploadError) { toast.error(uploadError.message); return; }
                        const { data: { publicUrl } } = supabase.storage.from('content').getPublicUrl(fileName);
                        await supabase.from('notes').insert({
                          title: newNote.title,
                          pdf_url: publicUrl,
                          lesson_id: newNote.lesson_id || null,
                        });
                        toast.success("Note uploaded!");
                        setNoteFile(null);
                        setNewNote({ title: "", pdf_url: "", lesson_id: "" });
                        fetchLibraryData();
                      } else {
                        handleCreateNote();
                      }
                    }}>
                      <Plus className="h-3 w-3 mr-1" /> {noteFile ? "Upload & Add Note" : "Add Note"}
                    </Button>
                  </div>

                  <ScrollArea className="h-[350px]">
                    <div className="space-y-2">
                      {notesList.map((n) => (
                        <div key={n.id} className="p-3 border rounded bg-white">
                          {editingNoteId === n.id ? (
                            <div className="space-y-2">
                              <Input value={editNoteData.title} onChange={(e) => setEditNoteData({...editNoteData, title: e.target.value})} />
                              <Input value={editNoteData.pdf_url} onChange={(e) => setEditNoteData({...editNoteData, pdf_url: e.target.value})} />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleSaveNoteEdit}><CheckCircle className="h-3 w-3 mr-1" /> Save</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingNoteId(null)}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{n.title}</p>
                                <p className="text-xs text-muted-foreground">{n.lessons?.title || "No lesson linked"}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button size="icon" variant="ghost" onClick={() => { setEditingNoteId(n.id); setEditNoteData({ title: n.title, pdf_url: n.pdf_url }); }}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="text-red-400" onClick={() => handleDeleteNote(n.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {notesList.length === 0 && <p className="text-center text-muted-foreground py-8">No notes yet.</p>}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* --- TAB: SOCIAL LINKS --- */}
          <TabsContent value="social">
            <SocialLinksManager />
          </TabsContent>

          {/* --- TAB: LIVE CLASSES --- */}
          <TabsContent value="live">
            <div className="flex flex-col items-center gap-4 py-8 px-4 text-center">
              <div className="p-4 rounded-2xl bg-destructive/10">
                <Radio className="h-10 w-10 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Live Class Manager</h2>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Schedule live YouTube sessions, go live with one click, manage chat and answer student doubts in real-time.
                </p>
              </div>
              <button
                onClick={() => navigate("/admin/live")}
                className="inline-flex items-center gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors"
              >
                <Radio className="h-4 w-4" /> Open Live Manager
              </button>
            </div>
          </TabsContent>

          {/* --- TAB: HERO BANNERS --- */}
          <TabsContent value="banners">
            <HeroBannerManager />
          </TabsContent>

          {/* --- TAB: DOUBTS (Zoom Sessions) --- */}
          <TabsContent value="doubts">
            <div className="flex flex-col items-center gap-4 py-8 px-4 text-center">
              <div className="p-4 rounded-2xl bg-primary/10">
                <MessageSquare className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Zoom Doubt Sessions</h2>
                <p className="text-muted-foreground text-sm max-w-sm">
                  View all student doubt requests, create Zoom meetings, and manage 1:1 sessions.
                </p>
              </div>
              <button
                onClick={() => navigate("/doubts")}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors"
              >
                <MessageSquare className="h-4 w-4" /> Open Doubt Manager
              </button>
            </div>
          </TabsContent>

          {/* --- TAB: SESSIONS --- */}
          <TabsContent value="sessions">
            <Card className="border shadow-sm">
              <CardHeader className="border-b pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-primary" />
                    Active Sessions ({sessionsList.length})
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={fetchSessionsData} disabled={sessionsLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${sessionsLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Monitor all active device sessions. Force-logout suspicious or excess sessions.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {sessionsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : sessionsList.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                    <Monitor className="h-10 w-10" />
                    <p className="font-medium">No active sessions</p>
                    <p className="text-sm">Sessions are created when users log in</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {sessionsList.map((s) => (
                      <div key={s.id} className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors">
                        <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${s.device_type === "mobile" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                          {s.device_type === "mobile" ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs capitalize shrink-0">{s.device_type}</Badge>
                            <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">{s.user_id}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {s.user_agent ? s.user_agent.substring(0, 70) + "..." : "Unknown browser"}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>Logged in: {new Date(s.logged_in_at).toLocaleString()}</span>
                            <span>·</span>
                            <span>Last active: {new Date(s.last_active_at).toLocaleString()}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 text-destructive border-destructive/20 hover:bg-destructive/10"
                          onClick={() => handleForceLogout(s.session_token, s.user_id)}
                          disabled={terminatingSession === s.session_token}
                        >
                          {terminatingSession === s.session_token ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <><LogOut className="h-3 w-3 mr-1" />Logout</>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
