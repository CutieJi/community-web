import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, hasValidAdminSession } from "@/lib/admin-auth";
import { AdminDashboard } from "./admin-dashboard";
import {
  FirebaseConfigurationError,
  FIRESTORE_PERMISSION_ERROR_MESSAGE,
  getCommunityContent,
  isFirestorePermissionDenied,
} from "@/lib/community-content";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!session || !hasValidAdminSession(session)) redirect("/admin/login");

  let content = null;
  let loadError = "";
  try {
    content = await getCommunityContent();
  } catch (error) {
    console.error("Could not load community content from Firestore:", error);
    loadError = error instanceof FirebaseConfigurationError
      ? error.message
      : isFirestorePermissionDenied(error)
        ? FIRESTORE_PERMISSION_ERROR_MESSAGE
        : "Could not load Firestore content. Check the Firebase server credentials and try again.";
  }

  return <AdminDashboard initialContent={content} loadError={loadError} />;
}
