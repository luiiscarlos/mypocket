import { redirect } from "next/navigation";

// Profile lives in Settings (first tab), as in the desktop app.
export default function MobileProfilePage() {
  redirect("/mobile/settings?tab=profile");
}
