"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase, hasSupabaseCredentials } from "@/lib/supabase";

export type SiteHeaderTab = "builder" | "news" | "workspace";

interface SiteHeaderProps {
  variant?: "public" | "admin";
  activeUser?: { email?: string | null } | null;
  onSignOut?: () => void;
  /** Highlights the current nav item. */
  activeNav?: "explore" | "calculator" | "resources" | "submit-prompt" | SiteHeaderTab | null;
}

export default function SiteHeader({
  variant = "public",
  activeUser: propActiveUser,
  onSignOut,
  activeNav = null,
}: SiteHeaderProps) {
  const [activeUser, setActiveUser] = useState<{ email?: string | null } | null>(null);

  // Synchronize state with prop if passed from parent
  useEffect(() => {
    if (propActiveUser !== undefined) {
      setActiveUser(propActiveUser);
    }
  }, [propActiveUser]);

  // Load session automatically on mount (for pages that don't pass activeUser)
  useEffect(() => {
    if (propActiveUser !== undefined) return;

    // 1. Check Mock session
    try {
      const mockUserStr = localStorage.getItem("appprompthub_mock_user");
      if (mockUserStr) {
        setActiveUser(JSON.parse(mockUserStr));
      }
    } catch (e) {
      console.error("Failed to load mock user session:", e);
    }

    // 2. Check Supabase session
    if (hasSupabaseCredentials) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setActiveUser(session.user);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setActiveUser(session?.user ?? null);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [propActiveUser]);

  const handleSignOut = async () => {
    try {
      if (onSignOut) {
        await onSignOut();
      }
      if (hasSupabaseCredentials) {
        await supabase.auth.signOut();
      } else {
        localStorage.removeItem("appprompthub_mock_user");
      }
      setActiveUser(null);
      // Reload page to propagate auth change state
      window.location.reload();
    } catch (e) {
      console.error("Sign out failed:", e);
    }
  };

  if (variant === "admin") {
    return (
      <header className="app-header">
        <div className="app-header__container">
          <div className="logo-container" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <img src="/logo-mark.png" alt="Logo" style={{ width: "250px" }} />
            <span className="admin-pill">Admin</span>
          </div>
          <nav className="nav-links" style={{ display: "flex", alignItems: "center" }}>
            <Link href="/" className="nav-link" style={{ textDecoration: "underline" }}>View Front Website</Link>
            <button type="button" className="nav-link" onClick={handleSignOut} style={{ color: "var(--accent-red)" }}>
              Log Out
            </button>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="app-header">
      <div className="app-header__container">
        <Link href="/" className="logo-container" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <img src="/logo-mark.png" alt="Logo" style={{ width: "250px" }} />
        </Link>
        <nav className="nav-links" style={{ display: "flex", alignItems: "center" }}>
          <Link
            href="/explore"
            className={`nav-link${activeNav === "explore" ? " nav-link--active" : ""}`}
          >
            Explore
          </Link>
          <Link
            href="/custom-builder"
            className={`nav-link${activeNav === "builder" ? " nav-link--active" : ""}`}
          >
            Custom Builder
          </Link>
          <Link
            href="/ai-news"
            className={`nav-link${activeNav === "news" ? " nav-link--active" : ""}`}
          >
            AI News
          </Link>
          <Link
            href="/for-business/calculator"
            className={`nav-link${activeNav === "calculator" ? " nav-link--active" : ""}`}
          >
            Calculator
          </Link>
          <Link
            href="/resources"
            className={`nav-link${activeNav === "resources" ? " nav-link--active" : ""}`}
          >
            Resources
          </Link>
          {/* Submit Prompt link removed from header navigation */}

          {activeUser ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginLeft: "1.25rem", borderLeft: "1px solid var(--border-color)", paddingLeft: "1.25rem" }}>
              <Link
                href="/workspace"
                className={`nav-link${activeNav === "workspace" ? " nav-link--active" : ""}`}
                style={{ color: "var(--accent-purple)", fontWeight: 700 }}
              >
                My Workspace
              </Link>
              <button
                type="button"
                aria-label="Sign out of workspace"
                onClick={handleSignOut}
                style={{ fontSize: "0.8rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/workspace"
              className={`nav-link${activeNav === "workspace" ? " nav-link--active" : ""}`}
              style={{ marginLeft: "1.25rem", padding: "0.45rem 1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--accent-purple)", color: "#fff", background: "rgba(124, 58, 237, 0.08)", fontWeight: 600, transition: "var(--transition-fast)" }}
            >
              Sign In / Sign Up
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
