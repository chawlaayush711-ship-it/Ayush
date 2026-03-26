import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import webpush from "@/lib/push";

const sendNotification = async (userId: string, title: string, body: string, url: string = "/") => {
  const { data: subscriptions } = await supabase.from("push_subscriptions").select("subscription").eq("user_id", userId);
  
  if (!subscriptions) return;

  for (const subRecord of subscriptions) {
    try {
      const subscription = subRecord.subscription as any;
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

export async function GET(request: Request) {
  // Check for authorization header to prevent unauthorized triggers
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log("Running daily notification check...");
  const today = new Date();
  const currentDay = today.getDate();
  
  const { data: groupsToRemind } = await supabase.from("groups").select("*").eq("status", "active");

  if (!groupsToRemind) return NextResponse.json({ success: true, message: "No active groups" });

  for (const group of groupsToRemind) {
    const reminderDay = group.payout_day - 2;
    if (currentDay === reminderDay) {
      const startDate = new Date(group.start_date);
      const monthsDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
      
      if (monthsDiff >= 0 && monthsDiff < group.total_members) {
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

  return NextResponse.json({ success: true });
}
