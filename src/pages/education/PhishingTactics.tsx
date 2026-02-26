import { motion } from "motion/react";
import { Mail, AlertTriangle, CheckCircle2, ArrowLeft, MousePointer2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function PhishingTactics() {
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
          <div className="p-4 rounded-2xl bg-risk-high/10 text-risk-high">
            <Mail className="w-10 h-10" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold">Phishing Tactics</h1>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
          <p className="text-xl leading-relaxed">
            Phishing is the most common form of cyberattack. It involves impersonating a trusted entity to trick you into revealing sensitive information like passwords or private keys.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">How to Spot a Phish</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h3 className="font-bold text-risk-high mb-2 flex items-center gap-2">
                <MousePointer2 className="w-5 h-5" /> Typosquatted Domains
              </h3>
              <p className="text-sm">Scammers register domains that look almost identical to the real ones (e.g., <code>arnazon.com</code> instead of <code>amazon.com</code>).</p>
            </div>
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h3 className="font-bold text-risk-high mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Urgent Language
              </h3>
              <p className="text-sm">"Your account will be deleted in 1 hour" or "Suspicious login detected" are common tactics to induce panic.</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">Advanced Phishing Methods</h2>
          <ul className="space-y-6">
            <li className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h4 className="font-bold text-white mb-2">Spear Phishing</h4>
              <p className="text-sm">Targeted attacks where the scammer uses personal information (often from data breaches) to make the message seem more legitimate.</p>
            </li>
            <li className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h4 className="font-bold text-white mb-2">Search Engine Phishing</h4>
              <p className="text-sm">Scammers pay for Google Ads so that their fake site appears at the very top of search results for terms like "MetaMask login".</p>
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">The "Never" List</h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-risk-low shrink-0 mt-1" />
              <span><strong>NEVER</strong> share your seed phrase or private key with anyone, ever.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-risk-low shrink-0 mt-1" />
              <span><strong>NEVER</strong> click links in unsolicited SMS or emails from "banks" or "exchanges".</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-risk-low shrink-0 mt-1" />
              <span><strong>NEVER</strong> log in to sensitive accounts while on public Wi-Fi without a VPN.</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
