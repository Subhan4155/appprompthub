import { PromptItem, NewsItem } from "@/types";

// Central mapping between Supabase snake_case rows and the camelCase app types,
// plus the canonical allowed-value lists. Kept in one place so the shape lives
// in a single spot instead of being re-derived in every component and route.
// (Full generated types via `supabase gen types typescript` are the eventual
// goal — see Group C — but these hand-written row types remove the `any`s now.)

export const PROMPT_CATEGORIES = ["web-app", "blog", "image-gen"] as const;
export const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"] as const;
export const NEWS_CATEGORIES = ["Model Release", "Industry News", "API Updates"] as const;
export const IMPORTANCES = ["high", "medium", "low"] as const;

export interface PromptRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  target_ai: string;
  prompt_text: string;
  output_description: string | null;
  views: number | null;
  likes: number | null;
  difficulty: string;
  date: string;
  image_url?: string | null;
  expected_output_image_url?: string | null;
  price_cents?: number | null;
  preview_text?: string | null;
  full_text?: string | null;
  status?: string | null;
  source?: string | null;
}

export interface NewsRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  summary: string;
  content: string;
  importance: string;
  source_url: string | null;
}

export interface SubscriberRow {
  id: string;
  email: string;
  created_at: string;
}

export function rowToPrompt(p: PromptRow): PromptItem {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description ?? "",
    category: p.category as PromptItem["category"],
    targetAI: p.target_ai,
    promptText: p.prompt_text,
    outputDescription: p.output_description ?? "",
    views: p.views ?? 0,
    likes: p.likes ?? 0,
    difficulty: p.difficulty as PromptItem["difficulty"],
    date: p.date,
    imageUrl: p.image_url ?? undefined,
    expectedOutputImageUrl: p.expected_output_image_url ?? undefined,
    priceCents: p.price_cents ?? undefined,
    previewText: p.preview_text ?? undefined,
    fullText: p.full_text ?? undefined,
    status: p.status as any ?? undefined,
    source: p.source as any ?? undefined,
  };
}

export function rowToNews(n: NewsRow): NewsItem {
  return {
    id: n.id,
    slug: n.slug,
    title: n.title,
    category: n.category as NewsItem["category"],
    date: n.date,
    summary: n.summary,
    content: n.content,
    importance: n.importance as NewsItem["importance"],
    sourceUrl: n.source_url ?? undefined,
  };
}
