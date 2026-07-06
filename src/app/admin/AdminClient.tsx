"use client";

import React, { useState, useEffect } from "react";
import { mockPrompts as defaultMockPrompts, mockNews as defaultMockNews } from "../../data/mockData";
import { PromptItem, NewsItem } from "../../types";
import { supabase, hasSupabaseCredentials } from "../../lib/supabase";

interface SubscriberItem {
  id: string;
  email: string;
  created_at: string;
}

export default function AdminClient() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [activePanel, setActivePanel] = useState<"prompts" | "news" | "subscribers" | "status">("prompts");
  
  // Data lists
  const [prompts, setPrompts] = useState<PromptItem[]>(defaultMockPrompts);
  const [news, setNews] = useState<NewsItem[]>(defaultMockNews);
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([
    { id: "s1", email: "onboarding@appprompthub.com", created_at: "2026-06-28T12:00:00.000Z" },
    { id: "s2", email: "builder-beta@appprompthub.com", created_at: "2026-06-29T14:30:00.000Z" }
  ]);
  const [dbLoading, setDbLoading] = useState(false);

  // Toast alerts
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Prompt Form States
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null);
  const [promptForm, setPromptForm] = useState({
    id: "",
    slug: "",
    title: "",
    description: "",
    category: "web-app" as "web-app" | "blog" | "image-gen",
    targetAI: "Claude 3.5 Sonnet",
    promptText: "",
    outputDescription: "",
    difficulty: "Intermediate" as "Beginner" | "Intermediate" | "Advanced"
  });

  // News Form States
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [newsForm, setNewsForm] = useState({
    id: "",
    slug: "",
    title: "",
    category: "Model Release" as "Model Release" | "Industry News" | "API Updates",
    summary: "",
    content: "",
    importance: "high" as "high" | "medium" | "low",
    sourceUrl: ""
  });

  // Fetch all lists from Supabase
  const loadDatabaseData = async () => {
    if (!hasSupabaseCredentials) return;
    setDbLoading(true);
    try {
      // 1. Fetch prompts
      const { data: dbPrompts, error: pe } = await supabase.from("prompts").select("*");
      if (pe) throw pe;
      if (dbPrompts) {
        setPrompts(dbPrompts.map((p: any) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          description: p.description,
          category: p.category,
          targetAI: p.target_ai,
          promptText: p.prompt_text,
          outputDescription: p.output_description,
          views: p.views || 0,
          likes: p.likes || 0,
          difficulty: p.difficulty,
          date: p.date
        })));
      }

      // 2. Fetch news
      const { data: dbNews, error: ne } = await supabase.from("news").select("*").order("date", { ascending: false });
      if (ne) throw ne;
      if (dbNews) {
        setNews(dbNews.map((n: any) => ({
          id: n.id,
          slug: n.slug,
          title: n.title,
          category: n.category,
          date: n.date,
          summary: n.summary,
          content: n.content,
          importance: n.importance,
          sourceUrl: n.source_url
        })));
      }

      // 3. Fetch newsletter subscribers
      const { data: dbSubs, error: se } = await supabase.from("subscribers").select("*").order("created_at", { ascending: false });
      if (se) throw se;
      if (dbSubs) {
        setSubscribers(dbSubs.map((s: any) => ({
          id: s.id,
          email: s.email,
          created_at: s.created_at
        })));
      }
    } catch (err) {
      console.error("[Admin] Failed to load data from Supabase", err);
      triggerToast("Failed to fetch records. Operating in mock mode.");
    } finally {
      setDbLoading(false);
    }
  };

  // Toast Helper
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

  // Handle Login Check
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const envPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";
    if (passwordInput === envPassword) {
      setIsAuthenticated(true);
      triggerToast("Access Granted. Welcome Admin!");
      loadDatabaseData();
    } else {
      triggerToast("Access Denied! Incorrect Password.");
    }
  };

  // PROMPTS CRUD ACTIONS
  const openPromptModal = (item: PromptItem | null = null) => {
    if (item) {
      setEditingPrompt(item);
      setPromptForm({
        id: item.id,
        slug: item.slug,
        title: item.title,
        description: item.description,
        category: item.category,
        targetAI: item.targetAI,
        promptText: item.promptText,
        outputDescription: item.outputDescription || "",
        difficulty: item.difficulty
      });
    } else {
      setEditingPrompt(null);
      setPromptForm({
        id: `p-${Date.now()}`,
        slug: "new-prompt-slug-" + Math.floor(Math.random() * 1000),
        title: "",
        description: "",
        category: "web-app",
        targetAI: "Claude 3.5 Sonnet",
        promptText: "",
        outputDescription: "",
        difficulty: "Intermediate"
      });
    }
    setIsPromptModalOpen(true);
  };

  const handlePromptSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const saveDate = editingPrompt ? editingPrompt.date : new Date().toISOString().split("T")[0];
    const viewsCount = editingPrompt ? editingPrompt.views : 0;
    const likesCount = editingPrompt ? editingPrompt.likes : 0;

    const payload = {
      id: promptForm.id,
      slug: promptForm.slug,
      title: promptForm.title,
      description: promptForm.description,
      category: promptForm.category,
      target_ai: promptForm.targetAI, // db key map
      prompt_text: promptForm.promptText,
      output_description: promptForm.outputDescription,
      views: viewsCount,
      likes: likesCount,
      difficulty: promptForm.difficulty,
      date: saveDate
    };

    if (hasSupabaseCredentials) {
      try {
        const { error } = await supabase
          .from("prompts")
          .upsert([payload], { onConflict: "id" });
        if (error) throw error;
        triggerToast("Prompt saved successfully to database!");
      } catch (err) {
        console.error("[Admin Save Prompt]", err);
        triggerToast("Database insert failed. Saved in local layout state only.");
      }
    }

    // Local layout state sync
    const mappedItem: PromptItem = {
      id: promptForm.id,
      slug: promptForm.slug,
      title: promptForm.title,
      description: promptForm.description,
      category: promptForm.category,
      targetAI: promptForm.targetAI,
      promptText: promptForm.promptText,
      outputDescription: promptForm.outputDescription,
      views: viewsCount,
      likes: likesCount,
      difficulty: promptForm.difficulty,
      date: saveDate
    };

    if (editingPrompt) {
      setPrompts(prompts.map((p) => (p.id === editingPrompt.id ? mappedItem : p)));
    } else {
      setPrompts([mappedItem, ...prompts]);
    }
    setIsPromptModalOpen(false);
  };

  const handlePromptDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prompt?")) return;

    if (hasSupabaseCredentials) {
      try {
        const { error } = await supabase.from("prompts").delete().eq("id", id);
        if (error) throw error;
        triggerToast("Prompt deleted from database.");
      } catch (err) {
        console.error("[Admin Delete Prompt]", err);
        triggerToast("Database delete failed.");
      }
    } else {
      triggerToast("Deleted locally (sandbox).");
    }
    setPrompts(prompts.filter((p) => p.id !== id));
  };


  // NEWS CRUD ACTIONS
  const openNewsModal = (item: NewsItem | null = null) => {
    if (item) {
      setEditingNews(item);
      setNewsForm({
        id: item.id,
        slug: item.slug,
        title: item.title,
        category: item.category,
        summary: item.summary,
        content: item.content,
        importance: item.importance,
        sourceUrl: item.sourceUrl || ""
      });
    } else {
      setEditingNews(null);
      setNewsForm({
        id: `n-${Date.now()}`,
        slug: "new-release-slug-" + Math.floor(Math.random() * 1000),
        title: "",
        category: "Model Release",
        summary: "",
        content: "",
        importance: "high",
        sourceUrl: ""
      });
    }
    setIsNewsModalOpen(true);
  };

  const handleNewsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const saveDate = editingNews ? editingNews.date : new Date().toISOString().split("T")[0];

    const payload = {
      id: newsForm.id,
      slug: newsForm.slug,
      title: newsForm.title,
      category: newsForm.category,
      summary: newsForm.summary,
      content: newsForm.content,
      importance: newsForm.importance,
      source_url: newsForm.sourceUrl || null,
      date: saveDate
    };

    if (hasSupabaseCredentials) {
      try {
        const { error } = await supabase
          .from("news")
          .upsert([payload], { onConflict: "id" });
        if (error) throw error;
        triggerToast("News article saved to database!");
      } catch (err) {
        console.error("[Admin Save News]", err);
        triggerToast("Database insert failed.");
      }
    }

    const mappedItem: NewsItem = {
      id: newsForm.id,
      slug: newsForm.slug,
      title: newsForm.title,
      category: newsForm.category,
      summary: newsForm.summary,
      content: newsForm.content,
      importance: newsForm.importance,
      sourceUrl: newsForm.sourceUrl || undefined,
      date: saveDate
    };

    if (editingNews) {
      setNews(news.map((n) => (n.id === editingNews.id ? mappedItem : n)));
    } else {
      setNews([mappedItem, ...news]);
    }
    setIsNewsModalOpen(false);
  };

  const handleNewsDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this release update?")) return;

    if (hasSupabaseCredentials) {
      try {
        const { error } = await supabase.from("news").delete().eq("id", id);
        if (error) throw error;
        triggerToast("News article deleted.");
      } catch (err) {
        console.error("[Admin Delete News]", err);
        triggerToast("Database delete failed.");
      }
    } else {
      triggerToast("Deleted locally (sandbox).");
    }
    setNews(news.filter((n) => n.id !== id));
  };


  // SUBSCRIBERS ACTIONS
  const handleSubscriberDelete = async (id: string) => {
    if (!confirm("Remove this email from subscribers list?")) return;

    if (hasSupabaseCredentials) {
      try {
        const { error } = await supabase.from("subscribers").delete().eq("id", id);
        if (error) throw error;
        triggerToast("Subscriber removed.");
      } catch (err) {
        console.error("[Admin Delete Subscriber]", err);
        triggerToast("Database deletion failed.");
      }
    }
    setSubscribers(subscribers.filter((s) => s.id !== id));
  };

  const handleCopyEmails = () => {
    const list = subscribers.map((s) => s.email).join(", ");
    navigator.clipboard.writeText(list).then(() => {
      triggerToast("Copied subscriber list to clipboard!");
    });
  };

  // Render Login Panel
  if (!isAuthenticated) {
    return (
      <div className="app-shell" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        
        {/* Toast Alert */}
        <div className={`toast-notification ${showToast ? "toast-notification--show" : ""}`}>
          <span>{toastMessage}</span>
        </div>

        <div className="login-card" style={{ maxWidth: "400px", width: "90%", background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "2.5rem", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", textAlign: "center" }}>
          <div className="logo-container" style={{ justifyContent: "center", marginBottom: "1.5rem" }}>
            <span className="logo-icon">▲</span>
            <span>App<span className="logo-text">PromptHub</span></span>
          </div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: "700", marginBottom: "0.5rem" }}>Admin Dashboard Gate</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            Enter your admin workspace password to authorize database modifications.
          </p>

          <form onSubmit={handleLoginSubmit}>
            <div style={{ marginBottom: "1.25rem", textAlign: "left" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.4rem", display: "block" }}>Password</label>
              <input
                type="password"
                className="builder-input"
                style={{ width: "100%" }}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="default: admin123"
                required
              />
            </div>
            <button type="submit" className="action-btn-large" style={{ width: "100%" }}>
              Authorize Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render Main Dashboard
  return (
    <div className="app-shell admin-dashboard-shell">
      
      {/* Toast Alert */}
      <div className={`toast-notification ${showToast ? "toast-notification--show" : ""}`}>
        <span>{toastMessage}</span>
      </div>

      {/* Admin header */}
      <header className="app-header">
        <div className="app-header__container">
          <div className="logo-container">
            <span className="logo-icon">▲</span>
            <span>App<span className="logo-text">PromptHub</span> <span className="admin-pill">Admin</span></span>
          </div>
          <nav className="nav-links">
            <a href="/" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textDecoration: "underline" }}>View Front Website</a>
            <button onClick={() => setIsAuthenticated(false)} style={{ fontSize: "0.85rem", color: "var(--accent-red)" }}>Log Out</button>
          </nav>
        </div>
      </header>

      {/* Main layout grid */}
      <div className="admin-layout-container" style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "calc(100vh - 70px)" }}>
        
        {/* Sidebar Nav */}
        <aside className="admin-sidebar" style={{ background: "#040407", borderRight: "1px solid var(--border-color)", padding: "2rem 1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <button
              onClick={() => setActivePanel("prompts")}
              className={`admin-nav-btn ${activePanel === "prompts" ? "admin-nav-btn--active" : ""}`}
            >
              📂 Manage Prompts
            </button>
            <button
              onClick={() => setActivePanel("news")}
              className={`admin-nav-btn ${activePanel === "news" ? "admin-nav-btn--active" : ""}`}
            >
              📰 AI Release Radar
            </button>
            <button
              onClick={() => setActivePanel("subscribers")}
              className={`admin-nav-btn ${activePanel === "subscribers" ? "admin-nav-btn--active" : ""}`}
            >
              ✉️ Newsletter Subscribers
            </button>
            <button
              onClick={() => setActivePanel("status")}
              className={`admin-nav-btn ${activePanel === "status" ? "admin-nav-btn--active" : ""}`}
            >
              ⚙️ Server Credentials Status
            </button>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="admin-content-pane" style={{ padding: "2.5rem 3.5rem" }}>
          
          {/* Sandbox Mock Alert */}
          {!hasSupabaseCredentials && (
            <div className="news-timeline-info" style={{ borderColor: "var(--accent-purple)", marginBottom: "2rem" }}>
              <span>⚡ <strong>Running in Mock Sandbox Mode:</strong> Supabase keys are missing in `.env.local`. All prompt edits, additions, and deletions will reside in local memory only and reset upon browser refresh. Connect Supabase to write permanently!</span>
            </div>
          )}

          {dbLoading && (
            <div style={{ marginBottom: "2rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              <span>Syncing records with Supabase...</span>
            </div>
          )}

          {/* PANEL A: PROMPTS */}
          {activePanel === "prompts" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                  <h1 style={{ fontSize: "1.6rem", fontWeight: "700", letterSpacing: "-0.02em" }}>Prompts Manager</h1>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Create, edit, and organize prompt items inside the search engine grid.</p>
                </div>
                <button onClick={() => openPromptModal()} className="action-btn-large" style={{ padding: "0.55rem 1.25rem", borderRadius: "var(--radius-sm)" }}>
                  + Add New Prompt
                </button>
              </div>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Platform</th>
                    <th>Difficulty</th>
                    <th>Views / Likes</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prompts.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: "600" }}>{item.title}</td>
                      <td><span className="table-badge">{item.category}</span></td>
                      <td>{item.targetAI}</td>
                      <td>{item.difficulty}</td>
                      <td>👁️ {item.views} / ❤️ {item.likes}</td>
                      <td style={{ textAlign: "right" }}>
                        <button onClick={() => openPromptModal(item)} className="table-action-edit" style={{ marginRight: "0.5rem" }}>Edit</button>
                        <button onClick={() => handlePromptDelete(item.id)} className="table-action-delete">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PANEL B: NEWS RADAR */}
          {activePanel === "news" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                  <h1 style={{ fontSize: "1.6rem", fontWeight: "700", letterSpacing: "-0.02em" }}>Release Radar Updates</h1>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Manage chronological releases, updates, and model drops timeline announcements.</p>
                </div>
                <button onClick={() => openNewsModal()} className="action-btn-large" style={{ padding: "0.55rem 1.25rem", borderRadius: "var(--radius-sm)" }}>
                  + Add New Release
                </button>
              </div>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {news.map((item) => (
                    <tr key={item.id}>
                      <td>{item.date}</td>
                      <td style={{ fontWeight: "600" }}>{item.title}</td>
                      <td><span className="table-badge">{item.category}</span></td>
                      <td>
                        <span className={`news-card__importance-badge importance--${item.importance}`}>
                          {item.importance}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button onClick={() => openNewsModal(item)} className="table-action-edit" style={{ marginRight: "0.5rem" }}>Edit</button>
                        <button onClick={() => handleNewsDelete(item.id)} className="table-action-delete">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PANEL C: NEWSLETTER SUBSCRIBERS */}
          {activePanel === "subscribers" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                  <h1 style={{ fontSize: "1.6rem", fontWeight: "700", letterSpacing: "-0.02em" }}>Newsletter Subscriptions</h1>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Timeline registry of visitor email signups recorded from footer landing forms.</p>
                </div>
                <button onClick={handleCopyEmails} className="action-btn-large" style={{ padding: "0.55rem 1.25rem", borderRadius: "var(--radius-sm)" }}>
                  📋 Copy All Emails
                </button>
              </div>

              <table className="admin-table" style={{ maxWidth: "800px" }}>
                <thead>
                  <tr>
                    <th>Joined Date</th>
                    <th>Email Address</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((item) => (
                    <tr key={item.id}>
                      <td>{new Date(item.created_at).toLocaleDateString()}</td>
                      <td style={{ fontWeight: "600" }}>{item.email}</td>
                      <td style={{ textAlign: "right" }}>
                        <button onClick={() => handleSubscriberDelete(item.id)} className="table-action-delete">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PANEL D: SYSTEM STATUS */}
          {activePanel === "status" && (
            <div>
              <h1 style={{ fontSize: "1.6rem", fontWeight: "700", letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>System Status & Credentials</h1>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "2rem" }}>Check environment connections and API settings.</p>

              <div className="status-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                
                {/* Supabase Status Card */}
                <div className="status-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "1.5rem", borderRadius: "var(--radius-md)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <span style={{ fontWeight: "700" }}>Supabase Database Connection</span>
                    <span className={`status-tag ${hasSupabaseCredentials ? "status-tag--online" : "status-tag--offline"}`}>
                      {hasSupabaseCredentials ? "ONLINE" : "MISSING"}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                    Handles prompt entries, radar articles, views counters, and email subscribers registers. Configured in your `.env.local` file.
                  </p>
                </div>

                {/* Resend Status Card */}
                <div className="status-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "1.5rem", borderRadius: "var(--radius-md)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <span style={{ fontWeight: "700" }}>Resend Marketing List Sync</span>
                    <span className={`status-tag ${process.env.NEXT_PUBLIC_RESEND_CONNECTED === "true" || (typeof window === "undefined" ? false : !!(process.env.RESEND_API_KEY)) ? "status-tag--online" : "status-tag--offline"}`}>
                      {!!(process.env.RESEND_API_KEY) ? "ONLINE" : "MISSING"}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                    Pushes subscribers to your Resend.com dashboard. If offline, submissions are saved to the Supabase backup table automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL 1: CREATE / EDIT PROMPT */}
      {isPromptModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsPromptModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "650px" }}>
            <button className="modal-close-btn" onClick={() => setIsPromptModalOpen(false)}>&times;</button>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "700", marginBottom: "1.5rem" }}>
              {editingPrompt ? "Edit Prompt Record" : "Create New Prompt Record"}
            </h2>

            <form onSubmit={handlePromptSave} className="admin-form">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="builder-field">
                  <label className="builder-field__label">Prompt ID</label>
                  <input
                    type="text"
                    className="builder-input"
                    value={promptForm.id}
                    disabled={!!editingPrompt}
                    onChange={(e) => setPromptForm({ ...promptForm, id: e.target.value })}
                    required
                  />
                </div>
                <div className="builder-field">
                  <label className="builder-field__label">Slug (SEO Link URL)</label>
                  <input
                    type="text"
                    className="builder-input"
                    value={promptForm.slug}
                    onChange={(e) => setPromptForm({ ...promptForm, slug: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="builder-field">
                <label className="builder-field__label">Title</label>
                <input
                  type="text"
                  className="builder-input"
                  value={promptForm.title}
                  onChange={(e) => setPromptForm({ ...promptForm, title: e.target.value })}
                  placeholder="e.g. Secure Payment Form"
                  required
                />
              </div>

              <div className="builder-field">
                <label className="builder-field__label">Short Description</label>
                <textarea
                  className="builder-input"
                  style={{ minHeight: "60px", fontFamily: "inherit" }}
                  value={promptForm.description}
                  onChange={(e) => setPromptForm({ ...promptForm, description: e.target.value })}
                  placeholder="Summarize prompt outputs..."
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div className="builder-field">
                  <label className="builder-field__label">Category</label>
                  <select
                    className="builder-select"
                    value={promptForm.category}
                    onChange={(e) => setPromptForm({ ...promptForm, category: e.target.value as any })}
                  >
                    <option value="web-app">Web Apps</option>
                    <option value="blog">Web Content</option>
                    <option value="image-gen">Image Gen</option>
                  </select>
                </div>
                <div className="builder-field">
                  <label className="builder-field__label">Target Model AI</label>
                  <input
                    type="text"
                    className="builder-input"
                    value={promptForm.targetAI}
                    onChange={(e) => setPromptForm({ ...promptForm, targetAI: e.target.value })}
                    required
                  />
                </div>
                <div className="builder-field">
                  <label className="builder-field__label">Complexity Level</label>
                  <select
                    className="builder-select"
                    value={promptForm.difficulty}
                    onChange={(e) => setPromptForm({ ...promptForm, difficulty: e.target.value as any })}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="builder-field">
                <label className="builder-field__label">Prompt Prompt Code (PromptText)</label>
                <textarea
                  className="builder-input"
                  style={{ minHeight: "120px", fontFamily: "monospace", fontSize: "0.8rem" }}
                  value={promptForm.promptText}
                  onChange={(e) => setPromptForm({ ...promptForm, promptText: e.target.value })}
                  placeholder="Act as a developer and build..."
                  required
                />
              </div>

              <div className="builder-field">
                <label className="builder-field__label">Expected Output Preview (OutputDescription)</label>
                <textarea
                  className="builder-input"
                  style={{ minHeight: "60px", fontFamily: "inherit" }}
                  value={promptForm.outputDescription}
                  onChange={(e) => setPromptForm({ ...promptForm, outputDescription: e.target.value })}
                  placeholder="A fully responsive dashboard containing SVG graphics..."
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "2rem" }}>
                <button type="button" className="prompt-btn--details" style={{ padding: "0.55rem 1.25rem" }} onClick={() => setIsPromptModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="action-btn-large" style={{ padding: "0.55rem 1.25rem" }}>
                  Save Prompt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE / EDIT NEWS RELEASE */}
      {isNewsModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsNewsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <button className="modal-close-btn" onClick={() => setIsNewsModalOpen(false)}>&times;</button>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "700", marginBottom: "1.5rem" }}>
              {editingNews ? "Edit Radar Update" : "Create Radar Update"}
            </h2>

            <form onSubmit={handleNewsSave} className="admin-form">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="builder-field">
                  <label className="builder-field__label">News ID</label>
                  <input
                    type="text"
                    className="builder-input"
                    value={newsForm.id}
                    disabled={!!editingNews}
                    onChange={(e) => setNewsForm({ ...newsForm, id: e.target.value })}
                    required
                  />
                </div>
                <div className="builder-field">
                  <label className="builder-field__label">Slug (SEO Link URL)</label>
                  <input
                    type="text"
                    className="builder-input"
                    value={newsForm.slug}
                    onChange={(e) => setNewsForm({ ...newsForm, slug: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="builder-field">
                <label className="builder-field__label">Title</label>
                <input
                  type="text"
                  className="builder-input"
                  value={newsForm.title}
                  onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                  placeholder="e.g. Gemini 2.5 Pro Drops Globally"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div className="builder-field">
                  <label className="builder-field__label">Category</label>
                  <select
                    className="builder-select"
                    value={newsForm.category}
                    onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value as any })}
                  >
                    <option value="Model Release">Model Release</option>
                    <option value="Industry News">Industry News</option>
                    <option value="API Updates">API Updates</option>
                  </select>
                </div>
                <div className="builder-field">
                  <label className="builder-field__label">Importance (Priority)</label>
                  <select
                    className="builder-select"
                    value={newsForm.importance}
                    onChange={(e) => setNewsForm({ ...newsForm, importance: e.target.value as any })}
                  >
                    <option value="high">High priority</option>
                    <option value="medium">Medium priority</option>
                    <option value="low">Low priority</option>
                  </select>
                </div>
                <div className="builder-field">
                  <label className="builder-field__label">Official Source URL</label>
                  <input
                    type="text"
                    className="builder-input"
                    value={newsForm.sourceUrl}
                    onChange={(e) => setNewsForm({ ...newsForm, sourceUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="builder-field">
                <label className="builder-field__label">Summary (Abstract overview)</label>
                <textarea
                  className="builder-input"
                  style={{ minHeight: "60px", fontFamily: "inherit" }}
                  value={newsForm.summary}
                  onChange={(e) => setNewsForm({ ...newsForm, summary: e.target.value })}
                  placeholder="Short, two-sentence description..."
                  required
                />
              </div>

              <div className="builder-field">
                <label className="builder-field__label">Full coverage detail content</label>
                <textarea
                  className="builder-input"
                  style={{ minHeight: "100px", fontFamily: "inherit" }}
                  value={newsForm.content}
                  onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                  placeholder="Detailed release logs..."
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "2rem" }}>
                <button type="button" className="prompt-btn--details" style={{ padding: "0.55rem 1.25rem" }} onClick={() => setIsNewsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="action-btn-large" style={{ padding: "0.55rem 1.25rem" }}>
                  Save Radar Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
