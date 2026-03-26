import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id: groupId } = params;
  const { phone, name, payoutMonthIndex } = await request.json();

  try {
    let { data: user } = await supabase.from("users").select("*").eq("phone", phone).maybeSingle();
    if (!user) {
      const { data: newUser, error } = await supabase.from("users").insert({ name, phone }).select().single();
      if (error) throw error;
      user = newUser;
    }

    await supabase
      .from("memberships")
      .insert({
        user_id: user.id,
        group_id: groupId,
        role: 'member',
        payout_month_index: payoutMonthIndex
      });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Member already in group or index taken" }, { status: 400 });
  }
}
