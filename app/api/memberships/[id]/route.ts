import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id: membershipId } = params;
  const { name, phone, payoutMonthIndex } = await request.json();

  try {
    const { data: membership } = await supabase.from("memberships").select("user_id, group_id, payout_month_index").eq("id", membershipId).single();
    if (!membership) throw new Error("Membership not found");

    // Update user details
    await supabase.from("users").update({ name, phone }).eq("id", membership.user_id);

    // If payout month is changing, check for swap
    if (payoutMonthIndex !== undefined && payoutMonthIndex !== membership.payout_month_index) {
      const { data: otherMember } = await supabase
        .from("memberships")
        .select("id")
        .eq("group_id", membership.group_id)
        .eq("payout_month_index", payoutMonthIndex)
        .neq("id", membershipId)
        .maybeSingle();

      if (otherMember) {
        await supabase.from("memberships").update({ payout_month_index: membership.payout_month_index }).eq("id", otherMember.id);
      }

      await supabase.from("memberships").update({ payout_month_index: payoutMonthIndex }).eq("id", membershipId);
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id: membershipId } = params;
  try {
    await supabase.from("memberships").delete().eq("id", membershipId);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
