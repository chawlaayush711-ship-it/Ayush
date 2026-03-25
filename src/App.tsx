import React, { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  ChevronRight, 
  Wallet, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare,
  ArrowLeft,
  UserPlus,
  TrendingUp,
  History,
  Edit3,
  LogOut,
  Settings,
  Trash2,
  Bell,
  Home,
  User as UserIcon,
  Search,
  ArrowRight,
  ArrowUpRight,
  Check,
  X,
  Sparkles,
  Copy,
  RefreshCw,
  Smartphone,
  Banknote,
  Clock,
  Cloud,
  CloudOff,
  Download,
  Upload,
  Share2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import jsPDF from "jspdf";
import { domToPng } from "modern-screenshot";
import { GoogleGenAI } from "@google/genai";
import { translations, Language } from "./i18n";

// --- Types ---
interface User {
  id: number;
  name: string;
  phone: string;
}

interface Group {
  id: number;
  name: string;
  contribution_amount: number;
  total_members: number;
  start_date: string;
  payout_day: number;
  status: string;
  role: string;
  payout_month_index: number;
}

interface Member extends User {
  membership_id: number;
  role: string;
  payout_month_index: number;
}

interface Payment {
  id: number;
  membership_id: number;
  month_index: number;
  amount: number;
  status: 'pending' | 'paid' | 'late';
  member_name: string;
  paid_at?: string;
  payment_method?: 'cash' | 'upi';
}

// --- Constants ---
const THEMES = [
  { id: 'emerald', color: 'bg-emerald-600', hover: 'hover:bg-emerald-700', text: 'text-emerald-600', light: 'bg-emerald-50', shadow: 'shadow-emerald-100', border: 'border-emerald-200', ring: 'focus:ring-emerald-500' },
  { id: 'indigo', color: 'bg-indigo-600', hover: 'hover:bg-indigo-700', text: 'text-indigo-600', light: 'bg-indigo-50', shadow: 'shadow-indigo-100', border: 'border-indigo-200', ring: 'focus:ring-indigo-500' },
  { id: 'rose', color: 'bg-rose-600', hover: 'hover:bg-rose-700', text: 'text-rose-600', light: 'bg-rose-50', shadow: 'shadow-rose-100', border: 'border-rose-200', ring: 'focus:ring-rose-500' },
  { id: 'amber', color: 'bg-amber-600', hover: 'hover:bg-amber-700', text: 'text-amber-600', light: 'bg-amber-50', shadow: 'shadow-amber-100', border: 'border-amber-200', ring: 'focus:ring-amber-500' },
  { id: 'violet', color: 'bg-violet-600', hover: 'hover:bg-violet-700', text: 'text-violet-600', light: 'bg-violet-50', shadow: 'shadow-violet-100', border: 'border-violet-200', ring: 'focus:ring-violet-500' },
  { id: 'blue', color: 'bg-blue-600', hover: 'hover:bg-blue-700', text: 'text-blue-600', light: 'bg-blue-50', shadow: 'shadow-blue-100', border: 'border-blue-200', ring: 'focus:ring-blue-500' },
];

// --- Components ---

const Auth = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Basic normalization: remove non-digits
      const normalizedPhone = phone.replace(/\D/g, "");
      if (normalizedPhone.length < 10) {
        throw new Error("Please enter a valid 10-digit phone number.");
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone, name }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Login failed. Please try again.");
      }

      const user = await res.json();
      localStorage.setItem("bhishi_user", JSON.stringify(user));
      onLogin(user);
      // No setLoading(false) here to avoid a flash before the component unmounts
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-stone-100"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="flex justify-center items-center mb-2">
          <h1 className="text-3xl font-black tracking-tighter font-display">
            <span className="text-stone-900 uppercase">Bhishi</span>
            <span className="text-emerald-600 uppercase">Track</span>
          </h1>
        </div>
        <p className="text-stone-500 text-center mb-8">Secure group savings for your community</p>
        
        <motion.form 
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
          onSubmit={handleLogin} 
          className="space-y-4"
        >
          <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
            <label className="block text-sm font-semibold text-stone-700 mb-1">Your Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="e.g. Rajesh Kumar"
            />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
            <label className="block text-sm font-semibold text-stone-700 mb-1">Phone Number</label>
            <input 
              type="tel" 
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="10-digit mobile number"
            />
          </motion.div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}

          <motion.button 
            variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            type="submit"
            className={`w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Logging in...
              </>
            ) : (
              'Get Started'
            )}
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  );
};

const AlertsView = ({ user, theme, t, onSelectGroup }: { user: User, theme: any, t: any, onSelectGroup: (g: Group) => void }) => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
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

const Dashboard = ({ user, onSelectGroup, onCreateGroup, theme, t }: { user: User, onSelectGroup: (g: Group) => void, onCreateGroup: () => void, theme: any, t: any }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isFirstLoginToday, setIsFirstLoginToday] = useState(true);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/groups?userId=${user.id}`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch");
        return data;
      })
      .then(data => {
        setGroups(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("Dashboard fetch error:", err);
        setError(err.message || "Failed to load your groups. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
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
        {filteredGroups.map((group, idx) => (
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

const GroupDetail = ({ group: initialGroup, user, onBack, t, theme }: { group: Group, user: User, onBack: () => void, t: any, theme: any }) => {
  const [group, setGroup] = useState(initialGroup);
  const [details, setDetails] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'ledger' | 'insights' | 'schedule'>('overview');
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [isEditingPayoutDay, setIsEditingPayoutDay] = useState(false);
  const [newPayoutDay, setNewPayoutDay] = useState((group.payout_day ?? 15).toString());
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false);
  const [newMemberInputs, setNewMemberInputs] = useState([{ name: "", phone: "", payoutMonthIndex: 0 }]);
  const [monthStatuses, setMonthStatuses] = useState<any[]>([]);
  const [datePickerFor, setDatePickerFor] = useState<{ membershipId: number, monthIndex: number } | null>(null);
  const [selectedPaidDate, setSelectedPaidDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [ledgerView, setLedgerView] = useState<'grid' | 'list'>('grid');
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'paid' | 'pending' | 'late'>('all');
  const [ledgerSort, setLedgerSort] = useState<'name' | 'date'>('name');
  const [scheduleView, setScheduleView] = useState<'timeline' | 'calendar'>('timeline');

  useEffect(() => {
    if (!group.id) return;
    setIsSyncing(true);
    fetch(`/api/groups/${group.id}`).then(res => res.json()).then(d => {
      setDetails(d);
      setIsSyncing(false);
    });
    fetch(`/api/groups/${group.id}/payments`).then(res => res.json()).then(setPayments);
    fetch(`/api/groups/${group.id}/month-status`).then(res => res.json()).then(setMonthStatuses);
  }, [group.id]);

  const currentMonthStatus = monthStatuses.find(s => s.month_index === selectedMonthIndex)?.status || 'open';
  const isGroupEnded = group.status === 'completed';
  const isMonthFrozen = currentMonthStatus === 'frozen';
  const isFrozen = isMonthFrozen || isGroupEnded;

  const toggleMonthFreeze = async () => {
    if (isGroupEnded) return;
    const newStatus = isMonthFrozen ? 'open' : 'frozen';
    await fetch(`/api/groups/${group.id}/month-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthIndex: selectedMonthIndex, status: newStatus })
    });
    fetch(`/api/groups/${group.id}/month-status`).then(res => res.json()).then(setMonthStatuses);
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('group-report');
    if (!element) return;
    
    try {
      const imgData = await domToPng(element, {
        scale: 2,
        backgroundColor: '#f5f5f4'
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${group.name}-report.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const updatePaymentStatus = async (membershipId: number, monthIndex: number, status: 'paid' | 'pending' | 'late', paidAt?: string, paymentMethod?: string) => {
    if (isFrozen) return;
    await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        membershipId, 
        monthIndex, 
        amount: group.contribution_amount, 
        status,
        paidAt,
        paymentMethod
      }),
    });
    // Refresh
    fetch(`/api/groups/${group.id}/payments`).then(res => res.json()).then(setPayments);
    setDatePickerFor(null);
  };

  const currentMonthPayments = payments.filter(p => p.month_index === selectedMonthIndex && p.status === 'paid');
  const isAllPaid = details?.members && currentMonthPayments.length === details.members.length;

  const markAllPaid = async () => {
    const newStatus = isAllPaid ? 'pending' : 'paid';
    await fetch(`/api/groups/${group.id}/payments/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        monthIndex: selectedMonthIndex, 
        status: newStatus 
      }),
    });
    // Refresh
    fetch(`/api/groups/${group.id}/payments`).then(res => res.json()).then(setPayments);
  };

  const toggleGroupStatus = async () => {
    const newStatus = group.status === 'active' ? 'completed' : 'active';
    const res = await fetch(`/api/groups/${group.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        name: group.name, 
        contributionAmount: group.contribution_amount, 
        payoutDay: group.payout_day,
        interestRate: (group as any).interest_rate,
        status: newStatus
      }),
    });
    if (res.ok) {
      setGroup({ ...group, status: newStatus });
    }
  };

  const handleUpdatePayoutDay = async () => {
    if (isGroupEnded) return;
    const res = await fetch(`/api/groups/${group.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        name: group.name, 
        contributionAmount: group.contribution_amount, 
        payoutDay: parseInt(newPayoutDay),
        interestRate: (group as any).interest_rate,
        status: group.status
      }),
    });
    if (res.ok) {
      setGroup({ ...group, payout_day: parseInt(newPayoutDay) });
      setIsEditingPayoutDay(false);
    }
  };

  const handleDeleteGroup = async () => {
    const res = await fetch(`/api/groups/${group.id}`, { method: 'DELETE' });
    if (res.ok) {
      onBack();
    }
  };

  const generateAiInsights = async () => {
    setIsGeneratingAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const pendingMembers = details.members.filter((m: any) => 
        !payments.find(p => p.membership_id === m.id && p.month_index === selectedMonthIndex && p.status === 'paid')
      );

      const prompt = `
        You are an AI Financial Assistant for a "Bhishi" (Community Savings Group) app.
        Analyze the following group data and provide:
        1. A brief "Group Health Summary" (1-2 sentences).
        2. "Smart Reminders": 2-3 personalized, polite, and friendly WhatsApp reminder messages for pending members.
        3. "Strategic Advice": One actionable tip for the admin.

        Group Data:
        - Name: ${group.name}
        - Total Members: ${group.total_members}
        - Contribution: ₹${group.contribution_amount}
        - Interest Rate: ${group.interest_rate}%
        - Current Month: ${months[selectedMonthIndex].name}
        - Pending Members: ${pendingMembers.map((m: any) => m.name).join(', ')}
        - Language: ${t.languageName || 'English'}

        Format the response in clean Markdown. Use emojis to make it friendly.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setAiInsights(response.text || "Could not generate insights at this time.");
    } catch (error) {
      console.error("AI Error:", error);
      setAiInsights("Error generating AI insights. Please check your connection.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'insights' && !aiInsights) {
      generateAiInsights();
    }
  }, [activeTab]);

  if (!details) return <div className="p-8 text-center">Loading...</div>;

  const getMonthName = (startDate: string, monthIndex: number) => {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + monthIndex);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const months = Array.from({ length: group.total_members }, (_, i) => ({
    index: i,
    name: getMonthName(group.start_date, i)
  }));

  const payoutMember = details.members.find((m: any) => m.payout_month_index === selectedMonthIndex);
  const interestRate = (group as any).interest_rate || 0;
  
  // Dynamic Amount per Member calculation (The Payout)
  const getPayoutForMonth = (monthIdx: number) => {
    if (monthIdx === 0) return group.contribution_amount;
    const m2 = group.contribution_amount - (interestRate * 10000);
    return m2 + (monthIdx - 1) * (interestRate * 1000);
  };

  const currentAmountPerMember = getPayoutForMonth(selectedMonthIndex);
  const currentContributionPerMember = currentAmountPerMember / group.total_members;

  const calculateMemberTotalPaid = (memberId: string) => {
    const memberPayments = payments.filter(p => p.membership_id === memberId && p.status === 'paid');
    return memberPayments.reduce((sum, p) => {
      const monthPayout = getPayoutForMonth(p.month_index);
      return sum + (monthPayout / group.total_members);
    }, 0);
  };
  
  // Calculate progress
  const totalExpectedPayments = group.total_members * group.total_members;
  const totalPaidPayments = payments.filter(p => p.status === 'paid').length;
  const progressPercentage = Math.round((totalPaidPayments / totalExpectedPayments) * 100) || 0;

  return (
    <div className="min-h-screen bg-stone-50 pb-32">
      <div className="bg-white border-b border-stone-100 p-6 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate font-display">{group.name}</h2>
            <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">
              {group.total_members} {t.members} • ₹{group.contribution_amount.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSyncing ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
                <Cloud className="w-3 h-3" /> Synced
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-stone-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <Cloud className="w-3 h-3" /> Cloud Active
              </div>
            )}
            <button 
              onClick={handleExportPDF}
              className={`p-2 hover:${theme.light} text-stone-400 hover:${theme.text} rounded-xl transition-colors`}
              title={t.exportPdf}
            >
              <History className="w-5 h-5" />
            </button>
            {group.role === 'admin' && (
              <button 
                onClick={() => setShowDeleteGroupConfirm(true)}
                className="p-2 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded-xl transition-colors"
                title={t.deleteGroup}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 p-1 bg-stone-100 rounded-2xl">
          {[
            { id: 'overview', label: t.payments, icon: Wallet },
            { id: 'members', label: t.membersTab, icon: Users },
            { id: 'ledger', label: 'Ledger', icon: TrendingUp },
            { id: 'schedule', label: 'Schedule', icon: Calendar },
            { id: 'insights', label: 'AI Insights', icon: Sparkles }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id 
                  ? `bg-white ${theme.text} shadow-sm` 
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Month Selector */}
      <div className="bg-white border-b border-stone-100 px-6 py-4 overflow-x-auto flex gap-3 scrollbar-hide">
        {months.map((m) => (
          <button
            key={m.index}
            onClick={() => setSelectedMonthIndex(m.index)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              selectedMonthIndex === m.index
                ? `${theme.color} text-white border-transparent shadow-md ${theme.shadow}`
                : 'bg-white text-stone-500 border-stone-100 hover:border-stone-200'
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>

      <div id="group-report" className="p-6 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className={`${theme.color} rounded-3xl p-6 text-white shadow-xl ${theme.shadow} relative overflow-hidden`}>
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Wallet className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Amount per Member</p>
                      <h3 className="text-4xl font-black font-display">₹{currentAmountPerMember.toLocaleString()}</h3>
                      {interestRate > 0 && (
                        <p className="text-[10px] text-white/60 italic mt-1">
                          Interest Rate: {interestRate}%
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {group.role === 'admin' && (
                        <button 
                          onClick={toggleMonthFreeze}
                          disabled={isGroupEnded}
                          className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-xl transition-all ${isMonthFrozen ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'} ${isGroupEnded ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isMonthFrozen ? 'Unfreeze' : 'Freeze'}
                        </button>
                      )}
                      {group.role === 'admin' && selectedMonthIndex === group.total_members - 1 && (
                        <button 
                          onClick={toggleGroupStatus}
                          className={`text-[10px] px-3 py-1.5 rounded-xl font-bold transition-all uppercase tracking-wider shadow-sm ${group.status === 'active' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                        >
                          {group.status === 'active' ? t.endPool : t.reopenPool}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Scheduled Payout</p>
                      {isFrozen && (
                        <span className="text-[10px] bg-red-500/20 text-red-100 px-2 py-1 rounded-lg font-bold uppercase tracking-wider flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Frozen
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center font-black text-lg border border-white/20">
                        {payoutMember ? (details.members.findIndex((m: any) => m.id === payoutMember.id) + 1) : '?'}
                      </div>
                      <div>
                        <p className="font-bold text-lg">{payoutMember ? payoutMember.name : 'Not Assigned'}</p>
                        <p className="text-xs text-white/60">{payoutMember ? payoutMember.phone : 'Assign a member to this month'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm relative group">
                  <Calendar className={`w-5 h-5 ${theme.text} mb-2`} />
                  <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Payout Day</p>
                  {isEditingPayoutDay ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input 
                        type="number" 
                        min="1" 
                        max="31"
                        value={newPayoutDay}
                        onChange={(e) => setNewPayoutDay(e.target.value)}
                        className="w-full p-1 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-stone-200"
                      />
                      <button onClick={handleUpdatePayoutDay} className={`text-[10px] ${theme.color} text-white px-2 py-1 rounded-lg font-bold`}>Save</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-stone-900">{(group.payout_day ?? 15)}th</p>
                      {group.role === 'admin' && !isGroupEnded && (
                        <button onClick={() => setIsEditingPayoutDay(true)} className="text-stone-300 hover:text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
                  <TrendingUp className={`w-5 h-5 ${theme.text} mb-2`} />
                  <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Interest</p>
                  <p className="font-bold text-stone-900">{interestRate}%</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
                  <CheckCircle2 className={`w-5 h-5 ${theme.text} mb-2`} />
                  <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">My Status</p>
                  <p className={`font-bold ${payments.find(p => p.membership_id === details.members.find((m: any) => m.user_id === user.id)?.id && p.month_index === selectedMonthIndex)?.status === 'paid' ? theme.text : 'text-stone-400'}`}>
                    {payments.find(p => p.membership_id === details.members.find((m: any) => m.user_id === user.id)?.id && p.month_index === selectedMonthIndex)?.status === 'paid' ? 'Paid' : 'Pending'}
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-stone-900">Overall Progress</h4>
                  <span className={`text-sm font-bold ${theme.text}`}>{progressPercentage}%</span>
                </div>
                <div className="h-3 bg-stone-100 rounded-full overflow-hidden mb-2">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    className={`h-full ${theme.color} rounded-full`}
                  />
                </div>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{totalPaidPayments} of {totalExpectedPayments} payments collected</p>
              </div>

              <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-stone-50 flex justify-between items-center bg-stone-50/50">
                  <div className="flex flex-col">
                    <h4 className="font-bold text-stone-900">Member Payments</h4>
                    <span className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">{months[selectedMonthIndex].name}</span>
                  </div>
                  {group.role === 'admin' && !isFrozen && (
                    <button 
                      onClick={markAllPaid}
                      className={`text-[10px] px-3 py-1.5 rounded-xl font-bold transition-all uppercase tracking-wider ${isAllPaid ? 'bg-stone-200 text-stone-600' : `${theme.color} text-white shadow-md ${theme.shadow}`}`}
                    >
                      {isAllPaid ? t.markAllUnpaid : t.markAllPaid}
                    </button>
                  )}
                </div>
                <motion.div 
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.05
                      }
                    }
                  }}
                  initial="hidden"
                  animate="show"
                  className="divide-y divide-stone-50"
                >
                  {details.members.map((member: any, idx: number) => {
                    const payment = payments.find(p => p.membership_id === member.id && p.month_index === selectedMonthIndex);
                    return (
                      <motion.div 
                        key={member.id} 
                        variants={{
                          hidden: { opacity: 0, x: -10 },
                          show: { opacity: 1, x: 0 }
                        }}
                        className="p-4 flex items-center justify-between hover:bg-stone-50/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 ${theme.light} rounded-xl flex items-center justify-center text-xs font-black ${theme.text}`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-stone-900">{member.name}</p>
                            <p className="text-[10px] text-stone-400 font-medium">{member.phone}</p>
                          </div>
                        </div>
                        <motion.div layout>
                          {payment?.status === 'paid' ? (
                            group.role === 'admin' && !isFrozen ? (
                              <button 
                                onClick={() => updatePaymentStatus(member.id, selectedMonthIndex, 'pending')}
                                className={`${theme.text} flex items-center gap-1 text-xs font-bold hover:text-red-500 transition-colors`}
                                title="Click to mark as Unpaid"
                              >
                                <CheckCircle2 className="w-4 h-4" /> Paid
                              </button>
                            ) : (
                              <div className="flex flex-col items-end">
                                <span className={`${theme.text} flex items-center gap-1 text-xs font-bold`}>
                                  <CheckCircle2 className="w-4 h-4" /> Paid
                                </span>
                                <div className="flex flex-col items-end gap-0.5 mt-0.5">
                                  {payment.paid_at && (
                                    <span className="text-[8px] font-bold text-stone-400 uppercase">
                                      {new Date(payment.paid_at).toLocaleDateString()}
                                    </span>
                                  )}
                                  {payment.payment_method && (
                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-1 ${payment.payment_method === 'upi' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                                      {payment.payment_method === 'upi' ? <Smartphone className="w-2 h-2" /> : <Banknote className="w-2 h-2" />}
                                      {payment.payment_method}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          ) : payment?.status === 'late' ? (
                            group.role === 'admin' && !isFrozen ? (
                              <button 
                                onClick={() => updatePaymentStatus(member.id, selectedMonthIndex, 'pending')}
                                className="text-amber-600 flex items-center gap-1 text-xs font-bold hover:text-red-500 transition-colors"
                                title="Click to mark as Unpaid"
                              >
                                <Clock className="w-4 h-4" /> Late
                              </button>
                            ) : (
                              <span className="text-amber-600 flex items-center gap-1 text-xs font-bold">
                                <Clock className="w-4 h-4" /> Late
                              </span>
                            )
                          ) : (
                            group.role === 'admin' && !isFrozen ? (
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => {
                                    const msg = `Hi ${member.name}, reminder for ${group.name} contribution of ₹${group.contribution_amount.toLocaleString()} for ${months[selectedMonthIndex].name}. Please pay by ${group.payout_day}. Thank you!`;
                                    window.open(`https://wa.me/${member.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`);
                                  }}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                  title="Send WhatsApp Reminder"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </button>
                                {datePickerFor?.membershipId === member.id && datePickerFor?.monthIndex === selectedMonthIndex ? (
                                <div className="flex flex-col items-end gap-2 bg-stone-50 p-3 rounded-2xl border border-stone-100">
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="date" 
                                      value={selectedPaidDate}
                                      onChange={(e) => setSelectedPaidDate(e.target.value)}
                                      className="text-[10px] border rounded-lg p-1.5 outline-none focus:ring-1 focus:ring-emerald-500 bg-white font-bold"
                                    />
                                    <select 
                                      value={selectedPaymentMethod}
                                      onChange={(e) => setSelectedPaymentMethod(e.target.value as any)}
                                      className="text-[10px] border rounded-lg p-1.5 outline-none focus:ring-1 focus:ring-emerald-500 bg-white font-bold uppercase"
                                    >
                                      <option value="cash">Cash</option>
                                      <option value="upi">UPI</option>
                                    </select>
                                  </div>
                                  <div className="flex items-center gap-2 w-full">
                                    <button 
                                      onClick={() => updatePaymentStatus(member.id, selectedMonthIndex, 'paid', selectedPaidDate, selectedPaymentMethod)}
                                      className={`flex-1 flex items-center justify-center gap-1 py-2 ${theme.color} text-white rounded-xl shadow-sm text-[10px] font-bold uppercase tracking-wider`}
                                    >
                                      <Check className="w-3 h-3" /> Confirm
                                    </button>
                                    <button 
                                      onClick={() => setDatePickerFor(null)}
                                      className="p-2 bg-white text-stone-400 rounded-xl border border-stone-100"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => updatePaymentStatus(member.id, selectedMonthIndex, 'late')}
                                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                      title="Mark as Late"
                                    >
                                      <Clock className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setDatePickerFor({ membershipId: member.id, monthIndex: selectedMonthIndex });
                                        setSelectedPaidDate(new Date().toISOString().split('T')[0]);
                                      }}
                                      className={`text-[10px] ${theme.light} ${theme.text} px-4 py-2 rounded-xl font-bold hover:${theme.color} hover:text-white active:scale-95 transition-all`}
                                    >
                                      Mark Paid
                                    </button>
                                  </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-stone-300 flex items-center gap-1 text-xs font-bold">
                              <AlertCircle className="w-4 h-4" /> Pending
                            </span>
                          )
                        )}
                      </motion.div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            </motion.div>
          )}

        {activeTab === 'members' && (
          <motion.div 
            key="members"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-stone-900 font-display">Group Members ({details.members.length}/{group.total_members})</h3>
              {group.role === 'admin' && !isGroupEnded && (
                <button 
                  onClick={() => {
                    const lastMember = [...details.members].sort((a: any, b: any) => b.payout_month_index - a.payout_month_index)[0];
                    const nextIndex = lastMember ? lastMember.payout_month_index + 1 : 0;
                    setNewMemberInputs([{ name: "", phone: "", payoutMonthIndex: nextIndex }]);
                    setShowAddMember(true);
                  }}
                  className={`${theme.text} text-sm font-bold flex items-center gap-1 hover:underline`}
                >
                  <UserPlus className="w-4 h-4" /> Add Member
                </button>
              )}
            </div>
            <div className="bg-white rounded-3xl border border-stone-100 shadow-sm divide-y divide-stone-50 overflow-hidden">
              {details.members.map((member: any, idx: number) => (
                <div key={member.id} className="p-5 flex items-center justify-between hover:bg-stone-50/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 ${theme.light} rounded-2xl flex items-center justify-center text-sm font-black ${theme.text}`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-stone-900">{member.name}</p>
                      <p className="text-xs text-stone-400 font-medium">{member.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] text-stone-400 uppercase font-bold tracking-widest mb-0.5">Payout</p>
                      <p className={`font-black ${theme.text} text-sm`}>Month {member.payout_month_index + 1}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-stone-400 uppercase font-bold tracking-widest mb-0.5">Total Paid</p>
                      <p className="font-black text-stone-900 text-sm">₹{calculateMemberTotalPaid(member.id).toLocaleString()}</p>
                    </div>
                    {group.role === 'admin' && !isGroupEnded && (
                      <button 
                        onClick={() => setEditingMember(member)}
                        className={`p-2 hover:${theme.light} rounded-xl text-stone-300 hover:${theme.text} transition-all`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'ledger' && (
          <motion.div 
            key="ledger"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="font-bold text-stone-900 font-display">Payment Ledger</h3>
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-stone-100 p-1 rounded-xl flex gap-1">
                  <button 
                    onClick={() => setLedgerView('grid')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${ledgerView === 'grid' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400'}`}
                  >
                    Grid
                  </button>
                  <button 
                    onClick={() => setLedgerView('list')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${ledgerView === 'list' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400'}`}
                  >
                    List
                  </button>
                </div>
                
                {ledgerView === 'list' && (
                  <>
                    <select 
                      value={ledgerFilter}
                      onChange={(e) => setLedgerFilter(e.target.value as any)}
                      className="bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="all">All Status</option>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="late">Late</option>
                    </select>
                    <select 
                      value={ledgerSort}
                      onChange={(e) => setLedgerSort(e.target.value as any)}
                      className="bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="date">Sort by Date</option>
                    </select>
                  </>
                )}
              </div>
            </div>

            {ledgerView === 'grid' ? (
              <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-stone-50/50">
                      <th className="p-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 sticky left-0 bg-stone-50/50 z-10">Member</th>
                      {months.map(m => (
                        <th key={m.index} className="p-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 text-center">
                          {m.name.split(' ')[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {details.members.map((member: any) => (
                      <tr key={member.id} className="hover:bg-stone-50/30 transition-colors">
                        <td className="p-4 border-b border-stone-50 sticky left-0 bg-white z-10">
                          <p className="text-sm font-bold text-stone-900">{member.name}</p>
                          <p className="text-[10px] text-stone-400">{member.phone}</p>
                        </td>
                        {months.map(m => {
                          const payment = payments.find(p => p.membership_id === member.id && p.month_index === m.index);
                          const isPaid = payment?.status === 'paid';
                          return (
                            <td key={m.index} className="p-4 border-b border-stone-50 text-center">
                              {isPaid ? (
                                <div className="flex flex-col items-center gap-1">
                                  <div className={`w-6 h-6 ${theme.color} text-white rounded-full flex items-center justify-center mx-auto shadow-sm`}>
                                    <Check className="w-3.5 h-3.5" />
                                  </div>
                                  {payment.paid_at && (
                                    <span className="text-[8px] font-bold text-stone-400 uppercase">
                                      {new Date(payment.paid_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center mx-auto">
                                  <X className="w-3.5 h-3.5 text-stone-300" />
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const allPayments = details.members.flatMap((m: any) => 
                    months.map(month => {
                      const p = payments.find(pay => pay.membership_id === m.id && pay.month_index === month.index);
                      return {
                        ...p,
                        membership_id: m.id,
                        member_name: m.name,
                        member_phone: m.phone,
                        month_name: month.name,
                        month_index: month.index,
                        status: p?.status || 'pending',
                        paid_at: p?.paid_at || null
                      };
                    })
                  );

                  const filtered = allPayments.filter(p => {
                    if (ledgerFilter === 'all') return true;
                    return p.status === ledgerFilter;
                  });

                  const sorted = filtered.sort((a, b) => {
                    if (ledgerSort === 'name') {
                      return a.member_name.localeCompare(b.member_name);
                    } else {
                      const dateA = a.paid_at ? new Date(a.paid_at).getTime() : 0;
                      const dateB = b.paid_at ? new Date(b.paid_at).getTime() : 0;
                      return dateB - dateA;
                    }
                  });

                  if (sorted.length === 0) {
                    return <div className="p-12 text-center text-stone-400 bg-white rounded-3xl border border-dashed border-stone-200">No payments match your filters.</div>;
                  }

                  return sorted.map((p, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      key={`${p.membership_id}-${p.month_index}`} 
                      className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.status === 'paid' ? theme.light : 'bg-stone-50'}`}>
                          {p.status === 'paid' ? <Check className={`w-5 h-5 ${theme.text}`} /> : <Clock className="w-5 h-5 text-stone-300" />}
                        </div>
                        <div>
                          <p className="font-bold text-stone-900">{p.member_name}</p>
                          <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">{p.month_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-black uppercase tracking-widest ${p.status === 'paid' ? theme.text : 'text-stone-300'}`}>
                          {p.status}
                        </p>
                        {p.paid_at && (
                          <p className="text-[10px] text-stone-400 font-bold mt-0.5">
                            {new Date(p.paid_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ));
                })()}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'schedule' && (
          <motion.div 
            key="schedule"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="font-bold text-stone-900 font-display">Group Schedule</h3>
              <div className="flex items-center gap-2">
                <div className="bg-stone-100 p-1 rounded-xl flex gap-1">
                  <button 
                    onClick={() => setScheduleView('timeline')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${scheduleView === 'timeline' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400'}`}
                  >
                    Timeline
                  </button>
                  <button 
                    onClick={() => setScheduleView('calendar')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${scheduleView === 'calendar' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400'}`}
                  >
                    Calendar
                  </button>
                </div>
              </div>
            </div>

            {scheduleView === 'timeline' ? (
              <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-stone-200 before:via-stone-200 before:to-transparent">
                {months.map((m, i) => {
                  const isPast = i < selectedMonthIndex;
                  const isCurrent = i === selectedMonthIndex;
                  const payoutMember = details?.members?.find((member: any) => member.payout_month_index === i);
                  
                  return (
                    <div key={m.index} className="relative flex items-start gap-6 group">
                      <div className={`absolute left-0 w-10 h-10 rounded-2xl flex items-center justify-center z-10 transition-all shadow-sm ${
                        isPast ? 'bg-stone-100 text-stone-400' : 
                        isCurrent ? `${theme.color} text-white scale-110 shadow-lg ${theme.shadow}` : 
                        'bg-white border border-stone-200 text-stone-400'
                      }`}>
                        {isPast ? <Check className="w-5 h-5" /> : <span className="text-xs font-black">{i + 1}</span>}
                      </div>
                      
                      <div className="ml-14 flex-1">
                        <div className={`bg-white p-5 rounded-3xl border transition-all ${
                          isCurrent ? `${theme.border} shadow-md` : 'border-stone-100'
                        }`}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className={`font-bold ${isCurrent ? theme.text : 'text-stone-900'}`}>{m.name}</h4>
                              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                                Deadline: {group.payout_day}th {m.name.split(' ')[0]}
                              </p>
                            </div>
                            {isCurrent && (
                              <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${theme.light} ${theme.text}`}>
                                Active Month
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 p-3 bg-stone-50 rounded-2xl border border-stone-100">
                            <div className={`w-8 h-8 ${theme.light} rounded-xl flex items-center justify-center text-[10px] font-black ${theme.text}`}>
                              {payoutMember ? (details.members.findIndex((mem: any) => mem.id === payoutMember.id) + 1) : '?'}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-stone-900">{payoutMember ? payoutMember.name : 'Unassigned'}</p>
                              <p className="text-[10px] text-stone-400">Receives ₹{(group.contribution_amount * group.total_members).toLocaleString()}</p>
                            </div>
                            {payoutMember && (
                              <button 
                                onClick={() => {
                                  const msg = `Hi ${payoutMember.name}, you are scheduled for the payout of ₹${(group.contribution_amount * group.total_members).toLocaleString()} this month (${m.name}) in our ${group.name} group.`;
                                  window.open(`https://wa.me/${payoutMember.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`);
                                }}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {months.map((m, i) => {
                  const isPast = i < selectedMonthIndex;
                  const isCurrent = i === selectedMonthIndex;
                  const payoutMember = details?.members?.find((member: any) => member.payout_month_index === i);
                  
                  return (
                    <motion.div 
                      key={`cal-${m.index}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={`bg-white p-5 rounded-3xl border transition-all ${
                        isCurrent ? `${theme.border} ring-2 ring-offset-2 ${theme.ring.replace('focus:', '')}` : 'border-stone-100'
                      } ${isPast ? 'opacity-60' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm ${
                          isPast ? 'bg-stone-100 text-stone-400' : 
                          isCurrent ? `${theme.color} text-white` : 
                          'bg-stone-50 text-stone-400'
                        }`}>
                          {i + 1}
                        </div>
                        <div className="text-right">
                          <h4 className="font-bold text-stone-900">{m.name.split(' ')[0]}</h4>
                          <p className="text-[10px] text-stone-400 font-bold uppercase">{m.name.split(' ')[1]}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                          <span className="text-stone-400">Deadline</span>
                          <span className="text-stone-900">{group.payout_day}th</span>
                        </div>
                        <div className="h-px bg-stone-50" />
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 ${theme.light} rounded-lg flex items-center justify-center text-[8px] font-black ${theme.text}`}>
                            {payoutMember ? (details.members.findIndex((mem: any) => mem.id === payoutMember.id) + 1) : '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-stone-900 truncate">{payoutMember ? payoutMember.name : 'Unassigned'}</p>
                            <p className="text-[8px] text-stone-400 uppercase">Payout</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'insights' && (
          <motion.div 
            key="insights"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-stone-900 font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" /> AI Group Assistant
              </h3>
              <button 
                onClick={generateAiInsights}
                disabled={isGeneratingAi}
                className="p-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-400"
              >
                <RefreshCw className={`w-4 h-4 ${isGeneratingAi ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isGeneratingAi ? (
              <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <Sparkles className="w-8 h-8 text-amber-500" />
                </div>
                <p className="text-stone-400 font-medium animate-pulse">Analyzing group dynamics and generating smart reminders...</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6 prose prose-stone max-w-none">
                <div className="markdown-body">
                  {aiInsights ? (
                    <div className="space-y-4">
                      {aiInsights.split('\n').map((line, i) => (
                        <div key={i} className="flex items-start justify-between gap-4 group">
                          <p className="text-stone-700 leading-relaxed flex-1">{line}</p>
                          {line.trim().length > 15 && (
                            <button 
                              onClick={() => {
                                window.open(`https://wa.me/?text=${encodeURIComponent(line)}`);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all shrink-0"
                              title="Share to WhatsApp"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-stone-400 text-center py-8">No insights available. Click refresh to generate.</p>
                  )}
                </div>
              </div>
            )}

            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
              <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest mb-1">AI Tip</p>
              <p className="text-xs text-amber-800 leading-relaxed">
                Use these reminders to follow up with members politely. AI-generated messages often get better responses than standard "Please pay" texts!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMember && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Add Members</h3>
                <button 
                  onClick={() => {
                    const lastMember = details.members.sort((a: any, b: any) => b.payout_month_index - a.payout_month_index)[0];
                    const nextIndex = lastMember ? lastMember.payout_month_index + 1 : 0;
                    if (nextIndex < group.total_members) {
                      setNewMemberInputs([...newMemberInputs, { name: "", phone: "", payoutMonthIndex: nextIndex + newMemberInputs.length }]);
                    }
                  }}
                  className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const validMembers = newMemberInputs.filter(m => m.name.trim() !== "" && m.phone.trim() !== "");
                if (validMembers.length === 0) return;

                await fetch(`/api/groups/${group.id}/members/bulk`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ members: validMembers })
                });
                
                setShowAddMember(false);
                setNewMemberInputs([{ name: "", phone: "", payoutMonthIndex: details.members.length }]);
                fetch(`/api/groups/${group.id}`).then(res => res.json()).then(setDetails);
              }} className="space-y-6">
                <div className="space-y-4">
                  {newMemberInputs.map((input, idx) => (
                    <div key={idx} className="space-y-2 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-stone-400 uppercase">Member {idx + 1}</span>
                        {newMemberInputs.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => setNewMemberInputs(newMemberInputs.filter((_, i) => i !== idx))}
                            className="text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <input 
                        placeholder="Name" 
                        required 
                        value={input.name}
                        onChange={(e) => {
                          const updated = [...newMemberInputs];
                          updated[idx].name = e.target.value;
                          setNewMemberInputs(updated);
                        }}
                        className="w-full p-3 rounded-xl border border-stone-200 text-sm" 
                      />
                      <input 
                        placeholder="Phone" 
                        required 
                        value={input.phone}
                        onChange={(e) => {
                          const updated = [...newMemberInputs];
                          updated[idx].phone = e.target.value;
                          setNewMemberInputs(updated);
                        }}
                        className="w-full p-3 rounded-xl border border-stone-200 text-sm" 
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-stone-400 uppercase">Payout Month:</label>
                        <input 
                          type="number" 
                          min="1" 
                          max={group.total_members}
                          value={input.payoutMonthIndex + 1}
                          onChange={(e) => {
                            const updated = [...newMemberInputs];
                            updated[idx].payoutMonthIndex = parseInt(e.target.value) - 1;
                            setNewMemberInputs(updated);
                          }}
                          className="w-16 p-1 rounded-lg border border-stone-200 text-xs text-center" 
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4 sticky bottom-0 bg-white">
                  <button type="button" onClick={() => setShowAddMember(false)} className="flex-1 py-3 font-bold text-stone-500">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100">Add Members</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Group Confirmation Modal */}
      <AnimatePresence>
        {showDeleteGroupConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-center mb-2">Delete Group?</h3>
              <p className="text-stone-500 text-center text-sm mb-8">
                This will permanently delete <span className="font-bold text-stone-900">"{group.name}"</span> and all its records. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteGroupConfirm(false)}
                  className="flex-1 py-3 font-bold text-stone-500 hover:bg-stone-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteGroup}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Member Modal */}
      <AnimatePresence>
        {editingMember && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-8"
            >
              <h3 className="text-2xl font-bold mb-6">Edit Member</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                await fetch(`/api/memberships/${editingMember.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: formData.get('name'),
                    phone: formData.get('phone'),
                    payoutMonthIndex: parseInt(formData.get('month') as string) - 1
                  })
                });
                setEditingMember(null);
                fetch(`/api/groups/${group.id}`).then(res => res.json()).then(setDetails);
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Name</label>
                  <input name="name" defaultValue={editingMember.name} required className="w-full p-3 rounded-xl border border-stone-200" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Phone</label>
                  <input name="phone" defaultValue={editingMember.phone} required className="w-full p-3 rounded-xl border border-stone-200" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Payout Month (1-{group.total_members})</label>
                  <input name="month" type="number" min="1" max={group.total_members} defaultValue={editingMember.payout_month_index + 1} required className="w-full p-3 rounded-xl border border-stone-200" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setEditingMember(null)} className="flex-1 py-3 font-bold text-stone-500">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CreateGroup = ({ user, onCancel, onSuccess, theme, t }: { user: User, onCancel: () => void, onSuccess: () => void, theme: any, t: any }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(1000);
  const [interestRate, setInterestRate] = useState(0);
  const [membersCount, setMembersCount] = useState(10);
  const [payoutDay, setPayoutDay] = useState("15");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberInputs, setMemberInputs] = useState([
    { name: user.name, phone: user.phone, isYou: true },
    { name: "", phone: "" }
  ]);

  const addMemberInput = () => {
    if (memberInputs.length < membersCount) {
      setMemberInputs([...memberInputs, { name: "", phone: "" }]);
    }
  };

  const updateMemberInput = (index: number, field: 'name' | 'phone', value: string) => {
    const newInputs = [...memberInputs];
    newInputs[index] = { ...newInputs[index], [field]: value };
    setMemberInputs(newInputs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          contributionAmount: amount,
          interestRate,
          totalMembers: membersCount,
          startDate: date,
          payoutDay: parseInt(payoutDay),
          adminId: user.id
        }),
      });
      
      if (res.ok) {
        const { id: groupId } = await res.json();
        
        // Add other members (skipping the first one which is "You" and already added by backend)
        const otherMembers = memberInputs.slice(1).filter(m => m.name.trim() !== "");
        
        for (let i = 0; i < otherMembers.length; i++) {
          const mRes = await fetch(`/api/groups/${groupId}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: otherMembers[i].name,
              phone: otherMembers[i].phone || `999000${Math.floor(Math.random() * 10000)}`, // Fallback if phone is optional
              payoutMonthIndex: i + 1
            }),
          });
          if (!mRes.ok) {
            const mErr = await mRes.json();
            console.warn("Failed to add member:", mErr.error);
          }
        }
        
        onSuccess();
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to create group");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const totalPool = amount * membersCount;

  return (
    <div className="min-h-screen bg-stone-50 pb-32">
      <div className="bg-white border-b border-stone-100 p-6 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onCancel} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
              <ArrowLeft className="w-6 h-6 text-stone-600" />
            </button>
            <h2 className="text-xl font-bold text-stone-900 font-display">{t.newGroup}</h2>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={loading || !name}
            className={`px-6 py-2 ${theme.color} text-white rounded-xl font-bold shadow-lg ${theme.shadow} disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2`}
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            {t.create}
          </button>
        </div>
      </div>

      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit} 
        className="p-6 max-w-2xl mx-auto space-y-8"
      >
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}
        <div className="space-y-6">
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Group Name</label>
            <input 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-5 py-4 rounded-2xl border border-stone-200 focus:ring-2 focus:${theme.ring} outline-none transition-all text-lg font-bold`} 
              placeholder="e.g., Family Bhishi 2024"
            />
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-stone-700">Monthly Contribution</label>
              <div className={`px-4 py-2 ${theme.light} ${theme.text} rounded-xl font-black text-lg`}>
                ₹{amount.toLocaleString()}
              </div>
            </div>
            <input 
              type="range"
              min="500"
              max="500000"
              step="500"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value))}
              className={`w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer ${theme.accent}`}
            />
            <div className="flex justify-between text-[10px] text-stone-400 font-bold uppercase tracking-widest">
              <span>₹500</span>
              <span>₹5,00,000</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Interest (%)</label>
              <input 
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                className={`w-full px-4 py-3 rounded-xl border border-stone-100 focus:ring-2 focus:${theme.ring} outline-none transition-all font-bold`}
              />
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Members</label>
              <div className="flex items-center gap-3">
                <input 
                  type="number"
                  min="3"
                  max="100"
                  value={membersCount}
                  onChange={(e) => setMembersCount(parseInt(e.target.value) || 3)}
                  className={`w-full px-4 py-3 rounded-xl border border-stone-100 focus:ring-2 focus:${theme.ring} outline-none transition-all font-bold`}
                />
              </div>
            </motion.div>
          </div>

          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-stone-900 font-display">Members List ({memberInputs.length})</h3>
              <button 
                type="button"
                onClick={addMemberInput}
                disabled={memberInputs.length >= membersCount}
                className={`flex items-center gap-1 px-4 py-2 ${theme.light} ${theme.text} rounded-xl text-xs font-bold hover:${theme.color} hover:text-white transition-all disabled:opacity-50`}
              >
                <Plus className="w-4 h-4" /> Add Member
              </button>
            </div>
            
            <div className="bg-white rounded-3xl border border-stone-100 shadow-sm divide-y divide-stone-50 overflow-hidden">
              {memberInputs.map((member, index) => (
                <div key={index} className="p-4 flex items-center gap-4">
                  <span className="text-stone-300 font-black text-sm w-6 text-center">{index + 1}.</span>
                  <div className="flex-1">
                    <input 
                      placeholder="Name"
                      value={index === 0 ? "You" : member.name}
                      readOnly={index === 0}
                      onChange={(e) => updateMemberInput(index, 'name', e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border border-stone-100 text-sm outline-none transition-all ${index === 0 ? 'bg-stone-50 text-stone-400 font-bold' : `bg-white focus:ring-2 focus:${theme.ring} shadow-sm font-bold`}`}
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      placeholder="Phone"
                      value={member.phone}
                      readOnly={index === 0}
                      onChange={(e) => updateMemberInput(index, 'phone', e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border border-stone-100 text-sm outline-none transition-all ${index === 0 ? 'bg-stone-50 text-stone-400 font-bold' : `bg-white focus:ring-2 focus:${theme.ring} shadow-sm font-bold`}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Payout Day</label>
              <input 
                type="number"
                min="1"
                max="31"
                required
                value={payoutDay}
                onChange={(e) => setPayoutDay(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border border-stone-100 focus:ring-2 focus:${theme.ring} outline-none transition-all font-bold`}
              />
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Start Date</label>
              <input 
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border border-stone-100 focus:ring-2 focus:${theme.ring} outline-none transition-all font-bold`}
              />
            </motion.div>
          </div>
        </div>

        <motion.div 
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          className={`${theme.light} p-6 rounded-3xl border ${theme.border} relative overflow-hidden`}
        >
          <div className="relative z-10">
            <p className={`text-[10px] ${theme.text} font-black uppercase tracking-widest mb-1`}>Initial Payout (Month 1)</p>
            <p className="text-3xl font-black text-stone-900 mb-1">₹{amount.toLocaleString()}</p>
            <p className="text-xs text-stone-500 font-medium">Each member receives this amount in the first month.</p>
          </div>
          <Wallet className={`absolute top-0 right-0 w-24 h-24 ${theme.text} opacity-5 -mr-4 -mt-4`} />
        </motion.div>

        <motion.button 
          variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className={`w-full ${theme.color} text-white font-black py-5 rounded-2xl hover:opacity-90 transition-all shadow-xl ${theme.shadow} text-lg font-display uppercase tracking-widest`}
        >
          Create Group
        </motion.button>
      </motion.form>
    </div>
  );
};

const Assistant = ({ user }: { user: User }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userMsg, context: { user } }),
    });
    const data = await res.json();
    setMessages(prev => [...prev, { role: 'ai', text: data.text }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-stone-50">
      <div className="p-6 border-b bg-white font-bold flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-stone-900">Bhishi Assistant</h3>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Online</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-stone-300" />
            </div>
            <p className="text-stone-400 text-sm">Ask me anything about Bhishi rules,<br/>payouts, or how to use the app!</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${
              m.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-tr-none' 
                : 'bg-white border border-stone-100 text-stone-800 rounded-tl-none'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-stone-100 p-4 rounded-2xl rounded-tl-none shadow-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="p-6 bg-white border-t">
        <div className="flex gap-2 bg-stone-50 p-2 rounded-2xl border border-stone-200 focus-within:border-emerald-500 transition-colors">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your question..."
            className="flex-1 bg-transparent px-3 py-2 outline-none text-sm"
          />
          <button 
            onClick={handleSend} 
            disabled={!input.trim() || loading}
            className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingsView = ({ user, onLogout, onDeleteAccount, onBack, language, setLanguage, theme, setThemeId, t, deferredPrompt, isInstalled, setDeferredPrompt }: { user: User, onLogout: () => void, onDeleteAccount: () => void, onBack: () => void, language: Language, setLanguage: (l: any) => void, theme: any, setThemeId: (id: string) => void, t: any, deferredPrompt: any, isInstalled: boolean, setDeferredPrompt: (p: any) => void }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const downloadPRD = () => {
    const doc = new jsPDF();
    const prdContent = `
# Product Requirements Document: Bhishi PWA

## 1. Project Overview
Bhishi is a community-driven financial management platform designed to digitize traditional "Chit Fund" or "ROSCAs" (Rotating Savings and Credit Associations). It simplifies the complex task of tracking monthly contributions, managing payout rotations, and ensuring transparency among community members.

---

## 2. User Flow & Navigation
1. Onboarding: User enters Name & Phone -> System verifies/creates account -> User lands on Dashboard.
2. Creation: User clicks "New Group" -> Fills details (Amount, Members, Date) -> Adds members -> Group is initialized with a 12-month schedule.
3. Management: User selects a Group -> Views monthly status -> Marks payments as "Paid" -> Views who is receiving the payout this month.
4. Settings: User toggles Language (EN/HI/MR) -> Selects Theme -> Enables Push Notifications -> Exports/Restores data.

---

## 3. Detailed Page Breakdown

### A. Authentication / Landing Page
* Purpose: Entry point for users.
* Components: AuthView, Input, Button.
* Logic: Checks localStorage for an existing session.

### B. Main Dashboard
* Purpose: High-level overview of all financial commitments.
* Components: StatsCard, GroupCard, AlertsBanner, BottomNav.

### C. Group Detail View
* Purpose: Granular management of a specific Bhishi group.
* Sections: Header, Month Selector, Payout Info, Member List.

### D. Create Group View
* Purpose: Step-by-step wizard to initialize a new association.
* Form Fields: Basic Info, Schedule, Members.

### E. Settings & Profile View
* Purpose: Personalization and data management.
* Features: Theme Picker, Language Toggle, Notification Toggle, Data Tools.

---

## 4. Component Library (Frontend)
* Button: High-impact action button.
* Card: Container with rounded-3xl.
* ProgressBar: Visual indicator of group completion.
* Modal: Animated overlay for confirmations.
* EmptyState: Illustrated view when no groups exist.

---

## 5. Technical Architecture
* Frontend: React 18+ with TypeScript, Vite, and Tailwind CSS.
* PWA: manifest.json and Service Worker.
* Backend: Node.js with Express.
* Database: SQLite using better-sqlite3.
* Cron Jobs: node-cron for daily reminders.

---

## 6. Production Checklist
1. VAPID Keys for notifications.
2. SSL (required for Service Workers).
3. Error Logging for debugging.
4. Responsive Design for all devices.
    `;
    
    const splitText = doc.splitTextToSize(prdContent, 180);
    doc.text(splitText, 15, 15);
    doc.save("Bhishi_PRD.pdf");
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
    if (res.ok) {
      onDeleteAccount();
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto pb-32">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold">{t.profile}</h2>
      </header>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex items-center gap-4">
          <div className={`w-20 h-20 ${theme.color} rounded-full flex items-center justify-center text-white text-3xl font-black shadow-lg ${theme.shadow}`}>
            {user.name[0]}
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900">{user.name}</h3>
            <p className="text-stone-500">{user.phone}</p>
          </div>
        </div>

        {/* Theme Picker */}
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Edit3 className={`w-5 h-5 ${theme.text}`} />
            <h3 className="font-bold">{t.selectTheme}</h3>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {THEMES.map((th) => (
              <button
                key={th.id}
                onClick={() => setThemeId(th.id)}
                className={`w-full aspect-square rounded-2xl ${th.color} transition-all ${theme.id === th.id ? 'ring-4 ring-stone-200 scale-90' : 'hover:scale-105'}`}
              />
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <History className={`w-5 h-5 ${theme.text}`} />
            <h3 className="font-bold">{t.language}</h3>
          </div>
          <div className="flex gap-2">
            {(['en', 'hi', 'mr'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${language === lang ? `${theme.color} text-white` : 'bg-stone-50 text-stone-400 hover:bg-stone-100'}`}
              >
                {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'मराठी'}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Bell className={`w-5 h-5 ${theme.text}`} />
            <h3 className="font-bold">Notifications</h3>
          </div>
          <p className="text-sm text-stone-500 mb-6">Get reminders for contribution deadlines and payout dates.</p>
          <button
            onClick={async () => {
              if (!('Notification' in window)) {
                alert("This browser does not support desktop notification");
              } else if (Notification.permission === "granted") {
                alert("Notifications already enabled!");
              } else {
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                  window.location.reload(); // Reload to trigger subscription logic in App
                }
              }
            }}
            className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${Notification.permission === 'granted' ? 'bg-stone-50 text-stone-400' : `${theme.color} text-white shadow-lg ${theme.shadow}`}`}
          >
            {Notification.permission === 'granted' ? (
              <><CheckCircle2 className="w-5 h-5" /> Notifications Enabled</>
            ) : (
              <><Smartphone className="w-5 h-5" /> Enable Push Notifications</>
            )}
          </button>
        </div>

        {/* PWA Installation */}
        {!isInstalled && deferredPrompt && (
          <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Download className={`w-5 h-5 ${theme.text}`} />
              <h3 className="font-bold">Install App</h3>
            </div>
            <p className="text-sm text-stone-500 mb-6">Install Bhishi on your home screen for quick access and offline use.</p>
            <button
              onClick={async () => {
                if (deferredPrompt) {
                  deferredPrompt.prompt();
                  const { outcome } = await deferredPrompt.userChoice;
                  if (outcome === 'accepted') {
                    setDeferredPrompt(null);
                  }
                }
              }}
              className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${theme.color} text-white shadow-lg ${theme.shadow}`}
            >
              <Plus className="w-5 h-5" /> Install Now
            </button>
          </div>
        )}

        {/* Cloud Backup & Sync */}
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Cloud className={`w-5 h-5 ${theme.text}`} />
            <h3 className="font-bold">Cloud Backup & Sync</h3>
          </div>
          <p className="text-sm text-stone-500 mb-6">Your data is automatically synced to the cloud. You can also manually export or restore your backups here.</p>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={async () => {
                const res = await fetch('/api/backup');
                const data = await res.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `bhishi-backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
              }}
              className="flex items-center justify-center gap-2 py-3 bg-stone-50 text-stone-600 font-bold rounded-xl hover:bg-stone-100 transition-all border border-stone-100"
            >
              <Download className="w-4 h-4" /> Export Backup
            </button>
            <label className="flex items-center justify-center gap-2 py-3 bg-stone-50 text-stone-600 font-bold rounded-xl hover:bg-stone-100 transition-all border border-stone-100 cursor-pointer">
              <Upload className="w-4 h-4" /> Restore Backup
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = async (event) => {
                    try {
                      const data = JSON.parse(event.target?.result as string);
                      const res = await fetch('/api/restore', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                      });
                      if (res.ok) {
                        alert("Backup restored successfully! You will be logged out to refresh your session.");
                        onLogout();
                        window.location.reload();
                      } else {
                        const err = await res.json();
                        alert("Failed to restore backup: " + (err.error || "Unknown error"));
                      }
                    } catch (err) {
                      alert("Error processing backup file: " + (err instanceof Error ? err.message : "Invalid format"));
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </label>
          </div>
        </div>

        {/* Developer Resources */}
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className={`w-5 h-5 ${theme.text}`} />
            <h3 className="font-bold">Developer Resources</h3>
          </div>
          <p className="text-sm text-stone-500 mb-6">Download the detailed Product Requirements Document (PRD) for this application.</p>
          <button 
            onClick={downloadPRD}
            className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${theme.color} text-white shadow-lg ${theme.shadow}`}
          >
            <Download className="w-5 h-5" /> Download PRD (PDF)
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
          <h3 className="text-red-600 font-bold mb-2">{t.dangerZone}</h3>
          <p className="text-red-500 text-sm mb-4">{t.deleteAccountDesc}</p>
          <div className="flex gap-3">
            <button 
              onClick={onLogout}
              className="flex-1 bg-white text-stone-600 font-bold py-3 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" /> {t.logout}
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" /> {t.deleteAccountBtn}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-center mb-2">{t.confirmSure}</h3>
              <p className="text-stone-500 text-center mb-8">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-stone-100 text-stone-600 font-bold py-4 rounded-xl hover:bg-stone-200 transition-colors"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 transition-colors"
                >
                  {t.yesDelete}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Helpers ---
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("bhishi_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [view, setView] = useState<'dashboard' | 'settings' | 'create' | 'detail' | 'alerts'>('dashboard');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [themeId, setThemeId] = useState(() => localStorage.getItem('theme') || 'emerald');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const t = translations[language];

  useEffect(() => {
    localStorage.setItem('theme', themeId);
  }, [themeId]);

  // Verify user on startup
  useEffect(() => {
    if (user) {
      fetch(`/api/auth/verify/${user.id}`).then(res => {
        if (!res.ok) {
          handleLogout();
        }
      }).catch(() => {
        // If server is down, don't logout, just wait
      });
    }
  }, []);

  // PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Push Notifications Subscription
  useEffect(() => {
    if (user && 'serviceWorker' in navigator && 'PushManager' in window) {
      registerAndSubscribe();
    }
  }, [user]);

  const registerAndSubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');

      const res = await fetch('/api/push/vapid-public-key');
      const { publicKey } = await res.json();

      if (!publicKey) {
        console.warn('VAPID public key not found on server');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          subscription
        })
      });
      console.log('User subscribed to push notifications');
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("bhishi_user");
    setUser(null);
    setView('dashboard');
  };

  return (
    <AnimatePresence mode="wait">
      {!user ? (
        <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Auth onLogin={setUser} />
        </motion.div>
      ) : (
        <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-stone-50 font-sans text-stone-900 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {view === 'dashboard' && (
                <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                  <Dashboard 
                    user={user} 
                    onSelectGroup={(g) => { setSelectedGroup(g); setView('detail'); }}
                    onCreateGroup={() => setView('create')}
                    theme={theme}
                    t={t}
                  />
                </motion.div>
              )}
              {view === 'alerts' && (
                <motion.div key="alerts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                  <AlertsView 
                    user={user} 
                    theme={theme} 
                    t={t} 
                    onSelectGroup={(g) => { setSelectedGroup(g); setView('detail'); }}
                  />
                </motion.div>
              )}
              {view === 'settings' && (
                <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                  <SettingsView 
                    user={user}
                    onLogout={handleLogout}
                    onDeleteAccount={handleLogout}
                    onBack={() => setView('dashboard')}
                    language={language}
                    setLanguage={setLanguage}
                    theme={theme}
                    setThemeId={setThemeId}
                    t={t}
                    deferredPrompt={deferredPrompt}
                    isInstalled={isInstalled}
                    setDeferredPrompt={setDeferredPrompt}
                  />
                </motion.div>
              )}
              {view === 'create' && (
                <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                  <CreateGroup 
                    user={user} 
                    onCancel={() => setView('dashboard')}
                    onSuccess={() => setView('dashboard')}
                    theme={theme}
                    t={t}
                  />
                </motion.div>
              )}
              {view === 'detail' && selectedGroup && (
                <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                  <GroupDetail 
                    group={selectedGroup} 
                    user={user}
                    onBack={() => setView('dashboard')}
                    t={t}
                    theme={theme}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
            {[
              { id: 'dashboard', icon: Home, label: t.home },
              { id: 'alerts', icon: Bell, label: t.alerts },
              { id: 'settings', icon: UserIcon, label: t.profile },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id as any)}
                className={`flex flex-col items-center gap-1 transition-all ${view === item.id ? theme.text : 'text-stone-400'}`}
              >
                <item.icon className={`w-6 h-6 ${view === item.id ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
              </button>
            ))}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
