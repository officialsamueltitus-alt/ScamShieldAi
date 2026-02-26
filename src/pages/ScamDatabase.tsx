import { useState, useEffect } from "react";
import { 
  Database as DbIcon, 
  Search, 
  Plus, 
  AlertTriangle, 
  ExternalLink,
  Filter,
  ChevronDown,
  ShieldAlert,
  Clock,
  User,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CommunityReport {
  id: number;
  title: string;
  description: string;
  scam_type: string;
  evidence_url: string;
  status: string;
  created_at: string;
}

export default function ScamDatabase() {
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scam_type: "Phishing",
    evidence_url: ""
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/community-reports");
      const data = await res.json();
      setReports(data);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/community-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      setIsModalOpen(false);
      setFormData({ title: "", description: "", scam_type: "Phishing", evidence_url: "" });
      fetchReports();
    } catch (error) {
      console.error("Failed to submit report:", error);
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "All" || r.scam_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const SCAM_TYPES = ["All", "Phishing", "Investment", "Crypto", "Impersonation", "Other"];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
            <DbIcon className="text-accent-cyan w-8 h-8 md:w-10 md:h-10 shrink-0" />
            Scam Report Database
          </h1>
          <p className="text-gray-400 text-sm md:text-base">Browse and search community-reported fraud cases.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center justify-center gap-2 w-full md:w-auto"
        >
          <Plus className="w-5 h-5" />
          Report a Scam
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 md:mb-12">
        <div className="flex-grow relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by keyword, domain, or wallet address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-accent-cyan/50 text-sm md:text-base"
          />
        </div>
        <div className="relative">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="glass px-6 py-3 flex items-center justify-center gap-2 text-gray-400 hover:text-white text-sm md:text-base w-full md:w-auto"
          >
            <Filter className="w-4 h-4" />
            {filterType}
            <ChevronDown className={cn("w-4 h-4 transition-transform", isFilterOpen && "rotate-180")} />
          </button>
          
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full right-0 mt-2 w-48 glass p-2 z-50 overflow-hidden"
              >
                {SCAM_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setFilterType(type);
                      setIsFilterOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 rounded-lg text-sm transition-colors",
                      filterType === type ? "bg-accent-cyan text-bg-primary font-bold" : "text-gray-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="glass h-64 animate-pulse" />
          ))
        ) : (
          filteredReports.map((report) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass p-6 flex flex-col hover:border-accent-cyan/30 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-risk-high/10 text-risk-high text-xs font-bold uppercase tracking-wider">
                  {report.scam_type}
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {new Date(report.created_at).toLocaleDateString()}
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-accent-cyan transition-colors">{report.title}</h3>
              <p className="text-gray-400 text-sm line-clamp-3 mb-6 flex-grow">
                {report.description}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <User className="w-3 h-3" />
                  Anonymous
                </div>
                {report.evidence_url && (
                  <a 
                    href={report.evidence_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-accent-cyan text-xs flex items-center gap-1 hover:underline"
                  >
                    Evidence <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-bg-primary/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative glass w-full max-w-lg p-6 md:p-8 overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2">
                <ShieldAlert className="text-risk-high shrink-0" />
                Report a New Scam
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Title</label>
                  <input 
                    required
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., Fake Coinbase Phishing Email"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent-cyan/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Scam Type</label>
                  <select 
                    value={formData.scam_type}
                    onChange={(e) => setFormData({...formData, scam_type: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent-cyan/50 appearance-none"
                  >
                    <option value="Phishing">Phishing</option>
                    <option value="Investment">Investment Fraud</option>
                    <option value="Crypto">Crypto Rug Pull</option>
                    <option value="Impersonation">Impersonation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Description</label>
                  <textarea 
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the scam details..."
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent-cyan/50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Evidence URL (Optional)</label>
                  <input 
                    type="url" 
                    value={formData.evidence_url}
                    onChange={(e) => setFormData({...formData, evidence_url: e.target.value})}
                    placeholder="Link to screenshot or suspicious domain"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent-cyan/50"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn-secondary flex-grow"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn-primary flex-grow"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
