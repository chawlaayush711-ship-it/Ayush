import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const { data: groups } = await supabase
    .from("memberships")
    .select(`
      role,
      payout_month_index,
      groups (*)
    `)
    .eq("user_id", userId);
  
  const flattenedGroups = groups?.map((m: any) => ({
    ...m.groups,
    role: m.role,
    payout_month_index: m.payout_month_index
  })) || [];

  return NextResponse.json(flattenedGroups);
}

export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }
  try {
    const { name, contributionAmount, totalMembers, startDate, payoutDay, adminId, description, interestRate } = await request.json();
    
    // Verify admin exists
    const { data: admin } = await supabase.from("users").select("id").eq("id", adminId).maybeSingle();
    if (!admin) {
      return NextResponse.json({ error: "Admin user not found. Please log in again." }, { status: 400 });
    }

    // Create group
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        name,
        contribution_amount: contributionAmount,
        total_members: totalMembers,
        start_date: startDate,
        payout_day: payoutDay || 15,
        admin_id: adminId,
        description,
        interest_rate: interestRate || 0
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // Add admin as first member
    const { error: memError } = await supabase
      .from("memberships")
      .insert({
        user_id: adminId,
        group_id: group.id,
        role: 'admin',
        payout_month_index: 0
      });

    if (memError) throw memError;

    return NextResponse.json({ id: group.id });
  } catch (e: any) {
    console.error("Group creation error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
