import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
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

  const ease = [0.16, 1, 0.3, 1];

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/heroimage.png')" }} />
      <div className="absolute inset-0" style={{ background: "#3d0a0a", opacity: 0.3 }} />
      <div className="absolute inset-0 bg-black/20" />

      <motion.div
        className="w-full max-w-sm relative z-10"
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0.15 : 0.5, ease }}
      >
        {/* Brand */}
        <div className="text-center mb-10">
          <div
            className="text-4xl text-[var(--gold)]"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
          >
            BlackRock Restaurant
          </div>
          <div className="text-xs uppercase tracking-[0.25em] text-[var(--muted)] mt-2">Admin Console</div>
          <div className="w-10 h-px bg-[var(--gold)]/40 mx-auto mt-4" />
        </div>

        {/* Form panel */}
        <div style={{ background: "rgba(15,13,10,0.72)", border: "1px solid var(--border-soft)", padding: "32px 28px" }}>
          <form onSubmit={submit} className="space-y-5" aria-label="Sign in to admin console">
            <div>
              <label className="console-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                className="console-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="console-label" htmlFor="login-password">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  className="console-input"
                  placeholder="••••••••"
                  style={{ paddingRight: "42px" }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 top-0 h-full px-3 text-[var(--muted)] hover:text-[var(--warm-white)] transition-colors duration-150"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  role="alert"
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex items-center gap-2 text-xs text-red-400 border border-red-400/20 bg-red-400/5 px-3 py-2"
                >
                  <AlertCircle size={12} className="shrink-0" />
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button type="submit" disabled={loading} className="btn-gold w-full justify-center py-3">
              {loading && <Loader2 size={13} className="animate-spin" />}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
