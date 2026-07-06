"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import SiteHeader from "./SiteHeader";
import { mockPrompts as defaultMockPrompts } from "../data/mockData";
import { PromptItem } from "../types";
import { supabase, hasSupabaseCredentials } from "../lib/supabase";

export default function ExploreClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "web-app" | "blog" | "image-gen" | "bookmarks">("all");
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sandboxInputs, setSandboxInputs] = useState<Record<string, string>>({});

  // Dynamic database lists (initialized with mock fallbacks)
  const [prompts, setPrompts] = useState<PromptItem[]>(defaultMockPrompts);
  const [dbLoading, setDbLoading] = useState(false);

  // Advanced Filtering & Sorting States
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "likes">("popular");
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Pagination State
  const [visibleCount, setVisibleCount] = useState(12); // Default to 12 prompts visible

  // Toast Notification State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Favorites System (localStorage based)
  const [favorites, setFavorites] = useState<string[]>([]);

  // Newsletter Subscription States
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  useEffect(() => {
    try {
      const isSubbed = localStorage.getItem("appprompthub_subscribed");
      if (isSubbed === "true") setNewsletterSubscribed(true);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // User Auth status for header rendering
  const [activeUser, setActiveUser] = useState<any | null>(null);

  // Scroll listener to toggle sticky horizontal filter bar
  const [showHorizontalFilters, setShowHorizontalFilters] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 420) {
        setShowHorizontalFilters(true);
      } else {
        setShowHorizontalFilters(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll back to top of prompts grid when search or filter values change at mid-page
  useEffect(() => {
    if (typeof window !== "undefined" && window.scrollY > 200) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchQuery, categoryFilter, modelFilter, difficultyFilter]);

  // Listen for Supabase Auth state changes
  useEffect(() => {
    try {
      const storedMockUser = localStorage.getItem("appprompthub_mock_user");
      if (storedMockUser) setActiveUser(JSON.parse(storedMockUser));
    } catch (e) {
      console.error(e);
    }

    if (!hasSupabaseCredentials) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setActiveUser(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setActiveUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch prompts from Supabase
  useEffect(() => {
    async function loadDatabaseData() {
      if (!hasSupabaseCredentials) return;

      setDbLoading(true);
      try {
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
      } catch (err) {
        console.warn("[ExploreClient] Database fetch failed. Defaulting to mock fallback.", err);
      } finally {
        setDbLoading(false);
      }
    }

    loadDatabaseData();
  }, []);

  // Load favorites on mount
  useEffect(() => {
    try {
      const storedFavs = localStorage.getItem("appprompthub_favorites");
      if (storedFavs) setFavorites(JSON.parse(storedFavs));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Toggle favorite helper
  const toggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isFavorited = favorites.includes(id);
    let updated: string[];

    if (isFavorited) {
      updated = favorites.filter((favId) => favId !== id);
      triggerToast("Removed from bookmarked prompts");
      setPrompts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, likes: Math.max(0, p.likes - 1) } : p))
      );

      if (hasSupabaseCredentials) {
        const promptItem = prompts.find((p) => p.id === id);
        if (promptItem) {
          await supabase
            .from("prompts")
            .update({ likes: Math.max(0, promptItem.likes - 1) })
            .eq("id", id);
        }
      }
    } else {
      updated = [...favorites, id];
      triggerToast("Prompt bookmarked!");
      setPrompts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
      );

      if (hasSupabaseCredentials) {
        const promptItem = prompts.find((p) => p.id === id);
        if (promptItem) {
          await supabase
            .from("prompts")
            .update({ likes: promptItem.likes + 1 })
            .eq("id", id);
        }
      }
    }

    setFavorites(updated);
    localStorage.setItem("appprompthub_favorites", JSON.stringify(updated));
  };

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Helper to extract bracket [VarName] and curly {{var_name}} placeholders
  const extractVariables = (text: string): string[] => {
    if (!text) return [];
    const regex = /\[([A-Za-z0-9_\-\s]+)\]|\{\{([A-Za-z0-9_\-\s]+)\}\}/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      const val = match[1] || match[2];
      if (val && !matches.includes(val.trim())) {
        matches.push(val.trim());
      }
    }
    return matches;
  };

  // Compile prompt by substituting user inputs
  const getCompiledPrompt = (text: string, inputs: Record<string, string>): string => {
    if (!text) return "";
    let compiled = text;
    const vars = extractVariables(text);
    vars.forEach(v => {
      const userVal = inputs[v];
      if (userVal !== undefined && userVal.trim() !== "") {
        const escapedV = v.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const bracketRegex = new RegExp(`\\[\\s*${escapedV}\\s*\\]`, 'g');
        const braceRegex = new RegExp(`\\{\\{\\s*${escapedV}\\s*\\}\\}`, 'g');
        compiled = compiled.replace(bracketRegex, userVal);
        compiled = compiled.replace(braceRegex, userVal);
      }
    });
    return compiled;
  };

  // Get safe HTML string highlighting active vs empty sandbox variables
  const getHighlightedPreview = (text: string, inputs: Record<string, string>): string => {
    if (!text) return "";
    let escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
      
    const vars = extractVariables(text);
    vars.forEach(v => {
      const userVal = inputs[v];
      const escapedV = v.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const bracketRegex = new RegExp(`\\[\\s*${escapedV}\\s*\\]`, 'g');
      const braceRegex = new RegExp(`\\{\\{\\s*${escapedV}\\s*\\}\\}`, 'g');
      
      if (userVal !== undefined && userVal.trim() !== "") {
        escaped = escaped.replace(bracketRegex, `<span class="sandbox-variable-highlight sandbox-variable-highlight--filled">${userVal}</span>`);
        escaped = escaped.replace(braceRegex, `<span class="sandbox-variable-highlight sandbox-variable-highlight--filled">${userVal}</span>`);
      } else {
        escaped = escaped.replace(bracketRegex, `<span class="sandbox-variable-highlight sandbox-variable-highlight--empty">[${v}]</span>`);
        escaped = escaped.replace(braceRegex, `<span class="sandbox-variable-highlight sandbox-variable-highlight--empty">{{${v}}}</span>`);
      }
    });
    
    return escaped;
  };

  const handleViewDetails = async (prompt: PromptItem) => {
    setSelectedPrompt(prompt);
    
    // Parse variables and initialize inputs
    const vars = extractVariables(prompt.promptText);
    const initialInputs: Record<string, string> = {};
    vars.forEach(v => {
      initialInputs[v] = "";
    });
    setSandboxInputs(initialInputs);

    setPrompts((prev) =>
      prev.map((p) => (p.id === prompt.id ? { ...p, views: p.views + 1 } : p))
    );

    if (hasSupabaseCredentials) {
      try {
        await supabase
          .from("prompts")
          .update({ views: prompt.views + 1 })
          .eq("id", prompt.id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCopy = (text: string, title: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      triggerToast("Prompt copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    });
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
        setNewsletterSubscribed(true);
        localStorage.setItem("appprompthub_subscribed", "true");
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

  const handleSignOut = async () => {
    if (hasSupabaseCredentials) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem("appprompthub_mock_user");
    }
    setActiveUser(null);
    triggerToast("Signed out successfully.");
  };

  // Filtered prompts
  const filteredPrompts = useMemo(() => {
    let result = prompts.filter((prompt) => {
      const matchesCategory =
        categoryFilter === "all" || 
        prompt.category === categoryFilter ||
        (categoryFilter === "bookmarks" && favorites.includes(prompt.id));

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

  const getBrandTheme = (targetAI: string) => {
    const ai = targetAI.toLowerCase();
    if (ai.includes("claude")) return { gradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", color: "#c084fc" };
    if (ai.includes("chatgpt") || ai.includes("gpt")) return { gradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)", color: "#34d399" };
    if (ai.includes("midjourney")) return { gradient: "linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)", color: "#60a5fa" };
    if (ai.includes("stable diffusion")) return { gradient: "linear-gradient(135deg, #db2777 0%, #f43f5e 100%)", color: "#fb7185" };
    return { gradient: "linear-gradient(135deg, #1f2937 0%, #4b5563 100%)", color: "#cbd5e1" };
  };

  return (
    <div className="app-shell">
      
      {/* Toast Notification */}
      <div className={`toast-notification ${showToast ? "toast-notification--show" : ""}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: "0.4rem" }}><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>{toastMessage}</span>
      </div>

      {/* Header */}
      <SiteHeader activeUser={activeUser} activeNav="explore" onSignOut={handleSignOut} />

      {/* Sticky Horizontal Filters Bar */}
      <div 
        className={`sticky-horizontal-filters ${showHorizontalFilters ? "sticky-horizontal-filters--show" : ""}`}
        style={{ backgroundColor: "#040406", borderBottom: "2px solid rgba(124, 58, 237, 0.4)" }}
      >
        <div className="sticky-filters__inner">
          <div className="sticky-filters__search">
          <div className="sidebar-search-wrapper" style={{ margin: 0 }}>
            <svg className="sidebar-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(12); }}
              className="sidebar-search-input"
              aria-label="Search prompt database"
            />
          </div>
        </div>

        <div className="sticky-filters__group">
          
          <div className="sticky-filters__field">
            <span>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value as any); setVisibleCount(12); setShowFavoritesOnly(e.target.value === "bookmarks"); }}
              className="control-select"
              style={{ padding: "0.45rem 0.65rem", fontSize: "0.8rem", borderRadius: "var(--radius-sm)" }}
            >
              <option value="all">All Categories</option>
              <option value="web-app">Web Apps</option>
              <option value="blog">Web Content</option>
              <option value="image-gen">Image Gen</option>
              <option value="bookmarks">Bookmarks ({favorites.length})</option>
            </select>
          </div>

          <div className="sticky-filters__field">
            <span>Platform:</span>
            <select
              value={modelFilter}
              onChange={(e) => { setModelFilter(e.target.value); setVisibleCount(12); }}
              className="control-select"
              style={{ padding: "0.45rem 0.65rem", fontSize: "0.8rem", borderRadius: "var(--radius-sm)" }}
            >
              <option value="all">All Platforms</option>
              <option value="claude">Claude</option>
              <option value="gpt">GPT / ChatGPT</option>
              <option value="midjourney">Midjourney</option>
              <option value="stable">Stable Diffusion</option>
              <option value="v0">v0 by Vercel</option>
            </select>
          </div>

          <div className="sticky-filters__field">
            <span>Complexity:</span>
            <select
              value={difficultyFilter}
              onChange={(e) => { setDifficultyFilter(e.target.value); setVisibleCount(12); }}
              className="control-select"
              style={{ padding: "0.45rem 0.65rem", fontSize: "0.8rem", borderRadius: "var(--radius-sm)" }}
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="sticky-filters__field">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="control-select"
              style={{ padding: "0.45rem 0.65rem", fontSize: "0.8rem", borderRadius: "var(--radius-sm)" }}
            >
              <option value="popular">Most Popular</option>
              <option value="likes">Most Upvoted</option>
              <option value="newest">Newest Releases</option>
            </select>
          </div>

        </div>
      </div>
    </div>

      {/* Main Grid */}
      <main className="main-content main-content--explore">
        
        {/* 2-Column Sidebar Layout */}
        <div className="explore-layout explore-layout--fullwidth" style={{ marginTop: "2rem", paddingBottom: "4rem" }}>
          
          {/* Left Sidebar: Filters & categories */}
          <aside className="explore-sidebar">
            <div className="sidebar-filter-group">
              <span className="sidebar-title">Keyword Search</span>
              <div className="sidebar-search-wrapper">
                <svg className="sidebar-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input
                  type="text"
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(12); }}
                  className="sidebar-search-input"
                  aria-label="Search prompt database"
                />
              </div>
            </div>

            <div className="sidebar-filter-group">
              <span className="sidebar-title">Categories</span>
              <div className="vertical-category-list">
                {(["all", "web-app", "blog", "image-gen"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setCategoryFilter(cat); setVisibleCount(12); setShowFavoritesOnly(false); }}
                    className={`vertical-category-btn ${categoryFilter === cat && !showFavoritesOnly ? "vertical-category-btn--active" : ""}`}
                  >
                    {cat === "all" ? "All Prompts" : cat === "web-app" ? "Web Apps" : cat === "blog" ? "Web Content" : "Image Gen"}
                  </button>
                ))}
                
                {/* Bookmarks Filter */}
                <button
                  onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setCategoryFilter("bookmarks"); setVisibleCount(12); }}
                  className={`vertical-category-btn ${showFavoritesOnly ? "vertical-category-btn--active" : ""}`}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill={showFavoritesOnly ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    Bookmarks
                  </span>
                  <span>({favorites.length})</span>
                </button>
              </div>
            </div>

            <div className="sidebar-filter-group">
              <span className="sidebar-title">Filters &amp; Sort</span>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="builder-field">
                  <label htmlFor="sidebar-model-select" className="sidebar-filter-label">AI Platform</label>
                  <select
                    id="sidebar-model-select"
                    value={modelFilter}
                    onChange={(e) => { setModelFilter(e.target.value); setVisibleCount(12); }}
                    className="control-select"
                    style={{ width: "100%", padding: "0.55rem 0.75rem", fontSize: "0.8rem", borderRadius: "var(--radius-sm)" }}
                  >
                    <option value="all">All Platforms</option>
                    <option value="claude">Claude</option>
                    <option value="gpt">GPT / ChatGPT</option>
                    <option value="midjourney">Midjourney</option>
                    <option value="stable">Stable Diffusion</option>
                    <option value="v0">v0 by Vercel</option>
                  </select>
                </div>

                <div className="builder-field">
                  <label htmlFor="sidebar-difficulty-select" className="sidebar-filter-label">Complexity</label>
                  <select
                    id="sidebar-difficulty-select"
                    value={difficultyFilter}
                    onChange={(e) => { setDifficultyFilter(e.target.value); setVisibleCount(12); }}
                    className="control-select"
                    style={{ width: "100%", padding: "0.55rem 0.75rem", fontSize: "0.8rem", borderRadius: "var(--radius-sm)" }}
                  >
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="builder-field">
                  <label htmlFor="sidebar-sort-select" className="sidebar-filter-label">Sort By</label>
                  <select
                    id="sidebar-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="control-select"
                    style={{ width: "100%", padding: "0.55rem 0.75rem", fontSize: "0.8rem", borderRadius: "var(--radius-sm)" }}
                  >
                    <option value="popular">Most Popular (Views)</option>
                    <option value="likes">Most Upvoted (Likes)</option>
                    <option value="newest">Newest Releases</option>
                  </select>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Column: Main Content Area */}
          <div className="explore-main" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            
            {dbLoading && (
              <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-secondary)" }}>
                <span>Loading database records from Supabase...</span>
              </div>
            )}

            {/* Grid */}
            {filteredPrompts.length > 0 ? (
              <>
                <div className="explore-prompt-grid">
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
                      onClick={() => setVisibleCount(visibleCount + 12)}
                      className="load-more-btn"
                    >
                      Load More Prompts
                    </button>
                  ) : (
                    <p className="caught-up-message">
                      ⚡ Showing all matching prompts. Updates loaded daily!
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-secondary)" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: "1rem", opacity: 0.5 }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <p>No prompts match the active filters or search terms.</p>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Modal View for Prompts */}
      {selectedPrompt && (
        <div className="modal-backdrop" onClick={() => setSelectedPrompt(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setSelectedPrompt(null)}
              aria-label="Close modal"
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

            {/* Prompt Sandbox Variables Grid */}
            {(() => {
              const vars = extractVariables(selectedPrompt.promptText);
              if (vars.length === 0) return null;
              return (
                <div style={{ marginBottom: "1.75rem" }}>
                  <h3 className="modal__section-title">Prompt Sandbox (Variables Editor)</h3>
                  <div className="sandbox-variables-grid">
                    {vars.map((v) => (
                      <div key={v} className="sandbox-field-group">
                        <label className="sandbox-input-label">{v}</label>
                        <input
                          type="text"
                          placeholder={`Enter value for [${v}]...`}
                          value={sandboxInputs[v] || ""}
                          onChange={(e) => setSandboxInputs(prev => ({ ...prev, [v]: e.target.value }))}
                          className="sandbox-input-field"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <h3 className="modal__section-title">
              {extractVariables(selectedPrompt.promptText).length > 0 ? "Compiled Prompt Preview" : "Prompt Code"}
            </h3>
            <div className="modal__prompt-container">
              <pre 
                className="modal__prompt-box"
                dangerouslySetInnerHTML={{ __html: getHighlightedPreview(selectedPrompt.promptText, sandboxInputs) }}
              />
              <button
                className="modal__copy-btn"
                onClick={() => handleCopy(getCompiledPrompt(selectedPrompt.promptText, sandboxInputs), selectedPrompt.title, `modal-${selectedPrompt.id}`)}
                aria-label="Copy compiled prompt text"
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

            <div className="modal__footer-actions" style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", borderTop: "1px solid var(--border-color)", paddingTop: "1.25rem" }}>
              <button
                onClick={() => handleCopy(getCompiledPrompt(selectedPrompt.promptText, sandboxInputs), selectedPrompt.title, `modal-footer-${selectedPrompt.id}`)}
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
                  gap: "0.35rem",
                  cursor: "pointer"
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                Copy Compiled Prompt
              </button>
              <button
                onClick={() => setSelectedPrompt(null)}
                className="prompt-btn--details"
                style={{ padding: "0.6rem 1.25rem" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div className="app-footer__container">
          <div className="app-footer__grid">
            <div className="app-footer__section footer-brand-section">
              <Link href="/" className="logo-container" style={{ marginBottom: "1rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <img src="/logo-mark.png" alt="Logo" style={{ width: "250px" }} />
              </Link>
              <p className="footer-about-text">
                AppPromptHub is an open-source database of production AI prompts, built for developers to ship faster.
              </p>
            </div>
            
            <div className="app-footer__section">
              <h4 className="footer-title">Navigation</h4>
              <ul className="footer-links-list" style={{ listStyle: "none" }}>
                <li><Link href="/explore" style={{ textDecoration: "none" }}>Explore Library</Link></li>
                <li><Link href="/?tab=builder" style={{ textDecoration: "none" }}>Custom Builder</Link></li>
                <li><Link href="/?tab=news" style={{ textDecoration: "none" }}>AI News Radar</Link></li>
              </ul>
            </div>

            <div className="app-footer__section">
              <h4 className="footer-title">Privacy &amp; Legal</h4>
              <ul className="footer-links-list" style={{ listStyle: "none" }}>
                <li><a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a></li>
                <li><a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a></li>
              </ul>
            </div>

            <div className="app-footer__section footer-newsletter-section">
              <h4 className="footer-title">Stay Updated</h4>
              <p className="newsletter-desc" style={{ marginBottom: "0.5rem" }}>Subscribe to prompt radar updates.</p>
              {newsletterSubscribed ? (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.8rem", backgroundColor: "rgba(52, 211, 153, 0.08)", border: "1px solid var(--accent-green)", borderRadius: "var(--radius-sm)", color: "var(--accent-green)", fontSize: "0.8rem", fontWeight: "700" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Subscribed to Radar
                </div>
              ) : (
                <form onSubmit={handleSubscribe} style={{ display: "flex", gap: "0.4rem" }}>
                  <input
                    type="email"
                    className="newsletter-input"
                    placeholder="Enter email..."
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    style={{ padding: "0.4rem 0.6rem", fontSize: "0.75rem", background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", flex: 1 }}
                    required
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
