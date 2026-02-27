import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Link as LinkIcon, 
  MessageSquare, 
  Phone, 
  Building2, 
  Wallet, 
  Coins, 
  Image as ImageIcon,
  Shield,
  ShieldAlert, 
  ShieldCheck, 
  ShieldQuestion, 
  Loader2,
  ArrowRight,
  Share2,
  Download,
  Camera,
  Upload,
  X as CloseIcon,
  HelpCircle,
  Zap,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toPng } from "html-to-image";
import { analyzeInput, type AnalysisResult } from "../services/gemini";
import { useUser } from "../context/UserContext";

const TABS = [
  { id: "link", label: "Link", icon: LinkIcon },
  { id: "message", label: "Message", icon: MessageSquare },
  { id: "phone", label: "Phone", icon: Phone },
  { id: "business", label: "Business", icon: Building2 },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "contract", label: "Contract", icon: Coins },
  { id: "screenshot", label: "Screenshot", icon: ImageIcon },
];

export default function Home() {
  const { user, useSearch } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("link");
  const [input, setInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);
  
  const words = ["Pay", "Connect", "Use", "Call", "Contact"];
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/stats").then(res => res.json()).then(setStats);
  }, []);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [guestSearches, setGuestSearches] = useState(() => {
    const saved = localStorage.getItem("guest_searches");
    return saved ? parseInt(saved) : 5;
  });

  useEffect(() => {
    localStorage.setItem("guest_searches", guestSearches.toString());
  }, [guestSearches]);

  const handleAnalyze = async () => {
    setError(null);

    if (!user && guestSearches <= 0) {
      if (error === "Credits Exhausted, purchase more credits to continue") {
        navigate("/pricing");
      } else {
        setError("Credits Exhausted, purchase more credits to continue");
      }
      return;
    }

    if (user && user.searches_remaining <= 0 && user.credits <= 0) {
      if (error === "Credits Exhausted, purchase more credits to continue") {
        navigate("/pricing");
      } else {
        setError("Credits Exhausted, purchase more credits to continue");
      }
      return;
    }

    if (!input.trim() && !selectedImage) return;
    
    setIsAnalyzing(true);
    setResult(null);
    
    try {
      if (user) {
        const success = await useSearch();
        if (!success) {
          navigate("/auth");
          return;
        }
      } else {
        setGuestSearches(prev => prev - 1);
      }

      const analysis = await analyzeInput(activeTab, input, selectedImage || undefined);
      setResult(analysis);
      
      if (user) {
        await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: activeTab,
            content: input,
            risk_score: analysis.riskScore,
            risk_level: analysis.riskLevel,
            explanation: analysis.explanation,
            owner_info: analysis.ownerInfo
          })
        });
      }
    } catch (error: any) {
      console.error("Analysis failed:", error);
      setError("Analysis failed: " + (error?.message || "Please check your API key and try again."));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadImage = async () => {
    if (shareCardRef.current === null) return;
    try {
      const dataUrl = await toPng(shareCardRef.current, { 
        cacheBust: true, 
        backgroundColor: '#0a0a0a',
        pixelRatio: 3,
      });
      const link = document.createElement('a');
      link.download = `scamshield-analysis-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image', err);
    }
  };

  const handleShareImage = async () => {
    if (shareCardRef.current === null) return;
    try {
      const dataUrl = await toPng(shareCardRef.current, { 
        cacheBust: true, 
        backgroundColor: '#0a0a0a',
        pixelRatio: 3,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'scamshield-analysis.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'ScamShield AI Analysis',
          text: `I just checked a suspicious ${activeTab} on ScamShield AI. Result: ${result?.riskLevel} Risk.`,
        });
      } else {
        navigator.clipboard.writeText(`I just checked a suspicious ${activeTab} on ScamShield AI. Result: ${result?.riskLevel} Risk (${result?.riskScore}/100). Stay safe and check your links at www.scamshieldai.com!`);
        alert("Sharing not supported on this browser. Link copied to clipboard instead!");
      }
    } catch (err) {
      console.error('Failed to share image', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12 md:mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-7xl font-bold mb-6 tracking-tight leading-tight"
        >
          Check Before You{" "}
          <AnimatePresence mode="wait">
            <motion.span
              key={words[wordIndex]}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-accent-cyan inline-block min-w-[120px]"
            >
              {words[wordIndex]}.
            </motion.span>
          </AnimatePresence>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto px-4"
        >
          Paste a link, message, wallet address, or contract to instantly detect scams and crypto fraud.
        </motion.p>
      </div>

      {/* Analysis Container */}
      <div className="max-w-4xl mx-auto">
        <div className="glass p-1 mb-8 overflow-x-auto no-scrollbar">
          <div className="flex flex-nowrap md:flex-wrap gap-1 min-w-max md:min-w-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? "bg-accent-cyan text-bg-primary shadow-[0_0_15px_rgba(0,245,255,0.3)]" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass p-4 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-cyan to-accent-purple opacity-50" />
          
          {activeTab === "screenshot" ? (
            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-white/10 rounded-2xl bg-white/5 mb-6">
              {selectedImage ? (
                <div className="relative w-full max-w-xs aspect-video rounded-xl overflow-hidden border border-white/20">
                  <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-accent-cyan/10 text-accent-cyan">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">Upload a screenshot for analysis</p>
                    <p className="text-gray-500 text-sm">Our AI will scan for deceptive UI and fake text</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 mt-2">
                    <button 
                      onClick={() => cameraInputRef.current?.click()}
                      className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm"
                    >
                      <Camera className="w-4 h-4" />
                      Take Photo
                    </button>
                    <button 
                      onClick={() => galleryInputRef.current?.click()}
                      className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm"
                    >
                      <Upload className="w-4 h-4" />
                      Photo Library
                    </button>
                  </div>
                  <input 
                    type="file" 
                    ref={cameraInputRef} 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                  <input 
                    type="file" 
                    ref={galleryInputRef} 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>
          ) : (
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Paste the ${activeTab} here...`}
              className="w-full h-32 md:h-40 bg-transparent border-none focus:ring-0 text-base md:text-lg resize-none placeholder:text-gray-600"
            />
          )}

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-risk-high/10 border border-risk-high/20 text-risk-high text-sm font-bold flex items-center gap-2 animate-pulse">
              <ShieldAlert className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-4">
            <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-500">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              AI-powered real-time verification
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={() => setShowHowItWorks(true)}
                className="btn-secondary flex-grow md:flex-grow-0 text-sm md:text-base"
              >
                How It Works
              </button>
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!input.trim() && !selectedImage)}
                className="btn-primary flex-grow md:flex-grow-0 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze Now
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="mt-12"
            >
              <div className="glass p-6 md:p-8 relative">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-center">
                  {/* Risk Meter */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative w-32 h-32 md:w-48 md:h-48">
                      <div className="absolute inset-0">
                        <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                          <circle cx="100" cy="100" r="80" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-white/5" />
                          <motion.circle
                            cx="100" cy="100" r="80" fill="transparent" stroke="currentColor" strokeWidth="12"
                            strokeDasharray={502.4}
                            initial={{ strokeDashoffset: 502.4 }}
                            animate={{ strokeDashoffset: 502.4 - (502.4 * result.riskScore) / 100 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={
                              result.riskLevel === "High" ? "text-risk-high" :
                              result.riskLevel === "Medium" ? "text-risk-medium" : "text-risk-low"
                            }
                          />
                        </svg>
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl md:text-4xl font-bold">{result.riskScore}</span>
                        <span className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest">Risk Score</span>
                      </div>
                    </div>
                    <div className={`mt-4 px-4 py-1 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider ${
                      result.riskLevel === "High" ? "bg-risk-high/20 text-risk-high" :
                      result.riskLevel === "Medium" ? "bg-risk-medium/20 text-risk-medium" : "bg-risk-low/20 text-risk-low"
                    }`}>
                      {result.riskLevel} Risk
                    </div>
                  </div>

                  {/* Details */}
                  <div className="md:col-span-2">
                    <h3 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
                      {result.riskLevel === "High" ? <ShieldAlert className="text-risk-high shrink-0" /> : 
                       result.riskLevel === "Medium" ? <ShieldQuestion className="text-risk-medium shrink-0" /> : 
                       <ShieldCheck className="text-risk-low shrink-0" />}
                      Analysis Report
                    </h3>
                    <p className="text-gray-300 mb-6 leading-relaxed text-sm md:text-base">{result.explanation}</p>
                    
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <h4 className="text-[10px] md:text-sm font-bold text-gray-500 uppercase mb-2">Recommended Action</h4>
                        <p className={`font-semibold text-sm md:text-base ${
                          result.recommendedAction === "Avoid" ? "text-risk-high" :
                          result.recommendedAction === "Caution" ? "text-risk-medium" : "text-risk-low"
                        }`}>
                          {result.recommendedAction}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-[10px] md:text-sm font-bold text-gray-500 uppercase mb-3">Key Findings</h4>
                        <ul className="space-y-2">
                          {result.findings?.map((finding, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs md:text-sm text-gray-400">
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-cyan shrink-0" />
                              {finding}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-4 border-t border-white/5">
                        <h4 className="text-[10px] md:text-sm font-bold text-gray-500 uppercase mb-2">CEO / Founder / Owner</h4>
                        <p className="text-sm md:text-base text-white font-medium">{result.ownerInfo || "Information not available"}</p>
                      </div>

                      {result.verifiedSources && result.verifiedSources.length > 0 && (
                        <div className="pt-4 border-t border-white/5">
                          <h4 className="text-[10px] md:text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3 text-risk-low" />
                            Verified Sources
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {result.verifiedSources.map((source, i) => (
                              <span key={i} className="px-2 py-1 rounded-md bg-risk-low/10 border border-risk-low/20 text-[10px] text-risk-low font-medium">
                                {source}
                              </span>
                            ))}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-2 italic">
                            Information cross-referenced across multiple scam databases and local registries.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-8">
                      <button 
                        onClick={() => setShowShareModal(true)}
                        className="btn-primary flex items-center justify-center gap-2 py-2 text-xs md:text-sm"
                      >
                        <Share2 className="w-4 h-4" /> Share Result
                      </button>
                      <button className="btn-secondary flex items-center justify-center gap-2 py-2 text-xs md:text-sm">
                        <Download className="w-4 h-4" /> Download PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="max-w-4xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-3 gap-4 px-4">
          <div className="glass p-6 text-center">
            <div className="text-2xl md:text-3xl font-bold text-accent-cyan mb-1">{stats.totalChecks}</div>
            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Total Checks</div>
          </div>
          <div className="glass p-6 text-center">
            <div className="text-2xl md:text-3xl font-bold text-accent-cyan mb-1">{stats.guestUsers}</div>
            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Free Tier Users</div>
          </div>
          <div className="glass p-6 text-center">
            <div className="text-2xl md:text-3xl font-bold text-accent-cyan mb-1">{stats.registeredUsers}</div>
            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Registered Users</div>
          </div>
        </div>
      )}

      {/* Trust Elements */}
      <div className="mt-20 md:mt-32 text-center">
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 opacity-50 grayscale hover:grayscale-0 transition-all">
          <div className="flex items-center gap-2 font-bold text-base md:text-xl">
            <Shield className="text-accent-cyan w-5 h-5 md:w-6 md:h-6" /> SECURE
          </div>
          <div className="flex items-center gap-2 font-bold text-base md:text-xl">
            <ShieldCheck className="text-accent-cyan w-5 h-5 md:w-6 md:h-6" /> VERIFIED
          </div>
          <div className="flex items-center gap-2 font-bold text-base md:text-xl">
            <ShieldAlert className="text-accent-cyan w-5 h-5 md:w-6 md:h-6" /> PROTECTED
          </div>
        </div>
        <p className="mt-8 md:mt-12 text-gray-500 italic text-xs md:text-sm px-4">"Built for Everyday Protection. Your data is not stored without consent."</p>
      </div>

      {/* Newsletter Section */}
      <div className="mt-24 max-w-xl mx-auto">
        <div className="flex gap-2">
          <input 
            type="email" 
            placeholder="Subscribe to our newsletter" 
            value={newsletterEmail}
            onChange={(e) => setNewsletterEmail(e.target.value)}
            className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent-cyan/50 text-sm"
          />
          <button 
            onClick={async () => {
              if (!newsletterEmail) return;
              const res = await fetch("/api/user/newsletter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: newsletterEmail }),
              });
              const data = await res.json();
              if (data.success) alert("Subscribed successfully!");
              else alert(data.message);
              setNewsletterEmail("");
            }}
            className="btn-primary py-3 px-8 text-sm"
          >
            Join
          </button>
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && result && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-bg-primary/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative glass w-full max-w-md p-8 overflow-hidden"
            >
              <div ref={shareCardRef} className="p-4 bg-[#0a0a0a] rounded-xl">
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Shield className="w-8 h-8 text-accent-cyan" />
                    <span className="text-2xl font-bold">ScamShield AI</span>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-6">
                    <div className="text-sm text-gray-400 uppercase tracking-widest mb-2">Analysis Result</div>
                    <div className="text-lg font-bold text-white mb-1 uppercase">
                      {input || (selectedImage ? "SCREENSHOT" : "UNKNOWN")}
                    </div>
                    <div className="text-xs text-accent-cyan font-mono mb-4">
                      <div className="flex items-center justify-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span>Founder/CEO: {result.ownerInfo || "N/A"}</span>
                      </div>
                    </div>
                    <div className={`text-3xl font-bold mb-4 ${
                      result.riskLevel === 'High' ? 'text-risk-high' :
                      result.riskLevel === 'Medium' ? 'text-risk-medium' : 'text-risk-low'
                    }`}>
                      {result.riskLevel} Risk ({result.riskScore}/100)
                    </div>
                    {result.findings && result.findings.length > 0 && (
                      <div className="text-left bg-white/5 rounded-xl p-3 mb-4 border border-white/5">
                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-2 tracking-wider">Key Findings:</div>
                        <ul className="space-y-1">
                          {result.findings.slice(0, 2).map((finding, i) => (
                            <li key={i} className="text-[11px] text-gray-300 flex items-start gap-2">
                              <div className="w-1 h-1 rounded-full bg-accent-cyan mt-1.5 flex-shrink-0" />
                              {finding}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-gray-400 italic text-sm">"Don't get caught in the net. Check before you pay with ScamShield AI."</p>
                  </div>
                  <div className="flex flex-col gap-2 text-xs text-gray-500 font-mono">
                    <div className="flex justify-center gap-4">
                      <span>@ScamShieldAI</span>
                      <span>#StaySafe</span>
                    </div>
                    <div className="text-accent-cyan/60">www.scamshieldai.com</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleDownloadImage} className="btn-secondary flex items-center justify-center gap-2 py-2 text-xs">
                    <Download className="w-4 h-4" /> Download Image
                  </button>
                  <button onClick={handleShareImage} className="btn-primary flex items-center justify-center gap-2 py-2 text-xs">
                    <Share2 className="w-4 h-4" /> Share Image
                  </button>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`I just checked a suspicious ${activeTab} on ScamShield AI. Result: ${result.riskLevel} Risk (${result.riskScore}/100). Stay safe and check your links at www.scamshieldai.com!`);
                    alert("Link copied to clipboard!");
                  }}
                  className="btn-secondary w-full py-2 text-xs"
                >
                  Copy Text Link
                </button>
                <button onClick={() => setShowShareModal(false)} className="btn-secondary w-full py-2 text-xs opacity-50">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* How It Works Modal */}
      <AnimatePresence>
        {showHowItWorks && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowHowItWorks(false)}
              className="absolute inset-0 bg-bg-primary/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative glass w-full max-w-2xl p-6 md:p-10 overflow-y-auto max-h-[90vh]"
            >
              <button onClick={() => setShowHowItWorks(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
                <CloseIcon className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-xl bg-accent-cyan/10 text-accent-cyan">
                  <HelpCircle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">How It Works</h2>
              </div>
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { num: 1, title: "Input Data", desc: "Paste a suspicious link, message, phone number, or upload a screenshot. Our system accepts various formats to ensure comprehensive coverage." },
                    { num: 2, title: "AI Analysis", desc: "Our advanced Gemini-powered AI scans the content for emotional manipulation, urgency triggers, known scam patterns, and technical red flags." },
                    { num: 3, title: "Risk Scoring", desc: "You receive a detailed risk score from 0 to 100, along with a clear explanation of why the input was flagged or cleared." },
                    { num: 4, title: "Take Action", desc: "Follow our recommended actions to protect your assets. Share results with others or report new scams to our community database." }
                  ].map(({ num, title, desc }) => (
                    <div key={num} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-cyan text-bg-primary flex items-center justify-center font-bold">{num}</div>
                        <h3 className="font-bold text-lg">{title}</h3>
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
                <div className="p-6 rounded-2xl bg-accent-cyan/5 border border-accent-cyan/10">
                  <h4 className="font-bold mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-accent-cyan" />
                    Pro Tip for Screenshots
                  </h4>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    When using the Screenshot tool, ensure the text is clear and legible. The AI can detect fake "Verified" badges, suspicious payment UIs, and deceptive messaging patterns that text-only analysis might miss.
                  </p>
                </div>
                <div className="flex justify-center pt-4">
                  <button onClick={() => setShowHowItWorks(false)} className="btn-primary px-12">Got It!</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}