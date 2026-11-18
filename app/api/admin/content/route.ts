import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, hasValidAdminSession } from "@/lib/admin-auth";
import {
  FIRESTORE_PERMISSION_ERROR_MESSAGE,
  getCommunityContent,
  isFirestorePermissionDenied,
  saveCommunityContent,
} from "@/lib/community-content";

export const runtime = "nodejs";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE)?.value;
  return Boolean(session && hasValidAdminSession(session));
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    return NextResponse.json(await getCommunityContent());
  } catch (error) {
    console.error("Could not load community content from Firestore:", error);
    const message = isFirestorePermissionDenied(error)
      ? FIRESTORE_PERMISSION_ERROR_MESSAGE
      : "Could not load Firestore content. Check the Firebase server credentials.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { welcome?: unknown; announcement?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof body.welcome !== "string" || typeof body.announcement !== "string" ||
      body.welcome.length > 280 || body.announcement.length > 280) {
    return NextResponse.json({ error: "Both fields must be text no longer than 280 characters." }, { status: 400 });
  }

  try {
    await saveCommunityContent({ welcome: body.welcome, announcement: body.announcement });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Could not save community content to Firestore:", error);
    const message = isFirestorePermissionDenied(error)
      ? FIRESTORE_PERMISSION_ERROR_MESSAGE
      : "Could not save changes. Check the Firebase server credentials and try again.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
