export interface PromptItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: 'web-app' | 'blog' | 'image-gen';
  targetAI: string;
  promptText: string;
  outputDescription: string;
  views: number;
  likes: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  imageUrl?: string;
  expectedOutputImageUrl?: string;
  date: string; // Added date for sorting by newest
  priceCents?: number;
  previewText?: string;
  fullText?: string;
  status?: 'pending' | 'approved' | 'rejected';
  source?: 'official' | 'community';
}

export interface NewsItem {
  id: string;
  slug: string;
  title: string;
  category: 'Model Release' | 'Industry News' | 'API Updates';
  date: string;
  summary: string;
  content: string;
  importance: 'high' | 'medium' | 'low';
  sourceUrl?: string;
}
