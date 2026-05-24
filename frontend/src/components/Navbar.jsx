import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LOGO_URL, NAV_LINKS } from "../lib/data";

export default function Navbar({ onReserveClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    handler();
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const onLight = scrolled || location.pathname !== "/";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          onLight
            ? "bg-[var(--warm-white)]/95 backdrop-blur-md border-b border-[var(--border-soft)]"
            : "bg-transparent"
        }`}
        data-testid="navbar"
      >
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 flex items-center justify-between h-20 md:h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
            <img
              src={LOGO_URL}
              alt="The BlackRock Lagos"
              className={`h-12 md:h-14 w-auto transition-all duration-500 ${
                onLight ? "opacity-100" : "brightness-0 invert opacity-95"
              }`}
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-10">
            {NAV_LINKS.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`nav-link ${onLight ? "nav-link-dark" : ""} ${active ? "active" : ""}`}
                  data-testid={`nav-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-6">
            <button
              onClick={() => navigate("/reservations")}
              className={onLight ? "btn-burgundy" : "btn-outline-gold"}
              data-testid="reserve-cta-desktop"
            >
              <span>Reserve a Table</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setOpen(true)}
            data-testid="mobile-menu-open"
            aria-label="Open menu"
          >
            <Menu size={24} className={onLight ? "text-[var(--charcoal)]" : "text-[var(--warm-white)]"} />
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[80] bg-[var(--charcoal)]"
            data-testid="mobile-menu"
          >
            <div className="flex items-center justify-between px-6 h-20">
              <img src={LOGO_URL} alt="" className="h-12 w-auto brightness-0 invert" />
              <button onClick={() => setOpen(false)} data-testid="mobile-menu-close" aria-label="Close menu">
                <X size={26} className="text-[var(--warm-white)]" />
              </button>
            </div>
            <div className="px-8 pt-12 flex flex-col gap-2">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i + 0.1, duration: 0.4 }}
                >
                  <Link
                    to={link.to}
                    className="block font-serif-display text-4xl text-[var(--warm-white)] py-3 border-b border-white/10"
                    data-testid={`mobile-nav-${link.label.toLowerCase()}`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                onClick={() => { setOpen(false); navigate("/reservations"); }}
                className="btn-outline-gold mt-12"
                data-testid="mobile-reserve-cta"
              >
                Reserve a Table
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
