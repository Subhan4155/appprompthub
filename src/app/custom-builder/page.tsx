import HomeClient from "@/components/HomeClient";

export const metadata = {
  title: "Custom AI Prompt Builder - AppPromptHub",
  description: "Assemble structured, production-grade prompts for web application components and cinematic image generators interactively.",
};

export default function CustomBuilderPage() {
  return <HomeClient defaultTab="builder" />;
}
