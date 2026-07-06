import { hasSupabaseCredentials, supabase } from "@/lib/supabase";
import { mockPrompts as defaultMockPrompts } from "@/data/mockData";
import { rowToPrompt } from "@/lib/mappers";
import { notFound } from "next/navigation";
import PromptDetailClient from "@/components/PromptDetailClient";

export const revalidate = 60; // Dynamic ISR revalidation

// Static params generation for SSG
export async function generateStaticParams() {
  if (!hasSupabaseCredentials) {
    return defaultMockPrompts.map((p) => ({ slug: p.slug }));
  }
  try {
    const { data, error } = await supabase
      .from("prompts")
      .select("slug");
    if (error) throw error;
    return (data || []).map((p) => ({ slug: p.slug }));
  } catch (err) {
    console.warn("[generateStaticParams] Fallback to mock slugs due to error:", err);
    return defaultMockPrompts.map((p) => ({ slug: p.slug }));
  }
}

// Metadata generation for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let prompt = null;

  if (hasSupabaseCredentials) {
    try {
      const { data } = await supabase
        .from("prompts")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (data) {
        prompt = rowToPrompt(data);
      }
    } catch (e) {
      console.error("[generateMetadata] DB error:", e);
    }
  }

  if (!prompt) {
    prompt = defaultMockPrompts.find((p) => p.slug === slug);
  }

  if (!prompt) {
    return {
      title: "Prompt Not Found - AppPromptHub",
      description: "The requested prompt template could not be found."
    };
  }

  return {
    title: `${prompt.title} - AI Prompt Code Template | AppPromptHub`,
    description: prompt.description || `Compile variables, copy and run the ${prompt.title} prompt code template for ${prompt.targetAI}.`,
    openGraph: {
      title: `${prompt.title} - AppPromptHub`,
      description: prompt.description,
      type: "article"
    }
  };
}

export default async function PromptDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let prompt = null;

  if (hasSupabaseCredentials) {
    try {
      const { data } = await supabase
        .from("prompts")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (data) {
        prompt = rowToPrompt(data);
      }
    } catch (e) {
      console.error("[PromptDetailPage] DB error:", e);
    }
  }

  if (!prompt) {
    prompt = defaultMockPrompts.find((p) => p.slug === slug);
  }

  if (!prompt) {
    notFound();
  }

  return <PromptDetailClient prompt={prompt} />;
}
