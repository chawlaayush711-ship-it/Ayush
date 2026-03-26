import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id: groupId } = params;
  const { monthIndex, status } = await request.json();
  const paidAt = status === 'paid' ? new Date().toISOString() : null;

  try {
    const { data: members } = await supabase.from("memberships").select("id").eq("group_id", groupId);
    const { data: group } = await supabase.from("groups").select("contribution_amount").eq("id", groupId).single();

    if (!members || !group) throw new Error("Group or members not found");

    for (const member of members) {
      const { data: existing } = await supabase
        .from("payments")
        .select("id")
        .eq("membership_id", member.id)
        .eq("month_index", monthIndex)
        .maybeSingle();

      if (existing) {
        await supabase.from("payments").update({ status, paid_at: paidAt }).eq("id", existing.id);
      } else {
        await supabase.from("payments").insert({ 
          membership_id: member.id, 
          month_index: monthIndex, 
          amount: group.contribution_amount, 
          status, 
          paid_at: paidAt 
        });
      }
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
