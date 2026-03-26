import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  const { data: group } = await supabase.from("groups").select("*").eq("id", id).single();
  const { data: members } = await supabase
    .from("memberships")
    .select(`
      *,
      users (name, phone)
    `)
    .eq("group_id", id);
  
  const flattenedMembers = members?.map((m: any) => ({
    ...m,
    name: m.users.name,
    phone: m.users.phone
  })) || [];
  
  return NextResponse.json({ ...group, members: flattenedMembers });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { name, contributionAmount, payoutDay, interestRate, status } = await request.json();
  
  try {
    await supabase
      .from("groups")
      .update({
        name,
        contribution_amount: contributionAmount,
        payout_day: payoutDay,
        interest_rate: interestRate || 0,
        status: status || 'active'
      })
      .eq("id", id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    await supabase.from("groups").delete().eq("id", id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
