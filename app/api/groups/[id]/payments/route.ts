import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id: groupId } = params;
  
  const { data: payments } = await supabase
    .from("payments")
    .select(`
      *,
      memberships!inner (
        group_id,
        users (name)
      )
    `)
    .eq("memberships.group_id", groupId);
  
  const flattenedPayments = payments?.map((p: any) => ({
    ...p,
    member_name: p.memberships.users.name
  })) || [];

  return NextResponse.json(flattenedPayments);
}
