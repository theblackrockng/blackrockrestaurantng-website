import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { supabase } from "../lib/supabase";
import SectionHeader from "../components/SectionHeader";

const categoryImages = {
  "Starters":                "/images/menu/starters.jpg",
  "Salads":                  "/images/menu/salads.jpg",
  "Rice":                    "/images/menu/rice.jpg",
  "Noodles":                 "/images/menu/noodles.jpg",
  "Pepper Soup & Specials":  "/images/menu/pepper-soup.jpg",
  "Continental":             "/images/menu/continental.jpg",
  "Sauces":                  "/images/menu/sauces.jpg",
  "Charcoal Grills":         "/images/menu/grills.jpg",
  "National Dishes":         "/images/menu/national.jpg",
  "Traditional Specials":    "/images/menu/traditional.jpg",
};

function formatPrice(price) {
  const num = parseFloat(String(price).replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return String(price);
  return `₦${num.toLocaleString("en-NG")}`;
}

function CategoryImage({ category }) {
  const [errorCats, setErrorCats] = useState(new Set());
  const src = categoryImages[category];
  const hasError = errorCats.has(category);
  const showImage = src && !hasError;

  return (
    <div className="relative aspect-[4/5] overflow-hidden">
      <AnimatePresence mode="wait">
        {showImage ? (
          <motion.img
            key={category}
            src={src}
            alt={category}
            onError={() => setErrorCats(prev => new Set([...prev, category]))}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <motion.div
            key={`placeholder-${category}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "#1a1a1a" }}
          >
            <span style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "1.5rem",
              letterSpacing: "0.2em",
              color: "#c8a96e",
            }}>
              BLACKROCK
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Bottom gradient to blend into dark background */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{ height: "30%", background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }}
      />
    </div>
  );
}

export default function MenuPage() {
  const [menuByCategory, setMenuByCategory] = useState({});
  const [categories, setCategories] = useState([]);
  const [active, setActive] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("menu_items")
      .select("*")
      .eq("available", true)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .then(({ data }) => {
        if (!data || data.length === 0) { setLoading(false); return; }
        const grouped = {};
        data.forEach((item) => {
          if (!grouped[item.category]) grouped[item.category] = [];
          grouped[item.category].push(item);
        });
        const cats = Object.keys(grouped);
        setMenuByCategory(grouped);
        setCategories(cats);
        setActive(cats[0]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="page-enter">
      {/* Header */}
      <section className="relative overflow-hidden" data-testid="menu-header">
        <div className="absolute inset-0">
          <img
            src="/Menuhero.png"
            alt="BlackRock dishes"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0" style={{ background: "rgba(20,20,20,0.72)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(20,20,20,0.4) 0%, rgba(20,20,20,0.5) 60%, rgba(20,20,20,1) 100%)" }} />
        </div>
        <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-12 text-center pt-32 pb-24 md:pt-44 md:pb-32">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="gold-line"
          >
            Our Menu
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5 }}
            className="font-serif-display text-3xl md:text-5xl lg:text-8xl leading-[0.95] mt-6 md:mt-8 text-[var(--warm-white)] drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
          >
            What we'll <span className="font-serif-italic text-[var(--burgundy)]">cook for you.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-white/75 mt-8 max-w-2xl mx-auto font-light text-base md:text-lg leading-relaxed"
          >
            Our menu shifts with the seasons and the markets. What follows is a
            recent expression. Your night may bring something new.
          </motion.p>
        </div>
      </section>

      {/* Category tabs */}
      <section
        className="sticky top-20 md:top-28 lg:top-36 z-30 backdrop-blur-md border-y border-[var(--border-soft)]"
        style={{ backgroundColor: "rgba(15,13,10,0.96)" }}
        data-testid="menu-tabs"
      >
        <div className="max-w-[1440px] mx-auto px-6 md:px-12">
          <div className="relative">
            <div
              className="flex gap-2 py-4"
              style={{ overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
            >
              {categories.map((cat) => (
                <motion.button
                  key={cat}
                  onClick={() => setActive(cat)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className={`flex-shrink-0 px-4 py-2 md:px-6 md:py-3 text-xs uppercase tracking-[0.22em] font-medium transition-all duration-300 border whitespace-nowrap ${
                    active === cat
                      ? "bg-[var(--gold)] text-[var(--charcoal)] border-[var(--gold)]"
                      : "bg-transparent text-[var(--muted)] border-[var(--border-soft)] hover:border-[var(--gold)] hover:text-[var(--warm-white)]"
                  }`}
                  data-testid={`menu-tab-${cat.toLowerCase()}`}
                >
                  {cat}
                </motion.button>
              ))}
            </div>
            <div
              className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none"
              style={{ background: "linear-gradient(to right, transparent, rgba(15,13,10,0.96))" }}
            />
          </div>
        </div>
      </section>

      {/* Menu items */}
      <section className="bg-[var(--charcoal)] py-20 md:py-28" data-testid="menu-items-section">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12">
          {loading ? (
            <div className="text-center py-24 text-[var(--muted)] text-sm tracking-widest uppercase">
              Loading menu…
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-24 text-[var(--muted)] text-sm">
              Menu coming soon.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
              {/* Category image — transitions on tab change, never on dish hover */}
              <div className="lg:col-span-5 lg:sticky lg:top-44 self-start">
                <CategoryImage category={active} />
                <div className="mt-6">
                  <span className="gold-line">{active}</span>
                </div>
              </div>

              {/* Dish list */}
              <div className="lg:col-span-7">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                  >
                    {(menuByCategory[active] || []).map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.06 }}
                        className="border-b border-[var(--border-soft)] px-3 -mx-3"
                        style={{ paddingTop: "2.8rem", paddingBottom: "2.8rem" }}
                        data-testid={`menu-item-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <div className="flex items-baseline justify-between gap-4">
                          <h3
                            className="font-serif-display leading-snug"
                            style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--warm-white)" }}
                          >
                            {item.name}
                          </h3>
                          <span
                            className="flex-shrink-0 font-sans"
                            style={{ fontSize: "1.05rem", fontWeight: 500, color: "#c8a96e" }}
                          >
                            {formatPrice(item.price)}
                          </span>
                        </div>
                        {item.description && (
                          <p
                            className="font-light mt-2 leading-relaxed"
                            style={{ fontSize: "0.83rem", color: "#888580" }}
                          >
                            {item.description}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--charcoal-soft)] py-24" data-testid="menu-cta">
        <div className="max-w-3xl mx-auto px-6 md:px-12 text-center">
          <SectionHeader
            kicker="Hungry?"
            title="Best book ahead."
            subtitle="Weekends fill up by Wednesday. Tuesdays are quiet, intimate, and ours."
          />
          <Link to="/reservations" className="btn-burgundy mt-12 inline-flex" data-testid="menu-reserve-cta">
            Reserve a Table <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <style>{`
        [data-testid="menu-tabs"] div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
