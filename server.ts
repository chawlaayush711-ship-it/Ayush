import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("bhishi.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contribution_amount REAL NOT NULL,
    total_members INTEGER NOT NULL,
    start_date DATE NOT NULL,
    payout_day INTEGER DEFAULT 15,
    description TEXT,
    interest_rate REAL DEFAULT 0,
    status TEXT DEFAULT 'active', -- active, completed
    admin_id INTEGER,
    FOREIGN KEY (admin_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    group_id INTEGER,
    role TEXT DEFAULT 'member', -- admin, member
    payout_month_index INTEGER, -- 0 to N-1
    status TEXT DEFAULT 'active', -- active, dropped
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (group_id) REFERENCES groups(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    membership_id INTEGER,
    month_index INTEGER,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, paid, late
    paid_at DATETIME,
    FOREIGN KEY (membership_id) REFERENCES memberships(id)
  );

  CREATE TABLE IF NOT EXISTS payouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    membership_id INTEGER,
    month_index INTEGER,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'scheduled', -- scheduled, paid
    paid_at DATETIME,
    FOREIGN KEY (membership_id) REFERENCES memberships(id)
  );

  CREATE TABLE IF NOT EXISTS month_status (
    group_id INTEGER,
    month_index INTEGER,
    status TEXT DEFAULT 'open', -- open, frozen
    PRIMARY KEY (group_id, month_index),
    FOREIGN KEY (group_id) REFERENCES groups(id)
  );
`);

// Migration: Add payout_day to groups if it doesn't exist
try {
  db.prepare("ALTER TABLE groups ADD COLUMN payout_day INTEGER DEFAULT 15").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE groups ADD COLUMN description TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE groups ADD COLUMN interest_rate REAL DEFAULT 0").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE payments ADD COLUMN payment_method TEXT").run();
} catch (e) {}

// --- Pre-prepared Statements ---
let loginStmt: any;
let createUserStmt: any;
let getGroupsStmt: any;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Prepare statements once
  loginStmt = db.prepare("SELECT * FROM users WHERE phone = ?");
  createUserStmt = db.prepare("INSERT INTO users (name, phone) VALUES (?, ?)");
  getGroupsStmt = db.prepare(`
    SELECT g.*, m.role, m.payout_month_index 
    FROM groups g
    JOIN memberships m ON g.id = m.group_id
    WHERE m.user_id = ?
  `);

  app.use(express.json());

  // --- API Routes ---

  // Auth / User
  app.post("/api/auth/login", (req, res) => {
    try {
      const { phone, name } = req.body;
      if (!phone || !name) {
        return res.status(400).json({ error: "Name and phone are required." });
      }
      
      let user = loginStmt.get(phone);
      
      if (!user) {
        const info = createUserStmt.run(name, phone);
        user = { id: info.lastInsertRowid, name, phone };
      }
      
      res.json(user);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/users/:id", (req, res) => {
    const userId = req.params.id;
    
    const transaction = db.transaction(() => {
      // 1. Find all groups where this user is the admin
      const adminGroups = db.prepare("SELECT id FROM groups WHERE admin_id = ?").all(userId) as any[];
      
      for (const group of adminGroups) {
        const groupId = group.id;
        // Full group deletion logic for each group they admin
        const memberships = db.prepare("SELECT id FROM memberships WHERE group_id = ?").all(groupId) as any[];
        const membershipIds = memberships.map(m => m.id);

        if (membershipIds.length > 0) {
          const placeholders = membershipIds.map(() => "?").join(",");
          db.prepare(`DELETE FROM payments WHERE membership_id IN (${placeholders})`).run(...membershipIds);
          db.prepare(`DELETE FROM payouts WHERE membership_id IN (${placeholders})`).run(...membershipIds);
        }
        db.prepare("DELETE FROM month_status WHERE group_id = ?").run(groupId);
        db.prepare("DELETE FROM memberships WHERE group_id = ?").run(groupId);
        db.prepare("DELETE FROM groups WHERE id = ?").run(groupId);
      }

      // 2. For other groups where they are just a member
      const memberships = db.prepare("SELECT id FROM memberships WHERE user_id = ?").all(userId) as any[];
      const membershipIds = memberships.map(m => m.id);

      if (membershipIds.length > 0) {
        const placeholders = membershipIds.map(() => "?").join(",");
        db.prepare(`DELETE FROM payments WHERE membership_id IN (${placeholders})`).run(...membershipIds);
        db.prepare(`DELETE FROM payouts WHERE membership_id IN (${placeholders})`).run(...membershipIds);
      }

      db.prepare("DELETE FROM memberships WHERE user_id = ?").run(userId);

      // 3. Finally delete the user
      db.prepare("DELETE FROM users WHERE id = ?").run(userId);
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Groups
  app.get("/api/groups", (req, res) => {
    const userId = req.query.userId;
    const groups = getGroupsStmt.all(userId);
    res.json(groups);
  });

  app.post("/api/groups", (req, res) => {
    const { name, contributionAmount, totalMembers, startDate, payoutDay, adminId, description, interestRate } = req.body;
    
    const transaction = db.transaction(() => {
      const groupInfo = db.prepare(`
        INSERT INTO groups (name, contribution_amount, total_members, start_date, payout_day, admin_id, description, interest_rate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(name, contributionAmount, totalMembers, startDate, payoutDay || 15, adminId, description, interestRate || 0);
      
      const groupId = groupInfo.lastInsertRowid;
      
      // Add admin as first member
      db.prepare(`
        INSERT INTO memberships (user_id, group_id, role, payout_month_index)
        VALUES (?, ?, 'admin', 0)
      `).run(adminId, groupId);

      return groupId;
    });

    const groupId = transaction();
    res.json({ id: groupId });
  });

  app.get("/api/groups/:id", (req, res) => {
    const group = db.prepare("SELECT * FROM groups WHERE id = ?").get(req.params.id);
    const members = db.prepare(`
      SELECT m.*, u.name, u.phone 
      FROM memberships m
      JOIN users u ON m.user_id = u.id
      WHERE m.group_id = ?
    `).all(req.params.id);
    
    res.json({ ...group, members });
  });

  app.put("/api/groups/:id", (req, res) => {
    const { name, contributionAmount, payoutDay, interestRate, status } = req.body;
    try {
      db.prepare("UPDATE groups SET name = ?, contribution_amount = ?, payout_day = ?, interest_rate = ?, status = ? WHERE id = ?")
        .run(name, contributionAmount, payoutDay, interestRate || 0, status || 'active', req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/groups/:id", (req, res) => {
    const groupId = req.params.id;
    
    const transaction = db.transaction(() => {
      // 1. Find all memberships for this group
      const memberships = db.prepare("SELECT id FROM memberships WHERE group_id = ?").all(groupId) as any[];
      const membershipIds = memberships.map(m => m.id);

      if (membershipIds.length > 0) {
        const placeholders = membershipIds.map(() => "?").join(",");
        // 2. Delete payments
        db.prepare(`DELETE FROM payments WHERE membership_id IN (${placeholders})`).run(...membershipIds);
        // 3. Delete payouts
        db.prepare(`DELETE FROM payouts WHERE membership_id IN (${placeholders})`).run(...membershipIds);
      }

      // 4. Delete month status
      db.prepare("DELETE FROM month_status WHERE group_id = ?").run(groupId);

      // 5. Delete memberships
      db.prepare("DELETE FROM memberships WHERE group_id = ?").run(groupId);

      // 6. Delete the group
      db.prepare("DELETE FROM groups WHERE id = ?").run(groupId);
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Add Member
  app.post("/api/groups/:id/members", (req, res) => {
    const { phone, name, payoutMonthIndex } = req.body;
    const groupId = req.params.id;

    let user = db.prepare("SELECT * FROM users WHERE phone = ?").get(phone) as any;
    if (!user) {
      const info = db.prepare("INSERT INTO users (name, phone) VALUES (?, ?)").run(name, phone);
      user = { id: info.lastInsertRowid, name, phone };
    }

    try {
      db.prepare(`
        INSERT INTO memberships (user_id, group_id, role, payout_month_index)
        VALUES (?, ?, 'member', ?)
      `).run(user.id, groupId, payoutMonthIndex);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Member already in group or index taken" });
    }
  });

  app.post("/api/groups/:id/members/bulk", (req, res) => {
    const { members } = req.body; // Array of { name, phone, payoutMonthIndex }
    const groupId = req.params.id;

    const transaction = db.transaction(() => {
      for (const member of members) {
        let user = db.prepare("SELECT * FROM users WHERE phone = ?").get(member.phone) as any;
        if (!user) {
          const info = db.prepare("INSERT INTO users (name, phone) VALUES (?, ?)").run(member.name, member.phone);
          user = { id: info.lastInsertRowid, name: member.name, phone: member.phone };
        }
        
        db.prepare(`
          INSERT INTO memberships (user_id, group_id, role, payout_month_index)
          VALUES (?, ?, 'member', ?)
        `).run(user.id, groupId, member.payoutMonthIndex);
      }
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Update Member
  app.put("/api/memberships/:id", (req, res) => {
    const { name, phone, payoutMonthIndex } = req.body;
    const membershipId = req.params.id;

    const transaction = db.transaction(() => {
      const membership = db.prepare("SELECT user_id, group_id, payout_month_index FROM memberships WHERE id = ?").get(membershipId) as any;
      if (!membership) throw new Error("Membership not found");

      // Update user details
      db.prepare("UPDATE users SET name = ?, phone = ? WHERE id = ?").run(name, phone, membership.user_id);

      // If payout month is changing, check for swap
      if (payoutMonthIndex !== undefined && payoutMonthIndex !== membership.payout_month_index) {
        // Find if someone else has the target month in the same group
        const otherMember = db.prepare("SELECT id FROM memberships WHERE group_id = ? AND payout_month_index = ? AND id != ?")
          .get(membership.group_id, payoutMonthIndex, membershipId) as any;

        if (otherMember) {
          // Swap: Move the other member to the current member's old month
          db.prepare("UPDATE memberships SET payout_month_index = ? WHERE id = ?")
            .run(membership.payout_month_index, otherMember.id);
        }

        // Update current member to new month
        db.prepare("UPDATE memberships SET payout_month_index = ? WHERE id = ?")
          .run(payoutMonthIndex, membershipId);
      }
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Payments
  app.get("/api/groups/:id/payments", (req, res) => {
    const payments = db.prepare(`
      SELECT p.*, u.name as member_name
      FROM payments p
      JOIN memberships m ON p.membership_id = m.id
      JOIN users u ON m.user_id = u.id
      WHERE m.group_id = ?
    `).all(req.params.id);
    res.json(payments);
  });

  app.post("/api/payments", (req, res) => {
    const { membershipId, monthIndex, amount, status, paidAt: customPaidAt, paymentMethod } = req.body;
    const paidAt = customPaidAt || (status === 'paid' ? new Date().toISOString() : null);
    
    const existing = db.prepare("SELECT id FROM payments WHERE membership_id = ? AND month_index = ?").get(membershipId, monthIndex) as any;
    
    if (existing) {
      db.prepare("UPDATE payments SET status = ?, paid_at = ?, payment_method = ? WHERE id = ?").run(status, paidAt, paymentMethod, existing.id);
    } else {
      db.prepare("INSERT INTO payments (membership_id, month_index, amount, status, paid_at, payment_method) VALUES (?, ?, ?, ?, ?, ?)").run(membershipId, monthIndex, amount, status, paidAt, paymentMethod);
    }
    
    res.json({ success: true });
  });

  app.post("/api/groups/:id/payments/bulk", (req, res) => {
    const { monthIndex, status } = req.body;
    const groupId = req.params.id;
    const paidAt = status === 'paid' ? new Date().toISOString() : null;

    const transaction = db.transaction(() => {
      const members = db.prepare("SELECT id FROM memberships WHERE group_id = ?").all(groupId) as any[];
      const group = db.prepare("SELECT contribution_amount FROM groups WHERE id = ?").get(groupId) as any;

      for (const member of members) {
        const existing = db.prepare("SELECT id FROM payments WHERE membership_id = ? AND month_index = ?").get(member.id, monthIndex) as any;
        if (existing) {
          db.prepare("UPDATE payments SET status = ?, paid_at = ? WHERE id = ?").run(status, paidAt, existing.id);
        } else {
          db.prepare("INSERT INTO payments (membership_id, month_index, amount, status, paid_at) VALUES (?, ?, ?, ?, ?)").run(member.id, monthIndex, group.contribution_amount, status, paidAt);
        }
      }
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/groups/:id/month-status", (req, res) => {
    const statuses = db.prepare("SELECT * FROM month_status WHERE group_id = ?").all(req.params.id);
    res.json(statuses);
  });

  app.post("/api/groups/:id/month-status", (req, res) => {
    const { monthIndex, status } = req.body;
    db.prepare(`
      INSERT INTO month_status (group_id, month_index, status)
      VALUES (?, ?, ?)
      ON CONFLICT(group_id, month_index) DO UPDATE SET status = excluded.status
    `).run(req.params.id, monthIndex, status);
    res.json({ success: true });
  });

  // Backup & Restore
  app.get("/api/backup", (req, res) => {
    try {
      const data = {
        users: db.prepare("SELECT * FROM users").all(),
        groups: db.prepare("SELECT * FROM groups").all(),
        memberships: db.prepare("SELECT * FROM memberships").all(),
        payments: db.prepare("SELECT * FROM payments").all(),
        payouts: db.prepare("SELECT * FROM payouts").all(),
        month_status: db.prepare("SELECT * FROM month_status").all()
      };
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/restore", (req, res) => {
    const data = req.body;
    console.log("Restore request received");
    
    if (!data || typeof data !== 'object') {
      console.error("Restore failed: Invalid data format");
      return res.status(400).json({ error: "Invalid backup data format." });
    }

    try {
      console.log("Disabling foreign keys...");
      db.exec("PRAGMA foreign_keys = OFF");

      const transaction = db.transaction(() => {
        console.log("Clearing existing tables...");
        db.prepare("DELETE FROM payments").run();
        db.prepare("DELETE FROM payouts").run();
        db.prepare("DELETE FROM month_status").run();
        db.prepare("DELETE FROM memberships").run();
        db.prepare("DELETE FROM groups").run();
        db.prepare("DELETE FROM users").run();

        console.log("Restoring users...");
        if (data.users && Array.isArray(data.users)) {
          const stmt = db.prepare("INSERT INTO users (id, name, phone, created_at) VALUES (?, ?, ?, ?)");
          data.users.forEach((u: any) => stmt.run(u.id, u.name, u.phone, u.created_at));
        }
        
        console.log("Restoring groups...");
        if (data.groups && Array.isArray(data.groups)) {
          const stmt = db.prepare("INSERT INTO groups (id, name, contribution_amount, total_members, start_date, payout_day, description, interest_rate, status, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
          data.groups.forEach((g: any) => stmt.run(g.id, g.name, g.contribution_amount, g.total_members, g.start_date, g.payout_day, g.description, g.interest_rate, g.status, g.admin_id));
        }
        
        console.log("Restoring memberships...");
        if (data.memberships && Array.isArray(data.memberships)) {
          const stmt = db.prepare("INSERT INTO memberships (id, user_id, group_id, role, payout_month_index, status) VALUES (?, ?, ?, ?, ?, ?)");
          data.memberships.forEach((m: any) => stmt.run(m.id, m.user_id, m.group_id, m.role, m.payout_month_index, m.status));
        }
        
        console.log("Restoring payments...");
        if (data.payments && Array.isArray(data.payments)) {
          const stmt = db.prepare("INSERT INTO payments (id, membership_id, month_index, amount, status, paid_at, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?)");
          data.payments.forEach((p: any) => stmt.run(p.id, p.membership_id, p.month_index, p.amount, p.status, p.paid_at, p.payment_method));
        }
        
        console.log("Restoring payouts...");
        if (data.payouts && Array.isArray(data.payouts)) {
          const stmt = db.prepare("INSERT INTO payouts (id, membership_id, month_index, amount, status, paid_at) VALUES (?, ?, ?, ?, ?, ?)");
          data.payouts.forEach((p: any) => stmt.run(p.id, p.membership_id, p.month_index, p.amount, p.status, p.paid_at));
        }
        
        console.log("Restoring month status...");
        if (data.month_status && Array.isArray(data.month_status)) {
          const stmt = db.prepare("INSERT INTO month_status (group_id, month_index, status) VALUES (?, ?, ?)");
          data.month_status.forEach((ms: any) => stmt.run(ms.group_id, ms.month_index, ms.status));
        }
      });

      console.log("Executing restore transaction...");
      transaction();
      console.log("Restore successful");
      res.json({ success: true });
    } catch (e: any) {
      console.error("Restore failed with error:", e);
      res.status(500).json({ error: "Database restore failed: " + e.message });
    } finally {
      console.log("Re-enabling foreign keys...");
      db.exec("PRAGMA foreign_keys = ON");
    }
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
}

startServer();
