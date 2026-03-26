import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: users } = await supabase.from("users").select("*");
    const { data: groups } = await supabase.from("groups").select("*");
    const { data: memberships } = await supabase.from("memberships").select("*");
    const { data: payments } = await supabase.from("payments").select("*");
    const { data: payouts } = await supabase.from("payouts").select("*");
    const { data: month_status } = await supabase.from("month_status").select("*");

    return NextResponse.json({ users, groups, memberships, payments, payouts, month_status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
