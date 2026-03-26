import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();
    
  if (user) {
    return NextResponse.json(user);
  } else {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}
