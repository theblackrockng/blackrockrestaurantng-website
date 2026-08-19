import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { UploadCloud, Trash2, Check, X, ArrowRightLeft, Pencil } from "lucide-react";

/* ─── Constants ─── */
const GALLERY_SECTIONS = [
  { key: "gallery-food",   label: "Food",               fetchKeys: ["gallery-food", "home-food-reel"] },
  { key: "gallery-drinks", label: "Drinks",             fetchKeys: ["gallery-drinks", "home-food-reel"] },
  { key: "gallery",        label: "Ambience",           fetchKeys: ["gallery"] },
  { key: "gallery-behind", label: "Behind the Scenes",  fetchKeys: ["gallery-behind"] },
];

const DRINK_KEYWORDS = ["heineken", "beer", "wine", "cocktail", "spirit", "whiskey", "vodka", "gin", "rum", "juice", "drink", "mocktail", "cider", "champagne", "prosecco", "brandy", "whisky", "liquor", "lager", "stout"];
const isDrink = (filename) => DRINK_KEYWORDS.some((k) => (filename || "").toLowerCase().includes(k));

const GOLD_BTN = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "9px 18px", borderRadius: 8, border: "none",
  background: "var(--ds-gold)", color: "#1a1a1a",
  fontSize: 13, fontWeight: 600,
  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
};

const GHOST_BTN = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "9px 14px", borderRadius: 8,
  border: "1px solid var(--ds-border)", background: "transparent",
  color: "var(--ds-text)", fontSize: 13, fontWeight: 500,
  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
};

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* ─── MoveModal ─── */
function MoveModal({ asset, currentSectionKey, onConfirm, onClose }) {
  const [target, setTarget] = useState("");
  const options = GALLERY_SECTIONS.filter((s) => s.key !== currentSectionKey);

  useEffect(() => {
    if (options.length > 0) setTarget(options[0].key);
  }, [currentSectionKey]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.55)",
    }}>
      <div style={{
        background: "var(--ds-surface)",
        border: "1px solid var(--ds-border)",
        borderRadius: 12,
        width: 380,
        padding: "24px 24px 20px",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: "var(--ds-text)" }}>
            Move to section
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ds-muted)", display: "flex" }}>
            <X size={17} />
          </button>
        </div>

        <p style={{ fontSize: 12.5, color: "var(--ds-muted)", margin: "0 0 16px", lineHeight: 1.5 }}>
          Choose where to move <strong style={{ color: "var(--ds-text)" }}>{asset.filename || "this image"}</strong>:
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {options.map((s) => (
            <label
              key={s.key}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                border: target === s.key ? "1px solid var(--ds-gold)" : "1px solid var(--ds-border)",
                background: target === s.key ? "rgba(200,169,110,0.08)" : "transparent",
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              <input
                type="radio"
                name="move-target"
                value={s.key}
                checked={target === s.key}
                onChange={() => setTarget(s.key)}
                style={{ accentColor: "var(--ds-gold)" }}
              />
              <span style={{ fontSize: 13, color: "var(--ds-text)", fontWeight: target === s.key ? 500 : 400 }}>
                {s.label}
              </span>
            </label>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button style={GHOST_BTN} onClick={onClose}>Cancel</button>
          <button
            style={{ ...GOLD_BTN, opacity: !target ? 0.5 : 1 }}
            onClick={() => target && onConfirm(target)}
            disabled={!target}
          >
            <Check size={13} /> Move
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── ImageCard ─── */
function ImageCard({ asset, activeKey, onDelete, onMove, onNameUpdated }) {
  const [hovered, setHovered] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(asset.filename ?? "");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const nameInputRef = useRef(null);

  useEffect(() => { setNameVal(asset.filename ?? ""); }, [asset.filename]);

  const startEditing = (e) => {
    e.stopPropagation();
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.select(), 0);
  };

  const saveName = async () => {
    const trimmed = nameVal.trim();
    setEditingName(false);
    if (!trimmed || trimmed === asset.filename) { setNameVal(asset.filename ?? ""); return; }
    try {
      const { error } = await supabase.from("media_assets").update({ filename: trimmed }).eq("id", asset.id);
      if (!error) onNameUpdated({ ...asset, filename: trimmed });
      else setNameVal(asset.filename ?? "");
    } catch { setNameVal(asset.filename ?? ""); }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Thumbnail */}
      <div
        style={{
          position: "relative", aspectRatio: "1", overflow: "hidden", borderRadius: 8,
          background: "var(--ds-input-bg)", border: "1px solid var(--ds-border)",
        }}
        onMouseEnter={() => !deleteConfirm && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <img
          src={asset.url}
          alt={asset.filename}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />

        {/* Shared with homepage food reel badge */}
        {asset.used_in === "home-food-reel" && (
          <div style={{ position: "absolute", top: 6, left: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", background: "var(--ds-gold)", color: "#1a1a1a", borderRadius: 99, padding: "2px 7px" }}>
              Also on Home
            </span>
          </div>
        )}

        {/* Hover overlay */}
        {hovered && !deleteConfirm && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.58)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            borderRadius: 8,
          }}>
            {/* Edit name */}
            <button
              onClick={startEditing}
              title="Rename"
              style={{
                width: 34, height: 34, borderRadius: 7,
                background: "rgba(255,255,255,0.13)", border: "1px solid rgba(255,255,255,0.2)",
                cursor: "pointer", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Pencil size={13} />
            </button>

            {/* Move */}
            <button
              onClick={(e) => { e.stopPropagation(); setHovered(false); onMove(asset); }}
              title="Move to section"
              style={{
                width: 34, height: 34, borderRadius: 7,
                background: "rgba(255,255,255,0.13)", border: "1px solid rgba(255,255,255,0.2)",
                cursor: "pointer", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <ArrowRightLeft size={13} />
            </button>

            {/* Delete */}
            <button
              onClick={(e) => { e.stopPropagation(); setHovered(false); setDeleteConfirm(true); }}
              title="Delete"
              style={{
                width: 34, height: 34, borderRadius: 7,
                background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.35)",
                cursor: "pointer", color: "#ef4444",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Inline delete confirm */}
      {deleteConfirm && (
        <div style={{
          marginTop: 6, padding: "8px 10px", borderRadius: 7,
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
        }}>
          <p style={{ fontSize: 11, color: "#ef4444", margin: "0 0 6px", fontWeight: 500 }}>
            Confirm delete?
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => { setDeleteConfirm(false); onDelete(asset); }}
              style={{
                flex: 1, fontSize: 11, fontWeight: 600, padding: "5px 0", borderRadius: 5, cursor: "pointer",
                background: "#ef4444", color: "#fff", border: "none", fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Yes
            </button>
            <button
              onClick={() => setDeleteConfirm(false)}
              style={{
                flex: 1, fontSize: 11, fontWeight: 500, padding: "5px 0", borderRadius: 5, cursor: "pointer",
                background: "var(--ds-input-bg)", color: "var(--ds-text)",
                border: "1px solid var(--ds-border)", fontFamily: "'DM Sans', sans-serif",
              }}
            >
              No
            </button>
          </div>
        </div>
      )}

      {/* Name + date */}
      {!deleteConfirm && (
        <div style={{ marginTop: 6 }}>
          {editingName ? (
            <input
              ref={nameInputRef}
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName();
                if (e.key === "Escape") { setEditingName(false); setNameVal(asset.filename ?? ""); }
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", fontSize: 11.5, color: "var(--ds-text)",
                background: "var(--ds-input-bg)", border: "1px solid var(--ds-gold)",
                borderRadius: 4, padding: "2px 6px", outline: "none",
                fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
              }}
            />
          ) : (
            <p
              title="Click to rename"
              onClick={startEditing}
              style={{
                fontSize: 11.5, color: "var(--ds-text)", margin: "0 0 2px",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                cursor: "text", borderBottom: "1px dashed transparent",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderBottomColor = "var(--ds-muted)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderBottomColor = "transparent"; }}
            >
              {asset.filename || "Untitled"}
            </p>
          )}
          <p style={{ fontSize: 10.5, color: "var(--ds-muted)", margin: 0 }}>{fmtDate(asset.uploaded_at)}</p>
        </div>
      )}
    </div>
  );
}

/* ─── GalleryManager ─── */
export default function GalleryManager() {
  const [allAssets, setAllAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeKey, setActiveKey] = useState(GALLERY_SECTIONS[0].key);
  const [dragOver, setDragOver] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [movingAsset, setMovingAsset] = useState(null);
  const fileInputRef = useRef(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const allKeys = [...new Set(GALLERY_SECTIONS.flatMap((s) => s.fetchKeys))];
      const { data, error } = await supabase
        .from("media_assets")
        .select("*")
        .in("used_in", allKeys)
        .order("uploaded_at", { ascending: false });
      if (!error && data) setAllAssets(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const activeSection = GALLERY_SECTIONS.find((s) => s.key === activeKey);

  const assetMatchesTab = (a, key) => {
    const section = GALLERY_SECTIONS.find((s) => s.key === key);
    if (!section || !section.fetchKeys.includes(a.used_in)) return false;
    if (a.used_in === "home-food-reel") {
      // Food-reel images: route drinks to Drinks tab, rest to Food tab
      return key === "gallery-drinks" ? isDrink(a.filename) : !isDrink(a.filename);
    }
    return true;
  };

  const visibleAssets = allAssets.filter((a) => assetMatchesTab(a, activeKey));
  const countFor = (key) => allAssets.filter((a) => assetMatchesTab(a, key)).length;

  /* ── Upload ── */
  const uploadFiles = async (files) => {
    const fileArr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!fileArr.length) return;

    const batch = fileArr.map((f) => ({ filename: f.name, progress: 0, done: false, error: false }));
    setUploads((prev) => [...prev, ...batch]);
    const startIdx = uploads.length;

    for (let i = 0; i < fileArr.length; i++) {
      const file = fileArr[i];
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;

      setUploads((prev) =>
        prev.map((u, idx) => idx === startIdx + i ? { ...u, progress: 40 } : u)
      );

      try {
        const { error: upErr } = await supabase.storage
          .from("media-library")
          .upload(path, file, { upsert: false });
        if (upErr) throw upErr;

        setUploads((prev) =>
          prev.map((u, idx) => idx === startIdx + i ? { ...u, progress: 80 } : u)
        );

        const { data: { publicUrl } } = supabase.storage.from("media-library").getPublicUrl(path);

        await supabase.from("media_assets").insert({
          url: publicUrl,
          filename: file.name,
          file_size: file.size,
          used_in: activeKey,
        });

        setUploads((prev) =>
          prev.map((u, idx) => idx === startIdx + i ? { ...u, progress: 100, done: true } : u)
        );
      } catch {
        setUploads((prev) =>
          prev.map((u, idx) => idx === startIdx + i ? { ...u, done: true, error: true } : u)
        );
      }
    }

    await fetchAll();
    setTimeout(() => setUploads([]), 2500);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files); };
  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  /* ── Delete ── */
  const handleDelete = async (asset) => {
    try {
      const parts = asset.url.split("/storage/v1/object/public/media-library/");
      if (parts[1]) await supabase.storage.from("media-library").remove([parts[1]]);
      await supabase.from("media_assets").delete().eq("id", asset.id);
      setAllAssets((prev) => prev.filter((a) => a.id !== asset.id));
    } catch {}
  };

  /* ── Name update ── */
  const handleNameUpdated = (updated) => {
    setAllAssets((prev) => prev.map((a) => a.id === updated.id ? updated : a));
  };

  /* ── Move ── */
  const handleMove = async (targetKey) => {
    if (!movingAsset) return;
    try {
      const { error } = await supabase
        .from("media_assets")
        .update({ used_in: targetKey })
        .eq("id", movingAsset.id);
      if (!error) {
        setAllAssets((prev) =>
          prev.map((a) => a.id === movingAsset.id ? { ...a, used_in: targetKey } : a)
        );
      }
    } catch {}
    setMovingAsset(null);
  };

  return (
    <div style={{ padding: "28px 32px 48px", fontFamily: "'DM Sans', sans-serif", maxWidth: 1200, margin: "0 auto" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: 32,
            fontWeight: 600, color: "var(--ds-text)", margin: "0 0 4px",
          }}>
            Gallery
          </h1>
          <p style={{ fontSize: 13, color: "var(--ds-muted)", margin: 0 }}>
            Manage images shown on the website gallery page
          </p>
        </div>
        <button style={GHOST_BTN} onClick={() => fileInputRef.current?.click()}>
          <UploadCloud size={14} /> Upload Images
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => { if (e.target.files?.length) uploadFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {/* ── Section tabs ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
        {GALLERY_SECTIONS.map((s) => {
          const active = s.key === activeKey;
          const count = countFor(s.key);
          return (
            <button
              key={s.key}
              onClick={() => setActiveKey(s.key)}
              style={{
                padding: "7px 16px", borderRadius: 99, border: "none", cursor: "pointer",
                fontSize: 12.5, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                background: active ? "var(--ds-gold)" : "var(--ds-input-bg)",
                color: active ? "#1a1a1a" : "var(--ds-muted)",
                transition: "background 0.15s, color 0.15s",
                display: "inline-flex", alignItems: "center", gap: 6,
                flexShrink: 0,
              }}
            >
              {s.label}
              <span style={{
                fontSize: 10, borderRadius: 99, padding: "1px 6px", fontWeight: 600,
                background: active ? "rgba(0,0,0,0.15)" : "var(--ds-border)",
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Upload zone ── */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        style={{
          marginBottom: 24,
          border: dragOver ? "2px solid var(--ds-gold)" : "2px dashed rgba(200,169,110,0.35)",
          borderRadius: 8,
          background: dragOver ? "rgba(200,169,110,0.1)" : "rgba(200,169,110,0.03)",
          padding: "20px 20px",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 6, cursor: "pointer",
          transition: "background 0.15s, border-color 0.15s",
        }}
      >
        <UploadCloud size={22} strokeWidth={1.5} style={{ color: "var(--ds-gold)", opacity: 0.65 }} />
        <p style={{ fontSize: 12.5, color: "var(--ds-muted)", margin: 0 }}>
          Drag & drop images here or click to upload — added to{" "}
          <strong style={{ color: "var(--ds-text)" }}>{activeSection?.label}</strong>
        </p>

        {uploads.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6, justifyContent: "center" }}>
            {uploads.map((u, i) => (
              <span
                key={i}
                style={{
                  fontSize: 11, fontWeight: 500, borderRadius: 99, padding: "3px 10px",
                  background: u.error
                    ? "rgba(239,68,68,0.12)"
                    : u.done
                    ? "rgba(34,197,94,0.12)"
                    : "rgba(200,169,110,0.14)",
                  color: u.error ? "#ef4444" : u.done ? "#16a34a" : "var(--ds-muted)",
                  border: u.error
                    ? "1px solid rgba(239,68,68,0.25)"
                    : u.done
                    ? "1px solid rgba(34,197,94,0.25)"
                    : "1px solid var(--ds-border)",
                }}
              >
                {u.filename.length > 24 ? u.filename.slice(0, 22) + "…" : u.filename}
                {" — "}
                {u.error ? "Error" : u.done ? "Done" : `${u.progress}%`}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Grid / Empty / Loading ── */}
      {loading ? (
        <div style={{ textAlign: "center", color: "var(--ds-muted)", padding: "70px 0", fontSize: 13 }}>
          Loading…
        </div>
      ) : visibleAssets.length === 0 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "70px 0", gap: 14,
        }}>
          <UploadCloud size={44} strokeWidth={1.2} style={{ color: "var(--ds-muted)", opacity: 0.3 }} />
          <p style={{ color: "var(--ds-muted)", fontSize: 14, margin: 0 }}>
            No images in this section yet.
          </p>
          <button style={GOLD_BTN} onClick={() => fileInputRef.current?.click()}>
            <UploadCloud size={14} /> Upload Images
          </button>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 12,
        }}>
          {visibleAssets.map((asset) => (
            <ImageCard
              key={asset.id}
              asset={asset}
              activeKey={activeKey}
              onDelete={handleDelete}
              onMove={(a) => setMovingAsset(a)}
              onNameUpdated={handleNameUpdated}
            />
          ))}
        </div>
      )}

      {/* ── Move modal ── */}
      {movingAsset && (
        <MoveModal
          asset={movingAsset}
          currentSectionKey={activeKey}
          onConfirm={handleMove}
          onClose={() => setMovingAsset(null)}
        />
      )}
    </div>
  );
}
