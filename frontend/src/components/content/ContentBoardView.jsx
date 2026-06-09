import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const BRAND_PRIMARY = '#8B1A2B'
const EMOJIS = ['👍','❤️','🔥','👏','💡']

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function initials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function PostCard({ post, reactions, currentUserId, isAdmin, onReact, onDelete }) {
  const postReactions = reactions.filter(r => r.post_id === post.id)
  const counts = EMOJIS.reduce((acc, e) => { acc[e] = postReactions.filter(r => r.emoji === e).length; return acc }, {})
  const myReactions = new Set(postReactions.filter(r => r.user_id === currentUserId).map(r => r.emoji))

  return (
    <div className={`bg-white rounded-2xl border p-5 ${post.is_pinned ? 'border-red-200 shadow-sm' : 'border-gray-100'}`}>
      {post.is_pinned && (
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-xs font-bold text-[#8B1A2B] bg-red-50 px-2 py-0.5 rounded-full">📌 Pinned</span>
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ background: BRAND_PRIMARY }}>
          {post.author ? initials(post.author.full_name) : '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-gray-900">{post.author?.full_name ?? 'Unknown'}</p>
            <div className="flex items-center gap-2">
              <p className="text-[11px] text-gray-400">{timeAgo(post.created_at)}</p>
              {(post.author?.id === currentUserId || isAdmin) && (
                <button onClick={() => onDelete(post.id)} className="text-[11px] text-red-400 hover:text-red-600">Delete</button>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-700 mt-1.5 leading-relaxed whitespace-pre-wrap">{post.body}</p>
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {EMOJIS.map(e => (
              <button key={e} onClick={() => onReact(post.id, e)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
                  myReactions.has(e) ? 'bg-red-50 text-[#8B1A2B] font-semibold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{e}</span>
                {counts[e] > 0 && <span>{counts[e]}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ContentBoardView({ posts: initialPosts, reactions: initialReactions, currentUserId, isAdmin }) {
  const { user } = useAuth()
  const [posts,     setPosts]     = useState(initialPosts)
  const [reactions, setReactions] = useState(initialReactions)
  const [body,      setBody]      = useState('')
  const [isPinned,  setIsPinned]  = useState(false)
  const [posting,   setPosting]   = useState(false)
  const [error,     setError]     = useState(null)

  async function post() {
    if (!body.trim() || posting) return
    setPosting(true); setError(null)
    const { data, error: err } = await supabase
      .from('content_board_posts')
      .insert({ body: body.trim(), is_pinned: isPinned, author_id: user.id })
      .select('*, author:users!author_id(id, full_name, role)')
      .single()
    setPosting(false)
    if (err) { setError(err.message ?? 'Failed to post.'); return }
    setPosts(prev => {
      if (data.is_pinned) return [data, ...prev]
      const first = prev.findIndex(x => !x.is_pinned)
      if (first === -1) return [...prev, data]
      return [...prev.slice(0, first), data, ...prev.slice(first)]
    })
    setBody(''); setIsPinned(false)
  }

  async function handleReact(postId, emoji) {
    const { data: existing } = await supabase
      .from('content_board_reactions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .eq('emoji', emoji)
      .maybeSingle()

    if (existing) {
      await supabase.from('content_board_reactions').delete().eq('id', existing.id)
    } else {
      await supabase.from('content_board_reactions').insert({ post_id: postId, user_id: user.id, emoji })
    }

    const { data: updated } = await supabase
      .from('content_board_reactions')
      .select('*')
      .eq('post_id', postId)
    setReactions(prev => [...prev.filter(r => r.post_id !== postId), ...(updated ?? [])])
  }

  async function handleDelete(postId) {
    if (!window.confirm('Delete this post?')) return
    const { error: err } = await supabase.from('content_board_posts').delete().eq('id', postId)
    if (!err) setPosts(prev => prev.filter(p => p.id !== postId))
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={3}
          placeholder="Share an update, tip, or strategy note with the team…"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#8B1A2B] resize-none"
        />
        <div className="flex items-center justify-between mt-3">
          {isAdmin ? (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm text-gray-600 font-medium">📌 Pin this post</span>
            </label>
          ) : <div />}
          <button onClick={post} disabled={!body.trim() || posting}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
            style={{ background: BRAND_PRIMARY }}
          >
            {posting ? 'Posting…' : 'Post'}
          </button>
        </div>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>

      {posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-3xl mb-3">💬</p>
          <p className="text-sm font-semibold text-gray-700">No posts yet</p>
          <p className="text-xs text-gray-400 mt-1">Be the first to post an update for the team.</p>
        </div>
      ) : posts.map(p => (
        <PostCard key={p.id} post={p} reactions={reactions} currentUserId={currentUserId}
          isAdmin={isAdmin} onReact={handleReact} onDelete={handleDelete} />
      ))}
    </div>
  )
}
