"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  ChevronRight, 
  TrendingUp, 
  Search, 
  ArrowUpRight, 
  AlertCircle, 
  Cloud,
  Calendar
} from "lucide-react";
import { motion } from "motion/react";
import { User, Group } from "@/src/types";
import { safeFetch } from "@/lib/api";

interface DashboardProps {
  user: User;
  onSelectGroup: (g: Group) => void;
  onCreateGroup: () => void;
  theme: any;
  t: any;
}

export const Dashboard = ({ user, onSelectGroup, onCreateGroup, theme, t }: DashboardProps) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isFirstLoginToday, setIsFirstLoginToday] = useState(true);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await safeFetch(`/api/groups?userId=${user.id}`);
      setGroups(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to load your groups. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    
    const lastLogin = localStorage.getItem(`last_login_${user.id}`);
    const today = new Date().toDateString();
    if (lastLogin === today) {
      setIsFirstLoginToday(false);
    } else {
      localStorage.setItem(`last_login_${user.id}`, today);
    }
  }, [user.id]);

  const totalSaved = groups.reduce((acc, g) => acc + (g.contribution_amount * g.total_members), 0);
  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto pb-32 animate-pulse">
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-stone-200 rounded-lg" />
            <div className="h-8 w-48 bg-stone-200 rounded-lg" />
          </div>
          <div className="w-12 h-12 bg-stone-200 rounded-2xl" />
        </div>
        <div className="h-40 w-full bg-stone-200 rounded-3xl mb-8" />
        <div className="space-y-4">
          <div className="h-6 w-32 bg-stone-200 rounded-lg" />
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 w-full bg-stone-200 rounded-3xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-stone-600 font-medium">{error}</p>
        <button 
          onClick={fetchGroups}
          className={`${theme.color} text-white px-6 py-2 rounded-xl font-bold shadow-md`}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto pb-32">
        <header className="flex justify-between items-start mb-8">
          <div>
            <p className="text-stone-500 text-sm font-medium">
              {isFirstLoginToday ? t.welcome : t.welcomeBack}
            </p>
            <h2 className="text-2xl font-bold text-stone-900 leading-tight">{user.name}</h2>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-stone-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <Cloud className="w-3 h-3" /> Cloud Active
            </div>
            <button 
              onClick={onCreateGroup}
              className={`w-12 h-12 ${theme.color} ${theme.shadow} text-white rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg`}
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </header>

      {/* Summary Stats Card */}
      <div className={`${theme.color} rounded-3xl p-6 mb-8 text-white shadow-xl ${theme.shadow}`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-white/70 text-sm font-bold uppercase tracking-wider">{t.overallStats}</p>
            <h3 className="text-3xl font-black">₹{totalSaved.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-white/70 text-[10px] font-bold uppercase">{t.activeGroups}</p>
            <p className="font-bold">{groups.length}</p>
          </div>
          <div>
            <p className="text-white/70 text-[10px] font-bold uppercase">{t.totalSaved}</p>
            <p className="font-bold">₹{totalSaved.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Upcoming Payouts Horizontal Scroll */}
      <div className="mb-8 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-stone-900 text-lg">Upcoming Payouts</h3>
          <Calendar className="w-5 h-5 text-stone-300" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
          {groups.map((group) => {
            const today = new Date().getDate();
            const payoutDay = group.payout_day || 15;
            const isSoon = payoutDay >= today && payoutDay <= today + 7;
            
            return (
              <motion.div 
                key={`upcoming-${group.id}`}
                whileHover={{ y: -4 }}
                onClick={() => onSelectGroup(group)}
                className={`min-w-[200px] p-5 rounded-3xl border ${isSoon ? `${theme.border} bg-white` : 'border-stone-100 bg-white'} shadow-sm cursor-pointer shrink-0`}
              >
                <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isSoon ? theme.text : 'text-stone-400'}`}>
                  {isSoon ? 'Payout Soon' : `Day ${payoutDay}`}
                </p>
                <h4 className="font-bold text-stone-900 truncate mb-3">{group.name}</h4>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-900">₹{group.contribution_amount.toLocaleString()}</span>
                  <div className={`w-8 h-8 ${theme.light} rounded-xl flex items-center justify-center`}>
                    <ArrowUpRight className={`w-4 h-4 ${theme.text}`} />
                  </div>
                </div>
              </motion.div>
            );
          })}
          {groups.length === 0 && (
            <div className="w-full py-8 text-center bg-stone-50 rounded-3xl border border-dashed border-stone-200">
              <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">No upcoming payouts</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-stone-900 text-lg">My Groups</h3>
        <div className="relative w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-stone-100 focus:ring-2 focus:ring-stone-50 outline-none transition-all text-xs font-bold"
          />
        </div>
      </div>

      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        initial="hidden"
        animate="show"
        className="grid gap-4"
      >
        {filteredGroups.map((group) => (
          <motion.div 
            key={group.id}
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1 }
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectGroup(group)}
            className={`bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex items-center justify-between cursor-pointer hover:${theme.border} transition-all`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 ${theme.light} rounded-2xl flex items-center justify-center font-bold ${theme.text} text-xl`}>
                {group.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-lg">{group.name}</h3>
                <div className="flex items-center gap-2 text-sm text-stone-500">
                  <span className={`font-bold ${theme.text}`}>Pool: ₹{group.contribution_amount.toLocaleString()}</span>
                  <span>•</span>
                  <span>{group.total_members} {t.members}</span>
                </div>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center group-hover:${theme.light} transition-colors`}>
              <ChevronRight className={`w-5 h-5 text-stone-400 group-hover:${theme.text}`} />
            </div>
          </motion.div>
        ))}

        {filteredGroups.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200"
          >
            <p className="text-stone-400 mb-4">{search ? `No groups found matching "${search}"` : t.noGroups}</p>
            {!search && (
              <button 
                onClick={onCreateGroup}
                className={`${theme.text} font-bold flex items-center gap-2 mx-auto`}
              >
                <Plus className="w-5 h-5" /> {t.createGroup}
              </button>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
