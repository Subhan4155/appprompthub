import AdminClient from "./AdminClient";

export const metadata = {
  title: "Admin Dashboard - AppPromptHub",
  description: "Secure panel to manage prompts, release updates, and subscribers.",
};

export default function AdminPage() {
  return <AdminClient />;
}
