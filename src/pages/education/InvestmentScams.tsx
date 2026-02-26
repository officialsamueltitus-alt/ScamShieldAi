import { motion } from "motion/react";
import { TrendingUp, AlertTriangle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function InvestmentScams() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link to="/education" className="flex items-center gap-2 text-accent-cyan mb-8 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Education Hub
      </Link>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 md:p-12"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-risk-medium/10 text-risk-medium">
            <TrendingUp className="w-10 h-10" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold">Investment Scams</h1>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
          <p className="text-xl leading-relaxed">
            Investment scams are designed to look like legitimate opportunities to grow your wealth, but they are actually sophisticated traps to steal your money.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">Common Red Flags</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h3 className="font-bold text-risk-high mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Guaranteed Returns
              </h3>
              <p className="text-sm">No legitimate investment can guarantee high returns with zero risk. Markets are inherently volatile.</p>
            </div>
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h3 className="font-bold text-risk-high mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> High Pressure
              </h3>
              <p className="text-sm">Scammers often use "limited time offers" to force you into making a decision before you can do proper research.</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">How to Protect Yourself</h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-risk-low shrink-0 mt-1" />
              <span><strong>Verify Registration:</strong> Check if the individual or firm is registered with financial regulators like the SEC or FINRA.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-risk-low shrink-0 mt-1" />
              <span><strong>Do Your Own Research (DYOR):</strong> Never rely solely on social media testimonials or celebrity endorsements.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-risk-low shrink-0 mt-1" />
              <span><span><strong>Ask Questions:</strong> If they can't explain how the investment works in simple terms, walk away.</span></span>
            </li>
          </ul>

          <div className="mt-12 p-8 bg-accent-cyan/10 rounded-2xl border border-accent-cyan/20">
            <h3 className="text-xl font-bold text-accent-cyan mb-4">Real-World Example: The "Pig Butchering" Scam</h3>
            <p className="text-sm leading-relaxed">
              This scam involves building a long-term relationship with the victim (often through dating apps or social media) before convincing them to invest in a fake cryptocurrency platform. The victim sees "gains" on a fake dashboard, encouraging them to invest more, until the scammer disappears with all the funds.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
