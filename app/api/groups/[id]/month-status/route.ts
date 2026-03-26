import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id: groupId } = params;
  const { data: statuses } = await supabase.from("month_status").select("*").eq("group_id", groupId);
  return NextResponse.json(statuses || []);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id: groupId } = params;
  const { monthIndex, status } = await request.json();
  
  try {
    const { data: existing } = await supabase
      .from("month_status")
      .select("id")
      .eq("group_id", groupId)
      .eq("month_index", monthIndex)
      .maybeSingle();

    if (existing) {
      await supabase.from("month_status").update({ status }).eq("id", existing.id);
    } else {
      await supabase.from("month_status").insert({ group_id: groupId, month_index: monthIndex, status });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
