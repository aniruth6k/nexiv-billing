import { redirect } from "next/navigation";

export default function HomePage() {
  // Server-side redirect to hotel route
  // Let /hotel/page.tsx handle the authentication flow
  redirect("/hotel");
}