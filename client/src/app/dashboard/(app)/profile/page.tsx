import { redirect } from "next/navigation";

// Profile lives in Settings now (first tab); kept so old links keep working.
export default function ProfilePage() {
  redirect("/dashboard/settings?tab=profile");
}
