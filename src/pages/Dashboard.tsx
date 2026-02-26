import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { 
  LayoutDashboard, 
  History, 
  ShieldAlert, 
  ShieldCheck, 
  TrendingUp,
  Clock,
  ArrowUpRight,
  Search,
  CreditCard,
  Zap
} from "lucide-react";
import { motion } from "motion/react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

interface HistoryItem {
  id: number;
  type: string;
  content: string;
  risk_score: number;
  risk_level: string;
  explanation: string;
  owner_info: string;
  created_at: string;
}

interface Stats {
  totalChecks: number;
  highRiskDetected: number;
  averageRiskScore: number;
  registeredUsers: number;
  guestUsers: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, refreshUser, isLoading: userLoading } = useUser();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [referrals, setReferrals] = useState<any[]>([]);

  useEffect(() => {
    if (!user && !userLoading) {
      navigate("/auth");
      return;
    }

    const fetchData = async () => {
      try {
        const [historyRes, statsRes] = await Promise.all([
          fetch("/api/history"),
          fetch("/api/stats")
        ]);
        const historyData = await historyRes.json();
        const statsData = await statsRes.json();
        setHistory(historyData);
        setStats(statsData);

        if (user) {
          const refRes = await fetch(`/api/user/referrals?email=${encodeURIComponent(user.email)}`);
          const refData = await refRes.json();
          setReferrals(refData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const chartData = (history || []).slice(0, 10).reverse().map(item => ({
    time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    score: item.risk_score
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-accent-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12 gap-6">
        <div className="flex items-center gap-4">
          {user?.profile_photo ? (
            <img src={user.profile_photo} alt="Profile" className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-accent-cyan/30" />
          ) : (
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-accent-cyan/10 flex items-center justify-center border-2 border-accent-cyan/30">
              <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-accent-cyan" />
            </div>
          )}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-1">Welcome, {user?.name || "User"}</h1>
            <p className="text-gray-400 text-sm md:text-base">Monitor your security status and analysis history.</p>
          </div>
        </div>
        {user ? (
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-accent-cyan/20 text-accent-cyan px-4 py-2 rounded-full border border-accent-cyan/30 w-fit">
              <Zap className="w-4 h-4" />
              <span className="text-xs md:text-sm font-bold">{user.searches_remaining} Searches Left</span>
            </div>
            <div className="flex items-center gap-2 bg-accent-purple/20 text-accent-purple px-4 py-2 rounded-full border border-accent-purple/30 w-fit">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs md:text-sm font-bold">{user.credits} Credits</span>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => navigate("/")}
            className="btn-primary px-6 py-2 text-sm"
          >
            Login to see stats
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
        {[
          { label: "Total Checks", value: stats?.totalChecks || 0, icon: Search, color: "text-accent-cyan" },
          { label: "High Risk Detected", value: stats?.highRiskDetected || 0, icon: ShieldAlert, color: "text-risk-high" },
          { label: "Avg. Risk Score", value: stats?.averageRiskScore || 0, icon: ShieldCheck, color: "text-risk-low" },
          { label: "Free Tier Users", value: stats?.guestUsers || 0, icon: Zap, color: "text-accent-purple" },
          { label: "Registered Users", value: stats?.registeredUsers || 0, icon: ShieldCheck, color: "text-accent-cyan" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 flex flex-col items-center text-center"
          >
            <div className={`p-3 rounded-xl bg-white/5 ${stat.color} mb-4`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-sm text-gray-400 font-medium mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Referrals Section */}
      {user && (
        <div className="glass p-8 mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold mb-1">Your Referrals</h3>
              <p className="text-sm text-gray-400">Invite friends to get free searches. Check your profile for your referral code.</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-accent-cyan">{referrals?.length || 0}</p>
              <p className="text-xs text-gray-500 uppercase">Total Referrals</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {referrals?.map((ref, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent-cyan/10 text-accent-cyan flex items-center justify-center font-bold text-xs">
                  {ref.referred_email?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{ref.referred_email}</p>
                  <p className="text-[10px] text-gray-500">{new Date(ref.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {(!referrals || referrals.length === 0) && (
              <div className="col-span-full text-center py-8 text-gray-500 border-2 border-dashed border-white/5 rounded-2xl">
                <p>No referrals yet. Start inviting friends!</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 glass p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg md:text-xl font-bold">Risk History Chart</h3>
            <div className="flex items-center gap-4 text-[10px] md:text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-accent-cyan" />
                Risk Score
              </div>
            </div>
          </div>
          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F5FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00F5FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#ffffff40" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#ffffff40" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#00F5FF' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#00F5FF" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent History */}
        <div className="glass p-6 md:p-8 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg md:text-xl font-bold">Recent Checks</h3>
            <Link to="/history" className="text-xs text-accent-cyan hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {history?.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                <div className={`p-2 rounded-lg ${
                  item.risk_level === 'High' ? 'bg-risk-high/10 text-risk-high' :
                  item.risk_level === 'Medium' ? 'bg-risk-medium/10 text-risk-medium' : 'bg-risk-low/10 text-risk-low'
                }`}>
                  {item.risk_level === 'High' ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-bold truncate">{item.content}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                  {item.owner_info && (
                    <p className="text-[10px] text-accent-cyan font-medium mt-1">Owner: {item.owner_info}</p>
                  )}
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-accent-cyan transition-colors" />
              </div>
            ))}
            {(!history || history.length === 0) && (
              <div className="text-center py-12 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No analysis history found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Link({ to, children, className }: { to: string, children: React.ReactNode, className?: string }) {
  return <a href={to} className={className}>{children}</a>;
}
