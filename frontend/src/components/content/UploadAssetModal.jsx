import { useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const BRAND_PRIMARY = '#8B1A2B'
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram',   limit: 2200  },
  { key: 'tiktok',    label: 'TikTok',      limit: 2200  },
  { key: 'facebook',  label: 'Facebook',    limit: 63206 },
  { key: 'x',         label: 'X / Twitter', limit: 280   },
  { key: 'linkedin',  label: 'LinkedIn',    limit: 3000  },
]

function detectType(f) {
  if (f.type.startsWith('image/')) return 'image'
  if (f.type.startsWith('video/')) return 'video'
  return 'document'
}

function nameToTitle(name) {
  return name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function UploadAssetModal({ weekId, onClose, onUploaded }) {
  const { user } = useAuth()
  const [items,        setItems]        = useState([])
  const [dayOfWeek,    setDayOfWeek]    = useState(DAYS[0])
  const [hashtags,     setHashtags]     = useState('')
  const [captions,     setCaptions]     = useState({ instagram: '', tiktok: '', facebook: '', x: '', linkedin: '' })
  const [showCaptions, setShowCaptions] = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [globalErr,    setGlobalErr]    = useState(null)
  const fileRef = useRef(null)

  function updateItem(id, patch) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it))
  }

  function removeItem(id) {
    setItems(prev => prev.filter(it => it.id !== id))
  }

  async function addFiles(files) {
    const arr = Array.from(files)
    const newItems = arr.map(f => ({
      id:       Math.random().toString(36).slice(2),
      file:     f,
      preview:  f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      status:   'pending',
      url:      null,
      title:    nameToTitle(f.name),
      errorMsg: null,
    }))
    setItems(prev => [...prev, ...newItems])

    await Promise.all(newItems.map(async item => {
      const { file } = item
      const isVideo = file.type.startsWith('video/')
      const MAX = isVideo ? 200 * 1024 * 1024 : 50 * 1024 * 1024
      if (file.size > MAX) {
        updateItem(item.id, { status: 'error', errorMsg: `Too large (max ${isVideo ? '200MB' : '50MB'})` })
        return
      }
      updateItem(item.id, { status: 'uploading' })
      const ext  = file.name.split('.').pop()
      const path = `${weekId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from('content-assets').upload(path, file, { upsert: false })
      if (upErr) {
        updateItem(item.id, { status: 'error', errorMsg: `Upload failed: ${upErr.message}` })
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('content-assets').getPublicUrl(path)
      updateItem(item.id, { status: 'done', url: publicUrl })
    }))
  }

  async function handleDrop(e) {
    e.preventDefault()
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  async function saveAll() {
    const ready = items.filter(it => it.status === 'done' && it.url && it.title.trim())
    if (!ready.length) return
    setSaving(true)
    setGlobalErr(null)
    let saved = 0
    for (const item of ready) {
      const { data, error } = await supabase
        .from('content_assets')
        .insert({
          week_id:           weekId,
          day_of_week:       dayOfWeek,
          title:             item.title.trim(),
          file_url:          item.url,
          file_type:         detectType(item.file),
          thumbnail_url:     item.file.type.startsWith('image/') ? item.url : null,
          hashtags:          hashtags.trim() || null,
          caption_instagram: captions.instagram.trim() || null,
          caption_tiktok:    captions.tiktok.trim()    || null,
          caption_facebook:  captions.facebook.trim()  || null,
          caption_x:         captions.x.trim()         || null,
          caption_linkedin:  captions.linkedin.trim()  || null,
          sort_order:        0,
          uploaded_by:       user.id,
        })
        .select('*, uploader:users!uploaded_by(id, full_name)')
        .single()
      if (!error && data) { onUploaded(data); saved++ }
    }
    setSaving(false)
    if (saved === ready.length) {
      onClose()
    } else {
      setGlobalErr(`${ready.length - saved} file(s) failed to save.`)
    }
  }

  const doneCount      = items.filter(it => it.status === 'done').length
  const uploadingCount = items.filter(it => it.status === 'uploading').length
  const canSave        = doneCount > 0 && !saving && uploadingCount === 0

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-2xl max-h-[92vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Upload Content</h2>
            {items.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                {doneCount}/{items.length} uploaded
                {uploadingCount > 0 ? ` · ${uploadingCount} in progress…` : ''}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-red-100 rounded-2xl p-6 text-center cursor-pointer hover:border-[#8B1A2B] hover:bg-red-50/30 transition-colors"
          >
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              accept="image/*,video/mp4,video/quicktime,.pdf"
              onChange={e => { if (e.target.files?.length) addFiles(e.target.files) }}
            />
            <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p className="text-sm font-semibold text-gray-600">
              {items.length > 0 ? 'Tap to add more files' : 'Tap to select or drag & drop'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Images, videos, or PDFs</p>
          </div>

          {items.length > 0 && (
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center">
                    {item.preview ? (
                      <img src={item.preview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      value={item.title}
                      onChange={e => updateItem(item.id, { title: e.target.value })}
                      placeholder="Title…"
                      className="w-full text-sm font-medium bg-transparent border-b border-gray-200 focus:border-[#8B1A2B] focus:outline-none pb-0.5 text-gray-900 placeholder:text-gray-400"
                    />
                    <p className="text-[10px] mt-1 truncate">
                      {item.status === 'uploading' && <span className="text-amber-500 font-semibold">Uploading…</span>}
                      {item.status === 'done'      && <span className="text-green-600 font-semibold">✓ Ready</span>}
                      {item.status === 'error'     && <span className="text-red-500">{item.errorMsg}</span>}
                      {item.status === 'pending'   && <span className="text-gray-400">Waiting…</span>}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {item.status === 'uploading' ? (
                      <div className="w-5 h-5 border-2 border-red-100 border-t-[#8B1A2B] rounded-full animate-spin" />
                    ) : (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <div className="space-y-3 pt-1 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Applies to all files</p>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Day <span className="text-red-400">*</span></label>
                <select
                  value={dayOfWeek}
                  onChange={e => setDayOfWeek(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#8B1A2B] bg-white"
                >
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1"># Hashtags <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  value={hashtags}
                  onChange={e => setHashtags(e.target.value)}
                  placeholder="#theblackrock #lagos #nigerianfood"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#8B1A2B]"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowCaptions(v => !v)}
                className="flex items-center gap-2 text-xs font-semibold text-[#8B1A2B] hover:opacity-80 transition-opacity"
              >
                <span>{showCaptions ? '▲' : '▼'}</span>
                {showCaptions ? 'Hide captions' : '+ Add captions (optional)'}
              </button>

              {showCaptions && (
                <div className="space-y-3 pt-1">
                  {PLATFORMS.map(p => {
                    const val = captions[p.key]
                    const over = val.length > p.limit
                    return (
                      <div key={p.key}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-gray-500">{p.label}</label>
                          <span className={`text-[10px] font-mono ${over ? 'text-red-500 font-bold' : val.length > p.limit * 0.9 ? 'text-amber-500' : 'text-gray-400'}`}>
                            {val.length}/{p.limit}
                          </span>
                        </div>
                        <textarea
                          value={val}
                          onChange={e => setCaptions(prev => ({ ...prev, [p.key]: e.target.value }))}
                          placeholder={`${p.label} caption…`}
                          rows={3}
                          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#8B1A2B] resize-none"
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {globalErr && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{globalErr}</p>}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:border-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveAll}
            disabled={!canSave}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ background: BRAND_PRIMARY }}
          >
            {saving
              ? 'Saving…'
              : doneCount > 0
                ? `Save ${doneCount} asset${doneCount > 1 ? 's' : ''}`
                : 'Select files above'}
          </button>
        </div>
      </div>
    </div>
  )
}
