import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }
  const { membershipId, monthIndex, amount, status, paidAt: customPaidAt, paymentMethod } = await request.json();
  const paidAt = customPaidAt || (status === 'paid' ? new Date().toISOString() : null);
  
  try {
    const { data: existing } = await supabase
      .from("payments")
      .select("id")
      .eq("membership_id", membershipId)
      .eq("month_index", monthIndex)
      .maybeSingle();
    
    if (existing) {
      await supabase
        .from("payments")
        .update({ status, paid_at: paidAt, payment_method: paymentMethod })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("payments")
        .insert({ membership_id: membershipId, month_index: monthIndex, amount, status, paid_at: paidAt, payment_method: paymentMethod });
    }
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
