import HomeClient from "@/components/HomeClient";

export const metadata = {
  title: "My Workspace - AppPromptHub",
  description: "Access your bookmarked prompts, personalized custom templates, and generation histories in your dashboard.",
};

export default function WorkspacePage() {
  return <HomeClient defaultTab="workspace" />;
}
