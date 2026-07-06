"use client";

import React, { useState, useEffect } from "react";
import { supabase, hasSupabaseCredentials } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";

interface AffiliateResource {
  id: string;
  name: string;
  category: string;
  description: string;
  referral_url: string;
  discount_code: string | null;
  display_order: number;
}

// Local static fallback seeds
const DEFAULT_RESOURCES: AffiliateResource[] = [
  {
    id: "res-hostinger",
    name: "Hostinger Cloud VPS",
    category: "hosting",
    description: "Optimized, high-performance virtual private servers for deploying Next.js and Supabase databases with ease.",
    referral_url: "https://hostinger.com?referral=appprompthub",
    discount_code: "PROMPTHUB10",
    display_order: 1
  },
  {
    id: "res-namecheap",
    name: "Namecheap Domains",
    category: "domain",
    description: "Quick, reliable domain name registrations with free WHOIS guard privacy protection lifetime plans.",
    referral_url: "https://namecheap.pxf.io/c/appprompthub",
    discount_code: null,
    display_order: 2
  },
  {
    id: "res-stripe",
    name: "Stripe Merchant Network",
    category: "billing",
    description: "The global gold standard payment infrastructure for running secure SaaS credit card subscription checkouts.",
    referral_url: "https://stripe.com",
    discount_code: null,
    display_order: 3
  }
];

export default function ResourcesPage() {
  const [resources, setResources] = useState<AffiliateResource[]>([]);

  useEffect(() => {
    async function loadResources() {
      if (!hasSupabaseCredentials) {
        setResources(DEFAULT_RESOURCES);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("resources_affiliates")
          .select("*")
          .order("display_order", { ascending: true });
        if (error) throw error;
        if (data && data.length > 0) {
          setResources(data);
        } else {
          setResources(DEFAULT_RESOURCES);
        }
      } catch (err) {
        console.warn("Affiliate resources load failed. Fallback loaded.", err);
        setResources(DEFAULT_RESOURCES);
      }
    }
    loadResources();
  }, []);

  return (
    <div className="app-shell" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <SiteHeader activeNav="resources" />

      {/* Main Body */}
      <main style={{ flex: 1, padding: "3rem 1.5rem" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h1 style={{ fontSize: "2.2rem", fontWeight: "800", color: "#fff", letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
              Recommended Launch Resources
            </h1>
            <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", maxWidth: "580px", margin: "0 auto" }}>
              Prerequisites, hosts, and billing systems we recommend to quickly configure and deploy your SaaS applications.
            </p>
          </div>

          {/* FTC Affiliate Disclosure */}
          <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "2rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <div style={{ fontSize: "1.2rem", color: "var(--accent-purple)", lineHeight: 1 }}>📢</div>
            <div>
              <strong style={{ fontSize: "0.8rem", color: "#fff", display: "block", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.02em" }}>Affiliate Link Disclosure</strong>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0, lineHeight: "1.4" }}>
                AppPromptHub is reader-supported. Some of the product cards shown below contain referral links. If you register or purchase a subscription through these links, we may receive a small affiliate commission at no extra cost to you. We only recommend resources we trust.
              </p>
            </div>
          </div>

          {/* Resources List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {resources.map((res) => (
              <div
                key={res.id}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-lg)",
                  padding: "1.75rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1.5rem",
                  transition: "transform 0.2s ease"
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.65rem", background: "rgba(124,58,237,0.15)", border: "1px solid var(--accent-purple)", color: "var(--accent-purple)", padding: "0.15rem 0.4rem", borderRadius: "3px", fontWeight: "700", textTransform: "uppercase" }}>
                      {res.category}
                    </span>
                    {res.discount_code && (
                      <span style={{ fontSize: "0.65rem", background: "rgba(52,211,153,0.15)", border: "1px solid var(--accent-green)", color: "var(--accent-green)", padding: "0.15rem 0.4rem", borderRadius: "3px", fontWeight: "700" }}>
                        Promo: {res.discount_code}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#fff", margin: "0 0 0.5rem 0" }}>{res.name}</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" }}>{res.description}</p>
                </div>
                
                <a
                  href={res.referral_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-btn-large"
                  style={{
                    padding: "0.55rem 1.25rem",
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    background: "var(--accent-purple)",
                    color: "#000",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    display: "inline-block",
                    borderRadius: "var(--radius-sm)"
                  }}
                >
                  Visit Resource &rarr;
                </a>
              </div>
            ))}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="app-footer__container" style={{ textAlign: "center", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
          <p className="copyright-text" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            &copy; {new Date().getFullYear()} AppPromptHub. Built with integrity.
          </p>
        </div>
      </footer>
    </div>
  );
}
