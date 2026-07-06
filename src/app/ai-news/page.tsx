import HomeClient from "@/components/HomeClient";

export const metadata = {
  title: "AI Release Radar - AppPromptHub",
  description: "Keep up to date with the latest AI model updates, prompts, engineering techniques, and framework releases.",
};

export default function AiNewsPage() {
  return <HomeClient defaultTab="news" />;
}
