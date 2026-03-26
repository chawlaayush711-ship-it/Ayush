import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // Delete user's memberships first (cascading delete might not be set up)
    await supabase.from("memberships").delete().eq("user_id", id);
    
    // Delete user's push subscriptions
    await supabase.from("push_subscriptions").delete().eq("user_id", id);

    // Delete the user
    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
