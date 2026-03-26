import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase.from("users").select("count").limit(1);
    return NextResponse.json({
      status: "ok",
      supabase: error ? "error" : "connected",
      details: error ? error.message : "Connection successful"
    });
  } catch (e: any) {
    return NextResponse.json({ status: "error", details: e.message }, { status: 500 });
  }
}
