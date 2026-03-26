import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const data = await request.json();
  if (!data || typeof data !== 'object') {
    return NextResponse.json({ error: "Invalid backup data format." }, { status: 400 });
  }

  try {
    // Supabase doesn't easily support clearing all tables in one go via client
    // This would ideally be an RPC call. For now, we'll do it sequentially.
    // NOTE: This is dangerous and should be handled with care.
    await supabase.from("payments").delete().neq("id", -1);
    await supabase.from("payouts").delete().neq("id", -1);
    await supabase.from("month_status").delete().neq("group_id", -1);
    await supabase.from("memberships").delete().neq("id", -1);
    await supabase.from("groups").delete().neq("id", -1);
    await supabase.from("users").delete().neq("id", -1);

    if (data.users && data.users.length > 0) await supabase.from("users").insert(data.users);
    if (data.groups && data.groups.length > 0) await supabase.from("groups").insert(data.groups);
    if (data.memberships && data.memberships.length > 0) await supabase.from("memberships").insert(data.memberships);
    if (data.payments && data.payments.length > 0) await supabase.from("payments").insert(data.payments);
    if (data.payouts && data.payouts.length > 0) await supabase.from("payouts").insert(data.payouts);
    if (data.month_status && data.month_status.length > 0) await supabase.from("month_status").insert(data.month_status);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Database restore failed: " + e.message }, { status: 500 });
  }
}
