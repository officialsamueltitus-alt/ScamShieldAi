import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Shield, 
  Search, 
  History, 
  Database as DbIcon, 
  BookOpen, 
  CreditCard, 
  LayoutDashboard,
  Menu,
  X,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowRight,
  Zap,
  Mail,
  User as UserIcon,
  Share2,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { UserProvider, useUser } from "./context/UserContext";
import Auth from "./pages/Auth";

// Pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ScamDatabase from "./pages/ScamDatabase";
import Education from "./pages/Education";
import Pricing from "./pages/Pricing";
import Profile from "./pages/Profile";

// Detailed Education Pages
import InvestmentScams from "./pages/education/InvestmentScams";
import CryptoRedFlags from "./pages/education/CryptoRedFlags";
import PhishingTactics from "./pages/education/PhishingTactics";
import FakeVendorDetection from "./pages/education/FakeVendorDetection";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function Navbar() {
  const { user, logout } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: "Analyze", path: "/", icon: Search },
    { name: "Database", path: "/database", icon: DbIcon },
    { name: "Education", path: "/education", icon: BookOpen },
    { name: "Credits", path: "/pricing", icon: CreditCard },
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
      <div className="max-w-7xl mx-auto glass px-6 py-3 flex items-center justify-between relative">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-accent-cyan/20 p-2 rounded-lg group-hover:bg-accent-cyan/30 transition-colors">
            <Shield className="w-6 h-6 text-accent-cyan" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">ScamShield <span className="text-accent-cyan">AI</span></span>
        </Link>

        {/* Desktop Nav - Centered */}
        <div className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "text-xs font-bold uppercase tracking-widest transition-colors hover:text-accent-cyan flex items-center gap-2",
                location.pathname === item.path ? "text-accent-cyan" : "text-gray-400"
              )}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.name}
            </Link>
          ))}
        </div>

        {/* Desktop Actions - Right */}
        <div className="hidden lg:flex items-center gap-4">
          <button 
            onClick={() => navigate("/pricing")}
            className="btn-primary py-2 px-4 text-xs"
          >
            Get Credits
          </button>
          <Link 
            to="/profile"
            className={cn(
              "w-10 h-10 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all",
              location.pathname === "/profile" ? "border-accent-cyan" : "border-white/10 hover:border-white/30"
            )}
          >
            {user?.profile_photo ? (
              <img src={user.profile_photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-5 h-5 text-gray-400" />
            )}
          </Link>
          {user && (
            <button 
              onClick={() => logout()}
              className="text-gray-500 hover:text-risk-high text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              Logout
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button className="lg:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-20 left-4 right-4 glass p-6 flex flex-col gap-4"
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "text-lg font-medium flex items-center gap-3",
                  location.pathname === item.path ? "text-accent-cyan" : "text-gray-400"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className={cn(
                "text-lg font-medium flex items-center gap-3",
                location.pathname === "/profile" ? "text-accent-cyan" : "text-gray-400"
              )}
            >
              <UserIcon className="w-5 h-5" />
              Profile
            </Link>
            <button 
              onClick={() => {
                navigate("/pricing");
                setIsOpen(false);
              }}
              className="btn-primary w-full mt-4"
            >
              Get Credits
            </button>
            {user && (
              <button 
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full py-3 text-risk-high font-bold border border-risk-high/20 rounded-xl mt-2"
              >
                Logout
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = async () => {
    if (!email) return;
    const res = await fetch("/api/user/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.success) alert("Subscribed successfully!");
    else alert(data.message);
    setEmail("");
  };

  return (
    <footer className="py-12 px-4 border-t border-white/5 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <Shield className="w-8 h-8 text-accent-cyan" />
            <span className="text-2xl font-bold text-white">ScamShield AI</span>
          </Link>
          <p className="text-gray-400 max-w-md leading-relaxed mb-6">
            Protecting the digital world with intelligent fraud detection. 
            Analyze links, messages, and crypto transactions in real-time.
          </p>
          <div className="flex gap-2 max-w-sm">
            <input 
              type="email" 
              placeholder="Newsletter Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-accent-cyan/50 text-sm"
            />
            <button 
              onClick={handleSubscribe}
              className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Join
            </button>
          </div>
          <div className="mt-8 space-y-1">
            <p className="text-accent-cyan/60 font-medium italic flex items-center gap-2">
              Proudly built by{" "}
              <a 
                href="https://x.com/_saamie" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white transition-colors underline decoration-dotted underline-offset-4"
              >
                Titus
              </a>
            </p>
            <p className="text-[10px] uppercase tracking-widest opacity-50">
              <a 
                href="https://www.orderrit.xyz" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white transition-colors underline decoration-dotted underline-offset-4"
              >
                ORDERRIT PRODUCTIONS
              </a>
            </p>
          </div>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-white">Platform</h4>
          <ul className="space-y-4 text-gray-400">
            <li><Link to="/" className="hover:text-accent-cyan transition-colors">Analyze</Link></li>
            <li><Link to="/database" className="hover:text-accent-cyan transition-colors">Scam Database</Link></li>
            <li><Link to="/education" className="hover:text-accent-cyan transition-colors">Education Hub</Link></li>
            <li><Link to="/pricing" className="hover:text-accent-cyan transition-colors">Get Credits</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-white">Community</h4>
          <ul className="space-y-4 text-gray-400">
            <li>
              <a 
                href="https://t.me/scamshieldai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-accent-cyan transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Telegram
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-sm">
        <p>© 2026 ScamShield AI. Built for Everyday Protection.</p>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> SSL Secure</span>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">Under SpiriTech group of companies</span>
            <span>Privacy-First Messaging</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function AppContent() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-28">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/database" element={<ScamDatabase />} />
          <Route path="/education" element={<Education />} />
          <Route path="/education/investment-scams" element={<InvestmentScams />} />
          <Route path="/education/crypto-red-flags" element={<CryptoRedFlags />} />
          <Route path="/education/phishing-tactics" element={<PhishingTactics />} />
          <Route path="/education/fake-vendor-detection" element={<FakeVendorDetection />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  );
}
