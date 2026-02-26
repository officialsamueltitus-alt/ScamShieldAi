import { motion } from "motion/react";
import { ShoppingBag, AlertTriangle, CheckCircle2, ArrowLeft, Search, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

export default function FakeVendorDetection() {
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
          <div className="p-4 rounded-2xl bg-accent-purple/10 text-accent-purple">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold">Fake Vendor Detection</h1>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
          <p className="text-xl leading-relaxed">
            Online shopping scams involve scammers pretending to be legitimate online sellers, either with a fake website or a fake ad on a genuine site.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">How to Identify a Fake Store</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h3 className="font-bold text-risk-high mb-2 flex items-center gap-2">
                <Search className="w-5 h-5" /> Too Good to be True
              </h3>
              <p className="text-sm">If a high-demand item (like a new iPhone or designer bag) is listed at 70-90% off, it's almost certainly a scam.</p>
            </div>
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h3 className="font-bold text-risk-high mb-2 flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> Unusual Payment Methods
              </h3>
              <p className="text-sm">Fake vendors often insist on payment via wire transfer, gift cards, or cryptocurrency because these are non-refundable.</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">The "Trust" Checklist</h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-risk-low shrink-0 mt-1" />
              <span><strong>Check the URL:</strong> Look for subtle misspellings (e.g., <code>nike-outlet-store.com</code> instead of <code>nike.com</code>).</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-risk-low shrink-0 mt-1" />
              <span><strong>Contact Information:</strong> Legitimate stores have a physical address and a working phone number. Fake ones usually only have a contact form.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-risk-low shrink-0 mt-1" />
              <span><strong>Social Media Presence:</strong> Check if their social media links actually work and if they have real, non-bot engagement.</span>
            </li>
          </ul>

          <div className="mt-12 p-8 bg-risk-medium/10 rounded-2xl border border-risk-medium/20">
            <h3 className="text-xl font-bold text-risk-medium mb-4">Warning: Social Media Ads</h3>
            <p className="text-sm leading-relaxed">
              Scammers frequently use Facebook and Instagram ads to target victims. They create professional-looking ads for trendy products, take your money, and either send nothing or a cheap knock-off that looks nothing like the ad.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">What to do if you've been scammed</h2>
          <p className="text-sm leading-relaxed">
            1. Contact your bank or credit card provider immediately to dispute the charge.<br/>
            2. Report the website to the hosting provider and search engines.<br/>
            3. Submit a report to the <strong>ScamShield AI Community Database</strong> to warn others.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
