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

// Initialize Supabase Client
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
  console.error("SUPABASE_URL and SUPABASE_KEY are required in .env file.");
}

// Configure web-push
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:example@example.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  console.log("Web-push configured successfully.");
} else {
  console.warn("VAPID keys are missing. Push notifications will not work.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Middleware to check Supabase configuration
  app.use("/api", (req, res, next) => {
    if (!supabase) {
      return res.status(500).json({ 
        error: "Supabase is not configured. Please add SUPABASE_URL and SUPABASE_KEY to your secrets." 
      });
    }
    next();
  });

  // --- API Routes ---

  app.get("/api/push/vapid-public-key", (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
  });

  app.post("/api/push/subscribe", async (req, res) => {
    const { userId, subscription } = req.body;
    if (!userId || !subscription) {
      return res.status(400).json({ error: "userId and subscription are required" });
    }

    try {
      // Check if subscription already exists
      const { data: existing } = await supabase
        .from("push_subscriptions")
        .select("id")
        .eq("user_id", userId)
        .eq("subscription", subscription)
        .maybeSingle();

      if (!existing) {
        await supabase
          .from("push_subscriptions")
          .insert({ user_id: userId, subscription });
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/push/unsubscribe", async (req, res) => {
    const { userId, subscription } = req.body;
    try {
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", userId)
        .eq("subscription", subscription);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Auth / User
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phone, name } = req.body;
      if (!phone || !name) {
        return res.status(400).json({ error: "Name and phone are required." });
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
      
      res.json(user);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/auth/verify/:id", async (req, res) => {
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();
      
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    const userId = req.params.id;
    try {
      await supabase.from("users").delete().eq("id", userId);
      res.json({ success: true });
    } catch (e: any) {
      console.error("User deletion failed:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Groups
  app.get("/api/groups", async (req, res) => {
    const userId = req.query.userId;
    const { data: groups } = await supabase
      .from("memberships")
      .select(`
        role,
        payout_month_index,
        groups (*)
      `)
      .eq("user_id", userId);
    
    // Flatten the response to match the old SQLite structure
    const flattenedGroups = groups?.map((m: any) => ({
      ...m.groups,
      role: m.role,
      payout_month_index: m.payout_month_index
    })) || [];

    res.json(flattenedGroups);
  });

  app.post("/api/groups", async (req, res) => {
    const { name, contributionAmount, totalMembers, startDate, payoutDay, adminId, description, interestRate } = req.body;
    
    try {
      // Verify admin exists
      const { data: admin } = await supabase.from("users").select("id").eq("id", adminId).maybeSingle();
      if (!admin) {
        return res.status(400).json({ error: "Admin user not found. Please log in again." });
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

      res.json({ id: group.id });
    } catch (e: any) {
      console.error("Group creation error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/groups/:id", async (req, res) => {
    const { data: group } = await supabase.from("groups").select("*").eq("id", req.params.id).single();
    const { data: members } = await supabase
      .from("memberships")
      .select(`
        *,
        users (name, phone)
      `)
      .eq("group_id", req.params.id);
    
    // Flatten members
    const flattenedMembers = members?.map((m: any) => ({
      ...m,
      name: m.users.name,
      phone: m.users.phone
    })) || [];
    
    res.json({ ...group, members: flattenedMembers });
  });

  app.put("/api/groups/:id", async (req, res) => {
    const { name, contributionAmount, payoutDay, interestRate, status } = req.body;
    try {
      await supabase
        .from("groups")
        .update({
          name,
          contribution_amount: contributionAmount,
          payout_day: payoutDay,
          interest_rate: interestRate || 0,
          status: status || 'active'
        })
        .eq("id", req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/groups/:id", async (req, res) => {
    const groupId = req.params.id;
    try {
      await supabase.from("groups").delete().eq("id", groupId);
      res.json({ success: true });
    } catch (e: any) {
      console.error("Group deletion failed:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Add Member
  app.post("/api/groups/:id/members", async (req, res) => {
    const { phone, name, payoutMonthIndex } = req.body;
    const groupId = req.params.id;

    try {
      let { data: user } = await supabase.from("users").select("*").eq("phone", phone).maybeSingle();
      if (!user) {
        const { data: newUser, error } = await supabase.from("users").insert({ name, phone }).select().single();
        if (error) throw error;
        user = newUser;
      }

      await supabase
        .from("memberships")
        .insert({
          user_id: user.id,
          group_id: groupId,
          role: 'member',
          payout_month_index: payoutMonthIndex
        });
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: "Member already in group or index taken" });
    }
  });

  app.post("/api/groups/:id/members/bulk", async (req, res) => {
    const { members } = req.body; // Array of { name, phone, payoutMonthIndex }
    const groupId = req.params.id;

    try {
      for (const member of members) {
        let { data: user } = await supabase.from("users").select("*").eq("phone", member.phone).maybeSingle();
        if (!user) {
          const { data: newUser, error } = await supabase.from("users").insert({ name: member.name, phone: member.phone }).select().single();
          if (error) throw error;
          user = newUser;
        }
        
        await supabase
          .from("memberships")
          .insert({
            user_id: user.id,
            group_id: groupId,
            role: 'member',
            payout_month_index: member.payoutMonthIndex
          });
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Update Member
  app.put("/api/memberships/:id", async (req, res) => {
    const { name, phone, payoutMonthIndex } = req.body;
    const membershipId = req.params.id;

    try {
      const { data: membership } = await supabase.from("memberships").select("user_id, group_id, payout_month_index").eq("id", membershipId).single();
      if (!membership) throw new Error("Membership not found");

      // Update user details
      await supabase.from("users").update({ name, phone }).eq("id", membership.user_id);

      // If payout month is changing, check for swap
      if (payoutMonthIndex !== undefined && payoutMonthIndex !== membership.payout_month_index) {
        const { data: otherMember } = await supabase
          .from("memberships")
          .select("id")
          .eq("group_id", membership.group_id)
          .eq("payout_month_index", payoutMonthIndex)
          .neq("id", membershipId)
          .maybeSingle();

        if (otherMember) {
          await supabase.from("memberships").update({ payout_month_index: membership.payout_month_index }).eq("id", otherMember.id);
        }

        await supabase.from("memberships").update({ payout_month_index: payoutMonthIndex }).eq("id", membershipId);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Payments
  app.get("/api/groups/:id/payments", async (req, res) => {
    const { data: payments } = await supabase
      .from("payments")
      .select(`
        *,
        memberships!inner (
          group_id,
          users (name)
        )
      `)
      .eq("memberships.group_id", req.params.id);
    
    const flattenedPayments = payments?.map((p: any) => ({
      ...p,
      member_name: p.memberships.users.name
    })) || [];

    res.json(flattenedPayments);
  });

  app.post("/api/payments", async (req, res) => {
    const { membershipId, monthIndex, amount, status, paidAt: customPaidAt, paymentMethod } = req.body;
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
      
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/groups/:id/payments/bulk", async (req, res) => {
    const { monthIndex, status } = req.body;
    const groupId = req.params.id;
    const paidAt = status === 'paid' ? new Date().toISOString() : null;

    try {
      const { data: members } = await supabase.from("memberships").select("id").eq("group_id", groupId);
      const { data: group } = await supabase.from("groups").select("contribution_amount").eq("id", groupId).single();

      if (!members || !group) throw new Error("Group or members not found");

      for (const member of members) {
        const { data: existing } = await supabase
          .from("payments")
          .select("id")
          .eq("membership_id", member.id)
          .eq("month_index", monthIndex)
          .maybeSingle();

        if (existing) {
          await supabase.from("payments").update({ status, paid_at: paidAt }).eq("id", existing.id);
        } else {
          await supabase.from("payments").insert({ 
            membership_id: member.id, 
            month_index: monthIndex, 
            amount: group.contribution_amount, 
            status, 
            paid_at: paidAt 
          });
        }
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/groups/:id/month-status", async (req, res) => {
    const { data: statuses } = await supabase.from("month_status").select("*").eq("group_id", req.params.id);
    res.json(statuses || []);
  });

  app.post("/api/groups/:id/month-status", async (req, res) => {
    const { monthIndex, status } = req.body;
    try {
      await supabase
        .from("month_status")
        .upsert({ group_id: req.params.id, month_index: monthIndex, status }, { onConflict: 'group_id,month_index' });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Backup & Restore (Modified for Supabase)
  app.get("/api/backup", async (req, res) => {
    try {
      const { data: users } = await supabase.from("users").select("*");
      const { data: groups } = await supabase.from("groups").select("*");
      const { data: memberships } = await supabase.from("memberships").select("*");
      const { data: payments } = await supabase.from("payments").select("*");
      const { data: payouts } = await supabase.from("payouts").select("*");
      const { data: month_status } = await supabase.from("month_status").select("*");

      res.json({ users, groups, memberships, payments, payouts, month_status });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/restore", async (req, res) => {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: "Invalid backup data format." });
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

      if (data.users) await supabase.from("users").insert(data.users);
      if (data.groups) await supabase.from("groups").insert(data.groups);
      if (data.memberships) await supabase.from("memberships").insert(data.memberships);
      if (data.payments) await supabase.from("payments").insert(data.payments);
      if (data.payouts) await supabase.from("payouts").insert(data.payouts);
      if (data.month_status) await supabase.from("month_status").insert(data.month_status);

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: "Database restore failed: " + e.message });
    }
  });

  // Catch-all for undefined /api routes
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // --- Vite Integration ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // --- Push Notification Logic ---
  const sendNotification = async (userId: number, title: string, body: string, url: string = "/") => {
    const { data: subscriptions } = await supabase.from("push_subscriptions").select("subscription").eq("user_id", userId);
    
    if (!subscriptions) return;

    for (const subRecord of subscriptions) {
      try {
        const subscription = subRecord.subscription;
        await webpush.sendNotification(subscription, JSON.stringify({
          title,
          body,
          url
        }));
      } catch (error: any) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("user_id", userId).eq("subscription", subRecord.subscription);
        } else {
          console.error("Error sending push notification:", error);
        }
      }
    }
  };

  // Cron job (Modified for Supabase)
  cron.schedule("0 9 * * *", async () => {
    if (!supabase) {
      console.warn("Cron job skipped: Supabase is not configured.");
      return;
    }
    console.log("Running daily notification check...");
    const today = new Date();
    const currentDay = today.getDate();
    
    const { data: groupsToRemind } = await supabase.from("groups").select("*").eq("status", "active");

    if (!groupsToRemind) return;

    for (const group of groupsToRemind) {
      const reminderDay = group.payout_day - 2;
      if (currentDay === reminderDay) {
        const startDate = new Date(group.start_date);
        const monthsDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
        
        if (monthsDiff >= 0 && monthsDiff < group.total_members) {
          // This complex query is better handled with a view or RPC in Supabase
          // For now, we'll fetch memberships and then filter
          const { data: members } = await supabase
            .from("memberships")
            .select(`
              user_id,
              users (name),
              payments (status, month_index)
            `)
            .eq("group_id", group.id);

          const unpaidMembers = members?.filter((m: any) => {
            const payment = m.payments?.find((p: any) => p.month_index === monthsDiff);
            return !payment || payment.status !== 'paid';
          }) || [];

          for (const member of unpaidMembers) {
            await sendNotification(
              member.user_id,
              "Contribution Reminder",
              `Hi ${member.users.name}, your contribution of ₹${group.contribution_amount} for ${group.name} is due in 2 days.`
            );
          }
        }
      }

      if (currentDay === group.payout_day) {
        const startDate = new Date(group.start_date);
        const monthsDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());

        if (monthsDiff >= 0 && monthsDiff < group.total_members) {
          const { data: payoutMember } = await supabase
            .from("memberships")
            .select("user_id, users (name)")
            .eq("group_id", group.id)
            .eq("payout_month_index", monthsDiff)
            .maybeSingle();

          if (payoutMember) {
            await sendNotification(
              payoutMember.user_id,
              "Payout Day!",
              `Congratulations ${(payoutMember as any).users.name}! Today is your payout day for ${group.name}.`
            );
          }
        }
      }
    }
  });
}

startServer();
