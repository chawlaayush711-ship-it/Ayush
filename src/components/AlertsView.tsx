"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Wallet, 
  CheckCircle2, 
  ArrowRight 
} from "lucide-react";
import { motion } from "motion/react";
import { User, Group } from "@/src/types";

interface AlertsViewProps {
  user: User;
  theme: any;
  t: any;
  onSelectGroup: (g: Group) => void;
}

export const AlertsView = ({ user, theme, t, onSelectGroup }: AlertsViewProps) => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/groups?userId=${user.id}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch groups");
        }

        const groups: Group[] = Array.isArray(data) ? data : [];
        
        const newAlerts: any[] = [];
        const today = new Date();
        const currentDay = today.getDate();

        for (const group of groups) {
          // Payout day alert
          const payoutDay = group.payout_day || 15;
          const daysUntilPayout = payoutDay - currentDay;

          if (daysUntilPayout >= 0 && daysUntilPayout <= 3) {
            newAlerts.push({
              id: `payout-${group.id}`,
              type: 'payout',
              title: `Upcoming Payout: ${group.name}`,
              message: daysUntilPayout === 0 
                ? "Today is the payout day!" 
                : `Payout day is in ${daysUntilPayout} days.`,
              date: new Date().toISOString(),
              group: group,
              icon: Wallet,
              color: 'bg-amber-500'
            });
          }

          // Group status alert
          if (group.status === 'completed') {
            newAlerts.push({
              id: `completed-${group.id}`,
              type: 'status',
              title: `Group Completed: ${group.name}`,
              message: "This bhishi cycle has ended successfully.",
              date: new Date().toISOString(),
              group: group,
              icon: CheckCircle2,
              color: 'bg-emerald-500'
            });
          }
        }

        setAlerts(newAlerts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (error) {
        console.error("Failed to fetch alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [user.id]);

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto pb-32 animate-pulse">
        <div className="flex justify-between items-center mb-8">
          <div className="h-8 w-32 bg-stone-200 rounded-lg" />
          <div className="h-6 w-16 bg-stone-200 rounded-full" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 w-full bg-stone-200 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto pb-32">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold font-display">{t.alerts}</h2>
        {alerts.length > 0 && (
          <span className={`px-3 py-1 ${theme.light} ${theme.text} rounded-full text-[10px] font-black uppercase tracking-widest`}>
            {alerts.length} New
          </span>
        )}
      </div>

      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
            whileHover={{ scale: 1.01 }}
            onClick={() => onSelectGroup(alert.group)}
            className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm flex gap-4 cursor-pointer hover:border-stone-200 transition-all group"
          >
            <div className={`w-12 h-12 ${alert.color} rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0`}>
              <alert.icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-stone-900 truncate group-hover:text-stone-700 transition-colors">{alert.title}</h3>
                <span className="text-[10px] text-stone-400 font-bold whitespace-nowrap ml-2">
                  {new Date(alert.date).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-stone-500 leading-relaxed">{alert.message}</p>
              <div className="mt-3 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-stone-400 group-hover:text-stone-600 transition-colors">
                View Details <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </motion.div>
        ))}

        {alerts.length === 0 && (
          <div className="bg-white p-12 rounded-3xl border border-stone-100 text-center">
            <div className={`w-20 h-20 ${theme.light} rounded-full flex items-center justify-center mx-auto mb-6`}>
              <Bell className={`w-10 h-10 ${theme.text} opacity-20`} />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-2">All Caught Up!</h3>
            <p className="text-stone-400 text-sm">No new alerts for your groups right now.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
