import { useState, useRef, useEffect, useCallback, forwardRef } from "react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { cn } from "@/lib/utils";
import { X, Send, RotateCcw, ThumbsUp, ThumbsDown, Mic, MicOff, Paperclip, ImageIcon, Lock, LogIn } from "lucide-react";
import logoIcon from "@/assets/sarthi-avatar.png"; // Sarthi guru avatar

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  id: string;
  feedbackGiven?: "up" | "down" | null;
  queryType?: string;
  imageUrl?: string; // for image/doc preview in chat
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://wegamscqtvqhxowlskfm.supabase.co";
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const QUICK_PROMPTS = [
  "📚 Kaunsa course lun?",
  "📝 Mock test mein help chahiye",
  "🎯 Enroll kaise karein?",
  "🔥 NEET Physics syllabus batao",
];

const WELCOME_MSG = "👋 नमस्ते! मैं **Sadguru Sarthi** हूँ – आपका 24×7 personal learning assistant। ✨\n\nमैं आपकी मदद कर सकता हूँ:\n- 📚 **Courses** और **Syllabus** के बारे में\n- 📝 **Mock Test** doubts में guidance\n- 🎯 **Study tips** और **mnemonics**\n- 🔧 **Platform** की technical help\n- 🖼️ **Image doubt** upload करें और मैं समझाऊंगा!\n\nआज मैं आपके लिए क्या कर सकता हूँ?";

// Allowed image/doc types
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Web Speech API type declarations
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const MarkdownMessage = ({ content }: { content: string }) => (
  <ReactMarkdown
    components={{
      h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1.5 text-foreground">{children}</h2>,
      h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-foreground">{children}</h3>,
      p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
      ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
      li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
      strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
      a: ({ href, children }) => <a href={href} className="underline text-primary" target="_blank" rel="noopener noreferrer">{children}</a>,
      table: ({ children }) => (
        <div className="overflow-x-auto my-2 rounded-md border">
          <table className="text-xs w-full">{children}</table>
        </div>
      ),
      thead: ({ children }) => <thead className="bg-primary/10">{children}</thead>,
      th: ({ children }) => <th className="px-2 py-1.5 text-left font-semibold border-b">{children}</th>,
      td: ({ children }) => <td className="px-2 py-1.5 border-b border-border/50">{children}</td>,
      tr: ({ children }) => <tr className="hover:bg-muted/30 transition-colors">{children}</tr>,
      blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/50 pl-3 italic text-muted-foreground my-1">{children}</blockquote>,
      code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
    }}
  >
    {content}
  </ReactMarkdown>
);

const ChatWidget = forwardRef<HTMLDivElement>(() => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginTip, setShowLoginTip] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME_MSG, timestamp: new Date(), id: "welcome", feedbackGiven: null },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Image/doc upload state
  const [uploadedFile, setUploadedFile] = useState<{ file: File; previewUrl: string; type: "image" | "pdf" } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Check voice support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SpeechRecognition);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Voice input handler
  const toggleVoice = () => {
    if (!voiceSupported) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = "hi-IN"; // Hindi + English support
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("");
      setInput(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // File upload handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("❌ Only images (JPG, PNG, GIF, WebP) and PDF files allowed!");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert("❌ File size must be under 5MB!");
      return;
    }

    const isImage = file.type.startsWith("image/");
    const previewUrl = isImage ? URL.createObjectURL(file) : "";

    setUploadedFile({ file, previewUrl, type: isImage ? "image" : "pdf" });

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeUploadedFile = () => {
    if (uploadedFile?.previewUrl) URL.revokeObjectURL(uploadedFile.previewUrl);
    setUploadedFile(null);
  };

  // Upload file to Supabase storage and get URL
  const uploadFileToStorage = async (file: File): Promise<string | null> => {
    try {
      const ext = file.name.split(".").pop();
      const path = `chat-doubts/${user?.id || "anon"}/${Date.now()}.${ext}`;

      const { data, error } = await (await import("@/integrations/supabase/client")).supabase.storage
        .from("chat-attachments")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) throw error;

      const { data: { publicUrl } } = (await import("@/integrations/supabase/client")).supabase.storage
        .from("chat-attachments")
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  };

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if ((!msg && !uploadedFile) || isLoading) return;
    setInput("");

    let filePublicUrl: string | null = null;
    let fileType: "image" | "pdf" | null = null;
    const fileToSend = uploadedFile;
    setUploadedFile(null);

    if (fileToSend) {
      setIsUploading(true);
      filePublicUrl = await uploadFileToStorage(fileToSend.file);
      fileType = fileToSend.type;
      setIsUploading(false);
      if (fileToSend.previewUrl) URL.revokeObjectURL(fileToSend.previewUrl);
    }

    const displayMsg = msg || (fileType === "image" ? "🖼️ [Image doubt]" : "📄 [Document]");
    const userMsgId = crypto.randomUUID();
    const userMsg: Message = {
      role: "user",
      content: displayMsg,
      timestamp: new Date(),
      id: userMsgId,
      imageUrl: fileType === "image" && filePublicUrl ? filePublicUrl : undefined,
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));

      // Build message with image context if file uploaded
      let fullMsg = msg;
      if (filePublicUrl && fileType === "image") {
        fullMsg = `${msg ? msg + "\n\n" : ""}[Student ne ek image/doubt upload ki hai: ${filePublicUrl}]\nIs image mein jo bhi question ya concept hai usse explain karein step by step.`;
      } else if (filePublicUrl && fileType === "pdf") {
        fullMsg = `${msg ? msg + "\n\n" : ""}[Student ne ek PDF document upload kiya hai: ${filePublicUrl}]\nIs document ke baare mein help karein.`;
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({ message: fullMsg, history, userId: user?.id, sessionId }),
      });

      const data = await response.json();
      const botReply = data.response || "माफ़ करें, कुछ गड़बड़ हो गई। फिर try करें। 🙏";

      setMessages(prev => [...prev, {
        role: "assistant",
        content: botReply,
        timestamp: new Date(),
        id: crypto.randomUUID(),
        feedbackGiven: null,
        queryType: data.queryType,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "🔧 Connection में problem है। थोड़ी देर बाद try करें। 🙏",
        timestamp: new Date(),
        id: crypto.randomUUID(),
        feedbackGiven: null,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = useCallback(async (msgId: string, rating: "up" | "down") => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || msg.feedbackGiven) return;

    const msgIndex = messages.findIndex(m => m.id === msgId);
    const userMsg = msgIndex > 0 ? messages[msgIndex - 1] : null;

    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, feedbackGiven: rating } : m));

    try {
      await fetch(`${SUPABASE_URL}/functions/v1/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ANON_KEY}` },
        body: JSON.stringify({
          message: "_feedback_",
          feedback: {
            messageContent: userMsg?.content || "",
            responseContent: msg.content,
            rating,
          },
          userId: user?.id,
          sessionId,
        }),
      });
    } catch {
      // Silently fail on feedback errors
    }
  }, [messages, user, sessionId]);

  const resetChat = () => {
    removeUploadedFile();
    setMessages([{
      role: "assistant",
      content: "👋 नमस्ते! मैं **Sadguru Sarthi** हूँ – नई बातचीत शुरू करते हैं! आज मैं आपकी कैसे मदद कर सकता हूँ? 🎓",
      timestamp: new Date(),
      id: "welcome-reset",
      feedbackGiven: null,
    }]);
  };

  // ─── LOGIN GATE: unauthenticated users see a locked button ───
  if (!user) {
    return (
      <div className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6 flex flex-col items-end gap-2">
        {/* Login tooltip */}
        {showLoginTip && (
          <div
            className={cn(
              "bg-card border border-border rounded-2xl shadow-xl px-4 py-4 text-right",
              "max-w-[230px] animate-in slide-in-from-bottom-3 fade-in duration-200",
              "ring-1 ring-primary/20"
            )}
          >
            {/* Header row */}
            <div className="flex items-center justify-end gap-2 mb-2">
              <p className="font-semibold text-sm text-foreground">Sadguru Sarthi 🎓</p>
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <img src={logoIcon} className="w-3.5 h-3.5 object-contain" alt="" />
              </div>
            </div>
            {/* Body */}
            <p className="text-muted-foreground text-xs leading-relaxed mb-3">
              सीखने के लिए <strong className="text-foreground">Login करें</strong> और Sarthi से 24×7 बात करें।
            </p>
            {/* CTA */}
            <Link
              to="/login"
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-semibold",
                "bg-primary text-primary-foreground px-3 py-1.5 rounded-full",
                "hover:opacity-90 transition-opacity"
              )}
            >
              <LogIn className="h-3 w-3" />
              Login करें →
            </Link>
          </div>
        )}

        {/* Locked floating button */}
        <button
          onClick={() => setShowLoginTip(prev => !prev)}
          className={cn(
            "w-14 h-14 rounded-full shadow-lg flex items-center justify-center",
            "bg-primary text-primary-foreground transition-all duration-200",
            "hover:scale-110 active:scale-95 relative",
            showLoginTip && "scale-105 shadow-xl ring-2 ring-primary/40"
          )}
          aria-label="Login to chat with Sadguru Sarthi"
        >
          <img src={logoIcon} className="w-8 h-8 object-contain" alt="Sadguru Sarthi" />
          {/* Lock badge */}
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-card rounded-full border-2 border-border flex items-center justify-center shadow-sm">
            <Lock className="h-2.5 w-2.5 text-muted-foreground" />
          </span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(
          "fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6",
          "w-14 h-14 rounded-full shadow-lg flex items-center justify-center",
          "bg-primary text-primary-foreground transition-all duration-200",
          "hover:scale-110 active:scale-95",
          isOpen && "scale-0 opacity-0 pointer-events-none"
        )}
        aria-label="Open Sadguru Sarthi"
      >
        <img src={logoIcon} className="w-8 h-8 object-contain" alt="Sadguru Sarthi" />
      </button>

      {/* Full-page chat overlay */}
      {isOpen && (
        <div className={cn(
          "fixed inset-0 z-50",
          "bg-background flex flex-col",
          "animate-in fade-in duration-200",
          "md:left-auto md:w-[560px] lg:w-[680px] md:shadow-2xl md:border-l md:border md:rounded-l-2xl"
        )}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-primary/5 shrink-0">
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center relative shrink-0">
              <img src={logoIcon} className="w-5 h-5 object-contain" alt="Sarthi" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-chart-2 rounded-full border-2 border-card" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">Sadguru Sarthi 2.0 🎓</p>
              <p className="text-xs text-muted-foreground">सीखने का सच्चा साथी • 24×7 उपलब्ध</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={resetChat} title="Reset chat">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setIsOpen(false)} title="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
            <div className="space-y-3 pb-2">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <img src={logoIcon} className="w-4 h-4 object-contain" alt="Sarthi" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1 max-w-[82%]">
                    {/* Image preview in user message */}
                    {msg.imageUrl && (
                      <div className="rounded-xl overflow-hidden border border-border">
                        <img
                          src={msg.imageUrl}
                          alt="Uploaded doubt"
                          className="max-w-full max-h-48 object-contain bg-muted"
                        />
                      </div>
                    )}
                    <div className={cn(
                      "rounded-2xl px-3 py-2 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    )}>
                      {msg.role === "assistant" ? <MarkdownMessage content={msg.content} /> : msg.content}
                    </div>
                    {/* Feedback buttons for assistant messages (not welcome) */}
                    {msg.role === "assistant" && msg.id !== "welcome" && msg.id !== "welcome-reset" && (
                      <div className="flex gap-1 pl-1">
                        <button
                          onClick={() => handleFeedback(msg.id, "up")}
                          disabled={!!msg.feedbackGiven}
                          className={cn(
                            "p-1 rounded-md transition-colors text-xs flex items-center gap-0.5",
                            msg.feedbackGiven === "up"
                              ? "text-primary bg-primary/15"
                              : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                          )}
                          title="Helpful"
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleFeedback(msg.id, "down")}
                          disabled={!!msg.feedbackGiven}
                          className={cn(
                            "p-1 rounded-md transition-colors text-xs flex items-center gap-0.5",
                            msg.feedbackGiven === "down"
                              ? "text-destructive bg-destructive/15"
                              : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          )}
                          title="Not helpful"
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                        {msg.feedbackGiven && (
                          <span className="text-xs text-muted-foreground self-center ml-1">
                            {msg.feedbackGiven === "up" ? "शुक्रिया! 😊" : "समझ गया, बेहतर करेंगे 🙏"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Animated typing indicator */}
              {(isLoading || isUploading) && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <img src={logoIcon} className="w-4 h-4 object-contain" alt="Sarthi" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                    {isUploading ? (
                      <span className="text-xs text-muted-foreground">Uploading...</span>
                    ) : (
                      [0, 1, 2].map(i => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick prompts (first message only) */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-xs bg-primary/10 text-primary rounded-full px-3 py-1.5 hover:bg-primary/20 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* File preview strip */}
          {uploadedFile && (
            <div className="px-3 pb-1 shrink-0">
              <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2">
                {uploadedFile.type === "image" ? (
                  <>
                    <img src={uploadedFile.previewUrl} alt="preview" className="w-8 h-8 rounded object-cover" />
                    <span className="text-xs text-foreground flex-1 truncate">{uploadedFile.file.name}</span>
                  </>
                ) : (
                  <>
                    <Paperclip className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs text-foreground flex-1 truncate">{uploadedFile.file.name}</span>
                  </>
                )}
                <button onClick={removeUploadedFile} className="text-muted-foreground hover:text-destructive transition-colors ml-1">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Voice listening indicator */}
          {isListening && (
            <div className="px-4 pb-1 shrink-0">
              <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-full px-3 py-1.5">
                <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                <span className="text-xs text-destructive font-medium">सुन रहा हूँ... बोलिए 🎤</span>
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="p-3 border-t flex gap-2 shrink-0 items-center">
            {/* Attach file button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 text-muted-foreground hover:text-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Image/PDF doubt upload karein"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>

            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={isListening ? "बोल रहे हैं..." : "Sarthi se kuch poochein... 🙏"}
              className="flex-1 text-sm h-10"
              disabled={isLoading}
            />

            {/* Voice button */}
            {voiceSupported && (
              <Button
                variant={isListening ? "destructive" : "ghost"}
                size="icon"
                className={cn(
                  "h-10 w-10 shrink-0 transition-all",
                  !isListening && "text-muted-foreground hover:text-primary",
                  isListening && "animate-pulse"
                )}
                onClick={toggleVoice}
                disabled={isLoading}
                title={isListening ? "Voice रोकें" : "Voice से बोलें"}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}

            {/* Send button */}
            <Button
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => sendMessage()}
              disabled={(!input.trim() && !uploadedFile) || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
});

ChatWidget.displayName = "ChatWidget";

export default ChatWidget;
