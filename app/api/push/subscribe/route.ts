import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }
  const { userId, subscription } = await request.json();
  if (!userId || !subscription) {
    return NextResponse.json({ error: "userId and subscription are required" }, { status: 400 });
  }

  try {
    const { data: existing } = await supabase
      .from("push_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("subscription", subscription)
      .maybeSingle();

    if (!existing) {
      await supabase
        .from("push_subscriptions")
        .insert({ user_id: userId, subscription });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
