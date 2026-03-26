import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import webpush from "web-push";
import cron from "node-cron";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client initialized successfully.");
  } catch (e) {
    console.error("Failed to initialize Supabase client:", e);
  }
} else {
  console.error("SUPABASE_URL and SUPABASE_KEY are required.");
}

// Web Push
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:test@test.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // FIXED middleware
  app.use("/api", (req, res, next) => {
    if (!supabase && req.path !== "/health") {
      return res.status(500).json({ error: "Supabase not configured" });
    }
    next();
  });

  // Health
  app.get("/api/health", async (req, res) => {
    let dbStatus = "not_configured";
    let dbError = null;

    if (supabase) {
      try {
        const { error } = await supabase.from("users").select("count", { count: "exact", head: true });
        if (error) {
          dbStatus = "error";
          dbError = error.message;
        } else dbStatus = "connected";
      } catch (e: any) {
        dbStatus = "exception";
        dbError = e.message;
      }
    }

    res.json({ status: "ok", database: dbStatus, dbError });
  });

  // ---------------- PUSH ----------------
  app.get("/api/push/vapid-public-key", (req, res) => {
    res.json({ publicKey: vapidPublicKey });
  });

  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const { userId, subscription } = req.body;

      const { data: existing, error } = await supabase
        .from("push_subscriptions")
        .select("id")
        .eq("user_id", userId)
        .eq("subscription", subscription)
        .maybeSingle();

      if (error) throw error;

      if (!existing) {
        const { error: insertError } = await supabase
          .from("push_subscriptions")
          .insert({ user_id: userId, subscription });

        if (insertError) throw insertError;
      }

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/push/unsubscribe", async (req, res) => {
    try {
      const { userId, subscription } = req.body;

      const { error } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", userId)
        .eq("subscription", subscription);

      if (error) throw error;

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------------- AUTH ----------------
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phone, name } = req.body;

      let { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("phone", phone)
        .maybeSingle();

      if (error) throw error;

      if (!user) {
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({ name, phone })
          .select()
          .single();

        if (insertError) throw insertError;
        user = newUser;
      }

      res.json(user);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------------- GROUPS ----------------
  app.get("/api/groups", async (req, res) => {
    try {
      const userId = req.query.userId;

      const { data: groups, error } = await supabase
        .from("memberships")
        .select(`role, payout_month_index, groups (*)`)
        .eq("user_id", userId);

      if (error) throw error;

      const flattened = groups?.map((m: any) => ({
        ...m.groups,
        role: m.role,
        payout_month_index: m.payout_month_index,
      })) || [];

      res.json(flattened);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------------- PAYMENTS ----------------
  app.post("/api/payments", async (req, res) => {
    try {
      const { membershipId, monthIndex } = req.body;

      const { error } = await supabase
        .from("payments")
        .insert({ membership_id: membershipId, month_index: monthIndex });

      if (error) throw error;

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------------- BACKUP ----------------
  app.get("/api/backup", async (req, res) => {
    try {
      const { data: users } = await supabase.from("users").select("*");
      const { data: groups } = await supabase.from("groups").select("*");

      res.json({ users, groups });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------------- ERROR HANDLER ----------------
  app.use((err: any, req: any, res: any, next: any) => {
    console.error(err);
    res.status(500).json({
      error: "Internal Server Error",
      message: err.message,
    });
  });

  // ---------------- VITE ----------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log("Server running on port", PORT);
  });

  return app;
}

const appPromise = startServer();

export default async (req: any, res: any) => {
  const app = await appPromise;
  app(req, res);
};