import { useState, useEffect, useRef } from "react";

const CORRECT = "2012";
const MAX_ATTEMPTS = 3;

export default function PinModal({ onSuccess, onClose }) {
  const [digits, setDigits]   = useState(["", "", "", ""]);
  const [error, setError]     = useState(false);
  const attemptsRef           = useRef(0);
  const inputRefs             = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (error || !digits.every((d) => d !== "")) return;

    const pin = digits.join("");
    if (pin === CORRECT) {
      onSuccess();
      return;
    }

    attemptsRef.current += 1;
    const attempt = attemptsRef.current;
    setError(true);

    setTimeout(() => {
      setError(false);
      if (attempt >= MAX_ATTEMPTS) {
        onClose();
      } else {
        setDigits(["", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 30);
      }
    }, 480);
  }, [digits, error]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(idx, raw) {
    const val = raw.slice(-1);
    if (!/^\d$/.test(val)) return;
    const next = ["", "", "", ""];
    next[idx] = val;
    setDigits((prev) => {
      const updated = [...prev];
      updated[idx] = val;
      return updated;
    });
    if (idx < 3) setTimeout(() => inputRefs.current[idx + 1]?.focus(), 0);
  }

  function handleKeyDown(idx, e) {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "Backspace") {
      if (!digits[idx] && idx > 0) {
        setDigits((prev) => { const n = [...prev]; n[idx - 1] = ""; return n; });
        inputRefs.current[idx - 1]?.focus();
      } else if (digits[idx]) {
        setDigits((prev) => { const n = [...prev]; n[idx] = ""; return n; });
      }
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1a1a1a", borderRadius: 12, padding: 40,
          width: "100%", maxWidth: 360,
          display: "flex", flexDirection: "column", alignItems: "center",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Wordmark */}
        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 700, letterSpacing: "4px", color: "#c8a96e", textTransform: "uppercase" }}>
          BLACKROCK
        </div>

        {/* Heading */}
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, color: "#c8a96e", margin: "16px 0 6px", textAlign: "center" }}>
          Access Required
        </h2>
        <p style={{ fontSize: 12, color: "#666", margin: "0 0 28px", textAlign: "center", lineHeight: 1.5 }}>
          Enter your access code to continue.
        </p>

        {/* PIN inputs */}
        <div
          className={error ? "pin-row-shake" : ""}
          style={{ display: "flex", gap: 12 }}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              autoComplete="off"
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              style={{
                width: 52, height: 60,
                background: "#2a2a2a",
                border: `1px solid ${error ? "#e74c3c" : "#333"}`,
                borderRadius: 8,
                color: "#fff",
                fontSize: 24, fontWeight: 700,
                textAlign: "center",
                outline: "none",
                caretColor: "transparent",
                transition: "border-color 0.15s",
                boxShadow: error ? "none" : undefined,
              }}
              onFocus={(e) => {
                if (!error) e.target.style.borderColor = "#c8a96e";
                if (!error) e.target.style.boxShadow = "0 0 0 2px rgba(200,169,110,0.18)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = error ? "#e74c3c" : "#333";
                e.target.style.boxShadow = "none";
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pin-shake {
          0%,100% { transform: translateX(0); }
          18%     { transform: translateX(-7px); }
          36%     { transform: translateX(7px); }
          54%     { transform: translateX(-5px); }
          72%     { transform: translateX(5px); }
          90%     { transform: translateX(-2px); }
        }
        .pin-row-shake { animation: pin-shake 0.45s ease; }
      `}</style>
    </div>
  );
}
