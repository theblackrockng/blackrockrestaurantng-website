import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const CACHE_KEY = "br_ff_v1";
const CACHE_TTL = 60_000; // 60 seconds

const FeatureFlagContext = createContext({ orderingEnabled: false, loading: true, flags: {} });

export function FeatureFlagProvider({ children }) {
  const [flags, setFlags]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Serve from cache if still warm
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (raw) {
          const { ts, data } = JSON.parse(raw);
          if (Date.now() - ts < CACHE_TTL) {
            setFlags(data);
            setLoading(false);
            return;
          }
        }
        const { data, error } = await supabase
          .from("feature_flags")
          .select("flag_name, enabled");
        if (error || !data) throw new Error("fetch failed");
        const parsed = Object.fromEntries(data.map((f) => [f.flag_name, f.enabled]));
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: parsed }));
        setFlags(parsed);
      } catch {
        // Default everything to false (safe / disabled) on any error
        setFlags({});
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const orderingEnabled = flags?.ordering_enabled ?? false;

  return (
    <FeatureFlagContext.Provider value={{ orderingEnabled, loading, flags: flags ?? {} }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagContext);
}
