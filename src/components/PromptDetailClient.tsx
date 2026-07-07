"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import SiteHeader from "./SiteHeader";
import { PromptItem } from "../types";
import { supabase, hasSupabaseCredentials } from "../lib/supabase";

interface FeedbackItem {
  id: string;
  prompt_id: string;
  user_email: string;
  worked: boolean;
  comment: string | null;
  created_at: string;
}

interface PromptDetailClientProps {
  prompt: PromptItem;
}

export default function PromptDetailClient({ prompt }: PromptDetailClientProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sandboxInputs, setSandboxInputs] = useState<Record<string, string>>({});
  
  // Voting & Feedback States
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  
  // User Auth status
  const [activeUser, setActiveUser] = useState<{ id?: string; email: string } | null>(null);

  // Pay-per-unlock States
  const [unlockedFullText, setUnlockedFullText] = useState<string | null>(null);
  const [checkingUnlock, setCheckingUnlock] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showEmailPromptModal, setShowEmailPromptModal] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  
  // Simulated Checkout Sandbox States
  const [showMockCheckout, setShowMockCheckout] = useState(false);
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [checkoutPromptId, setCheckoutPromptId] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("424");

  // Load Auth Session
  useEffect(() => {
    try {
      const storedMockUser = localStorage.getItem("appprompthub_mock_user");
      if (storedMockUser) {
        const parsed = JSON.parse(storedMockUser);
        Promise.resolve().then(() => {
          setActiveUser(parsed);
        });
      }
    } catch (e) {
      console.error(e);
    }

    if (!hasSupabaseCredentials) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        Promise.resolve().then(() => {
          setActiveUser({ id: session.user.id, email: session.user.email ?? "" });
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      Promise.resolve().then(() => {
        if (session?.user) {
          setActiveUser({ id: session.user.id, email: session.user.email ?? "" });
        } else {
          setActiveUser(null);
        }
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load Feedbacks helper
  const loadFeedbacks = useCallback(async () => {
    if (hasSupabaseCredentials) {
      try {
        const { data, error } = await supabase
          .from("prompt_feedback")
          .select("*")
          .eq("prompt_id", prompt.id)
          .order("created_at", { ascending: false });
        if (!error && data) {
          setFeedbacks(data as FeedbackItem[]);
        }
      } catch (err) {
        console.error("Failed to load feedbacks:", err);
      }
    } else {
      const localFeedbacks = JSON.parse(localStorage.getItem(`feedbacks_${prompt.id}`) || "[]");
      setFeedbacks(localFeedbacks);
    }
  }, [prompt.id]);

  // Check pay-per-unlock status
  const checkUnlockStatus = useCallback(async () => {
    const isPremium = (prompt.priceCents ?? 0) > 0;
    if (!isPremium) {
      setUnlockedFullText(prompt.promptText);
      return;
    }

    setCheckingUnlock(true);
    const email = activeUser?.email || "";

    if (hasSupabaseCredentials) {
      try {
        const { data, error } = await supabase.rpc("get_prompt_full_text", {
          p_prompt_id: prompt.id,
          p_user_email: email
        });
        if (!error && data) {
          setUnlockedFullText(data);
        } else {
          setUnlockedFullText(null);
        }
      } catch (e) {
        console.error("Error calling get_prompt_full_text RPC:", e);
        // Fallback checks
        setUnlockedFullText(null);
      }
    } else {
      // LocalStorage mock check
      const localUnlocks = JSON.parse(localStorage.getItem("appprompthub_unlocks") || "[]");
      const isUnlocked = localUnlocks.includes(`${email}_${prompt.id}`) || 
                         (email && localUnlocks.includes(`${email}_${prompt.id}`)) ||
                         localUnlocks.includes(`guest_${prompt.id}`);
      if (isUnlocked) {
        setUnlockedFullText(prompt.fullText || prompt.promptText);
      } else {
        setUnlockedFullText(null);
      }
    }
    setCheckingUnlock(false);
  }, [prompt.id, prompt.promptText, prompt.fullText, prompt.priceCents, activeUser?.email]);

  // Load view counts, feedbacks, unlock status, and listen for URL parameters
  useEffect(() => {
    let active = true;

    async function loadPageData() {
      // 1. Increment view counter locally
      if (hasSupabaseCredentials) {
        try {
          await supabase
            .from("prompts")
            .update({ views: prompt.views + 1 })
            .eq("id", prompt.id);
        } catch (e) {
          console.warn("[views increment failed]", e);
        }
      }

      // 2. Load feedbacks & check unlock
      if (active) {
        loadFeedbacks();
        checkUnlockStatus();
      }
    }

    loadPageData();

    // Check search params for mock checkout redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get("mock_checkout") === "true") {
      const pid = params.get("promptId") || "";
      const email = params.get("email") || "";
      if (pid === prompt.id) {
        Promise.resolve().then(() => {
          setCheckoutPromptId(pid);
          setCheckoutEmail(email);
          setShowMockCheckout(true);
        });
      }
    }

    return () => {
      active = false;
    };
  }, [prompt.id, prompt.views, loadFeedbacks, checkUnlockStatus]);

  // Trigger check unlock when active user updates
  useEffect(() => {
    Promise.resolve().then(() => {
      checkUnlockStatus();
    });
  }, [activeUser, checkUnlockStatus]);

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

  const handleCopy = (text: string, title: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      triggerToast("Prompt copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const getBrandTheme = (targetAI: string) => {
    const ai = targetAI.toLowerCase();
    if (ai.includes("claude")) return { gradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", color: "#c084fc" };
    if (ai.includes("chatgpt") || ai.includes("gpt")) return { gradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)", color: "#34d399" };
    if (ai.includes("midjourney")) return { gradient: "linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)", color: "#60a5fa" };
    if (ai.includes("stable diffusion")) return { gradient: "linear-gradient(135deg, #db2777 0%, #f43f5e 100%)", color: "#fb7185" };
    return { gradient: "linear-gradient(135deg, #1f2937 0%, #4b5563 100%)", color: "#cbd5e1" };
  };

  const submitFeedback = async (worked: boolean) => {
    if (!activeUser) {
      triggerToast("You must be signed in to submit validation feedback.");
      return;
    }

    setSubmittingFeedback(true);
    const feedbackPayload = {
      prompt_id: prompt.id,
      user_id: activeUser.id || null,
      user_email: activeUser.email,
      worked,
      comment: feedbackComment.trim() || null
    };

    try {
      if (hasSupabaseCredentials) {
        const { error } = await supabase
          .from("prompt_feedback")
          .upsert(feedbackPayload, { onConflict: "prompt_id, user_email" });

        if (error) throw error;
        triggerToast("Thank you for validating this prompt!");
      } else {
        // Sandbox Mock Mode
        let localFeedbacks = JSON.parse(localStorage.getItem(`feedbacks_${prompt.id}`) || "[]");
        localFeedbacks = localFeedbacks.filter((f: FeedbackItem) => f.user_email !== activeUser.email);
        localFeedbacks.unshift({
          ...feedbackPayload,
          id: Math.random().toString(),
          created_at: new Date().toISOString()
        });
        localStorage.setItem(`feedbacks_${prompt.id}`, JSON.stringify(localFeedbacks));
        triggerToast("Feedback submitted (Sandbox Mock)!");
      }
      setFeedbackComment("");
      loadFeedbacks();
    } catch (err: unknown) {
      console.error("Feedback submit error:", err);
      const errMsg = err instanceof Error ? err.message : "Failed to submit feedback.";
      triggerToast(errMsg);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Start checkout flow for pay-per-unlock
  const handleUnlockClick = () => {
    if (activeUser?.email) {
      startCheckoutFlow(activeUser.email);
    } else {
      setShowEmailPromptModal(true);
    }
  };

  const startCheckoutFlow = async (email: string) => {
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId: prompt.id, userEmail: email }),
      });
      const data = await res.json();
      if (data.url) {
        // Redirect to Stripe or Mock Checkout URL
        window.location.href = data.url;
      } else {
        triggerToast(data.error || "Failed to initialize checkout.");
      }
    } catch (err) {
      console.error("Checkout integration error:", err);
      triggerToast("Error launching Stripe checkout session.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleGuestEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail.trim()) return;
    setShowEmailPromptModal(false);
    startCheckoutFlow(guestEmail.trim());
  };

  const handleCompleteMockCheckout = async () => {
    setPaymentLoading(true);
    try {
      // 1. Call api/pay/unlock to register unlock in database
      const res = await fetch("/api/pay/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId: checkoutPromptId, userEmail: checkoutEmail }),
      });
      if (!res.ok) throw new Error("Failed to register payment on server.");

      // 2. Set local mocks
      const localUnlocks = JSON.parse(localStorage.getItem("appprompthub_unlocks") || "[]");
      const key = `${checkoutEmail}_${checkoutPromptId}`;
      if (!localUnlocks.includes(key)) {
        localUnlocks.push(key);
        localStorage.setItem("appprompthub_unlocks", JSON.stringify(localUnlocks));
      }

      triggerToast("Payment successful! Prompt unlocked.");
      setShowMockCheckout(false);

      // Clean search parameters from url
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      // Reload
      checkUnlockStatus();
    } catch (e: unknown) {
      console.error(e);
      const errMsg = e instanceof Error ? e.message : "Simulated checkout error";
      triggerToast(errMsg);
    } finally {
      setPaymentLoading(false);
    }
  };

  const theme = getBrandTheme(prompt.targetAI);
  const promptVars = extractVariables(prompt.promptText);

  // Compute metrics
  const totalVotes = feedbacks.length;
  const workedVotes = feedbacks.filter((f) => f.worked).length;
  const successRate = totalVotes > 0 ? Math.round((workedVotes / totalVotes) * 100) : 0;

  const isPremium = (prompt.priceCents ?? 0) > 0;
  const isUnlocked = !isPremium || (unlockedFullText !== null);

  return (
    <div className="app-shell">
      {/* Toast Notification */}
      <div className={`toast-notification ${showToast ? "toast-notification--show" : ""}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: "0.4rem" }}><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>{toastMessage}</span>
      </div>

      <SiteHeader />

      <main className="main-content">
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          {/* Back button */}
          <Link href="/explore" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "2rem", transition: "var(--transition-fast)" }} className="hover-highlight">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to Library
          </Link>

          {/* Details layout mimicking the modal contents in a beautiful full-width card */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", padding: "2.5rem", position: "relative", boxShadow: "var(--shadow-md)" }}>
            
            {/* Header banner background */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "6px", background: theme.gradient, borderTopLeftRadius: "var(--radius-lg)", borderTopRightRadius: "var(--radius-lg)" }} />

            <div className="modal__header" style={{ marginTop: "1rem" }}>
              <div className="modal__meta">
                <span className="prompt-card__badge-ai" style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-color)", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", fontWeight: "600" }}>{prompt.targetAI}</span>
                <span className={`prompt-card__difficulty difficulty--${prompt.difficulty.toLowerCase()}`}>
                  {prompt.difficulty}
                </span>
                {totalVotes > 0 && (
                  <span style={{ fontSize: "0.75rem", background: successRate >= 70 ? "rgba(52, 211, 153, 0.1)" : "rgba(244, 63, 94, 0.1)", color: successRate >= 70 ? "var(--accent-green)" : "#fb7185", border: `1px solid ${successRate >= 70 ? "var(--accent-green)" : "#fb7185"}`, padding: "0.2rem 0.5rem", borderRadius: "var(--radius-sm)", fontWeight: "700" }}>
                    {successRate}% Success ({totalVotes} votes)
                  </span>
                )}
                {isPremium && (
                  <span style={{ fontSize: "0.75rem", background: isUnlocked ? "rgba(52, 211, 153, 0.08)" : "rgba(192, 132, 252, 0.08)", color: isUnlocked ? "var(--accent-green)" : "var(--accent-purple)", border: `1px solid ${isUnlocked ? "var(--accent-green)" : "var(--accent-purple)"}`, padding: "0.2rem 0.5rem", borderRadius: "var(--radius-sm)", fontWeight: "700" }}>
                    {isUnlocked ? "Unlocked" : "Premium"}
                  </span>
                )}
              </div>
              <h1 className="modal__title" style={{ fontSize: "2rem", color: "#fff", marginTop: "0.5rem" }}>{prompt.title}</h1>
            </div>

            <h3 className="modal__section-title">Description</h3>
            <p className="modal__description" style={{ fontSize: "0.95rem", lineHeight: "1.6" }}>{prompt.description}</p>

            {/* Sandbox inputs shown only if unlocked */}
            {isUnlocked && promptVars.length > 0 && (
              <div style={{ marginTop: "2rem", marginBottom: "1.75rem" }}>
                <h3 className="modal__section-title">Prompt Sandbox (Variables Editor)</h3>
                <div className="sandbox-variables-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem", marginTop: "0.5rem" }}>
                  {promptVars.map((v) => (
                    <div key={v} className="sandbox-field-group">
                      <label className="sandbox-input-label" style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", fontWeight: "700" }}>{v}</label>
                      <input
                        type="text"
                        placeholder={`Enter value for [${v}]...`}
                        value={sandboxInputs[v] || ""}
                        onChange={(e) => setSandboxInputs(prev => ({ ...prev, [v]: e.target.value }))}
                        className="sandbox-input-field"
                        style={{ width: "100%", padding: "0.6rem 0.8rem", background: "var(--bg-input)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", color: "#fff", fontSize: "0.85rem", transition: "var(--transition-fast)" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h3 className="modal__section-title" style={{ marginTop: "2rem" }}>
              {isUnlocked && promptVars.length > 0 ? "Compiled Prompt Preview" : "Prompt Code"}
            </h3>
            
            <div className="modal__prompt-container" style={{ marginTop: "0.5rem" }}>
              {checkingUnlock ? (
                <pre className="modal__prompt-box" style={{ background: "#020202", border: "1px solid var(--border-color)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
                  Checking purchase unlock status...
                </pre>
              ) : isUnlocked ? (
                <>
                  <pre 
                    className="modal__prompt-box"
                    style={{ maxHeight: "400px", fontSize: "0.85rem", background: "#020202", border: "1px solid var(--border-color)", padding: "1.25rem", borderRadius: "var(--radius-md)", color: "var(--text-secondary)" }}
                    dangerouslySetInnerHTML={{ __html: getHighlightedPreview(unlockedFullText || prompt.promptText, sandboxInputs) }}
                  />
                  <button
                    className="modal__copy-btn"
                    onClick={() => handleCopy(getCompiledPrompt(unlockedFullText || prompt.promptText, sandboxInputs), prompt.title, `detail-${prompt.id}`)}
                    aria-label="Copy compiled prompt text"
                  >
                    {copiedId === `detail-${prompt.id}` ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" color="var(--accent-green)"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    )}
                  </button>
                </>
              ) : (
                /* Premium Blur Overlay Container */
                <div style={{ position: "relative" }}>
                  <pre 
                    className="modal__prompt-box"
                    style={{ filter: "blur(5px)", pointerEvents: "none", userSelect: "none", background: "#020202", border: "1px solid var(--border-color)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}
                  >
                    {prompt.previewText || "Create a single-page React component for a SaaS Analytics Dashboard. It should use HTML5 semantic tags and be styled using a premium, dark-themed dashboard look..."}
                  </pre>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(14, 14, 20, 0.85)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", padding: "1.5rem", textAlign: "center" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2.5" style={{ marginBottom: "0.5rem" }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <span style={{ fontWeight: "700", color: "#fff", fontSize: "1rem", marginBottom: "0.25rem" }}>Premium Prompt Locked</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>Unlock this professional, production-optimized template.</span>
                    <button
                      onClick={handleUnlockClick}
                      disabled={paymentLoading}
                      style={{ background: theme.gradient, color: "#000", fontWeight: "800", border: "none", padding: "0.6rem 1.5rem", fontSize: "0.85rem", borderRadius: "var(--radius-sm)", cursor: "pointer", transition: "var(--transition-fast)" }}
                      className="hover-glow"
                    >
                      {paymentLoading ? "Launching..." : `Unlock for $${((prompt.priceCents || 0) / 100).toFixed(2)}`}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {prompt.outputDescription && (
              <>
                <h3 className="modal__section-title" style={{ marginTop: "2rem" }}>Expected Output Preview</h3>
                <div className="modal__output-box" style={{ background: "rgba(255, 255, 255, 0.015)", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "var(--radius-sm)", fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                  {prompt.outputDescription}
                </div>
              </>
            )}

            {prompt.expectedOutputImageUrl && (
              <div style={{ marginTop: "2rem" }}>
                <h3 className="modal__section-title">Expected Output Screenshot</h3>
                <div 
                  style={{ 
                    border: "1px solid var(--border-color)", 
                    borderRadius: "var(--radius-md)", 
                    overflow: "hidden", 
                    marginTop: "0.5rem", 
                    background: "#020202",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "0.5rem"
                  }}
                >
                  <img 
                    src={prompt.expectedOutputImageUrl} 
                    alt="Expected Output Preview" 
                    style={{ 
                      maxWidth: "100%", 
                      maxHeight: "450px", 
                      height: "auto", 
                      borderRadius: "var(--radius-sm)",
                      objectFit: "contain"
                    }} 
                  />
                </div>
              </div>
            )}

            {/* Voting & Reviews Section */}
            <div style={{ borderTop: "1px solid var(--border-color)", marginTop: "2.5rem", paddingTop: "2rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#fff", marginBottom: "1rem" }}>
                Reliability Validation
              </h3>
              
              {/* Voting actions */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-color)", padding: "1.5rem", borderRadius: "var(--radius-md)", marginBottom: "2rem" }}>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  Did this prompt work for you? Validate its reliability or write a review comment to help other builders.
                </p>
                {activeUser ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <textarea
                      placeholder="Add an optional comment (e.g. models settings used, customized output results)..."
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      style={{ width: "100%", minHeight: "80px", padding: "0.6rem 0.8rem", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", color: "#fff", fontSize: "0.85rem", resize: "vertical" }}
                    />
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <button
                        onClick={() => submitFeedback(true)}
                        disabled={submittingFeedback}
                        style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", fontWeight: "700", background: "rgba(52, 211, 153, 0.15)", border: "1px solid var(--accent-green)", color: "var(--accent-green)", borderRadius: "var(--radius-sm)", transition: "var(--transition-fast)" }}
                        className="hover-glow"
                      >
                        👍 Worked
                      </button>
                      <button
                        onClick={() => submitFeedback(false)}
                        disabled={submittingFeedback}
                        style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", fontWeight: "700", background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", color: "#f87171", borderRadius: "var(--radius-sm)", transition: "var(--transition-fast)" }}
                        className="hover-glow"
                      >
                        👎 Failed
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    You must be <Link href="/?tab=workspace" style={{ color: "var(--accent-purple)", textDecoration: "underline" }}>signed in</Link> to vote or leave a comment.
                  </div>
                )}
              </div>

              {/* Reviews list */}
              <h4 style={{ fontSize: "0.9rem", fontWeight: "700", color: "#fff", marginBottom: "0.75rem" }}>
                Community Feedback ({feedbacks.length})
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {feedbacks.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>No validation reviews submitted yet.</p>
                ) : (
                  feedbacks.map((fb) => (
                    <div key={fb.id || fb.user_email} style={{ background: "rgba(255, 255, 255, 0.01)", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "var(--radius-sm)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--accent-purple)" }}>
                          {fb.user_email}
                        </span>
                        <span style={{ fontSize: "0.75rem", background: fb.worked ? "rgba(52, 211, 153, 0.1)" : "rgba(239, 68, 68, 0.1)", color: fb.worked ? "var(--accent-green)" : "#f87171", border: `1px solid ${fb.worked ? "var(--accent-green)" : "#ef4444"}`, padding: "0.1rem 0.4rem", borderRadius: "var(--radius-sm)", fontWeight: "600" }}>
                          {fb.worked ? "WORKED" : "FAILED"}
                        </span>
                      </div>
                      {fb.comment && (
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                          {fb.comment}
                        </p>
                      )}
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginTop: "0.25rem" }}>
                        {new Date(fb.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom action row with full page copy button (only if unlocked) */}
            {isUnlocked && (
              <div style={{ borderTop: "1px solid var(--border-color)", marginTop: "2.5rem", paddingTop: "1.5rem", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button
                  onClick={() => handleCopy(getCompiledPrompt(unlockedFullText || prompt.promptText, sandboxInputs), prompt.title, `detail-footer-${prompt.id}`)}
                  style={{
                    background: theme.gradient,
                    color: "#000",
                    padding: "0.6rem 1.5rem",
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
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Guest Email Input Modal Overlay */}
      {showEmailPromptModal && (
        <div className="modal-backdrop" onClick={() => setShowEmailPromptModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
            <button className="modal-close-btn" onClick={() => setShowEmailPromptModal(false)} aria-label="Close modal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div className="modal__header" style={{ marginBottom: "1.5rem" }}>
              <h2 className="modal__title" style={{ fontSize: "1.35rem", color: "#fff" }}>Secure Prompt Unlock</h2>
              <p className="modal__description" style={{ marginTop: "0.5rem" }}>Enter your email address to unlock and purchase this premium prompt template.</p>
            </div>
            <form onSubmit={handleGuestEmailSubmit}>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem", fontWeight: "700" }}>Your Email Address</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  required
                  style={{ width: "100%", padding: "0.75rem 1rem", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", color: "#fff", fontSize: "0.9rem" }}
                />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowEmailPromptModal(false)} className="prompt-btn--details" style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}>Cancel</button>
                <button type="submit" style={{ background: theme.gradient, color: "#000", fontWeight: "700", padding: "0.5rem 1.25rem", borderRadius: "var(--radius-sm)", fontSize: "0.8rem" }}>Proceed to Checkout</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulated Checkout Sandbox Modal Overlay */}
      {showMockCheckout && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px", border: "1px solid var(--accent-purple)", boxShadow: "0 0 30px rgba(192, 132, 252, 0.2)" }}>
            <div className="modal__header" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(192, 132, 252, 0.15)", color: "var(--accent-purple)", padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)", fontSize: "0.7rem", fontWeight: "800", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                ⚡ Stripe Sandbox
              </div>
              <h2 className="modal__title" style={{ fontSize: "1.45rem", color: "#fff" }}>Simulated Checkout portal</h2>
              <p className="modal__description" style={{ marginTop: "0.25rem" }}>Testing unlock checkout for <strong>{prompt.title}</strong>.</p>
            </div>

            <div style={{ marginBottom: "1.25rem", fontSize: "0.85rem", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Priced Item:</span>
                <span style={{ color: "#fff", fontWeight: "600" }}>{prompt.title}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Customer Email:</span>
                <span style={{ color: "var(--accent-purple)", fontWeight: "600" }}>{checkoutEmail}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed var(--border-color)", paddingTop: "0.25rem", marginTop: "0.25rem" }}>
                <span style={{ color: "#fff", fontWeight: "700" }}>Total Cost:</span>
                <span style={{ color: "var(--accent-green)", fontWeight: "800", fontSize: "0.95rem" }}>${((prompt.priceCents || 0) / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Mock Credit Card Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
              <div>
                <label style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", fontWeight: "700" }}>Cardholder Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.8rem", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", color: "#fff", fontSize: "0.85rem" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", fontWeight: "700" }}>Card Number</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem 0.8rem 0.6rem 2.2rem", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", color: "#fff", fontSize: "0.85rem", fontFamily: "monospace" }}
                  />
                  <span style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.8rem", color: "var(--text-muted)" }}>💳</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", fontWeight: "700" }}>Expiration Date</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem 0.8rem", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", color: "#fff", fontSize: "0.85rem", fontFamily: "monospace" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", fontWeight: "700" }}>CVC Code</label>
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem 0.8rem", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", color: "#fff", fontSize: "0.85rem", fontFamily: "monospace" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button 
                type="button" 
                onClick={() => {
                  setShowMockCheckout(false);
                  const newUrl = window.location.pathname;
                  window.history.replaceState({}, "", newUrl);
                }} 
                className="prompt-btn--details" 
                style={{ padding: "0.55rem 1.25rem", fontSize: "0.85rem" }}
              >
                Cancel Checkout
              </button>
              <button
                type="button"
                onClick={handleCompleteMockCheckout}
                disabled={paymentLoading}
                style={{ background: "var(--accent-green)", color: "#000", fontWeight: "800", padding: "0.55rem 1.5rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", cursor: "pointer" }}
                className="hover-glow"
              >
                {paymentLoading ? "Processing payment..." : "Pay & Complete Unlock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div className="app-footer__container">
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
