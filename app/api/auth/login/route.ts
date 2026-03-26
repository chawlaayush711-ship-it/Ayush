import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }
  try {
    const { phone, name } = await request.json();
    if (!phone || !name) {
      return NextResponse.json({ error: "Name and phone are required." }, { status: 400 });
    }
    
    let { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();
    
    if (!user) {
      const { data: newUser, error } = await supabase
        .from("users")
        .insert({ name, phone })
        .select()
        .single();
      
      if (error) throw error;
      user = newUser;
    }
    
    return NextResponse.json(user);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
