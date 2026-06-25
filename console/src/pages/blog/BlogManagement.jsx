import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit2, Trash2, Eye, EyeOff, Clock, Calendar, Tag, Search } from "lucide-react";
import { supabase } from "../../lib/supabase";

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function StatusBadge({ status }) {
  const styles = {
    published: { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" },
    draft:     { background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" },
  };
  const s = styles[status] ?? styles.draft;
  return (
    <span style={{ ...s, borderRadius: 99, fontSize: 10.5, fontWeight: 600, padding: "3px 9px", textTransform: "capitalize", whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

export default function BlogManagement() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("blog_posts")
      .select("id,title,slug,excerpt,status,published_at,created_at,updated_at,cover_image_url,tags,author")
      .order("updated_at", { ascending: false });
    setPosts(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const togglePublish = async (post) => {
    const newStatus = post.status === "published" ? "draft" : "published";
    const update = { status: newStatus };
    if (newStatus === "published" && !post.published_at) {
      update.published_at = new Date().toISOString();
    }
    await supabase.from("blog_posts").update(update).eq("id", post.id);
    await load();
  };

  const deletePost = async (id) => {
    setDeleting(id);
    await supabase.from("blog_posts").delete().eq("id", id);
    await load();
    setDeleting(null);
  };

  const filtered = posts.filter(p => {
    const matchesSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.excerpt?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  const publishedCount = posts.filter(p => p.status === "published").length;
  const draftCount = posts.filter(p => p.status === "draft").length;

  return (
    <div style={{ padding: "26px 28px 44px", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 600, color: "var(--ds-text)", margin: "0 0 3px" }}>
            Blog
          </h1>
          <p style={{ fontSize: 13, color: "var(--ds-muted)", margin: 0 }}>
            {publishedCount} published · {draftCount} draft{draftCount !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => navigate("/blog/new")}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "var(--ds-burgundy)", color: "#fff",
            border: "none", borderRadius: 8, padding: "9px 16px",
            fontSize: 13, fontWeight: 500, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
          }}
        >
          <Plus size={15} />
          New Post
        </button>
      </div>

      {/* Filters + search */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 2 }}>
          {["all", "published", "draft"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 14px", borderRadius: 6, fontSize: 12.5, fontWeight: 500,
                border: "1px solid var(--ds-border)", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                background: filter === f ? "var(--ds-gold)" : "var(--ds-input-bg)",
                color: filter === f ? "var(--ds-charcoal, #1a1a1a)" : "var(--ds-muted)",
                textTransform: "capitalize",
              }}
            >
              {f === "all" ? `All (${posts.length})` : f === "published" ? `Published (${publishedCount})` : `Drafts (${draftCount})`}
            </button>
          ))}
        </div>
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ds-muted)", pointerEvents: "none" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search posts…"
            style={{
              width: "100%", background: "var(--ds-input-bg)",
              border: "1px solid var(--ds-border)", borderRadius: 7,
              padding: "7px 12px 7px 30px", fontSize: 12.5,
              color: "var(--ds-text)", fontFamily: "'DM Sans', sans-serif", outline: "none",
            }}
          />
        </div>
      </div>

      {/* Posts list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ds-muted)", fontSize: 13 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: 11,
          padding: "60px 20px", textAlign: "center",
        }}>
          <p style={{ color: "var(--ds-muted)", fontSize: 14, marginBottom: 16 }}>
            {search || filter !== "all" ? "No posts match your filter." : "No posts yet. Write your first story."}
          </p>
          {!search && filter === "all" && (
            <button
              onClick={() => navigate("/blog/new")}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "var(--ds-burgundy)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
            >
              <Plus size={14} /> Write First Post
            </button>
          )}
        </div>
      ) : (
        <div style={{ background: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: 11, overflow: "hidden" }}>
          {/* Table head */}
          <div style={{ display: "grid", gridTemplateColumns: "minmax(200px,1fr) 140px 110px 120px 100px", padding: "9px 20px", borderBottom: "1px solid var(--ds-border)" }}>
            {["POST", "AUTHOR", "STATUS", "UPDATED", "ACTIONS"].map((col, i) => (
              <div key={col} style={{ fontSize: 10.5, fontWeight: 600, color: "var(--ds-muted)", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: i === 4 ? "right" : "left" }}>{col}</div>
            ))}
          </div>

          {filtered.map((post, i) => (
            <div
              key={post.id}
              style={{
                display: "grid", gridTemplateColumns: "minmax(200px,1fr) 140px 110px 120px 100px",
                padding: "14px 20px", borderBottom: i < filtered.length - 1 ? "1px solid var(--ds-border)" : "none",
                alignItems: "center",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--ds-input-bg)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              {/* Title + excerpt */}
              <div style={{ minWidth: 0, paddingRight: 16 }}>
                <div
                  style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ds-text)", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}
                  onClick={() => navigate(`/blog/${post.id}`)}
                >
                  {post.cover_image_url && (
                    <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--ds-gold)", marginRight: 6, verticalAlign: "middle", flexShrink: 0 }} />
                  )}
                  {post.title || "Untitled"}
                </div>
                {post.excerpt && (
                  <div style={{ fontSize: 11.5, color: "var(--ds-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {post.excerpt}
                  </div>
                )}
                {post.tags?.length > 0 && (
                  <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                    {post.tags.slice(0, 3).map(tag => (
                      <span key={tag} style={{ fontSize: 10, background: "rgba(200,169,110,0.1)", color: "var(--ds-gold)", padding: "1px 6px", borderRadius: 99 }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Author */}
              <div style={{ fontSize: 12.5, color: "var(--ds-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {post.author || "—"}
              </div>

              {/* Status */}
              <div>
                <StatusBadge status={post.status} />
              </div>

              {/* Updated */}
              <div style={{ fontSize: 12, color: "var(--ds-muted)" }}>
                {timeAgo(post.updated_at)}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                {/* Edit */}
                <button
                  onClick={() => navigate(`/blog/${post.id}`)}
                  title="Edit post"
                  style={{ width: 30, height: 30, borderRadius: 6, background: "none", border: "none", cursor: "pointer", color: "var(--ds-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--ds-input-bg)"; e.currentTarget.style.color = "var(--ds-text)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--ds-muted)"; }}
                >
                  <Edit2 size={13} />
                </button>

                {/* Toggle publish */}
                <button
                  onClick={() => togglePublish(post)}
                  title={post.status === "published" ? "Unpublish" : "Publish"}
                  style={{ width: 30, height: 30, borderRadius: 6, background: "none", border: "none", cursor: "pointer", color: post.status === "published" ? "#16a34a" : "var(--ds-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--ds-input-bg)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                >
                  {post.status === "published" ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>

                {/* Delete */}
                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${post.title}"? This cannot be undone.`)) {
                      deletePost(post.id);
                    }
                  }}
                  title="Delete post"
                  disabled={deleting === post.id}
                  style={{ width: 30, height: 30, borderRadius: 6, background: "none", border: "none", cursor: "pointer", color: "var(--ds-muted)", display: "flex", alignItems: "center", justifyContent: "center", opacity: deleting === post.id ? 0.4 : 1 }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#ef4444"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--ds-muted)"; }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
