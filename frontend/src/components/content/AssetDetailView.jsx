import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const BRAND_PRIMARY = '#8B1A2B'

const STATUS_STYLE = {
  uploaded: 'bg-gray-100 text-gray-600',
  reviewed: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  posted:   'bg-gray-800 text-white',
}

const STATUSES = ['uploaded','reviewed','approved','posted']

const STATUS_PERMISSION = {
  uploaded: 'upload',
  reviewed: 'review',
  approved: 'review',
  posted:   'post',
}

const PLATFORMS = [
  { key: 'caption_instagram', label: '📸 Instagram', max: 2200,  color: '#E1306C' },
  { key: 'caption_tiktok',    label: '🎵 TikTok',    max: 2200,  color: '#69C9D0' },
  { key: 'caption_facebook',  label: '👥 Facebook',  max: 63206, color: '#1877F2' },
  { key: 'caption_x',         label: '🐦 X / Twitter', max: 280, color: '#1DA1F2' },
  { key: 'caption_linkedin',  label: '💼 LinkedIn',  max: 3000,  color: '#0A66C2' },
]

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement('textarea')
      el.value = text; el.style.position = 'fixed'; el.style.opacity = '0'
      document.body.appendChild(el); el.select()
      document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {copied ? (
        <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>Copied!</>
      ) : (
        <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy</>
      )}
    </button>
  )
}

export function AssetDetailView({ asset: initialAsset, isAdmin, contentPermission }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [asset,     setAsset]     = useState(initialAsset)
  const [updating,  setUpdating]  = useState(false)
  const [statusErr, setStatusErr] = useState(null)
  const [deleting,  setDeleting]  = useState(false)

  async function deleteAsset() {
    if (!window.confirm(`Delete "${asset.title}"? This cannot be undone.`)) return
    setDeleting(true)
    const { error } = await supabase.from('content_assets').delete().eq('id', asset.id)
    setDeleting(false)
    if (!error) {
      try {
        const url = new URL(asset.file_url)
        const parts = url.pathname.split('/content-assets/')
        if (parts[1]) {
          await supabase.storage.from('content-assets').remove([decodeURIComponent(parts[1])])
        }
      } catch { /* non-fatal */ }
      navigate('/content-hub')
    } else {
      alert(error.message ?? 'Failed to delete asset')
    }
  }

  async function updateStatus(status) {
    setUpdating(true); setStatusErr(null)

    const updates = { status }
    const now = new Date().toISOString()

    if (status === 'reviewed') {
      updates.reviewed_by = user.id; updates.reviewed_at = now
      updates.approved_by = null;    updates.approved_at = null
      updates.posted_by   = null;    updates.posted_at   = null
    }
    if (status === 'approved') {
      updates.approved_by = user.id; updates.approved_at = now
      updates.posted_by   = null;    updates.posted_at   = null
    }
    if (status === 'posted') {
      updates.posted_by = user.id; updates.posted_at = now
    }
    if (status === 'uploaded') {
      updates.reviewed_by = null; updates.reviewed_at = null
      updates.approved_by = null; updates.approved_at = null
      updates.posted_by   = null; updates.posted_at   = null
    }

    const { data, error } = await supabase
      .from('content_assets')
      .update(updates)
      .eq('id', asset.id)
      .select('*, week:content_weeks(id, title, start_date, end_date, week_number), uploader:users!uploaded_by(id, full_name), reviewer:users!reviewed_by(id, full_name), approver:users!approved_by(id, full_name), poster:users!posted_by(id, full_name)')
      .single()

    setUpdating(false)
    if (error) { setStatusErr(error.message ?? 'Failed to update'); return }
    setAsset(data)
  }

  const isImage = asset.file_type === 'image' || asset.file_type === 'graphic'
  const isVideo = asset.file_type === 'video'

  return (
    <div className="min-h-screen pb-12">
      <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-gray-100 sticky top-0 z-20">
        <Link
          to="/content-hub"
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900 truncate">{asset.title}</p>
          {asset.week && (
            <p className="text-xs text-gray-400">Week {asset.week.week_number} · {asset.week.title} · {asset.day_of_week}</p>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize flex-shrink-0 ${STATUS_STYLE[asset.status]}`}>
          {asset.status}
        </span>
      </div>

      <div className="px-6 py-5 max-w-3xl space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {isImage ? (
            <img src={asset.file_url} alt={asset.title} className="w-full max-h-[50vh] object-contain bg-gray-50" />
          ) : isVideo ? (
            <video src={asset.file_url} controls className="w-full max-h-[50vh] bg-black" />
          ) : (
            <div className="flex items-center justify-center h-40 bg-gray-50">
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <p className="text-sm text-gray-400">{asset.file_type?.toUpperCase()} file</p>
              </div>
            </div>
          )}
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
            <div>
              {asset.description && <p className="text-sm text-gray-600">{asset.description}</p>}
              {asset.uploader && <p className="text-xs text-gray-400 mt-0.5">Uploaded by {asset.uploader.full_name}</p>}
            </div>
            <a
              href={asset.file_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white flex-shrink-0 transition-opacity hover:opacity-90"
              style={{ background: BRAND_PRIMARY }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Status</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { s: 'uploaded', actor: asset.uploader },
              { s: 'reviewed', actor: asset.reviewer },
              { s: 'approved', actor: asset.approver },
              { s: 'posted',   actor: asset.poster   },
            ].map(({ s, actor }) => {
              const currentIdx = STATUSES.indexOf(asset.status)
              const sIdx       = STATUSES.indexOf(s)
              const isDone     = sIdx <= currentIdx
              const isActive   = sIdx === currentIdx
              const canClick   = isAdmin || contentPermission === STATUS_PERMISSION[s]
              return (
                <div key={s} className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => updateStatus(s)}
                    disabled={updating || isActive || !canClick}
                    title={!canClick ? 'You do not have permission to set this status' : undefined}
                    className={`w-full px-2 py-2 rounded-xl text-xs font-semibold capitalize transition-all text-center ${
                      isDone
                        ? `${STATUS_STYLE[s]}${isActive ? ' ring-2 ring-offset-1 ring-[#8B1A2B]' : ''}${!canClick ? ' opacity-70 cursor-not-allowed' : ''}`
                        : `bg-gray-100 text-gray-400 ${canClick ? 'hover:bg-gray-200' : 'cursor-not-allowed'}`
                    }`}
                  >
                    {updating && !isActive ? '…' : s}
                  </button>
                  <p className={`text-[10px] text-center leading-tight w-full truncate px-0.5 ${actor ? 'text-gray-500' : 'text-transparent select-none'}`}>
                    {actor ? actor.full_name.split(' ')[0] : '·'}
                  </p>
                </div>
              )
            })}
          </div>
          {statusErr && <p className="text-xs text-red-500 mt-2">{statusErr}</p>}
        </div>

        {PLATFORMS.map(({ key, label, max, color }) => {
          const text = asset[key]
          if (!text) return null
          return (
            <div key={key} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <p className="text-sm font-bold" style={{ color }}>{label}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] ${text.length > max * 0.9 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                    {text.length}/{max}
                  </span>
                  <CopyButton text={text} />
                </div>
              </div>
              <p className="px-5 py-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{text}</p>
            </div>
          )
        })}

        {asset.hashtags && (
          <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-700"># Hashtags</p>
              <CopyButton text={asset.hashtags} />
            </div>
            <p className="text-sm text-[#8B1A2B] font-medium">{asset.hashtags}</p>
          </div>
        )}

        {(isAdmin || asset.uploaded_by === user?.id) && (
          <div className="bg-white rounded-2xl border border-red-100 px-5 py-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Danger zone</p>
            <button
              onClick={deleteAsset}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
              {deleting ? 'Deleting…' : 'Delete asset'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
