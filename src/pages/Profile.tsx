import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { 
  User as UserIcon, 
  Mail, 
  Share2, 
  CreditCard, 
  History, 
  Camera, 
  CheckCircle2, 
  Loader2,
  Shield,
  Zap
} from "lucide-react";
import { motion } from "motion/react";

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

export default function Profile() {
  const { user, updateProfile, applyReferral, isLoading: userLoading } = useUser();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<{ history: HistoryItem[], referrals: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhoto, setNewPhoto] = useState("");
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);
  const [inputReferralCode, setInputReferralCode] = useState("");
  const [referralError, setReferralError] = useState("");
  const [referralSuccess, setReferralSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setNewName(user.name || "");
      setNewPhoto(user.profile_photo || "");
    }
  }, [user]);

  useEffect(() => {
    if (!user && !userLoading) {
      navigate("/auth");
      return;
    }
    
    const fetchData = async () => {
      if (!user) return;
      try {
        const res = await fetch("/api/user/profile-data");
        const data = await res.json();
        setProfileData(data);
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, userLoading, navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    const success = await updateProfile(newName, newPhoto);
    if (success) {
      setShowUpdateSuccess(true);
      setTimeout(() => setShowUpdateSuccess(false), 3000);
    }
    setIsUpdating(false);
  };

  const handleApplyReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setReferralError("");
    setReferralSuccess(false);
    
    if (!inputReferralCode) return;
    
    const result = await applyReferral(inputReferralCode);
    if (result.success) {
      setReferralSuccess(true);
      setInputReferralCode("");
    } else {
      setReferralError(result.error || "Failed to apply referral code");
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card & Settings */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass p-8 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-accent-cyan" />
            
            {user.is_premium === 1 && (
              <div className="absolute top-4 right-4 bg-accent-cyan/20 text-accent-cyan px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-accent-cyan/30">
                Premium
              </div>
            )}
            
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 rounded-full border-4 border-white/10 overflow-hidden bg-white/5 mx-auto">
                {newPhoto ? (
                  <img src={newPhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-accent-cyan/10">
                    <UserIcon className="w-16 h-16 text-accent-cyan" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-accent-cyan rounded-full cursor-pointer hover:scale-110 transition-transform shadow-lg">
                <Camera className="w-5 h-5 text-bg-primary" />
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
              </label>
            </div>

            <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
            <p className="text-gray-400 text-sm mb-6">{user.email}</p>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
              <div className="text-center">
                <p className="text-2xl font-bold text-accent-cyan">{user.searches_remaining}</p>
                <p className="text-[10px] text-gray-500 uppercase font-bold">Credits</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent-cyan">{profileData?.referrals?.length || 0}</p>
                <p className="text-[10px] text-gray-500 uppercase font-bold">Invites</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass p-8"
          >
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent-cyan" />
              Update Profile
            </h3>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Display Name</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent-cyan/50 transition-colors"
                />
              </div>

              {showUpdateSuccess && (
                <div className="flex items-center gap-2 text-risk-low text-sm font-bold bg-risk-low/10 p-3 rounded-xl border border-risk-low/20">
                  <CheckCircle2 className="w-4 h-4" />
                  Profile updated successfully!
                </div>
              )}

              <button 
                type="submit"
                disabled={isUpdating}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
              </button>
            </form>
          </motion.div>

          {/* Apply Referral Code */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass p-8"
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent-cyan" />
              Redeem Code
            </h3>
            <p className="text-gray-400 text-xs mb-6">Were you invited? Enter the referral code here to get 1 free search.</p>
            
            <form onSubmit={handleApplyReferral} className="space-y-4">
              <div className="space-y-2">
                <input 
                  type="text" 
                  placeholder="ABCDEF"
                  value={inputReferralCode}
                  onChange={(e) => setInputReferralCode(e.target.value.toUpperCase())}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent-cyan/50 transition-colors uppercase font-mono"
                />
              </div>

              {referralError && (
                <p className="text-risk-high text-xs font-bold">{referralError}</p>
              )}
              {referralSuccess && (
                <p className="text-risk-low text-xs font-bold">Code applied! You got 1 free search.</p>
              )}

              <button 
                type="submit"
                className="btn-secondary w-full py-3"
              >
                Apply Code
              </button>
            </form>
          </motion.div>
        </div>

        {/* Stats & History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-6 flex items-center gap-6"
            >
              <div className="p-4 rounded-2xl bg-accent-cyan/10 text-accent-cyan">
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium">Searches Left</p>
                <h3 className="text-3xl font-bold">{user.searches_remaining}</h3>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass p-6 flex items-center gap-6"
            >
              <div className="p-4 rounded-2xl bg-accent-purple/10 text-accent-purple">
                <Share2 className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium">Your Referral Code</p>
                <h3 className="text-xl font-mono font-bold text-accent-cyan">{user.referral_code}</h3>
              </div>
            </motion.div>
          </div>

          {/* Referred People */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass p-8"
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <UserIcon className="w-6 h-6 text-accent-cyan" />
              People Referred
            </h3>
            <div className="space-y-4">
              {profileData?.referrals?.map((ref, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{ref.referred_email}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Joined on {new Date(ref.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-risk-low/10 text-risk-low px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-risk-low/30">
                    +1 Search
                  </div>
                </div>
              ))}
              {(!profileData?.referrals || profileData.referrals.length === 0) && (
                <div className="text-center py-8 text-gray-500 italic text-sm">
                  You haven't referred anyone yet.
                </div>
              )}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <History className="w-6 h-6 text-accent-cyan" />
                Search History
              </h3>
              <span className="text-xs text-gray-500 uppercase font-bold">{profileData?.history?.length || 0} Total</span>
            </div>

            <div className="space-y-4">
              {profileData?.history?.map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between group hover:border-accent-cyan/30 transition-all">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`p-2 rounded-lg ${
                      item.risk_level === 'High' ? 'bg-risk-high/10 text-risk-high' :
                      item.risk_level === 'Medium' ? 'bg-risk-medium/10 text-risk-medium' :
                      'bg-risk-low/10 text-risk-low'
                    }`}>
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate max-w-[200px] md:max-w-md">{item.content}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">{item.type} • {new Date(item.created_at).toLocaleDateString()}</p>
                      {item.owner_info && (
                        <p className="text-[10px] text-accent-cyan font-medium mt-1">Owner: {item.owner_info}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${
                      item.risk_level === 'High' ? 'text-risk-high' :
                      item.risk_level === 'Medium' ? 'text-risk-medium' :
                      'text-risk-low'
                    }`}>{item.risk_score}%</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Risk</p>
                  </div>
                </div>
              ))}
              {(!profileData?.history || profileData.history.length === 0) && (
                <div className="text-center py-12 text-gray-500 italic">
                  No search history yet.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
