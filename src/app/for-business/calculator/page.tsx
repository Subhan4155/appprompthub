"use client";

import React, { useState, useEffect } from "react";
import { supabase, hasSupabaseCredentials } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";

interface PricingItem {
  id: string;
  category: string;
  approach: string;
  cost_per_year: number;
  cost_one_time: number;
  description: string;
}

// Local static pricing fallback (in case Supabase query fails or is not seeded)
const DEFAULT_PRICING: PricingItem[] = [
  { id: "domain-diy", category: "domain", approach: "diy", cost_per_year: 12, cost_one_time: 0, description: "Domain registration fee" },
  { id: "domain-builder", category: "domain", approach: "builder", cost_per_year: 12, cost_one_time: 0, description: "Domain registration fee" },
  { id: "domain-freelancer", category: "domain", approach: "freelancer", cost_per_year: 12, cost_one_time: 0, description: "Domain registration fee" },
  { id: "hosting-diy", category: "hosting", approach: "diy", cost_per_year: 0, cost_one_time: 0, description: "Free hosting tier (Vercel/Netlify)" },
  { id: "hosting-builder", category: "hosting", approach: "builder", cost_per_year: 200, cost_one_time: 0, description: "Website builder subscription fee" },
  { id: "hosting-freelancer", category: "hosting", approach: "freelancer", cost_per_year: 60, cost_one_time: 0, description: "VPS or basic hosting fee" },
  { id: "build-diy", category: "build", approach: "diy", cost_per_year: 0, cost_one_time: 0, description: "DIY with AI prompt assistance" },
  { id: "build-builder", category: "build", approach: "builder", cost_per_year: 0, cost_one_time: 0, description: "Using template website builders" },
  { id: "build-freelancer", category: "build", approach: "freelancer", cost_per_year: 0, cost_one_time: 900, description: "One-time developer fee" },
  { id: "ecom-diy", category: "ecommerce", approach: "diy", cost_per_year: 60, cost_one_time: 0, description: "Stripe API transactional costs" },
  { id: "ecom-builder", category: "ecommerce", approach: "builder", cost_per_year: 360, cost_one_time: 0, description: "Builder payment gateway integration" },
  { id: "ecom-freelancer", category: "ecommerce", approach: "freelancer", cost_per_year: 120, cost_one_time: 0, description: "Custom gateway setups" }
];

export default function CalculatorPage() {
  const [pricingConfig, setPricingConfig] = useState<PricingItem[]>([]);

  // User selections for each category
  const [domainApproach, setDomainApproach] = useState<"diy" | "builder" | "freelancer">("diy");
  const [hostingApproach, setHostingApproach] = useState<"diy" | "builder" | "freelancer">("diy");
  const [buildApproach, setBuildApproach] = useState<"diy" | "builder" | "freelancer">("diy");
  const [ecomApproach, setEcomApproach] = useState<"diy" | "builder" | "freelancer">("diy");

  useEffect(() => {
    async function loadPricing() {
      if (!hasSupabaseCredentials) {
        setPricingConfig(DEFAULT_PRICING);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("pricing_config")
          .select("*");
        if (error) throw error;
        if (data && data.length > 0) {
          setPricingConfig(data);
        } else {
          setPricingConfig(DEFAULT_PRICING);
        }
      } catch (err) {
        console.warn("Pricing configurations load failed. Fallback loaded.", err);
        setPricingConfig(DEFAULT_PRICING);
      }
    }
    loadPricing();
  }, []);

  const getCost = (category: string, approach: string) => {
    const item = pricingConfig.find(p => p.category === category && p.approach === approach);
    return item ? { yearly: item.cost_per_year, onetime: item.cost_one_time } : { yearly: 0, onetime: 0 };
  };

  // Calculations
  const domainCosts = getCost("domain", domainApproach);
  const hostingCosts = getCost("hosting", hostingApproach);
  const buildCosts = getCost("build", buildApproach);
  const ecomCosts = getCost("ecommerce", ecomApproach);

  const firstYearTotal = 
    (domainCosts.yearly + domainCosts.onetime) +
    (hostingCosts.yearly + hostingCosts.onetime) +
    (buildCosts.yearly + buildCosts.onetime) +
    (ecomCosts.yearly + ecomCosts.onetime);

  const ongoingAnnualTotal =
    domainCosts.yearly +
    hostingCosts.yearly +
    buildCosts.yearly +
    ecomCosts.yearly;

  return (
    <div className="app-shell" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <SiteHeader activeNav="calculator" />

      {/* Main Body */}
      <main style={{ flex: 1, padding: "3rem 1.5rem" }}>
        <div style={{ maxWidth: "1024px", margin: "0 auto" }}>
          
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h1 style={{ fontSize: "2.2rem", fontWeight: "800", color: "#fff", letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
              SaaS Business Cost Calculator
            </h1>
            <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", maxWidth: "580px", margin: "0 auto" }}>
              Select your construction approach for each SaaS stack component to forecast first-year setup capital and ongoing annual maintenance budgets.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2.5rem" }}>
            
            {/* Left Selection Columns */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
              
              {/* CATEGORY 1: DOMAIN */}
              <div className="calculator-section-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "1.75rem", borderRadius: "var(--radius-lg)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#fff", margin: 0 }}>1. Domain Registration</h3>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>${domainCosts.yearly}/year</span>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
                  Secure your brand domain name (e.g. .com, .io) and DNS configurations.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                  {(["diy", "builder", "freelancer"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setDomainApproach(mode)}
                      className={`filter-btn ${domainApproach === mode ? "filter-btn--active" : ""}`}
                      style={{ width: "100%", textTransform: "capitalize", padding: "0.55rem" }}
                    >
                      {mode === "diy" ? "DIY registrar" : mode === "builder" ? "SaaS bundled" : "Agency managed"}
                    </button>
                  ))}
                </div>
              </div>

              {/* CATEGORY 2: HOSTING */}
              <div className="calculator-section-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "1.75rem", borderRadius: "var(--radius-lg)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#fff", margin: 0 }}>2. Server Hosting &amp; CDN</h3>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>${hostingCosts.yearly}/year</span>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
                  Run your application online on edge nodes with dynamic rendering.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                  {(["diy", "builder", "freelancer"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setHostingApproach(mode)}
                      className={`filter-btn ${hostingApproach === mode ? "filter-btn--active" : ""}`}
                      style={{ width: "100%", textTransform: "capitalize", padding: "0.55rem" }}
                    >
                      {mode === "diy" ? "Vercel / Netlify" : mode === "builder" ? "Builder host" : "Managed VPS"}
                    </button>
                  ))}
                </div>
              </div>

              {/* CATEGORY 3: BUILD */}
              <div className="calculator-section-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "1.75rem", borderRadius: "var(--radius-lg)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#fff", margin: 0 }}>3. Development &amp; Templates</h3>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {buildCosts.onetime > 0 ? `$${buildCosts.onetime} one-time` : "Free"}
                  </span>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
                  Write code templates, user dashboard interfaces, and core databases.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                  {(["diy", "builder", "freelancer"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setBuildApproach(mode)}
                      className={`filter-btn ${buildApproach === mode ? "filter-btn--active" : ""}`}
                      style={{ width: "100%", textTransform: "capitalize", padding: "0.55rem" }}
                    >
                      {mode === "diy" ? "DIY with AI Prompts" : mode === "builder" ? "Builder templates" : "Freelance Engineer"}
                    </button>
                  ))}
                </div>
              </div>

              {/* CATEGORY 4: ECOMMERCE */}
              <div className="calculator-section-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "1.75rem", borderRadius: "var(--radius-lg)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#fff", margin: 0 }}>4. Checkout &amp; Payments</h3>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>${ecomCosts.yearly}/year</span>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
                  Collect monthly SaaS recurring subscription checkouts from global credit cards.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                  {(["diy", "builder", "freelancer"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setEcomApproach(mode)}
                      className={`filter-btn ${ecomApproach === mode ? "filter-btn--active" : ""}`}
                      style={{ width: "100%", textTransform: "capitalize", padding: "0.55rem" }}
                    >
                      {mode === "diy" ? "Stripe Checkout" : mode === "builder" ? "Shopify / Lemon" : "Merchant Account"}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Summary Board */}
            <div>
              <div style={{ position: "sticky", top: "2rem", background: "#0a0a0f", border: "1px solid var(--border-color)", padding: "2rem 1.5rem", borderRadius: "var(--radius-lg)" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#fff", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
                  Cost Estimation Summary
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "2rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Domain Registration</span>
                    <strong style={{ fontSize: "0.85rem", color: "#fff" }}>${domainCosts.yearly}/yr</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Server Edge Hosting</span>
                    <strong style={{ fontSize: "0.85rem", color: "#fff" }}>${hostingCosts.yearly}/yr</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Saas Build Cost</span>
                    <strong style={{ fontSize: "0.85rem", color: "#fff" }}>
                      {buildCosts.onetime > 0 ? `$${buildCosts.onetime} (1x)` : "$0"}
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Billing Processor</span>
                    <strong style={{ fontSize: "0.85rem", color: "#fff" }}>${ecomCosts.yearly}/yr</strong>
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>First-Year Total</span>
                    <strong style={{ fontSize: "1.25rem", color: "var(--accent-purple)", fontWeight: "800" }}>${firstYearTotal}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.75rem" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Ongoing Annual</span>
                    <strong style={{ fontSize: "1.1rem", color: "#fff", fontWeight: "700" }}>${ongoingAnnualTotal}/yr</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Interactive Launch Instructions Guide */}
          <div style={{ marginTop: "4rem", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", padding: "2.5rem" }}>
            <h2 style={{ fontSize: "1.45rem", fontWeight: "700", color: "#fff", letterSpacing: "-0.02em", marginBottom: "1.5rem" }}>
              📋 Tailored Step-by-Step Launch Guide
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* STEP 1 */}
              <div style={{ borderLeft: "2px solid var(--accent-purple)", paddingLeft: "1.5rem" }}>
                <strong style={{ fontSize: "0.95rem", color: "var(--accent-purple)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Step 1: Domain Securing</strong>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "0.35rem" }}>
                  {domainApproach === "diy" ? (
                    "Register your brand domain at a low cost ($10-12/yr) using a DNS registrar such as Namecheap or Cloudflare. Setup custom nameservers pointing to Vercel."
                  ) : domainApproach === "builder" ? (
                    "Secure domain directly inside your web builder control dashboard settings. This bundles DNS renewals directly in your builder subscription."
                  ) : (
                    "Provide your hired developers/agency team with your choice domain name. They will register it on your behalf and delegate domain pointer settings."
                  )}
                </p>
              </div>

              {/* STEP 2 */}
              <div style={{ borderLeft: "2px solid var(--accent-purple)", paddingLeft: "1.5rem" }}>
                <strong style={{ fontSize: "0.95rem", color: "var(--accent-purple)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Step 2: Hosting Provisioning</strong>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "0.35rem" }}>
                  {hostingApproach === "diy" ? (
                    "Initialize a free edge hosting pipeline on Vercel or Netlify. Link your GitHub repository for automatic CD/CI deployments on main code pushes."
                  ) : hostingApproach === "builder" ? (
                    "Hosting is fully managed and configured out-of-the-box by your builder subscription nodes. Just configure the DNS A-records in your domain registrar."
                  ) : (
                    "Spin up a VPS server instance on Hostinger or AWS. Ask your developer team to configure Nginx, SSL certificates, and server logs hooks."
                  )}
                </p>
              </div>

              {/* STEP 3 */}
              <div style={{ borderLeft: "2px solid var(--accent-purple)", paddingLeft: "1.5rem" }}>
                <strong style={{ fontSize: "0.95rem", color: "var(--accent-purple)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Step 3: SaaS Core Engineering</strong>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "0.35rem" }}>
                  {buildApproach === "diy" ? (
                    "Build your application DIY utilizing AppPromptHub's engineering recipes. Search our explore grid for web-app components, copy the prompts, and feed them to Claude Sonnet to generate pristine code files instantly."
                  ) : buildApproach === "builder" ? (
                    "Deploy code-free using web builder visual layout canvases. Bind your database blocks manually to visual forms."
                  ) : (
                    "Contract a professional developer or agency team. Share your software mockup architecture and let them compile the codebase blocks."
                  )}
                </p>
              </div>

              {/* STEP 4 */}
              <div style={{ borderLeft: "2px solid var(--accent-purple)", paddingLeft: "1.5rem" }}>
                <strong style={{ fontSize: "0.95rem", color: "var(--accent-purple)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Step 4: Subscription Billing Setup</strong>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "0.35rem" }}>
                  {ecomApproach === "diy" ? (
                    "Create a Stripe merchant account, configure checkout product lines, and copy your Stripe secret credentials into your server configuration files."
                  ) : ecomApproach === "builder" ? (
                    "Connect your LemonSqueezy or Shopify account to the builder dashboard visual gateway node to manage customer subscriptions."
                  ) : (
                    "Setup a custom merchant billing network (e.g. Adyen) or call local bank APIs. Developers will configure server-side webhook validators."
                  )}
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="app-footer__container" style={{ textAlign: "center", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
          <p className="copyright-text" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            &copy; {new Date().getFullYear()} AppPromptHub. Built securely.
          </p>
        </div>
      </footer>
    </div>
  );
}
