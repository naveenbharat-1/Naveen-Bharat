import { Suspense, lazy, memo, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { BatchProvider } from "@/contexts/BatchContext";

// Critical path - load immediately
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Lazy loaded pages for code splitting
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Courses = lazy(() => import("./pages/Courses"));
const Course = lazy(() => import("./pages/Course"));
const Lesson = lazy(() => import("./pages/Lesson"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin Pages - Lazy loaded
const Admin = lazy(() => import("./pages/Admin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminRegister = lazy(() => import("./pages/AdminRegister"));
const AdminUpload = lazy(() => import("./pages/AdminUpload"));
const AdminCMS = lazy(() => import("./pages/AdminCMS"));
const AdminSchedule = lazy(() => import("./pages/AdminSchedule"));
// Other Protected Pages - Lazy loaded
const Attendance = lazy(() => import("./pages/Attendance"));
const Reports = lazy(() => import("./pages/Reports"));
const Students = lazy(() => import("./pages/Students"));
const Messages = lazy(() => import("./pages/Messages"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Timetable = lazy(() => import("./pages/Timetable"));
const Books = lazy(() => import("./pages/Books"));
const Notices = lazy(() => import("./pages/Notices"));
const Materials = lazy(() => import("./pages/Materials"));
const Syllabus = lazy(() => import("./pages/Syllabus"));
const BuyCourse = lazy(() => import("./pages/BuyCourse"));
const AllClasses = lazy(() => import("./pages/AllClasses"));
const LessonView = lazy(() => import("./pages/LessonView"));
const ChapterView = lazy(() => import("./pages/ChapterView"));
const LectureListing = lazy(() => import("./pages/LectureListing"));
const MyCourses = lazy(() => import("./pages/MyCourses"));
const MyCourseDetail = lazy(() => import("./pages/MyCourseDetail"));
const AllTests = lazy(() => import("./pages/AllTests"));
const Install = lazy(() => import("./pages/Install"));
const QuizAttempt = lazy(() => import("./pages/QuizAttempt"));
const QuizResult = lazy(() => import("./pages/QuizResult"));
const AdminQuizManager = lazy(() => import("./pages/AdminQuizManager"));
const LiveClass = lazy(() => import("./pages/LiveClass"));
const AdminLiveManager = lazy(() => import("./pages/AdminLiveManager"));
const TeacherLiveView = lazy(() => import("./pages/TeacherLiveView"));
const AdminChatbotSettings = lazy(() => import("./pages/AdminChatbotSettings"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const Downloads = lazy(() => import("./pages/Downloads"));
const Doubts = lazy(() => import("./pages/Doubts"));
import ChatWidget from "./components/chat/ChatWidget";

// Optimized QueryClient with better caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Logo-based page loader with pulse animation
import sadguruLogo from "@/assets/branding/logo_icon_web.png";

const PageLoader = memo(() => {
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowRetry(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <img src={sadguruLogo} alt="Loading" className="h-16 w-16 rounded-2xl mahima-loader-logo" />
          <div className="absolute inset-0 rounded-2xl border-2 border-primary/40 mahima-loader-ring" />
        </div>
        <p className="text-muted-foreground text-sm">
          {showRetry ? "Taking longer than expected..." : "Please wait & Deep Breath"}
        </p>
        {showRetry && (
          <button 
            onClick={() => window.location.reload()}
            className="text-primary hover:underline text-sm font-medium"
          >
            Refresh Page
          </button>
        )}
      </div>
    </div>
  );
});

PageLoader.displayName = "PageLoader";

// AdminRoute: only accessible to users with admin role
const AdminRoute = ({ element }: { element: React.ReactElement }) => {
  const { isAdmin, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!isAdmin) return <Navigate to="/login" replace />;
  return element;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <BatchProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/install" element={<Install />} />
                  
                  {/* Admin Login/Register — public */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/register" element={<AdminRegister />} />

                  {/* Admin Routes — role-guarded */}
                  <Route path="/admin" element={<AdminRoute element={<Admin />} />} />
                  <Route path="/admin/upload" element={<AdminRoute element={<AdminUpload />} />} />
                  <Route path="/admin/cms" element={<AdminRoute element={<AdminCMS />} />} />
                  <Route path="/admin/schedule" element={<AdminRoute element={<AdminSchedule />} />} />
                  <Route path="/admin/quiz" element={<AdminRoute element={<AdminQuizManager />} />} />
                  <Route path="/admin/live" element={<AdminRoute element={<AdminLiveManager />} />} />
                  <Route path="/admin/chatbot" element={<AdminRoute element={<AdminChatbotSettings />} />} />
                  <Route path="/admin/analytics" element={<AdminRoute element={<AdminAnalytics />} />} />
                  
                  {/* Protected Routes */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/dashboard/my-courses" element={<MyCourses />} />
                  <Route path="/my-courses" element={<MyCourses />} />
                  <Route path="/my-courses/:courseId" element={<MyCourseDetail />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/course/:id" element={<Course />} />
                  <Route path="/lesson/:id" element={<Lesson />} />
                  
                  {/* Course Purchase & Learning Routes */}
                  <Route path="/buy-course" element={<BuyCourse />} />
                  <Route path="/buy-course/:id" element={<BuyCourse />} />
                  <Route path="/all-classes" element={<AllClasses />} />
                  <Route path="/classes/:courseId/lessons" element={<LessonView />} />
                  <Route path="/classes/:courseId/chapters" element={<ChapterView />} />
                  <Route path="/classes/:courseId/chapter/:chapterId" element={<LectureListing />} />
                  
                  {/* Quiz Routes */}
                  <Route path="/quiz/:quizId" element={<QuizAttempt />} />
                  <Route path="/quiz/:quizId/result/:attemptId" element={<QuizResult />} />

                  {/* Feature Pages */}
                   <Route path="/all-tests" element={<AllTests />} />
                   <Route path="/live/:sessionId" element={<LiveClass />} />
                   <Route path="/teacher/live/:sessionId" element={<TeacherLiveView />} />
                  <Route path="/attendance" element={<Attendance />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/students" element={<Students />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/timetable" element={<Timetable />} />
                  <Route path="/books" element={<Books />} />
                  <Route path="/notices" element={<Notices />} />
                  <Route path="/materials" element={<Materials />} />
                  <Route path="/syllabus" element={<Syllabus />} />
                  
                   <Route path="/downloads" element={<Downloads />} />
                   <Route path="/doubts" element={<Doubts />} />
                   <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <ChatWidget />
            </BrowserRouter>
          </TooltipProvider>
        </BatchProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
