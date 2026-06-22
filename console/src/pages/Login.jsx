import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2, Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) { setError(err.message); return; }
    navigate("/");
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/heroimage.png')" }} />
      <div className="absolute inset-0" style={{ background: "#3d0a0a", opacity: 0.3 }} />
      <div className="absolute inset-0 bg-black/30" />

      {/* Portal label */}
      <motion.p
        className="relative z-10 text-xs uppercase tracking-[0.3em] mb-5"
        style={{ color: "rgba(245,240,232,0.45)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: shouldReduceMotion ? 0.15 : 0.6, delay: shouldReduceMotion ? 0 : 0.1 }}
      >
        Admin Console
      </motion.p>

      {/* Card */}
      <motion.div
        className="relative z-10 w-full"
        style={{ maxWidth: "420px" }}
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0.15 : 0.5, ease: [0.16, 1, 0.3, 1], delay: shouldReduceMotion ? 0 : 0.15 }}
      >
        <div
          style={{
            background: "var(--warm-white)",
            border: "1px solid rgba(201,168,76,0.25)",
            padding: "40px 44px 36px",
          }}
        >
          {/* Brand mark */}
          <div className="mb-8">
            <div
              className="text-2xl text-[var(--charcoal)]"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, letterSpacing: "0.04em" }}
            >
              BLACKROCK
            </div>
            <div
              className="text-xs uppercase tracking-[0.2em] mt-1"
              style={{ color: "rgba(15,13,10,0.4)" }}
            >
              Restaurant & Lounge
            </div>
            <div className="mt-5 w-8 h-px" style={{ background: "rgba(201,168,76,0.5)" }} />
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1
              className="text-[22px] font-semibold"
              style={{ color: "var(--charcoal)", letterSpacing: "-0.01em", lineHeight: 1.2 }}
            >
              Welcome back
            </h1>
            <p className="text-sm mt-1.5" style={{ color: "rgba(15,13,10,0.45)" }}>
              Sign in to manage your restaurant.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-5" aria-label="Sign in to admin console">
            <div>
              <label className="login-label" htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                className="login-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="login-label" htmlFor="login-password">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  className="login-input"
                  placeholder="Enter your password"
                  style={{ paddingRight: "44px" }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 top-0 h-full px-3 transition-opacity duration-150"
                  style={{ color: "rgba(15,13,10,0.4)" }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  role="alert"
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#b91c1c",
                  }}
                >
                  <AlertCircle size={13} className="shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 text-xs font-bold uppercase tracking-[0.1em] transition-opacity duration-150"
                style={{
                  background: loading ? "rgba(201,168,76,0.7)" : "var(--gold)",
                  color: "var(--charcoal)",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-xs" style={{ color: "rgba(15,13,10,0.35)" }}>
            Access is restricted to authorised staff only.
          </p>
        </div>
      </motion.div>
    </main>
  );
}
