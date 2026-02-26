import { 
  BookOpen, 
  TrendingUp, 
  ShieldAlert, 
  Mail, 
  Coins, 
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info
} from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

const GUIDES = [
  {
    title: "Fake Investment Schemes",
    icon: TrendingUp,
    color: "text-risk-medium",
    path: "/education/investment-scams",
    description: "Learn how to spot 'guaranteed' profit claims and celebrity-endorsed scams.",
    tips: [
      "No legitimate investment guarantees high returns with zero risk.",
      "Be wary of pressure to invest immediately.",
      "Check if the company is registered with financial regulators."
    ]
  },
  {
    title: "Crypto Red Flags",
    icon: Coins,
    color: "text-accent-cyan",
    path: "/education/crypto-red-flags",
    description: "Identify rug pulls, honeypots, and suspicious wallet clusters.",
    tips: [
      "Check if liquidity is locked for at least 6-12 months.",
      "Avoid tokens where a few wallets hold most of the supply.",
      "Verify the contract source code on Etherscan or BscScan."
    ]
  },
  {
    title: "Phishing Tactics",
    icon: Mail,
    color: "text-risk-high",
    path: "/education/phishing-tactics",
    description: "Spot deceptive emails, fake login pages, and typosquatted domains.",
    tips: [
      "Always check the sender's actual email address, not just the display name.",
      "Hover over links to see the real destination URL.",
      "Enable Multi-Factor Authentication (MFA) on all sensitive accounts."
    ]
  },
  {
    title: "Fake Vendor Detection",
    icon: ShoppingBag,
    color: "text-accent-purple",
    path: "/education/fake-vendor-detection",
    description: "How to identify fraudulent online stores and social media sellers.",
    tips: [
      "Look for inconsistent business information and missing physical addresses.",
      "Check for reviews on independent platforms like Trustpilot.",
      "Use secure payment methods; avoid direct bank transfers or crypto for retail."
    ]
  }
];

export default function Education() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Education Hub</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Knowledge is your first line of defense. Learn how to stay safe in an increasingly digital world.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        {GUIDES.map((guide, i) => (
          <Link key={i} to={guide.path}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass p-6 md:p-8 h-full group hover:border-accent-cyan/30 transition-all"
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`p-4 rounded-2xl bg-white/5 ${guide.color}`}>
                  <guide.icon className="w-8 h-8" />
                </div>
                <div className="bg-white/5 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-5 h-5 text-accent-cyan" />
                </div>
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-4">{guide.title}</h3>
              <p className="text-gray-400 mb-8 leading-relaxed text-sm md:text-base">
                {guide.description}
              </p>
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Pro Tips</h4>
                {guide.tips.map((tip, j) => (
                  <div key={j} className="flex items-start gap-3 text-xs md:text-sm text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-risk-low shrink-0 mt-0.5" />
                    {tip}
                  </div>
                ))}
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Quick Check Section */}
      <div className="glass p-6 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-cyan/10 blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-6">The "Golden Rule" of Security</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="p-3 rounded-xl bg-risk-high/10 text-risk-high h-fit shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold mb-1 text-sm md:text-base">If it sounds too good to be true, it is.</h4>
                  <p className="text-gray-400 text-xs md:text-sm">No one is giving away free Bitcoin, and no bank will ever ask for your password over email.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="p-3 rounded-xl bg-accent-cyan/10 text-accent-cyan h-fit shrink-0">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold mb-1 text-sm md:text-base">Verify through official channels.</h4>
                  <p className="text-gray-400 text-xs md:text-sm">If you get a suspicious alert, log in directly through the official app or website—never click the link in the message.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/5 rounded-3xl p-6 md:p-8 border border-white/10">
            <h3 className="text-lg md:text-xl font-bold mb-6">Common Scam Phrases</h3>
            <div className="space-y-3">
              {[
                "Your account will be suspended in 24 hours.",
                "You have won a $1,000 Amazon gift card!",
                "Send 0.1 BTC to verify your wallet and get 1 BTC back.",
                "Urgent: Suspicious activity detected on your account.",
                "I am a representative from the IRS/FBI."
              ].map((phrase, i) => (
                <div key={i} className="p-3 rounded-lg bg-bg-primary/50 text-xs md:text-sm text-gray-400 border border-white/5 italic">
                  "{phrase}"
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
