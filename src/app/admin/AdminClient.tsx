"use client";

import React, { useState, useEffect, useCallback } from "react";
import SiteHeader from "@/components/SiteHeader";
import { PromptItem, NewsItem } from "../../types";

interface SubscriberItem {
  id: string;
  email: string;
  created_at: string;
}

export default function AdminClient() {
  // Auth is server-side: we only track whether the current session cookie is
  // valid. The password is never held or compared in the browser.
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [serverConfigured, setServerConfigured] = useState(true);
  const [activePanel, setActivePanel] = useState<"prompts" | "news" | "subscribers" | "status">("prompts");

  // Data lists (populated from the authorized server endpoint; no mock seed).
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    difficulty: "Intermediate" as "Beginner" | "Intermediate" | "Advanced",
    expectedOutputImageUrl: "",
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
    sourceUrl: "",
  });

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

  // Fetch all lists from the authorized admin endpoint.
  const loadDatabaseData = useCallback(async () => {
    setDbLoading(true);
    try {
      const res = await fetch("/api/admin/data");
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (res.status === 503) {
        setServerConfigured(false);
        triggerToast(data.error || "Server is not fully configured.");
        return;
      }
      if (!res.ok) {
        triggerToast(data.error || "Failed to fetch records.");
        return;
      }
      setServerConfigured(true);
      setPrompts(data.prompts ?? []);
      setNews(data.news ?? []);
      setSubscribers(data.subscribers ?? []);
    } catch {
      triggerToast("Could not reach the server.");
    } finally {
      setDbLoading(false);
    }
  }, []);

  // On mount, ask the server whether the session cookie is valid.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/session");
        const data = await res.json().catch(() => ({}));
        if (data.configured === false) setServerConfigured(false);
        if (data.authenticated) {
          setIsAuthenticated(true);
          await loadDatabaseData();
        }
      } catch {
        // network issue; leave unauthenticated
      } finally {
        setAuthChecked(true);
      }
    })();
  }, [loadDatabaseData]);

  // Handle Login (server-verified)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsAuthenticated(true);
        setPasswordInput("");
        triggerToast("Access granted. Welcome, admin.");
        await loadDatabaseData();
      } else if (res.status === 429) {
        triggerToast("Too many attempts. Please wait a minute and try again.");
      } else if (res.status === 503) {
        setServerConfigured(false);
        triggerToast(data.error || "Admin auth is not configured on the server.");
      } else {
        triggerToast(data.error || "Access denied.");
      }
    } catch {
      triggerToast("Could not reach the server.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // ignore; clearing local state below is enough for the UI
    }
    setIsAuthenticated(false);
    setPrompts([]);
    setNews([]);
    setSubscribers([]);
    triggerToast("Logged out.");
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
        difficulty: item.difficulty,
        expectedOutputImageUrl: item.expectedOutputImageUrl || "",
      });
    } else {
      setEditingPrompt(null);
      setPromptForm({
        id: "",
        slug: "",
        title: "",
        description: "",
        category: "web-app",
        targetAI: "Claude 3.5 Sonnet",
        promptText: "",
        outputDescription: "",
        difficulty: "Intermediate",
        expectedOutputImageUrl: "",
      });
    }
    setIsPromptModalOpen(true);
  };

  const handlePromptSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    const isEdit = !!editingPrompt;

    // Note: no id/views/likes/date — the server owns those. Editing never
    // clobbers live counters.
    const payload = {
      slug: promptForm.slug,
      title: promptForm.title,
      description: promptForm.description,
      category: promptForm.category,
      targetAI: promptForm.targetAI,
      promptText: promptForm.promptText,
      outputDescription: promptForm.outputDescription,
      difficulty: promptForm.difficulty,
      expectedOutputImageUrl: promptForm.expectedOutputImageUrl,
    };

    setIsSaving(true);
    try {
      const res = await fetch(
        isEdit ? `/api/admin/prompts/${editingPrompt!.id}` : "/api/admin/prompts",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setIsAuthenticated(false);
        triggerToast("Session expired. Please log in again.");
        return;
      }
      if (!res.ok) {
        triggerToast(data.error || "Failed to save prompt.");
        return;
      }
      // Only touch local state after a confirmed server write.
      const saved = data.prompt as PromptItem;
      setPrompts((prev) =>
        isEdit ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev]
      );
      triggerToast(isEdit ? "Prompt updated." : "Prompt created.");
      setIsPromptModalOpen(false);
    } catch {
      triggerToast("Could not reach the server.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePromptDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prompt?")) return;
    try {
      const res = await fetch(`/api/admin/prompts/${id}`, { method: "DELETE" });
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        triggerToast(data.error || "Delete failed.");
        return;
      }
      setPrompts((prev) => prev.filter((p) => p.id !== id));
      triggerToast("Prompt deleted.");
    } catch {
      triggerToast("Could not reach the server.");
    }
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
        sourceUrl: item.sourceUrl || "",
      });
    } else {
      setEditingNews(null);
      setNewsForm({
        id: "",
        slug: "",
        title: "",
        category: "Model Release",
        summary: "",
        content: "",
        importance: "high",
        sourceUrl: "",
      });
    }
    setIsNewsModalOpen(true);
  };

  const handleNewsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    const isEdit = !!editingNews;

    const payload = {
      slug: newsForm.slug,
      title: newsForm.title,
      category: newsForm.category,
      summary: newsForm.summary,
      content: newsForm.content,
      importance: newsForm.importance,
      sourceUrl: newsForm.sourceUrl,
    };

    setIsSaving(true);
    try {
      const res = await fetch(
        isEdit ? `/api/admin/news/${editingNews!.id}` : "/api/admin/news",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setIsAuthenticated(false);
        triggerToast("Session expired. Please log in again.");
        return;
      }
      if (!res.ok) {
        triggerToast(data.error || "Failed to save news article.");
        return;
      }
      const saved = data.news as NewsItem;
      setNews((prev) =>
        isEdit ? prev.map((n) => (n.id === saved.id ? saved : n)) : [saved, ...prev]
      );
      triggerToast(isEdit ? "News article updated." : "News article created.");
      setIsNewsModalOpen(false);
    } catch {
      triggerToast("Could not reach the server.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewsDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this release update?")) return;
    try {
      const res = await fetch(`/api/admin/news/${id}`, { method: "DELETE" });
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        triggerToast(data.error || "Delete failed.");
        return;
      }
      setNews((prev) => prev.filter((n) => n.id !== id));
      triggerToast("News article deleted.");
    } catch {
      triggerToast("Could not reach the server.");
    }
  };

  // SUBSCRIBERS ACTIONS
  const handleSubscriberDelete = async (id: string) => {
    if (!confirm("Remove this email from subscribers list?")) return;
    try {
      const res = await fetch(`/api/admin/subscribers/${id}`, { method: "DELETE" });
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        triggerToast(data.error || "Delete failed.");
        return;
      }
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
      triggerToast("Subscriber removed.");
    } catch {
      triggerToast("Could not reach the server.");
    }
  };

  const handleCopyEmails = () => {
    const list = subscribers.map((s) => s.email).join(", ");
    navigator.clipboard
      .writeText(list)
      .then(() => triggerToast("Copied subscriber list to clipboard!"))
      .catch(() => triggerToast("Could not access the clipboard."));
  };

  // Avoid flashing the login form before we know the session state.
  if (!authChecked) {
    return (
      <div
        className="app-shell"
        style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", color: "var(--text-secondary)" }}
      >
        <span>Checking session…</span>
      </div>
    );
  }

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

          {!serverConfigured && (
            <div className="news-timeline-info" style={{ borderColor: "var(--accent-red)", marginBottom: "1.25rem", textAlign: "left" }}>
              <span>⚠️ Admin access is not configured on the server. Set <code>ADMIN_PASSWORD</code> (and <code>SUPABASE_SERVICE_ROLE_KEY</code>) in the server environment.</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit}>
            <div style={{ marginBottom: "1.25rem", textAlign: "left" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.4rem", display: "block" }}>Password</label>
              <input
                type="password"
                className="builder-input"
                style={{ width: "100%" }}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter admin password"
                autoComplete="current-password"
                required
              />
            </div>
            <button type="submit" className="action-btn-large" style={{ width: "100%" }} disabled={loginLoading}>
              {loginLoading ? "Authorizing…" : "Authorize Login"}
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
      <SiteHeader variant="admin" onSignOut={handleLogout} />

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

          {/* Server config warning */}
          {!serverConfigured && (
            <div className="news-timeline-info" style={{ borderColor: "var(--accent-red)", marginBottom: "2rem" }}>
              <span>⚠️ <strong>Server not fully configured:</strong> the Supabase service-role key is missing, so writes will fail. Set <code>SUPABASE_SERVICE_ROLE_KEY</code> in the server environment.</span>
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
                  {prompts.length === 0 && !dbLoading && (
                    <tr><td colSpan={6} style={{ color: "var(--text-muted)" }}>No prompts yet.</td></tr>
                  )}
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
                  {news.length === 0 && !dbLoading && (
                    <tr><td colSpan={5} style={{ color: "var(--text-muted)" }}>No releases yet.</td></tr>
                  )}
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
                  {subscribers.length === 0 && !dbLoading && (
                    <tr><td colSpan={3} style={{ color: "var(--text-muted)" }}>No subscribers yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* PANEL D: SYSTEM STATUS */}
          {activePanel === "status" && (
            <div>
              <h1 style={{ fontSize: "1.6rem", fontWeight: "700", letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>System Status &amp; Credentials</h1>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "2rem" }}>Check environment connections and API settings.</p>

              <div className="status-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>

                {/* Supabase Status Card */}
                <div className="status-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "1.5rem", borderRadius: "var(--radius-md)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <span style={{ fontWeight: "700" }}>Supabase Database Connection</span>
                    <span className={`status-tag ${serverConfigured ? "status-tag--online" : "status-tag--offline"}`}>
                      {serverConfigured ? "ONLINE" : "MISSING"}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                    Handles prompt entries, radar articles, views counters, and email subscribers. Admin writes use the server-side service-role key.
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
                    value={editingPrompt ? promptForm.id : ""}
                    disabled
                    placeholder="Auto-generated on save"
                  />
                </div>
                <div className="builder-field">
                  <label className="builder-field__label">Slug (SEO Link URL)</label>
                  <input
                    type="text"
                    className="builder-input"
                    value={promptForm.slug}
                    onChange={(e) => setPromptForm({ ...promptForm, slug: e.target.value })}
                    placeholder="lowercase-with-hyphens"
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
                    onChange={(e) => setPromptForm({ ...promptForm, category: e.target.value as typeof promptForm.category })}
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
                    onChange={(e) => setPromptForm({ ...promptForm, difficulty: e.target.value as typeof promptForm.difficulty })}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="builder-field">
                <label className="builder-field__label">Prompt Text</label>
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
                <label className="builder-field__label">Expected Output Preview</label>
                <textarea
                  className="builder-input"
                  style={{ minHeight: "60px", fontFamily: "inherit" }}
                  value={promptForm.outputDescription}
                  onChange={(e) => setPromptForm({ ...promptForm, outputDescription: e.target.value })}
                  placeholder="A fully responsive dashboard containing SVG graphics..."
                  required
                />
              </div>

              <div className="builder-field">
                <label className="builder-field__label">Expected Output Screenshot URL</label>
                <input
                  type="text"
                  className="builder-input"
                  value={promptForm.expectedOutputImageUrl}
                  onChange={(e) => setPromptForm({ ...promptForm, expectedOutputImageUrl: e.target.value })}
                  placeholder="e.g. /previews/saas-dashboard.jpg"
                />
              </div>

              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "2rem" }}>
                <button type="button" className="prompt-btn--details" style={{ padding: "0.55rem 1.25rem" }} onClick={() => setIsPromptModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="action-btn-large" style={{ padding: "0.55rem 1.25rem" }} disabled={isSaving}>
                  {isSaving ? "Saving…" : "Save Prompt"}
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
                    value={editingNews ? newsForm.id : ""}
                    disabled
                    placeholder="Auto-generated on save"
                  />
                </div>
                <div className="builder-field">
                  <label className="builder-field__label">Slug (SEO Link URL)</label>
                  <input
                    type="text"
                    className="builder-input"
                    value={newsForm.slug}
                    onChange={(e) => setNewsForm({ ...newsForm, slug: e.target.value })}
                    placeholder="lowercase-with-hyphens"
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
                    onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value as typeof newsForm.category })}
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
                    onChange={(e) => setNewsForm({ ...newsForm, importance: e.target.value as typeof newsForm.importance })}
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
                <button type="submit" className="action-btn-large" style={{ padding: "0.55rem 1.25rem" }} disabled={isSaving}>
                  {isSaving ? "Saving…" : "Save Radar Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
