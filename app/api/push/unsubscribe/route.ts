import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const { userId, subscription } = await request.json();
  try {
    await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .eq("subscription", subscription);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
