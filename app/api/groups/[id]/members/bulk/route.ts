import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id: groupId } = params;
  const { members } = await request.json(); // Array of { name, phone, payoutMonthIndex }

  try {
    for (const member of members) {
      let { data: user } = await supabase.from("users").select("*").eq("phone", member.phone).maybeSingle();
      if (!user) {
        const { data: newUser, error } = await supabase.from("users").insert({ name: member.name, phone: member.phone }).select().single();
        if (error) throw error;
        user = newUser;
      }

      await supabase
        .from("memberships")
        .insert({
          user_id: user.id,
          group_id: groupId,
          role: 'member',
          payout_month_index: member.payoutMonthIndex
        });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
