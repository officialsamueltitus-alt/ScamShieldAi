import { motion } from "motion/react";
import { Coins, AlertTriangle, CheckCircle2, ArrowLeft, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

export default function CryptoRedFlags() {
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
          <div className="p-4 rounded-2xl bg-accent-cyan/10 text-accent-cyan">
            <Coins className="w-10 h-10" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold">Crypto Red Flags</h1>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
          <p className="text-xl leading-relaxed">
            The cryptocurrency space is fast-moving and decentralized, making it a prime target for scammers. Understanding technical red flags is crucial for any investor.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">Technical Warning Signs</h2>
          <div className="space-y-4">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h3 className="font-bold text-risk-high mb-2 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> The "Honeypot" Contract
              </h3>
              <p className="text-sm">A smart contract designed so that you can buy the token, but the code prevents you from ever selling it. Always check sell tax and contract permissions.</p>
            </div>
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h3 className="font-bold text-risk-high mb-2 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Unlocked Liquidity
              </h3>
              <p className="text-sm">If the developers can remove the liquidity pool at any time, they can "rug pull" the project, leaving investors with worthless tokens.</p>
            </div>
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h3 className="font-bold text-risk-high mb-2 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Proxy Upgrade Risks
              </h3>
              <p className="text-sm">Some contracts allow developers to change the logic of the contract after you've invested, potentially adding malicious functions later.</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">On-Chain Verification</h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-risk-low shrink-0 mt-1" />
              <span><strong>Check Holder Concentration:</strong> If the top 10 wallets hold more than 20% of the supply (excluding exchanges/burn addresses), it's high risk.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-risk-low shrink-0 mt-1" />
              <span><strong>Verify Source Code:</strong> Legitimate projects always verify their contract source code on explorers like Etherscan.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-risk-low shrink-0 mt-1" />
              <span><strong>Audit Reports:</strong> Look for audits from reputable firms like CertiK, Hacken, or PeckShield.</span>
            </li>
          </ul>

          <div className="mt-12 p-8 bg-accent-purple/10 rounded-2xl border border-accent-purple/20">
            <h3 className="text-xl font-bold text-accent-purple mb-4">Pro Tip: Use ScamShield AI</h3>
            <p className="text-sm leading-relaxed">
              Our "Token Contract" analysis tool automatically checks for honeypot behavior, minting privileges, and liquidity status. Never invest in a new token without running a contract scan first.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
