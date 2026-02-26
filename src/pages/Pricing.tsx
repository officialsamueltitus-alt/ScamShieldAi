import { useState, useEffect } from "react";
import { Check, Shield, Zap, Globe, BarChart3, Bell, Download, Search, CreditCard, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useUser } from "../context/UserContext";

import { useNavigate, useSearchParams } from "react-router-dom";

const CREDIT_TIERS = Array.from({ length: 20 }, (_, i) => {
  const credits = (i + 1) * 10;
  const price = (credits * 0.499).toFixed(2);
  const searches = Math.floor((credits / 10) * 5);
  return { credits, price, searches };
});

export default function Pricing() {
  const { user, addCredits, subscribePremium, refreshUser } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success") {
      setShowSuccessModal(true);
      refreshUser();
      // Clear the query param
      navigate("/pricing", { replace: true });
    } else if (paymentStatus === "failed") {
      setErrorMessage("Payment failed. Please try again.");
      setShowErrorModal(true);
      navigate("/pricing", { replace: true });
    } else if (paymentStatus === "error") {
      setErrorMessage("An error occurred during payment verification.");
      setShowErrorModal(true);
      navigate("/pricing", { replace: true });
    }
  }, [searchParams, refreshUser, navigate]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-12 md:mb-16">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">More Credits, More Searches, More Awareness</h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base px-4 mb-8">
          Get more credit, then subscribe to premium. Each 10 credits gives you 5 additional searches.
        </p>
        {user && (
          <div className="flex justify-center">
            {user.is_premium === 1 ? (
              <div className="flex items-center gap-2 bg-accent-cyan/10 text-accent-cyan px-6 py-3 rounded-2xl border border-accent-cyan/20 font-bold">
                <Shield className="w-5 h-5" />
                Premium Subscriber
              </div>
            ) : (
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch("/api/payments/paystack/initialize", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        amount: 99.80 * 1600, // Assuming 1600 NGN per USD for demo
                        metadata: { type: "premium" }
                      })
                    });
                    const data = await res.json();
                    if (data.authorization_url) {
                      window.location.href = data.authorization_url;
                    } else {
                      alert("Failed to initialize payment");
                    }
                  } catch (e) {
                    console.error(e);
                    alert("Payment error");
                  }
                }}
                className="btn-primary px-8 py-3 flex items-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Subscribe to Premium ($99.80)
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* Free Plan Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 border-white/10 flex flex-col"
        >
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-2">Free Starter</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-5xl font-bold">$0</span>
            </div>
            <p className="text-gray-400 text-sm">Perfect for trying out our detection tools.</p>
          </div>
          <div className="space-y-4 mb-12 flex-grow">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-white/5 text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <span className="text-sm text-gray-300">5 Free searches total</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-white/5 text-gray-400">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-sm text-gray-300">Community database access</span>
            </div>
          </div>
          <button 
            onClick={() => navigate("/")}
            className="w-full py-4 rounded-xl font-bold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all"
          >
            Go to Analyze
          </button>
        </motion.div>

        {/* Dynamic Credit Tiers */}
        {CREDIT_TIERS.map((tier, i) => (
          <motion.div
            key={tier.credits}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i % 6) * 0.05 }}
            className={`glass p-8 relative flex flex-col border-white/10 hover:border-accent-cyan/30 transition-all`}
          >
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-2">{tier.credits} Credits</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-5xl font-bold">${tier.price}</span>
              </div>
              <p className="text-gray-400 text-sm">Get {tier.searches} additional searches.</p>
            </div>

            <div className="space-y-4 mb-12 flex-grow">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-accent-cyan/10 text-accent-cyan">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-300">Priority AI processing</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-accent-cyan/10 text-accent-cyan">
                  <Download className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-300">Downloadable PDF reports</span>
              </div>
            </div>

            <button 
              onClick={async () => {
                if (!user) {
                  navigate("/auth");
                  return;
                }
                try {
                  const res = await fetch("/api/payments/paystack/initialize", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      amount: parseFloat(tier.price) * 1600, // Assuming 1600 NGN per USD
                      metadata: { type: "credits", credits: tier.credits }
                    })
                  });
                  const data = await res.json();
                  if (data.authorization_url) {
                    window.location.href = data.authorization_url;
                  } else {
                    alert("Failed to initialize payment");
                  }
                } catch (e) {
                  console.error(e);
                  alert("Payment error");
                }
              }}
              className="w-full py-4 rounded-xl font-bold bg-accent-cyan text-bg-primary hover:shadow-[0_0_20px_rgba(0,245,255,0.4)] transition-all"
            >
              Buy {tier.credits} Credits
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-16 md:mt-20 glass p-8 md:p-12 text-center max-w-3xl mx-auto">
        <h3 className="text-xl md:text-2xl font-bold mb-4">Need a Custom Enterprise Solution?</h3>
        <p className="text-gray-400 mb-8 text-sm md:text-base">
          We offer API access and bulk analysis for businesses, exchanges, and financial institutions.
        </p>
        <a 
          href="https://wa.me/2347047956284" 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn-secondary w-full md:w-auto inline-block"
        >
          Contact Sales Team
        </a>
      </div>
      {/* FAQ Section */}
      <div className="mt-24 md:mt-32 max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 md:mb-12 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4 md:space-y-6">
          {[
            { q: "How accurate is the AI detection?", a: "Our AI models are trained on millions of known scam patterns and are updated daily. While no system is 100% perfect, we provide a high-confidence risk score based on multiple data points." },
            { q: "Is my data stored during analysis?", a: "We prioritize your privacy. We only store the content of your analysis if you explicitly choose to save it to your history or report it to the community database." },
            { q: "Can I cancel my Pro subscription anytime?", a: "Yes, you can cancel your subscription at any time through your dashboard. You will retain access to Pro features until the end of your billing cycle." }
          ].map((faq, i) => (
            <div key={i} className="glass p-5 md:p-6">
              <h4 className="font-bold mb-2 text-accent-cyan text-sm md:text-base">Q: {faq.q}</h4>
              <p className="text-gray-400 text-xs md:text-sm leading-relaxed">A: {faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccessModal(false)}
              className="absolute inset-0 bg-bg-primary/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              className="relative glass w-full max-w-sm p-8 text-center overflow-hidden"
            >
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.1
                  }}
                  className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)]"
                >
                  <motion.div
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <Check className="w-12 h-12 text-white stroke-[3px]" />
                  </motion.div>
                </motion.div>
              </div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold mb-2"
              >
                Payment Successful
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-400 mb-8"
              >
                Your account has been successfully updated. Thank you for choosing ScamShield AI!
              </motion.p>
              
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={() => setShowSuccessModal(false)}
                className="btn-primary w-full py-3"
              >
                Continue
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Error Modal */}
      <AnimatePresence>
        {showErrorModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowErrorModal(false)}
              className="absolute inset-0 bg-bg-primary/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              className="relative glass w-full max-w-sm p-8 text-center overflow-hidden"
            >
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.1
                  }}
                  className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                >
                  <XCircle className="w-12 h-12 text-white stroke-[3px]" />
                </motion.div>
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Payment Failed</h2>
              <p className="text-gray-400 mb-8">
                {errorMessage}
              </p>
              
              <button
                onClick={() => setShowErrorModal(false)}
                className="btn-secondary w-full py-3"
              >
                Try Again
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
