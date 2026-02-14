import { NextResponse } from "next/server";
import { generateAllMatches } from "@/lib/matching/generate";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await generateAllMatches();
  return NextResponse.json(result);
}
