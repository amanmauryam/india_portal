import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const REVALIDATION_TOKEN =
  process.env.NEXTJS_REVALIDATE_TOKEN ||
  "super-secret-revalidation-token-2026";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag");
  const token = searchParams.get("token");

  if (token !== REVALIDATION_TOKEN) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (!tag) {
    return NextResponse.json({ error: "Missing tag" }, { status: 400 });
  }

  revalidateTag(tag);

  return NextResponse.json({ revalidated: true, tag });
}
