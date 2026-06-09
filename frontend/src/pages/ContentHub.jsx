import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ContentHubView } from '../components/content/ContentHubView'

const CONTENT_ROLE = 'content_manager'

function Spinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-[#8B1A2B] rounded-full" />
    </div>
  )
}

export default function ContentHub() {
  const { user, profile, loading: authLoading } = useAuth()
  const [hubData,  setHubData]  = useState(null)
  const [loading,  setLoading]  = useState(true)

  const role = profile?.role
  const hasAccess = role === 'admin' || role === CONTENT_ROLE

  useEffect(() => {
    if (authLoading || !user || !hasAccess) return
    loadData()
  }, [authLoading, user, hasAccess]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    setLoading(true)

    const [weeksRes, boardRes, reactionsRes] = await Promise.all([
      supabase
        .from('content_weeks')
        .select('*, assets:content_assets(id)')
        .order('start_date', { ascending: false }),
      supabase
        .from('content_board_posts')
        .select('*, author:users!author_id(id, full_name, role)')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('content_board_reactions').select('*'),
    ])

    const weeks = (weeksRes.data ?? []).map(w => ({
      ...w,
      asset_count: w.assets?.length ?? 0,
      assets: undefined,
    }))

    const activeWeek = weeks.find(w => w.status === 'active') ?? weeks[0] ?? null

    let activeAssets = []
    if (activeWeek) {
      const { data } = await supabase
        .from('content_assets')
        .select('*, uploader:users!uploaded_by(id, full_name)')
        .eq('week_id', activeWeek.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
      activeAssets = data ?? []
    }

    setHubData({
      weeks,
      activeWeek,
      activeAssets,
      boardPosts:     boardRes.data ?? [],
      boardReactions: reactionsRes.data ?? [],
    })
    setLoading(false)
  }

  if (authLoading) return <Spinner />
  if (!user) return <Navigate to="/content-hub/login" replace />
  if (!hasAccess) return <Navigate to="/" replace />
  if (loading || !hubData) return <Spinner />

  return (
    <ContentHubView
      currentUser={{
        id:                 user.id,
        full_name:          profile.full_name,
        role:               profile.role,
        content_permission: profile.content_permission,
      }}
      weeks={hubData.weeks}
      activeWeek={hubData.activeWeek}
      activeAssets={hubData.activeAssets}
      boardPosts={hubData.boardPosts}
      boardReactions={hubData.boardReactions}
    />
  )
}
