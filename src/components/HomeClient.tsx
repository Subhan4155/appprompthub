"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import SiteHeader from "./SiteHeader";
import { mockPrompts as defaultMockPrompts, mockNews as defaultMockNews } from "../data/mockData";
import { PromptItem, NewsItem } from "../types";
import { supabase, hasSupabaseCredentials } from "../lib/supabase";

interface CustomUserPrompt {
  id: string;
  title: string;
  targetAI: string;
  promptText: string;
  date: string;
}

interface CopyHistoryItem {
  id: string;
  title: string;
  timestamp: string;
}

interface HomeClientProps {
  defaultTab?: "explore" | "builder" | "news" | "workspace";
}

export default function HomeClient({ defaultTab = "explore" }: HomeClientProps) {
  const [activeTab, setActiveTab] = useState<"explore" | "builder" | "news" | "workspace">(defaultTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "web-app" | "blog" | "image-gen">("all");
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedNewsId, setExpandedNewsId] = useState<string | null>(null);

  // Dynamic database lists (initialized with mock fallbacks)
  const [prompts, setPrompts] = useState<PromptItem[]>(defaultMockPrompts);
  const [news, setNews] = useState<NewsItem[]>(defaultMockNews);
  const [dbLoading, setDbLoading] = useState(false);

  // Advanced Filtering & Sorting States
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "likes">("popular");
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Pagination State
  const [visibleCount, setVisibleCount] = useState(6);

  // Toast Notification State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Favorites System (localStorage based)
  const [favorites, setFavorites] = useState<string[]>([]);

  // User Workspace States
  const [userCustomPrompts, setUserCustomPrompts] = useState<CustomUserPrompt[]>([]);
  const [copyHistory, setCopyHistory] = useState<CopyHistoryItem[]>([]);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    title: "",
    description: "",
    category: "web-app" as "web-app" | "blog" | "image-gen",
    targetAI: "Claude 3.5 Sonnet",
    promptText: "",
    outputDescription: "",
    difficulty: "Intermediate" as "Beginner" | "Intermediate" | "Advanced",
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editingCustom, setEditingCustom] = useState<CustomUserPrompt | null>(null);
  const [customForm, setCustomForm] = useState({
    title: "",
    targetAI: "Claude 3.5 Sonnet",
    promptText: ""
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  // User Registration & Auth States
  const [sessionUser, setSessionUser] = useState<any | null>(null);
  const [mockUser, setMockUser] = useState<any | null>(null); // For local fallback testing
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Compute active user
  const activeUser = useMemo(() => sessionUser || mockUser, [sessionUser, mockUser]);

  // Read URL query parameter on client mount for seamless redirection tabs
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "builder" || tabParam === "news" || tabParam === "workspace") {
        setActiveTab(tabParam as any);
        // Scroll to content below hero on home page
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 100);
      }
    }
  }, []);

  // Listen for Supabase Auth state changes
  useEffect(() => {
    if (!hasSupabaseCredentials) return;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionUser(session?.user ?? null);
    });

    // Listen for auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadSubmissions = async () => {
    if (!activeUser) return;
    if (!hasSupabaseCredentials) {
      // Load mock submissions
      try {
        const mockSubs = JSON.parse(localStorage.getItem("appprompthub_mock_submissions") || "[]");
        const filtered = mockSubs.filter((s: any) => s.submittedBy === activeUser.id);
        setMySubmissions(filtered);
      } catch (e) {
        console.error(e);
      }
      return;
    }
    try {
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .eq("submitted_by", activeUser.id);
      if (!error && data) {
        setMySubmissions(data);
      }
    } catch (err) {
      console.warn("Submissions loading failed:", err);
    }
  };

  // Load community submissions
  useEffect(() => {
    loadSubmissions();
  }, [activeUser]);

  // Fetch prompts & news from Supabase
  useEffect(() => {
    async function loadDatabaseData() {
      if (!hasSupabaseCredentials) {
        console.log("[HomeClient] Using local static mock database (no credentials).");
        return;
      }

      setDbLoading(true);
      try {
        // Query Prompts table
        const { data: dbPrompts, error: promptsError } = await supabase
          .from("prompts")
          .select("*");
        
        if (promptsError) throw promptsError;

        if (dbPrompts && dbPrompts.length > 0) {
          const formattedPrompts: PromptItem[] = dbPrompts.map((p: any) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            description: p.description,
            category: p.category,
            targetAI: p.target_ai,
            promptText: p.prompt_text,
            outputDescription: p.output_description,
            views: p.views ?? 0,
            likes: p.likes ?? 0,
            difficulty: p.difficulty,
            date: p.date,
            imageUrl: p.imageUrl || undefined
          }));
          setPrompts(formattedPrompts);
        }

        // Query News table
        const { data: dbNews, error: newsError } = await supabase
          .from("news")
          .select("*")
          .order("date", { ascending: false });

        if (newsError) throw newsError;

        if (dbNews && dbNews.length > 0) {
          const formattedNews: NewsItem[] = dbNews.map((n: any) => ({
            id: n.id,
            slug: n.slug,
            title: n.title,
            category: n.category,
            date: n.date,
            summary: n.summary,
            content: n.content,
            importance: n.importance,
            sourceUrl: n.source_url || undefined
          }));
          setNews(formattedNews);
        }
      } catch (err) {
        console.warn("[HomeClient] Database fetch failed. Defaulting to mock fallback.", err);
      } finally {
        setDbLoading(false);
      }
    }

    loadDatabaseData();
  }, []);

  // Load favorites, custom prompts, copy histories on mount
  useEffect(() => {
    try {
      const storedFavs = localStorage.getItem("appprompthub_favorites");
      if (storedFavs) setFavorites(JSON.parse(storedFavs));

      const storedCustom = localStorage.getItem("appprompthub_custom_prompts");
      if (storedCustom) setUserCustomPrompts(JSON.parse(storedCustom));

      const storedHistory = localStorage.getItem("appprompthub_copy_history");
      if (storedHistory) setCopyHistory(JSON.parse(storedHistory));

      const storedSubStatus = localStorage.getItem("appprompthub_sub_status");
      if (storedSubStatus) setIsSubscribed(storedSubStatus === "true");

      const storedMockUser = localStorage.getItem("appprompthub_mock_user");
      if (storedMockUser) setMockUser(JSON.parse(storedMockUser));
    } catch (e) {
      console.error("Failed to load local storage configurations", e);
    }
  }, []);

  // Toggle favorite / like count helper
  const toggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening details modal
    const isFavorited = favorites.includes(id);
    let updated: string[];

    if (isFavorited) {
      updated = favorites.filter((favId) => favId !== id);
      triggerToast("Removed from bookmarked prompts");
      
      // Decrement locally in state first
      setPrompts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, likes: Math.max(0, p.likes - 1) } : p))
      );

      // Decrement in Supabase
      const promptItem = prompts.find((p) => p.id === id);
      if (promptItem && hasSupabaseCredentials) {
        try {
          await supabase
            .from("prompts")
            .update({ likes: Math.max(0, promptItem.likes - 1) })
            .eq("id", id);
        } catch (err) {
          console.error("Failed to decrement likes in Supabase", err);
        }
      }
    } else {
      updated = [...favorites, id];
      triggerToast("Prompt bookmarked to local shelf!");

      // Increment locally in state first
      setPrompts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
      );

      // Increment in Supabase
      const promptItem = prompts.find((p) => p.id === id);
      if (promptItem && hasSupabaseCredentials) {
        try {
          await supabase
            .from("prompts")
            .update({ likes: promptItem.likes + 1 })
            .eq("id", id);
        } catch (err) {
          console.error("Failed to increment likes in Supabase", err);
        }
      }
    }

    setFavorites(updated);
    try {
      localStorage.setItem("appprompthub_favorites", JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to save favorites", err);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      triggerToast("Please enter a valid email address.");
      return;
    }

    setIsSubscribing(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsSubscribed(true);
        localStorage.setItem("appprompthub_sub_status", "true");
        triggerToast("Thanks for subscribing!");
        setNewsletterEmail("");
      } else {
        triggerToast(data.error || "Subscription failed.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Failed to connect to subscription server.");
    } finally {
      setIsSubscribing(false);
    }
  };

  // Exporters for the Custom Constructor Builder
  const handleSaveBuiltToWorkspace = () => {
    const title = builderMode === "webapp" 
      ? `Web App: ${appSubject.slice(0, 35)}...` 
      : builderMode === "image" 
      ? `Midjourney: ${builderSubject.slice(0, 35)}...`
      : `Persona: ${personaName}`;
      
    const targetAI = builderMode === "webapp" 
      ? "ChatGPT / Claude" 
      : builderMode === "image" 
      ? "Midjourney v6"
      : "Claude System";

    const newTemplate: CustomUserPrompt = {
      id: `custom-built-${Date.now()}`,
      title,
      targetAI,
      promptText: generatedPrompt,
      date: new Date().toISOString().split("T")[0]
    };
    
    const updated = [newTemplate, ...userCustomPrompts];
    setUserCustomPrompts(updated);
    localStorage.setItem("appprompthub_custom_prompts", JSON.stringify(updated));
    triggerToast("Saved custom template to your Workspace!");
  };

  const handleDownloadMarkdown = () => {
    const title = builderMode === "webapp" 
      ? `Web App - ${appSubject.slice(0, 30)}` 
      : builderMode === "image"
      ? `Midjourney - ${builderSubject.slice(0, 30)}`
      : `Persona - ${personaName}`;
      
    const targetAI = builderMode === "webapp" 
      ? "ChatGPT / Claude" 
      : builderMode === "image" 
      ? "Midjourney v6"
      : "Claude System";

    const mdContent = `# ${title}\n\n## Target AI\n${targetAI}\n\n## Prompt Code\n\`\`\`\n${generatedPrompt}\n\`\`\`\n\n*Generated via AppPromptHub Custom Builder on ${new Date().toLocaleDateString()}*`;
    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Downloaded Markdown file!");
  };

  const handleCopyAsJSON = () => {
    const title = builderMode === "webapp" 
      ? `Web App: ${appSubject.slice(0, 35)}...` 
      : builderMode === "image" 
      ? `Midjourney: ${builderSubject.slice(0, 35)}...`
      : `Persona: ${personaName}`;
      
    const targetAI = builderMode === "webapp" 
      ? "ChatGPT / Claude" 
      : builderMode === "image" 
      ? "Midjourney v6"
      : "Claude System";

    const obj = {
      title,
      targetAI,
      prompt: generatedPrompt,
      generatedAt: new Date().toISOString()
    };
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2)).then(() => {
      triggerToast("Copied JSON payload!");
    });
  };

  // Toast Trigger Helper
  const triggerToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // View Details Modal & views count increment
  const handleViewDetails = async (prompt: PromptItem) => {
    setSelectedPrompt(prompt);

    // Increment locally in state immediately
    setPrompts((prev) =>
      prev.map((p) => (p.id === prompt.id ? { ...p, views: p.views + 1 } : p))
    );

    // Increment views column in Supabase table
    if (hasSupabaseCredentials) {
      try {
        await supabase
          .from("prompts")
          .update({ views: prompt.views + 1 })
          .eq("id", prompt.id);
      } catch (err) {
        console.error("Failed to increment views in Supabase", err);
      }
    }
  };

  // Newsletter Submission API call (Option 3 Setup)
  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const emailInput = e.currentTarget.elements.namedItem("email") as HTMLInputElement;
    const email = emailInput?.value || "";

    if (!email) return;

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        triggerToast(data.error || "Subscription failed.");
      } else {
        triggerToast(data.message || "Successfully subscribed!");
        setIsSubscribed(true);
        localStorage.setItem("appprompthub_sub_status", "true");
        emailInput.value = ""; // clear input field
      }
    } catch (err) {
      console.error("Newsletter submission connection error:", err);
      triggerToast("Connection error. Could not register email.");
    }
  };

  // Copy helper with activity log appending
  const handleCopy = (text: string, title: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      triggerToast("Prompt copied to clipboard!");

      // Append to copy history log
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newHistoryItem: CopyHistoryItem = {
        id: `h-${Date.now()}`,
        title,
        timestamp: timeStr
      };
      
      const updatedHistory = [newHistoryItem, ...copyHistory.slice(0, 4)];
      setCopyHistory(updatedHistory);
      localStorage.setItem("appprompthub_copy_history", JSON.stringify(updatedHistory));

      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    });
  };

  // USER AUTHENTICATION HANDLERS
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      triggerToast("Please enter email and password.");
      return;
    }

    setAuthLoading(true);
    try {
      if (authMode === "register") {
        if (hasSupabaseCredentials) {
          const { error } = await supabase.auth.signUp({
            email: authEmail,
            password: authPassword
          });
          if (error) throw error;
          triggerToast("Registration complete! Check your email for validation.");
        } else {
          // Sandbox mock sign up
          const mockSession = { email: authEmail, id: `user-${Date.now()}` };
          setMockUser(mockSession);
          localStorage.setItem("appprompthub_mock_user", JSON.stringify(mockSession));
          triggerToast("Successfully registered in Sandbox Mock Mode!");
        }
      } else {
        // Mode is Login
        if (hasSupabaseCredentials) {
          const { error } = await supabase.auth.signInWithPassword({
            email: authEmail,
            password: authPassword
          });
          if (error) throw error;
          triggerToast("Welcome back! Logged in.");
        } else {
          // Sandbox mock login
          const mockSession = { email: authEmail, id: `user-${Date.now()}` };
          setMockUser(mockSession);
          localStorage.setItem("appprompthub_mock_user", JSON.stringify(mockSession));
          triggerToast("Successfully logged in in Sandbox Mock Mode!");
        }
      }
      // Reset inputs
      setAuthEmail("");
      setAuthPassword("");
    } catch (err: any) {
      console.error("[User Auth Error]", err);
      triggerToast(err.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (hasSupabaseCredentials) {
      await supabase.auth.signOut();
    } else {
      setMockUser(null);
      localStorage.removeItem("appprompthub_mock_user");
    }
    triggerToast("Signed out successfully.");
  };

  // USER WORKSPACE: CUSTOM PERSONAL PROMPTS ACTIONS
  const openCustomModal = (item: CustomUserPrompt | null = null) => {
    if (item) {
      setEditingCustom(item);
      setCustomForm({
        title: item.title,
        targetAI: item.targetAI,
        promptText: item.promptText
      });
    } else {
      setEditingCustom(null);
      setCustomForm({
        title: "",
        targetAI: "Claude 3.5 Sonnet",
        promptText: ""
      });
    }
    setIsCustomModalOpen(true);
  };

  const handleCustomPromptSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customForm.title || !customForm.promptText) {
      triggerToast("Please fill in all fields.");
      return;
    }

    let updatedList: CustomUserPrompt[];
    if (editingCustom) {
      const updatedItem: CustomUserPrompt = {
        ...editingCustom,
        title: customForm.title,
        targetAI: customForm.targetAI,
        promptText: customForm.promptText
      };
      updatedList = userCustomPrompts.map((item) => (item.id === editingCustom.id ? updatedItem : item));
      triggerToast("Personal template updated!");
    } else {
      const newItem: CustomUserPrompt = {
        id: `custom-${Date.now()}`,
        title: customForm.title,
        targetAI: customForm.targetAI,
        promptText: customForm.promptText,
        date: new Date().toISOString().split("T")[0]
      };
      updatedList = [newItem, ...userCustomPrompts];
      triggerToast("Personal template saved to workspace shelf!");
    }

    setUserCustomPrompts(updatedList);
    localStorage.setItem("appprompthub_custom_prompts", JSON.stringify(updatedList));
    setIsCustomModalOpen(false);
  };

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitForm.title || !submitForm.promptText) {
      triggerToast("Please fill in title and prompt instructions.");
      return;
    }

    setSubmitLoading(true);

    try {
      const promptId = `pr-${Date.now()}`;
      const slug = submitForm.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const today = new Date().toISOString().split("T")[0];

      if (!hasSupabaseCredentials) {
        // Mock Sandbox submission persistence
        const mockSubmissions = JSON.parse(localStorage.getItem("appprompthub_mock_submissions") || "[]");
        const newMockSubmission = {
          id: promptId,
          slug,
          title: submitForm.title,
          description: submitForm.description,
          category: submitForm.category,
          targetAI: submitForm.targetAI,
          promptText: submitForm.promptText,
          outputDescription: submitForm.outputDescription,
          difficulty: submitForm.difficulty,
          date: today,
          status: "pending",
          source: "community",
          submittedBy: activeUser?.id || "mock-user"
        };
        localStorage.setItem("appprompthub_mock_submissions", JSON.stringify([newMockSubmission, ...mockSubmissions]));
        
        triggerToast("Prompt recipe submitted to moderator queue!");
        
        setIsSubmitModalOpen(false);
        setSubmitForm({
          title: "",
          description: "",
          category: "web-app",
          targetAI: "Claude 3.5 Sonnet",
          promptText: "",
          outputDescription: "",
          difficulty: "Intermediate",
        });
        loadSubmissions();
        return;
      }

      const { error } = await supabase.from("prompts").insert({
        id: promptId,
        slug,
        title: submitForm.title,
        description: submitForm.description,
        category: submitForm.category,
        target_ai: submitForm.targetAI,
        prompt_text: submitForm.promptText,
        output_description: submitForm.outputDescription,
        difficulty: submitForm.difficulty,
        date: today,
        status: "pending",
        source: "community",
        submitted_by: activeUser.id
      });

      if (error) throw error;

      triggerToast("Prompt recipe submitted to moderator queue!");

      setIsSubmitModalOpen(false);
      setSubmitForm({
        title: "",
        description: "",
        category: "web-app",
        targetAI: "Claude 3.5 Sonnet",
        promptText: "",
        outputDescription: "",
        difficulty: "Intermediate",
      });
      loadSubmissions();
    } catch (err: unknown) {
      console.error(err);
      triggerToast(err instanceof Error ? err.message : "Failed to submit prompt.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCustomPromptDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this custom template?")) return;
    const updated = userCustomPrompts.filter((item) => item.id !== id);
    setUserCustomPrompts(updated);
    localStorage.setItem("appprompthub_custom_prompts", JSON.stringify(updated));
    triggerToast("Template deleted.");
  };

  // Helper for brand gradients and colors based on the target AI
  const getBrandTheme = (targetAI: string) => {
    const ai = targetAI.toLowerCase();
    if (ai.includes("claude")) {
      return {
        gradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        color: "#c084fc"
      };
    }
    if (ai.includes("chatgpt") || ai.includes("gpt")) {
      return {
        gradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
        color: "#34d399"
      };
    }
    if (ai.includes("midjourney")) {
      return {
        gradient: "linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)",
        color: "#60a5fa"
      };
    }
    if (ai.includes("stable diffusion")) {
      return {
        gradient: "linear-gradient(135deg, #db2777 0%, #f43f5e 100%)",
        color: "#fb7185"
      };
    }
    return {
      gradient: "linear-gradient(135deg, #1f2937 0%, #4b5563 100%)",
      color: "#cbd5e1"
    };
  };

  // Filtered prompts list
  const filteredPrompts = useMemo(() => {
    let result = prompts.filter((prompt) => {
      const matchesCategory =
        categoryFilter === "all" || prompt.category === categoryFilter;

      const matchesSearch =
        prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.targetAI.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesModel =
        modelFilter === "all" ||
        prompt.targetAI.toLowerCase().includes(modelFilter.toLowerCase());

      const matchesDifficulty =
        difficultyFilter === "all" ||
        prompt.difficulty.toLowerCase() === difficultyFilter.toLowerCase();

      const matchesFavorites = !showFavoritesOnly || favorites.includes(prompt.id);

      return matchesCategory && matchesSearch && matchesModel && matchesDifficulty && matchesFavorites;
    });

    return result.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === "likes") return b.likes - a.likes;
      return b.views - a.views;
    });
  }, [prompts, searchQuery, categoryFilter, sortBy, modelFilter, difficultyFilter, showFavoritesOnly, favorites]);

  // Bookmarked shelf view list
  const bookmarkedPrompts = useMemo(() => {
    return prompts.filter((p) => favorites.includes(p.id));
  }, [prompts, favorites]);

  // Prompt Builder States (Multi-mode Builder)
  const [builderMode, setBuilderMode] = useState<"image" | "webapp" | "persona">("webapp");

  // Mode 1: Image Builder States
  const [builderSubject, setBuilderSubject] = useState("A mysterious wizard tower on top of a floating island");
  const [builderStyle, setBuilderStyle] = useState("cinematic");
  const [builderLighting, setBuilderLighting] = useState("neon glow");
  const [builderAspectRatio, setBuilderAspectRatio] = useState("16:9");
  const [builderWeight, setBuilderWeight] = useState("medium");

  // Mode 2: Web App Builder States
  const [appSubject, setAppSubject] = useState("A secure Stripe subscription checkout payment flow");
  const [appFramework, setAppFramework] = useState("Next.js App Router");
  const [appStyling, setAppStyling] = useState("Tailwind CSS");
  const [appComponent, setAppComponent] = useState("API endpoints + React state hooks client page");
  const [appComplexity, setAppComplexity] = useState("Production-grade, including secure webhook signatures validation");

  // Mode 3: System Persona Creator Builder States
  const [personaName, setPersonaName] = useState("Senior Technical Architect");
  const [personaTone, setPersonaTone] = useState("analytical, educational, direct");
  const [personaRole, setPersonaRole] = useState("Reviewing code quality, identifying performance bottlenecks, and writing unit tests");
  const [personaOutput, setPersonaOutput] = useState("A clean code refactor, step-by-step optimization explanations, and 3 unit test suites");

  // State to trigger highlight/flicker animation on builder output changes
  const [builderFlicker, setBuilderFlicker] = useState(false);

  // Dynamically generated builder prompt
  const generatedPrompt = useMemo(() => {
    if (builderMode === "image") {
      const styleDescriptions: Record<string, string> = {
        cinematic: "cinematic shot, shot on 35mm lens, f/1.8, high-fidelity film grain",
        cyberpunk: "futuristic cyberpunk aesthetic, highly detailed tech components, holographic accents",
        photorealistic: "photorealistic render, hyper-detailed textures, unreal engine 5 render, raytraced reflection",
        anime: "modern anime aesthetic, vibrant keys, detailed line art, makoto shinkai style",
        "3d-render": "isometric 3D render, clay modeling style, clean pastel color palette, soft shadows",
        "oil-painting": "textured oil painting, heavy brush strokes, classical fine art styling, rich pigments"
      };

      const styleStr = styleDescriptions[builderStyle] || `${builderStyle} style`;
      const weightStr =
        builderWeight === "low"
          ? "--stylize 100"
          : builderWeight === "high"
          ? "--stylize 750"
          : "--stylize 250";

      return `${builderSubject}, ${styleStr}, ${builderLighting} lighting, aspect ratio ${builderAspectRatio} ${weightStr} --v 6.0`;
    } else if (builderMode === "persona") {
      return `You are an expert AI assistant specialized in acting as a: "${personaName}"

Tone and Style Instructions:
- Adopt a communication tone that is: ${personaTone}
- Write in a highly structured, clear format and directly address goals without extra conversational filler.

Primary Objectives and Responsibilities:
- Your core duties are: "${personaRole}"

Output Guidelines and Formats:
- Deliver outputs structured precisely as: ${personaOutput}
- Focus on accuracy, depth, and actionable details.

Begin execution.`;
    } else {
      return `// Target Architecture: ${appFramework}
// Design and Styling: ${appStyling}
// Layout Components: ${appComponent}
// Requirements and Features:
// 1. Build a functional component for: "${appSubject}"
// 2. Performance and Standards: ${appComplexity}
// 3. Ensure proper typescript definitions, clean state bindings, and correct event handlers.

Write clean, modular code following standard structures. Include inline documentation.`;
    }
  }, [
    builderMode,
    builderSubject,
    builderStyle,
    builderLighting,
    builderAspectRatio,
    builderWeight,
    appSubject,
    appFramework,
    appStyling,
    appComponent,
    appComplexity,
    personaName,
    personaTone,
    personaRole,
    personaOutput
  ]);

  useEffect(() => {
    setBuilderFlicker(true);
    const timer = setTimeout(() => setBuilderFlicker(false), 200);
    return () => clearTimeout(timer);
  }, [
    builderMode,
    builderSubject,
    builderStyle,
    builderLighting,
    builderAspectRatio,
    builderWeight,
    appSubject,
    appFramework,
    appStyling,
    appComponent,
    appComplexity,
    personaName,
    personaTone,
    personaRole,
    personaOutput
  ]);

  return (
    <div className="app-shell">
      
      {/* Toast Notification */}
      <div className={`toast-notification ${showToast ? "toast-notification--show" : ""}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: "0.4rem" }}><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>{toastMessage}</span>
      </div>

      {/* Header */}
      <SiteHeader
        activeUser={activeUser}
        activeNav={activeTab}
        onSignOut={handleSignOut}
      />

      {/* Main Grid */}
      <main className="main-content">
        
        {/* Hero Section - ONLY rendered on Explore tab */}
        {activeTab === "explore" && (
          <section className="hero-section">
            <div className="hero-section__badge">✨ Curated AI Prompts Database</div>
            <h1 className="hero-section__title">
              The Ultimate Hub for <span>Production AI Prompts</span>
            </h1>
            <p className="hero-section__subtitle">
              Free developer-curated library of prompts for full web apps, blogs, and cinematic images. Customize, copy, and launch in seconds.
            </p>
            
            {/* Hero stats reframing to build trust */}
            <div className="stats-glass-bar">
              <div className="hero-stats__item">
                <span className="hero-stats__value">150+</span>
                <span className="hero-stats__label">Curated Prompts</span>
              </div>
              <div className="hero-stats__divider" />
              <div className="hero-stats__item">
                <span className="hero-stats__value">Daily</span>
                <span className="hero-stats__label">Release Radar</span>
              </div>
              <div className="hero-stats__divider" />
              <div className="hero-stats__item">
                <span className="hero-stats__value">Open Source</span>
                <span className="hero-stats__label">&amp; Free</span>
              </div>
            </div>
          </section>
        )}

        {/* Tab Selection removed to keep pages separated */}

        {/* Main Content Area */}
        <div className="tabs-container">
          
          {/* EXPLORE LIBRARY TAB (SIMPLE LANDING GRID ON HOME ROUTE) */}
          {activeTab === "explore" && (
            <div className="container-width">
              
              {/* Category Pills & Keyword Search */}
              <div className="filter-bar">
                <div className="filter-categories">
                  {(["all", "web-app", "blog", "image-gen"] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setCategoryFilter(cat); setVisibleCount(6); }}
                      className={`filter-btn ${categoryFilter === cat ? "filter-btn--active" : ""}`}
                    >
                      {cat === "all" ? "All Prompts" : cat === "web-app" ? "Web Apps" : cat === "blog" ? "Web Content" : "Image Gen"}
                    </button>
                  ))}
                  
                  {/* Bookmarked toggle button */}
                  <button
                    onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setVisibleCount(6); }}
                    className={`filter-btn ${showFavoritesOnly ? "filter-btn--active" : ""}`}
                    style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill={showFavoritesOnly ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    Bookmarks ({favorites.length})
                  </button>
                </div>

                <div className="search-input-wrapper">
                  <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input
                    type="text"
                    placeholder="Search prompts, models..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(6); }}
                    className="search-input"
                    aria-label="Search prompt database"
                  />
                </div>
              </div>

              {/* Advanced Controls Dropdowns */}
              <div className="advanced-controls-bar">
                <div className="control-group">
                  <label htmlFor="model-select">AI Platform:</label>
                  <select
                    id="model-select"
                    value={modelFilter}
                    onChange={(e) => { setModelFilter(e.target.value); setVisibleCount(6); }}
                    className="control-select"
                  >
                    <option value="all">All Platforms</option>
                    <option value="claude">Claude</option>
                    <option value="gpt">GPT / ChatGPT</option>
                    <option value="midjourney">Midjourney</option>
                    <option value="stable">Stable Diffusion</option>
                    <option value="v0">v0 by Vercel</option>
                  </select>
                </div>

                <div className="control-group">
                  <label htmlFor="difficulty-select">Complexity Level:</label>
                  <select
                    id="difficulty-select"
                    value={difficultyFilter}
                    onChange={(e) => { setDifficultyFilter(e.target.value); setVisibleCount(6); }}
                    className="control-select"
                  >
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="control-group">
                  <label htmlFor="sort-select">Sort By:</label>
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="control-select"
                  >
                    <option value="popular">Most Popular (Views)</option>
                    <option value="likes">Most Upvoted (Likes)</option>
                    <option value="newest">Newest Releases</option>
                  </select>
                </div>
              </div>

              {/* Grid loading status */}
              {dbLoading && (
                <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  <span>Connecting to Supabase...</span>
                </div>
              )}

              {/* Grid */}
              {filteredPrompts.length > 0 ? (
                <>
                  <div className="prompt-grid">
                    {filteredPrompts.slice(0, visibleCount).map((prompt) => {
                      const theme = getBrandTheme(prompt.targetAI);
                      const isFavorited = favorites.includes(prompt.id);
                      return (
                        <div
                          key={prompt.id}
                          className="prompt-card"
                          style={{ "--brand-color": theme.color } as React.CSSProperties}
                        >
                          <div
                            className="prompt-card__banner"
                            style={{ background: theme.gradient }}
                          >
                            <div className="blueprint-overlay" />
                            <div className="prompt-card__header">
                              <span className="prompt-card__badge-ai">{prompt.targetAI}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <button
                                  onClick={(e) => toggleFavorite(prompt.id, e)}
                                  className="prompt-card__favorite-btn"
                                  aria-label="Bookmark prompt"
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill={isFavorited ? theme.color : "none"} stroke={isFavorited ? theme.color : "currentColor"} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                </button>
                                <span className={`prompt-card__difficulty difficulty--${prompt.difficulty.toLowerCase()}`}>
                                  {prompt.difficulty}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="prompt-card__body">
                            <h3 className="prompt-card__title">{prompt.title}</h3>
                            <p className="prompt-card__desc">{prompt.description}</p>
                            
                            <div className="prompt-card__actions">
                              <button
                                onClick={() => handleCopy(prompt.promptText, prompt.title, prompt.id)}
                                className={`prompt-btn--copy ${copiedId === prompt.id ? "prompt-btn--copy-success" : ""}`}
                              >
                                {copiedId === prompt.id ? "Copied!" : "Copy Prompt"}
                              </button>
                              <Link
                                href={`/prompt/${prompt.slug}`}
                                className="prompt-btn--details"
                                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                              >
                                Details
                              </Link>
                            </div>
                          </div>
                          
                          <div className="prompt-card__footer">
                            <div className="prompt-card__metrics">
                              <span className="prompt-card__metric-item">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                {prompt.views}
                              </span>
                              <span className="prompt-card__metric-item">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                {prompt.likes}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid-pagination-box">
                    {visibleCount < filteredPrompts.length ? (
                      <button
                        onClick={() => setVisibleCount(visibleCount + 6)}
                        className="load-more-btn"
                      >
                        Load More Prompts
                      </button>
                    ) : (
                      <p className="caught-up-message">
                        ⚡ You've viewed all prompts. For the full multi-page searchable library, click "Explore" at the top!
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-secondary)" }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: "1rem", opacity: 0.5 }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <p>No prompts match the active filters or keyword "{searchQuery}".</p>
                </div>
              )}
            </div>
          )}

          {/* INTERACTIVE BUILDER TAB */}
          {activeTab === "builder" && (
            <div className="container-width">
              
              <div className="builder-mode-selectors">
                <button
                  onClick={() => setBuilderMode("webapp")}
                  className={`builder-mode-btn ${builderMode === "webapp" ? "builder-mode-btn--active" : ""}`}
                >
                  💻 Web App Prompt Constructor
                </button>
                <button
                  onClick={() => setBuilderMode("image")}
                  className={`builder-mode-btn ${builderMode === "image" ? "builder-mode-btn--active" : ""}`}
                >
                  🎨 Midjourney Image Prompt Constructor
                </button>
              </div>

              <div className="builder-panel">
                
                {/* Form Controls */}
                {builderMode === "webapp" ? (
                  <div className="builder-form">
                    <div>
                      <h2 className="builder-form__title">Web App Constructor</h2>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        Assemble structured, production-grade prompts for components and backend endpoints.
                      </p>
                    </div>

                    <div className="builder-field">
                      <label className="builder-field__label">Application Feature</label>
                      <input
                        type="text"
                        className="builder-input"
                        value={appSubject}
                        onChange={(e) => setAppSubject(e.target.value)}
                        placeholder="e.g. A secure Stripe subscription checkout flow"
                      />
                    </div>

                    <div className="builder-field">
                      <label className="builder-field__label">Framework Environment</label>
                      <select
                        className="builder-select"
                        value={appFramework}
                        onChange={(e) => setAppFramework(e.target.value)}
                      >
                        <option value="Next.js App Router">Next.js App Router (React)</option>
                        <option value="React Vite SPA">React SPA (Vite + Router)</option>
                        <option value="Node.js Express API">Node.js API (Express)</option>
                        <option value="Vue 3 Nuxt">Vue 3 (Nuxt 3)</option>
                      </select>
                    </div>

                    <div className="builder-field">
                      <label className="builder-field__label">Styling System</label>
                      <select
                        className="builder-select"
                        value={appStyling}
                        onChange={(e) => setAppStyling(e.target.value)}
                      >
                        <option value="Tailwind CSS">Tailwind CSS (Utility-first)</option>
                        <option value="Vanilla CSS Modules">Vanilla CSS Modules (Modular)</option>
                        <option value="Styled Components">CSS-in-JS (Styled Components)</option>
                        <option value="Unstyled HTML5 (Semantic)">Pure HTML5 Semantic (Unstyled)</option>
                      </select>
                    </div>

                    <div className="builder-field">
                      <label className="builder-field__label">Target Components</label>
                      <select
                        className="builder-select"
                        value={appComponent}
                        onChange={(e) => setAppComponent(e.target.value)}
                      >
                        <option value="Full-stack client page and backend endpoints">API Endpoints + Client State Layout</option>
                        <option value="Reusable client component with mock state validation">Client-only Component (Props & Hooks)</option>
                        <option value="Pure database routing controller & typescript models">Backend Router (Schema & Logic)</option>
                      </select>
                    </div>

                    <div className="builder-field">
                      <label className="builder-field__label">Constraints & Complexity</label>
                      <input
                        type="text"
                        className="builder-input"
                        value={appComplexity}
                        onChange={(e) => setAppComplexity(e.target.value)}
                        placeholder="e.g. Including Stripe webhook verification and database logs"
                      />
                    </div>
                  </div>
                ) : builderMode === "image" ? (
                  <div className="builder-form">
                    <div>
                      <h2 className="builder-form__title">Midjourney Constructor</h2>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        Assemble studio-grade Midjourney parameters for custom artwork generation.
                      </p>
                    </div>

                    <div className="builder-field">
                      <label className="builder-field__label">Art Subject</label>
                      <input
                        type="text"
                        className="builder-input"
                        value={builderSubject}
                        onChange={(e) => setBuilderSubject(e.target.value)}
                        placeholder="e.g. A cybernetic owl perched on a servers rack"
                      />
                    </div>

                    <div className="builder-field">
                      <label className="builder-field__label">Artistic Style</label>
                      <div className="style-grid">
                        {["cinematic", "cyberpunk", "photorealistic", "anime", "3d-render", "oil-painting"].map((style) => (
                          <button
                            key={style}
                            onClick={() => setBuilderStyle(style)}
                            className={`style-chip ${builderStyle === style ? "style-chip--active" : ""}`}
                          >
                            {style.charAt(0).toUpperCase() + style.slice(1).replace("-", " ")}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="builder-field">
                      <label className="builder-field__label">Lighting Preset</label>
                      <select
                        className="builder-select"
                        value={builderLighting}
                        onChange={(e) => setBuilderLighting(e.target.value)}
                      >
                        <option value="neon glow">Cyberpunk Neon Glow</option>
                        <option value="golden hour">Golden Hour (Soft & Warm)</option>
                        <option value="studio lighting">High-End Studio Softbox</option>
                        <option value="dramatic shadows">Moody Film Noir (Dramatic Shadows)</option>
                        <option value="volumetric haze">Volumetric Haze (Misty & Deep)</option>
                        <option value="bioluminescent">Bioluminescent Deep Sea Glow</option>
                      </select>
                    </div>

                    <div className="builder-field">
                      <label className="builder-field__label">Aspect Ratio</label>
                      <select
                        className="builder-select"
                        value={builderAspectRatio}
                        onChange={(e) => setBuilderAspectRatio(e.target.value)}
                      >
                        <option value="16:9">Widescreen Landscape (16:9)</option>
                        <option value="1:1">Square Post (1:1)</option>
                        <option value="9:16">Vertical Mobile Shot (9:16)</option>
                        <option value="4:3">Classic Photography (4:3)</option>
                      </select>
                    </div>

                    <div className="builder-field">
                      <label className="builder-field__label">Model Stylization Weight</label>
                      <select
                        className="builder-select"
                        value={builderWeight}
                        onChange={(e) => setBuilderWeight(e.target.value)}
                      >
                        <option value="low">Subtle (Allows subject detail - --s 100)</option>
                        <option value="medium">Balanced (Artistic blend - --s 250)</option>
                        <option value="high">Maximum Style (Creative liberty - --s 750)</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="builder-form">
                    <div>
                      <h2 className="builder-form__title">AI Persona Constructor</h2>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        Design structured AI system prompts and customized agent role instructions.
                      </p>
                    </div>

                    <div className="builder-field">
                      <label className="builder-field__label">Agent Persona Name</label>
                      <input
                        type="text"
                        className="builder-input"
                        value={personaName}
                        onChange={(e) => setPersonaName(e.target.value)}
                        placeholder="e.g. Senior Technical Architect"
                      />
                    </div>

                    <div className="builder-field">
                      <label className="builder-field__label">Communication Tone</label>
                      <input
                        type="text"
                        className="builder-input"
                        value={personaTone}
                        onChange={(e) => setPersonaTone(e.target.value)}
                        placeholder="e.g. analytical, educational, direct"
                      />
                    </div>

                    <div className="builder-field">
                      <label className="builder-field__label">Core Objectives / Persona Role</label>
                      <textarea
                        className="builder-input"
                        style={{ minHeight: "80px", resize: "vertical" }}
                        value={personaRole}
                        onChange={(e) => setPersonaRole(e.target.value)}
                        placeholder="e.g. Reviewing code quality, identifying performance bottlenecks, and writing unit tests..."
                      />
                    </div>

                    <div className="builder-field">
                      <label className="builder-field__label">Target Outputs & Delivery Guidelines</label>
                      <input
                        type="text"
                        className="builder-input"
                        value={personaOutput}
                        onChange={(e) => setPersonaOutput(e.target.value)}
                        placeholder="e.g. A clean code refactor, step-by-step explanations, and unit tests"
                      />
                    </div>
                  </div>
                )}

                {/* Preview / Code Output */}
                <div className="builder-preview">
                  <div className="builder-preview__header">
                    <h3 className="builder-preview__title">Compiled Prompt Output</h3>
                    <span className="prompt-card__badge-ai">
                      {builderMode === "webapp" ? "Next.js / GPT-4" : builderMode === "image" ? "Midjourney v6" : "System / Claude"}
                    </span>
                  </div>

                  <div className={`prompt-output-box ${builderFlicker ? "prompt-output-box--flicker" : ""}`}>
                    {generatedPrompt}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "1rem" }}>
                    <button
                      onClick={() => handleCopy(generatedPrompt, "Custom Built Prompt", "builder")}
                      className="action-btn-large"
                      style={{ width: "100%" }}
                      aria-label="Copy built prompt to clipboard"
                    >
                      {copiedId === "builder" ? (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" color="var(--accent-green)" style={{ marginRight: "0.3rem" }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                          Copied to Clipboard!
                        </>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: "0.3rem" }}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                          Copy Generated Prompt
                        </>
                      )}
                    </button>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                      <button
                        onClick={handleSaveBuiltToWorkspace}
                        className="prompt-btn--details"
                        style={{ padding: "0.65rem 0.5rem", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", fontWeight: "700" }}
                        title="Save this template to your workspace shelf"
                      >
                        ⭐ Save Workspace
                      </button>
                      <button
                        onClick={handleDownloadMarkdown}
                        className="prompt-btn--details"
                        style={{ padding: "0.65rem 0.5rem", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", fontWeight: "700" }}
                        title="Download prompt code as Markdown file"
                      >
                        ⬇️ Download MD
                      </button>
                      <button
                        onClick={handleCopyAsJSON}
                        className="prompt-btn--details"
                        style={{ padding: "0.65rem 0.5rem", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", fontWeight: "700" }}
                        title="Copy structured JSON payload"
                      >
                        📦 Copy JSON
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NEWS TAB (AI RELEASE RADAR) */}
          {activeTab === "news" && (
            <div className="container-width">
              <div className="news-timeline-container">
                
                <div className="news-timeline-info">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, color: "var(--accent-purple)" }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  <span>⚡ <strong>AI Release Radar:</strong> Beta timeline tracking model upgrades, API pricing changes, and framework releases.</span>
                </div>

                <div className="news-timeline">
                  {news.map((newsItem) => {
                    const isExpanded = expandedNewsId === newsItem.id;
                    return (
                      <div key={newsItem.id} className="news-card">
                        <div className="news-card__header">
                          <div className="news-card__meta">
                            <span className="news-card__badge">{newsItem.category}</span>
                            <span className="news-card__date">{newsItem.date}</span>
                          </div>
                          <span className={`news-card__importance-badge importance--${newsItem.importance}`}>
                            {newsItem.importance} priority
                          </span>
                        </div>
                        <h3 className="news-card__title">{newsItem.title}</h3>
                        <p className="news-card__summary">{newsItem.summary}</p>
                        
                        {isExpanded ? (
                          <div className="news-card__content">
                            <p style={{ marginBottom: "1rem" }}>{newsItem.content}</p>
                            {newsItem.sourceUrl && (
                              <a
                                href={newsItem.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "var(--accent-blue)", fontSize: "0.85rem", textDecoration: "underline" }}
                                aria-label={`Read official announcement for ${newsItem.title}`}
                              >
                                View Official Source
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                              </a>
                            )}
                          </div>
                        ) : null}

                        <button
                          onClick={() => setExpandedNewsId(isExpanded ? null : newsItem.id)}
                          className="news-card__read-more"
                          aria-label={isExpanded ? "Collapse news story content" : "Expand news story content"}
                        >
                          <span>{isExpanded ? "Show Less" : "Read full coverage"}</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* USER WORKSPACE TAB (USER DASHBOARD WITH AUTH LOCK) */}
          {activeTab === "workspace" && (
            !activeUser ? (
              <div className="container-width" style={{ display: "flex", justifyContent: "center", padding: "4rem 0" }}>
                
                {/* Visual Glassmorphic Auth Form Card */}
                <div className="login-card" style={{ maxWidth: "450px", width: "100%", background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "2.5rem", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)" }}>
                  <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <h2 style={{ fontSize: "1.45rem", fontWeight: "700", letterSpacing: "-0.02em", color: "#fff", marginBottom: "0.5rem" }}>
                      {authMode === "login" ? "Sign In to Workspace" : "Create Personal Account"}
                    </h2>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      {authMode === "login" 
                        ? "Log in to access your saved prompt bookmarks, history, and custom templates."
                        : "Register a free account to unlock your personal workspace shelf."}
                    </p>
                  </div>

                  <form onSubmit={handleAuthSubmit} className="admin-form">
                    <div className="builder-field">
                      <label className="builder-field__label">Email Address</label>
                      <input
                        type="email"
                        className="builder-input"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                      />
                    </div>

                    <div className="builder-field">
                      <label className="builder-field__label">Password</label>
                      <input
                        type="password"
                        className="builder-input"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    <button type="submit" className="action-btn-large" style={{ width: "100%", marginTop: "1rem" }} disabled={authLoading}>
                      {authLoading ? "Authenticating..." : authMode === "login" ? "Sign In" : "Register Account"}
                    </button>
                  </form>

                  <div style={{ textAlign: "center", marginTop: "1.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.25rem" }}>
                    <button 
                      onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                      style={{ background: "none", border: "none", color: "var(--accent-purple)", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer", textDecoration: "underline" }}
                    >
                      {authMode === "login" ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="container-width user-workspace-panel" style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "2.5rem" }}>
                
                {/* Left Column: saved shelf & custom templates */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
                  
                  {/* Active User Greeting Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-color)", padding: "1rem 1.5rem", borderRadius: "var(--radius-md)" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      👤 Logged in as: <strong style={{ color: "#fff" }}>{activeUser.email}</strong>
                    </span>
                    <button onClick={handleSignOut} className="table-action-delete" style={{ fontSize: "0.8rem", textDecoration: "underline" }}>
                      Sign Out
                    </button>
                  </div>

                  {/* 1. Bookmarked Prompts */}
                  <div>
                    <h2 style={{ fontSize: "1.35rem", fontWeight: "700", letterSpacing: "-0.02em", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      ⭐ My Saved Bookmarks ({bookmarkedPrompts.length})
                    </h2>

                    {bookmarkedPrompts.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {bookmarkedPrompts.map((prompt) => {
                          const theme = getBrandTheme(prompt.targetAI);
                          return (
                            <div key={prompt.id} className="workspace-saved-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1.5rem" }}>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                                  <span className="prompt-card__badge-ai" style={{ background: theme.color, color: "#000", fontWeight: "700" }}>{prompt.targetAI}</span>
                                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{prompt.category}</span>
                                </div>
                                <h3 style={{ fontSize: "1.05rem", fontWeight: "600", color: "#fff", marginBottom: "0.25rem" }}>{prompt.title}</h3>
                                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{prompt.description}</p>
                              </div>
                              <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                                <button onClick={() => handleCopy(prompt.promptText, prompt.title, `workspace-${prompt.id}`)} className="prompt-btn--copy" style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }}>
                                  {copiedId === `workspace-${prompt.id}` ? "Copied!" : "Copy"}
                                </button>
                                <button onClick={() => handleViewDetails(prompt)} className="prompt-btn--details" style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }}>
                                  Details
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ background: "rgba(255,255,255,0.01)", border: "1px dashed var(--border-color)", padding: "2.5rem 1.5rem", borderRadius: "var(--radius-md)", textAlign: "center", color: "var(--text-muted)" }}>
                        <p style={{ fontSize: "0.85rem" }}>No bookmarked prompts yet. Star cards in the library to save them here!</p>
                        <button onClick={() => setActiveTab("explore")} className="load-more-btn" style={{ marginTop: "1rem", fontSize: "0.75rem", padding: "0.5rem 1.25rem" }}>Browse Prompts</button>
                      </div>
                    )}
                  </div>

                  {/* 2. My Custom Templates Workspace */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                      <h2 style={{ fontSize: "1.35rem", fontWeight: "700", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        # My Custom Templates ({userCustomPrompts.length})
                      </h2>
                      <button onClick={() => openCustomModal()} className="load-more-btn" style={{ padding: "0.4rem 1rem", fontSize: "0.75rem", borderColor: "var(--accent-purple)", color: "var(--accent-purple)" }}>
                        + Add Template
                      </button>
                    </div>

                    {userCustomPrompts.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {userCustomPrompts.map((custom) => (
                          <div key={custom.id} className="workspace-saved-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                              <div>
                                <h3 style={{ fontSize: "1.05rem", fontWeight: "600", color: "#fff", marginBottom: "0.2rem" }}>{custom.title}</h3>
                                <span className="prompt-card__badge-ai" style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", background: "rgba(255,255,255,0.05)" }}>For: {custom.targetAI}</span>
                              </div>
                              <div style={{ display: "flex", gap: "0.3rem" }}>
                                <button onClick={() => handleCopy(custom.promptText, custom.title, custom.id)} className="prompt-btn--copy" style={{ padding: "0.35rem 0.7rem", fontSize: "0.7rem" }}>
                                  {copiedId === custom.id ? "Copied!" : "Copy"}
                                </button>
                                <button onClick={() => openCustomModal(custom)} className="prompt-btn--details" style={{ padding: "0.35rem 0.7rem", fontSize: "0.7rem" }}>
                                  Edit
                                </button>
                                <button onClick={() => handleCustomPromptDelete(custom.id)} className="prompt-btn--details" style={{ padding: "0.35rem 0.7rem", fontSize: "0.7rem", color: "var(--accent-red)" }}>
                                  Delete
                                </button>
                              </div>
                            </div>
                            <pre style={{ background: "#020202", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "4px", fontSize: "0.75rem", fontFamily: "monospace", whiteSpace: "pre-wrap", maxHeight: "100px", overflowY: "auto", color: "var(--text-secondary)" }}>
                              {custom.promptText}
                            </pre>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ background: "rgba(255,255,255,0.01)", border: "1px dashed var(--border-color)", padding: "2.5rem 1.5rem", borderRadius: "var(--radius-md)", textAlign: "center", color: "var(--text-muted)" }}>
                        <p style={{ fontSize: "0.85rem" }}>Create your own prompt templates and save them locally in your browser workspace.</p>
                        <button onClick={() => openCustomModal()} className="load-more-btn" style={{ marginTop: "1rem", fontSize: "0.75rem", padding: "0.5rem 1.25rem", borderColor: "var(--accent-purple)", color: "var(--accent-purple)" }}>Create First Template</button>
                      </div>
                    )}
                  </div>

                  {/* 3. My Community Submissions */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                      <h2 style={{ fontSize: "1.35rem", fontWeight: "700", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        ✉️ My Submissions ({mySubmissions.length})
                      </h2>
                      <button onClick={() => setIsSubmitModalOpen(true)} className="load-more-btn" style={{ padding: "0.4rem 1rem", fontSize: "0.75rem", borderColor: "var(--accent-purple)", color: "var(--accent-purple)" }}>
                        + Submit Prompt
                      </button>
                    </div>

                    {mySubmissions.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {mySubmissions.map((sub) => {
                          const statusColor = sub.status === "approved" ? "var(--accent-green)" : sub.status === "rejected" ? "var(--accent-red)" : "orange";
                          return (
                            <div key={sub.id} className="workspace-saved-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <h3 style={{ fontSize: "1.05rem", fontWeight: "600", color: "#fff", marginBottom: "0.25rem" }}>{sub.title}</h3>
                                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>Target: {sub.targetAI || sub.target_ai} | Category: {sub.category}</p>
                              </div>
                              <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: "3px", fontWeight: "700", border: `1px solid ${statusColor}`, color: statusColor, textTransform: "uppercase" }}>
                                {sub.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ background: "rgba(255,255,255,0.01)", border: "1px dashed var(--border-color)", padding: "2.5rem 1.5rem", borderRadius: "var(--radius-md)", textAlign: "center", color: "var(--text-muted)" }}>
                        <p style={{ fontSize: "0.85rem" }}>You haven't submitted any prompts to the community library yet.</p>
                        <button onClick={() => setIsSubmitModalOpen(true)} className="load-more-btn" style={{ marginTop: "1rem", fontSize: "0.75rem", padding: "0.5rem 1.25rem", borderColor: "var(--accent-purple)", color: "var(--accent-purple)" }}>Submit Your First Prompt</button>
                      </div>
                    )}
                  </div>

                </div>

                {/* Right Column: session history & subscriptions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                  
                  {/* 3. Workspace Stats Card */}
                  <div style={{ background: "linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)", border: "1px solid rgba(124, 58, 237, 0.15)", borderRadius: "var(--radius-md)", padding: "1.5rem" }}>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#fff", marginBottom: "1rem", letterSpacing: "0.02em" }}>WORKSPACE SUMMARY</h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Bookmarked Prompts</span>
                        <span style={{ fontWeight: "700", color: "var(--accent-purple)" }}>{favorites.length}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>My Custom Templates</span>
                        <span style={{ fontWeight: "700", color: "var(--accent-purple)" }}>{userCustomPrompts.length}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Submitted Prompts</span>
                        <span style={{ fontWeight: "700", color: "var(--accent-purple)" }}>{mySubmissions.length}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Recent Session Copies</span>
                        <span style={{ fontWeight: "700", color: "var(--accent-purple)" }}>{copyHistory.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Session Copy History log */}
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "1.5rem" }}>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#fff", marginBottom: "1rem", letterSpacing: "0.02em" }}>RECENT COPIED HISTORY</h3>
                    
                    {copyHistory.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {copyHistory.map((item) => (
                          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", borderBottom: "1px solid rgba(255,255,255,0.02)", paddingBottom: "0.4rem" }}>
                            <span style={{ color: "var(--text-primary)", fontWeight: "500", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "160px" }}>
                              📋 {item.title}
                            </span>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{item.timestamp}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Copy prompt keys in library to display history tracker.</p>
                    )}
                  </div>

                  {/* 5. Subscription Status Widget */}
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "1.5rem" }}>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#fff", marginBottom: "0.5rem", letterSpacing: "0.02em" }}>NEWSLETTER STATUS</h3>
                    
                    {isSubscribed ? (
                      <div style={{ color: "var(--accent-green)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.5rem" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span>Subscribed to Prompt Radar releases</span>
                      </div>
                    ) : (
                      <div>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>You are not yet registered to our release newsletter feed.</p>
                        <form onSubmit={handleSubscribe} style={{ display: "flex", gap: "0.3rem" }}>
                          <input
                            type="email"
                            className="newsletter-input"
                            placeholder="Your email address..."
                            value={newsletterEmail}
                            onChange={(e) => setNewsletterEmail(e.target.value)}
                            required
                            style={{ padding: "0.4rem 0.6rem", fontSize: "0.75rem", background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", flex: 1 }}
                          />
                          <button
                            type="submit"
                            className="newsletter-btn"
                            style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem", background: "var(--accent-purple)", color: "#000", fontWeight: "700", borderRadius: "var(--radius-sm)", cursor: "pointer" }}
                            disabled={isSubscribing}
                          >
                            {isSubscribing ? "..." : "Join"}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )
          )}

        </div>
      </main>

      {/* Modal View for Prompts */}
      {selectedPrompt && (
        <div className="modal-backdrop" onClick={() => setSelectedPrompt(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setSelectedPrompt(null)}
              aria-label="Close detailed info modal"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div className="modal__header">
              <div className="modal__meta">
                <span className="prompt-card__badge-ai">{selectedPrompt.targetAI}</span>
                <span className={`prompt-card__difficulty difficulty--${selectedPrompt.difficulty.toLowerCase()}`}>
                  {selectedPrompt.difficulty}
                </span>
              </div>
              <h2 className="modal__title">{selectedPrompt.title}</h2>
            </div>

            <h3 className="modal__section-title">Description</h3>
            <p className="modal__description">{selectedPrompt.description}</p>

            <h3 className="modal__section-title">Prompt Details</h3>
            <div className="modal__prompt-container">
              <pre className="modal__prompt-box">{selectedPrompt.promptText}</pre>
              <button
                className="modal__copy-btn"
                onClick={() => handleCopy(selectedPrompt.promptText, selectedPrompt.title, `modal-${selectedPrompt.id}`)}
                aria-label="Copy prompt content to clipboard"
                title="Copy Prompt"
              >
                {copiedId === `modal-${selectedPrompt.id}` ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" color="var(--accent-green)"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                )}
              </button>
            </div>

            <h3 className="modal__section-title">Expected Output Preview</h3>
            <div className="modal__output-box" style={{ marginBottom: "2rem" }}>
              {selectedPrompt.outputDescription}
            </div>

            {/* Modal Action Row containing a prominent Copy button */}
            <div className="modal__footer-actions" style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", borderTop: "1px solid var(--border-color)", paddingTop: "1.25rem" }}>
              <button
                onClick={() => handleCopy(selectedPrompt.promptText, selectedPrompt.title, `modal-footer-${selectedPrompt.id}`)}
                className="modal-footer-copy-btn"
                style={{
                  background: getBrandTheme(selectedPrompt.targetAI).color,
                  color: "#000",
                  padding: "0.6rem 1.25rem",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem"
                }}
                aria-label="Copy prompt from details"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                Copy Prompt Code
              </button>
              <button
                onClick={() => setSelectedPrompt(null)}
                className="prompt-btn--details"
                style={{ padding: "0.6rem 1.25rem" }}
                aria-label="Close details"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE / EDIT CUSTOM USER TEMPLATES */}
      {isCustomModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCustomModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <button className="modal-close-btn" onClick={() => setIsCustomModalOpen(false)}>&times;</button>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "1.5rem" }}>
              {editingCustom ? "Edit Personal Template" : "Create Personal Template"}
            </h2>

            <form onSubmit={handleCustomPromptSave} className="admin-form">
              <div className="builder-field">
                <label className="builder-field__label">Template Title</label>
                <input
                  type="text"
                  className="builder-input"
                  value={customForm.title}
                  onChange={(e) => setCustomForm({ ...customForm, title: e.target.value })}
                  placeholder="e.g. My Custom React Modal Prompt"
                  required
                />
              </div>

              <div className="builder-field">
                <label className="builder-field__label">Target AI Platform</label>
                <input
                  type="text"
                  className="builder-input"
                  value={customForm.targetAI}
                  onChange={(e) => setCustomForm({ ...customForm, targetAI: e.target.value })}
                  placeholder="e.g. Claude 3.5 / ChatGPT"
                  required
                />
              </div>

              <div className="builder-field">
                <label className="builder-field__label">Prompt Text</label>
                <textarea
                  className="builder-input"
                  style={{ minHeight: "150px", fontFamily: "monospace", fontSize: "0.8rem" }}
                  value={customForm.promptText}
                  onChange={(e) => setCustomForm({ ...customForm, promptText: e.target.value })}
                  placeholder="Act as a developer..."
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "2rem" }}>
                <button type="button" className="prompt-btn--details" style={{ padding: "0.55rem 1.25rem" }} onClick={() => setIsCustomModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="action-btn-large" style={{ padding: "0.55rem 1.25rem" }}>
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: SHARE PROMPT RECIPE */}
      {isSubmitModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsSubmitModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "750px" }}>
            <button className="modal-close-btn" onClick={() => setIsSubmitModalOpen(false)}>&times;</button>
            <h2 style={{ fontSize: "1.45rem", fontWeight: "700", marginBottom: "0.25rem", color: "#fff" }}>
              Share Prompt Recipe
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Submit your optimized prompt template. Submissions undergo review to verify relevance and quality.
            </p>

            <form onSubmit={handlePromptSubmit} className="admin-form">
              <div className="builder-field">
                <label className="builder-field__label">PROMPT TITLE</label>
                <input
                  type="text"
                  className="builder-input"
                  value={submitForm.title}
                  onChange={(e) => setSubmitForm({ ...submitForm, title: e.target.value })}
                  placeholder="e.g. Next.js Tailwind Accordion Component"
                  required
                />
              </div>

              <div className="builder-field">
                <label className="builder-field__label">SHORT DESCRIPTION</label>
                <input
                  type="text"
                  className="builder-input"
                  value={submitForm.description}
                  onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })}
                  placeholder="e.g. Generates an interactive animated accordion layout."
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="builder-field">
                  <label className="builder-field__label">LIBRARY CATEGORY</label>
                  <select
                    className="builder-input"
                    style={{ background: "var(--bg-primary)", color: "#fff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", padding: "0.5rem" }}
                    value={submitForm.category}
                    onChange={(e) => setSubmitForm({ ...submitForm, category: e.target.value as any })}
                  >
                    <option value="web-app">Web Apps & Engineering</option>
                    <option value="blog">Blogs & Writing</option>
                    <option value="image-gen">Cinematic Image Gen</option>
                  </select>
                </div>

                <div className="builder-field">
                  <label className="builder-field__label">COMPLEXITY LEVEL</label>
                  <select
                    className="builder-input"
                    style={{ background: "var(--bg-primary)", color: "#fff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", padding: "0.5rem" }}
                    value={submitForm.difficulty}
                    onChange={(e) => setSubmitForm({ ...submitForm, difficulty: e.target.value as any })}
                  >
                    <option value="Beginner">Beginner Level</option>
                    <option value="Intermediate">Intermediate Level</option>
                    <option value="Advanced">Advanced Level</option>
                  </select>
                </div>
              </div>

              <div className="builder-field" style={{ marginTop: "1rem" }}>
                <label className="builder-field__label">TARGET MODEL PLATFORM</label>
                <input
                  type="text"
                  className="builder-input"
                  value={submitForm.targetAI}
                  onChange={(e) => setSubmitForm({ ...submitForm, targetAI: e.target.value })}
                  placeholder="Claude 3.5 Sonnet"
                  required
                />
              </div>

              <div className="builder-field">
                <label className="builder-field__label">PROMPT INSTRUCTIONS (TEMPLATE TEXT)</label>
                <textarea
                  className="builder-input"
                  style={{ minHeight: "120px", fontFamily: "monospace", fontSize: "0.8rem" }}
                  value={submitForm.promptText}
                  onChange={(e) => setSubmitForm({ ...submitForm, promptText: e.target.value })}
                  placeholder="Write your prompt code here. Use brackets like [Topic] to prompt placeholders."
                  required
                />
              </div>

              <div className="builder-field">
                <label className="builder-field__label">EXPECTED OUTPUTS PREVIEW</label>
                <textarea
                  className="builder-input"
                  style={{ minHeight: "80px", fontFamily: "sans-serif", fontSize: "0.85rem" }}
                  value={submitForm.outputDescription}
                  onChange={(e) => setSubmitForm({ ...submitForm, outputDescription: e.target.value })}
                  placeholder="Describe what this prompt outputs when run (or sample preview structure)."
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "2rem" }}>
                <button
                  type="button"
                  className="prompt-btn--details"
                  style={{ padding: "0.55rem 1.25rem" }}
                  onClick={() => setIsSubmitModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="action-btn-large"
                  style={{ padding: "0.55rem 1.25rem", background: "var(--accent-purple)", color: "#000" }}
                  disabled={submitLoading}
                >
                  {submitLoading ? "Submitting..." : "Submit to Moderator"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page footer containing About & Newsletter */}
      <footer className="app-footer">
        <div className="app-footer__container">
          
          <div className="app-footer__grid">
            {/* About / Mission Onboarding */}
            <div className="app-footer__section footer-brand-section">
              <div className="logo-container" style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <img src="/logo-mark.png" alt="Logo" style={{ width: "250px" }} />
              </div>
              <p className="footer-about-text">
                AppPromptHub is an open-source, curated database of production-ready AI prompts. Built for developers, designers, and prompt engineers to ship products faster using state-of-the-art AI.
              </p>
            </div>

            {/* Platform links */}
            <div className="app-footer__section">
              <h4 className="footer-title">Navigation</h4>
              <ul className="footer-links-list">
                <li><Link href="/explore" style={{ textDecoration: "none" }}>Explore Prompts</Link></li>
                <li><button aria-label="Go to dynamic builder" onClick={() => { setActiveTab("builder"); window.scrollTo({top: 0, behavior: 'smooth'}); }}>Interactive Builder</button></li>
                <li><button aria-label="Check news feed" onClick={() => { setActiveTab("news"); window.scrollTo({top: 0, behavior: 'smooth'}); }}>AI Release Radar</button></li>
              </ul>
            </div>

            {/* Legal / Policy links */}
            <div className="app-footer__section">
              <h4 className="footer-title">Privacy &amp; Terms</h4>
              <ul className="footer-links-list">
                <li><a href="#terms" onClick={(e) => { e.preventDefault(); triggerToast("Terms of Service placeholder"); }}>Terms of Service</a></li>
                <li><a href="#privacy" onClick={(e) => { e.preventDefault(); triggerToast("Privacy Policy placeholder"); }}>Privacy Policy</a></li>
              </ul>
            </div>

            {/* Newsletter Sign up field */}
            <div className="app-footer__section footer-newsletter-section">
              <h4 className="footer-title">Stay Updated</h4>
              <p className="newsletter-desc" style={{ marginBottom: "0.5rem" }}>Subscribe to get campaigns, prompt drops, and model news weekly.</p>
              {isSubscribed ? (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.8rem", backgroundColor: "rgba(52, 211, 153, 0.08)", border: "1px solid var(--accent-green)", borderRadius: "var(--radius-sm)", color: "var(--accent-green)", fontSize: "0.8rem", fontWeight: "700" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Subscribed to Radar
                </div>
              ) : (
                <form onSubmit={handleSubscribe} style={{ display: "flex", gap: "0.4rem" }}>
                  <input
                    type="email"
                    className="newsletter-input"
                    placeholder="Enter email address..."
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                    style={{ padding: "0.4rem 0.6rem", fontSize: "0.75rem", background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", flex: 1 }}
                    aria-label="Newsletter email address"
                  />
                  <button
                    type="submit"
                    className="newsletter-btn"
                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem", background: "var(--accent-purple)", color: "#000", fontWeight: "700", borderRadius: "var(--radius-sm)", cursor: "pointer" }}
                    aria-label="Subscribe to newsletter updates"
                    disabled={isSubscribing}
                  >
                    {isSubscribing ? "..." : "Join"}
                  </button>
                </form>
              )}
            </div>
            
          </div>

          <div className="app-footer__bottom">
            <p className="copyright-text">
              &copy; {new Date().getFullYear()} AppPromptHub. MIT License.
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
}
