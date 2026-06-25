import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import {
  ArrowLeft, Save, Eye, EyeOff, Image as ImageIcon,
  Bold, Italic, UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Minus, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight,
  Upload, X, Tag, Plus, Loader2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

/* ─── Slug generator ─── */
function toSlug(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

/* ─── Toolbar button ─── */
function TBtn({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 5, border: "none", cursor: disabled ? "default" : "pointer",
        background: active ? "rgba(200,169,110,0.18)" : "transparent",
        color: active ? "var(--ds-gold)" : "var(--ds-muted)",
        opacity: disabled ? 0.35 : 1,
        transition: "background 0.12s, color 0.12s",
        flexShrink: 0,
      }}
      onMouseEnter={e => { if (!disabled && !active) { e.currentTarget.style.background = "var(--ds-input-bg)"; e.currentTarget.style.color = "var(--ds-text)"; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ds-muted)"; } }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 18, background: "var(--ds-border)", margin: "0 4px", flexShrink: 0 }} />;
}

/* ─── Toolbar ─── */
function Toolbar({ editor, onImageUpload, uploading }) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  if (!editor) return null;

  const setLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
      setLinkUrl("");
      setShowLinkInput(false);
    }
  };

  return (
    <div style={{
      borderBottom: "1px solid var(--ds-border)",
      padding: "8px 12px",
      display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap",
      background: "var(--ds-surface)",
      position: "sticky", top: 0, zIndex: 10,
    }}>
      {/* Headings */}
      <TBtn title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 size={14} /></TBtn>
      <TBtn title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={14} /></TBtn>
      <TBtn title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={14} /></TBtn>

      <Divider />

      {/* Inline marks */}
      <TBtn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={13} /></TBtn>
      <TBtn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={13} /></TBtn>
      <TBtn title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={13} /></TBtn>
      <TBtn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={13} /></TBtn>
      <TBtn title="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}><Code size={13} /></TBtn>

      <Divider />

      {/* Alignment */}
      <TBtn title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft size={13} /></TBtn>
      <TBtn title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter size={13} /></TBtn>
      <TBtn title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight size={13} /></TBtn>

      <Divider />

      {/* Lists */}
      <TBtn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={14} /></TBtn>
      <TBtn title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={14} /></TBtn>
      <TBtn title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={14} /></TBtn>
      <TBtn title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={13} /></TBtn>

      <Divider />

      {/* Link */}
      {showLinkInput ? (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input
            autoFocus
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") setLink(); if (e.key === "Escape") setShowLinkInput(false); }}
            placeholder="https://…"
            style={{ fontSize: 12, padding: "4px 8px", border: "1px solid var(--ds-border)", borderRadius: 5, background: "var(--ds-input-bg)", color: "var(--ds-text)", fontFamily: "'DM Sans', sans-serif", outline: "none", width: 180 }}
          />
          <TBtn title="Set link" onClick={setLink}><LinkIcon size={12} /></TBtn>
          <TBtn title="Cancel" onClick={() => setShowLinkInput(false)}><X size={12} /></TBtn>
        </div>
      ) : (
        <TBtn title="Insert link" active={editor.isActive("link")} onClick={() => setShowLinkInput(true)}><LinkIcon size={13} /></TBtn>
      )}

      {/* Image upload */}
      <TBtn title="Insert image" disabled={uploading} onClick={onImageUpload}>
        {uploading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <ImageIcon size={13} />}
      </TBtn>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Cover image uploader ─── */
function CoverImage({ url, onUpload, onRemove }) {
  const inputRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `covers/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("blog").upload(path, file, { upsert: true });
    if (error) { alert("Upload failed: " + error.message); return; }
    const { data } = supabase.storage.from("blog").getPublicUrl(path);
    onUpload(data.publicUrl);
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.8px", color: "var(--ds-muted)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Cover Image</label>
      {url ? (
        <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", maxHeight: 260 }}>
          <img src={url} alt="Cover" style={{ width: "100%", objectFit: "cover", maxHeight: 260, display: "block" }} />
          <button
            type="button"
            onClick={onRemove}
            style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}
          >
            <X size={14} />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{ position: "absolute", bottom: 8, right: 8, fontSize: 11, fontWeight: 600, background: "rgba(0,0,0,0.65)", color: "#fff", border: "none", borderRadius: 5, padding: "5px 10px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
          >
            Replace
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            border: "2px dashed var(--ds-border)", borderRadius: 8, padding: "32px 20px",
            textAlign: "center", cursor: "pointer", color: "var(--ds-muted)",
            transition: "border-color 0.15s, background 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--ds-gold)"; e.currentTarget.style.background = "rgba(200,169,110,0.04)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--ds-border)"; e.currentTarget.style.background = "transparent"; }}
        >
          <Upload size={20} style={{ marginBottom: 8, opacity: 0.5 }} />
          <div style={{ fontSize: 13 }}>Click to upload cover image</div>
          <div style={{ fontSize: 11, marginTop: 4, opacity: 0.6 }}>JPG, PNG, WebP · recommended 1200×630</div>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files?.[0])} />
    </div>
  );
}

/* ─── Tags input ─── */
function TagsInput({ tags, onChange }) {
  const [input, setInput] = useState("");

  const add = () => {
    const val = input.trim().toLowerCase();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setInput("");
  };

  const remove = (tag) => onChange(tags.filter(t => t !== tag));

  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.8px", color: "var(--ds-muted)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Tags</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: tags.length ? 8 : 0 }}>
        {tags.map(tag => (
          <span key={tag} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, background: "rgba(200,169,110,0.1)", color: "var(--ds-gold)", padding: "4px 10px", borderRadius: 99, border: "1px solid rgba(200,169,110,0.25)" }}>
            <Tag size={10} /> {tag}
            <button type="button" onClick={() => remove(tag)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", display: "flex", padding: 0, marginLeft: 2 }}><X size={10} /></button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Add a tag…"
          style={{
            flex: 1, fontSize: 12.5, padding: "7px 11px",
            background: "var(--ds-input-bg)", border: "1px solid var(--ds-border)", borderRadius: 7,
            color: "var(--ds-text)", fontFamily: "'DM Sans', sans-serif", outline: "none",
          }}
        />
        <button
          type="button"
          onClick={add}
          style={{ padding: "7px 12px", background: "var(--ds-input-bg)", border: "1px solid var(--ds-border)", borderRadius: 7, cursor: "pointer", color: "var(--ds-muted)", display: "flex", alignItems: "center" }}
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

/* ─── BlogEditor ─── */
export default function BlogEditor() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const imageInputRef = useRef();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [author, setAuthor] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [tags, setTags] = useState([]);
  const [status, setStatus] = useState("draft");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [imgUploading, setImgUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Start writing your story…" }),
    ],
    editorProps: {
      attributes: {
        style: "min-height: 400px; outline: none; font-family: 'DM Sans', sans-serif; font-size: 15px; line-height: 1.75; color: var(--ds-text); padding: 24px;",
      },
    },
  });

  /* Load existing post */
  useEffect(() => {
    if (isNew) return;
    supabase.from("blog_posts").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (!data) { navigate("/blog"); return; }
      setTitle(data.title ?? "");
      setSlug(data.slug ?? "");
      setSlugEdited(true);
      setExcerpt(data.excerpt ?? "");
      setAuthor(data.author ?? "");
      setCoverUrl(data.cover_image_url ?? "");
      setTags(data.tags ?? []);
      setStatus(data.status ?? "draft");
      if (editor && data.content) editor.commands.setContent(data.content);
      setLoading(false);
    });
  }, [id, isNew, navigate]);

  /* Auto-set content once editor ready */
  useEffect(() => {
    if (!isNew && editor && !loading) return;
    if (editor && isNew) setLoading(false);
  }, [editor]);

  /* Auto-generate slug from title */
  useEffect(() => {
    if (!slugEdited) setSlug(toSlug(title));
  }, [title, slugEdited]);

  /* Insert image into editor body */
  const handleInlineImageFile = async (file) => {
    if (!file || !editor) return;
    setImgUploading(true);
    const ext = file.name.split(".").pop();
    const path = `body/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("blog").upload(path, file, { upsert: true });
    if (error) { alert("Upload failed: " + error.message); setImgUploading(false); return; }
    const { data } = supabase.storage.from("blog").getPublicUrl(path);
    editor.chain().focus().setImage({ src: data.publicUrl }).run();
    setImgUploading(false);
  };

  const save = async (publish = null) => {
    if (!title.trim()) { alert("Please add a title before saving."); return; }
    setSaving(true);
    const newStatus = publish !== null ? publish : status;
    const payload = {
      title: title.trim(),
      slug: slug || toSlug(title),
      excerpt: excerpt.trim(),
      author: author.trim(),
      content: editor?.getHTML() ?? "",
      cover_image_url: coverUrl,
      tags,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (newStatus === "published" && status !== "published") {
      payload.published_at = new Date().toISOString();
    }

    let resultId = id;
    if (isNew) {
      const { data, error } = await supabase.from("blog_posts").insert({ ...payload, created_at: new Date().toISOString() }).select("id").single();
      if (error) { alert("Save failed: " + error.message); setSaving(false); return; }
      resultId = data.id;
    } else {
      const { error } = await supabase.from("blog_posts").update(payload).eq("id", id);
      if (error) { alert("Save failed: " + error.message); setSaving(false); return; }
    }

    setStatus(newStatus);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    if (isNew) navigate(`/blog/${resultId}`, { replace: true });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--ds-muted)", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
        Loading…
      </div>
    );
  }

  const inputStyle = {
    width: "100%", fontSize: 13, padding: "8px 11px",
    background: "var(--ds-input-bg)", border: "1px solid var(--ds-border)", borderRadius: 7,
    color: "var(--ds-text)", fontFamily: "'DM Sans', sans-serif", outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: 11, fontWeight: 600, letterSpacing: "0.8px", color: "var(--ds-muted)",
    textTransform: "uppercase", display: "block", marginBottom: 6,
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Main editor area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid var(--ds-border)" }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid var(--ds-border)", background: "var(--ds-surface)", flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => navigate("/blog")}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--ds-muted)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", padding: "5px 8px", borderRadius: 6 }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--ds-text)"; e.currentTarget.style.background = "var(--ds-input-bg)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--ds-muted)"; e.currentTarget.style.background = "none"; }}
          >
            <ArrowLeft size={14} /> Blog
          </button>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ds-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {title || "Untitled post"}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {saved && <span style={{ fontSize: 12, color: "#16a34a" }}>Saved</span>}

            {/* Save draft */}
            <button
              type="button"
              onClick={() => save("draft")}
              disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 500, padding: "7px 14px", borderRadius: 7, border: "1px solid var(--ds-border)", background: "var(--ds-input-bg)", color: "var(--ds-text)", cursor: saving ? "default" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: saving ? 0.6 : 1 }}
            >
              {saving ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={13} />}
              Save Draft
            </button>

            {/* Publish / Unpublish */}
            <button
              type="button"
              onClick={() => save(status === "published" ? "draft" : "published")}
              disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 500, padding: "7px 14px", borderRadius: 7, border: "none", background: status === "published" ? "var(--ds-input-bg)" : "var(--ds-burgundy)", color: status === "published" ? "var(--ds-muted)" : "#fff", cursor: saving ? "default" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: saving ? 0.6 : 1 }}
            >
              {status === "published" ? <><EyeOff size={13} /> Unpublish</> : <><Eye size={13} /> Publish</>}
            </button>
          </div>
        </div>

        {/* Title field */}
        <div style={{ padding: "20px 24px 0", background: "var(--ds-bg)", flexShrink: 0 }}>
          <textarea
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Post title…"
            rows={2}
            style={{
              width: "100%", background: "transparent", border: "none", outline: "none",
              fontFamily: "'Cormorant Garamond', serif", fontSize: 38, fontWeight: 600,
              color: "var(--ds-text)", lineHeight: 1.2, resize: "none",
              letterSpacing: "-0.5px", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Rich text toolbar */}
        <div style={{ background: "var(--ds-bg)", flexShrink: 0 }}>
          <Toolbar editor={editor} onImageUpload={() => imageInputRef.current?.click()} uploading={imgUploading} />
        </div>

        {/* Editor body */}
        <div style={{ flex: 1, overflowY: "auto", background: "var(--ds-bg)" }}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* ── Right sidebar (meta) ── */}
      <div style={{ width: 300, flexShrink: 0, overflowY: "auto", background: "var(--ds-surface)", padding: "20px 20px 40px" }}>

        <CoverImage
          url={coverUrl}
          onUpload={url => setCoverUrl(url)}
          onRemove={() => setCoverUrl("")}
        />

        {/* Excerpt */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Excerpt</label>
          <textarea
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            placeholder="Short summary shown in post listings…"
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        {/* Author */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Author</label>
          <input
            value={author}
            onChange={e => setAuthor(e.target.value)}
            placeholder="e.g. Chef Adaobi"
            style={inputStyle}
          />
        </div>

        {/* Slug */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>URL Slug</label>
          <input
            value={slug}
            onChange={e => { setSlug(toSlug(e.target.value)); setSlugEdited(true); }}
            placeholder="auto-generated-from-title"
            style={{ ...inputStyle, fontSize: 12, fontFamily: "monospace" }}
          />
          <div style={{ fontSize: 10.5, color: "var(--ds-muted)", marginTop: 4 }}>
            /blog/{slug || "slug"}
          </div>
        </div>

        {/* Tags */}
        <div style={{ marginBottom: 20 }}>
          <TagsInput tags={tags} onChange={setTags} />
        </div>

        {/* Status indicator */}
        <div style={{ padding: "12px 14px", background: "var(--ds-input-bg)", borderRadius: 8, border: "1px solid var(--ds-border)" }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.6px", color: "var(--ds-muted)", textTransform: "uppercase", marginBottom: 4 }}>Status</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: status === "published" ? "#16a34a" : "#d97706" }}>
            {status === "published" ? "● Published" : "○ Draft"}
          </div>
        </div>
      </div>

      {/* Hidden file input for inline images */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={e => handleInlineImageFile(e.target.files?.[0])}
      />

      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--ds-muted);
          pointer-events: none;
          height: 0;
          opacity: 0.5;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 6px;
          margin: 12px 0;
          display: block;
        }
        .ProseMirror h1 { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 600; margin: 1.4em 0 0.4em; color: var(--ds-text); }
        .ProseMirror h2 { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 600; margin: 1.2em 0 0.3em; color: var(--ds-text); }
        .ProseMirror h3 { font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600; margin: 1em 0 0.25em; color: var(--ds-text); }
        .ProseMirror p { margin: 0.6em 0; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 1.4em; margin: 0.6em 0; }
        .ProseMirror li { margin: 0.2em 0; }
        .ProseMirror blockquote { border-left: 3px solid var(--ds-gold); padding-left: 1em; margin: 1em 0; color: var(--ds-muted); font-style: italic; }
        .ProseMirror code { background: var(--ds-input-bg); border: 1px solid var(--ds-border); border-radius: 3px; padding: 1px 5px; font-size: 0.88em; }
        .ProseMirror pre { background: var(--ds-input-bg); border: 1px solid var(--ds-border); border-radius: 7px; padding: 14px 16px; overflow-x: auto; margin: 1em 0; }
        .ProseMirror pre code { background: none; border: none; padding: 0; font-size: 13px; }
        .ProseMirror a { color: var(--ds-gold); text-decoration: underline; }
        .ProseMirror hr { border: none; border-top: 1px solid var(--ds-border); margin: 1.5em 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
