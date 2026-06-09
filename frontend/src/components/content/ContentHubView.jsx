import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ThisWeekView } from './ThisWeekView'
import { CalendarView } from './CalendarView'
import { ContentBoardView } from './ContentBoardView'

const CONTENT_ROLE = 'content_manager'

const TABS = [
  { key: 'week',     label: '📅 This Week' },
  { key: 'calendar', label: '🗓️ Calendar'  },
  { key: 'board',    label: '💬 Message Board' },
]

export function ContentHubView({
  currentUser,
  weeks: initialWeeks,
  activeWeek: initialActiveWeek,
  activeAssets: initialAssets,
  boardPosts,
  boardReactions,
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const tabParam = searchParams.get('tab')
  const weekId   = searchParams.get('weekId')
  const tab      = tabParam === 'calendar' || tabParam === 'board' ? tabParam : 'week'

  const [weeks,  setWeeks]  = useState(initialWeeks)
  const [assets, setAssets] = useState(initialAssets)
  const [loadingAssets, setLoadingAssets] = useState(false)

  const selectedWeek = weekId
    ? (weeks.find(w => w.id === weekId) ?? initialActiveWeek)
    : initialActiveWeek

  useEffect(() => {
    if (!selectedWeek) return
    if (selectedWeek.id === initialActiveWeek?.id && !weekId) return
    setLoadingAssets(true)
    supabase
      .from('content_assets')
      .select('*, uploader:users!uploaded_by(id, full_name)')
      .eq('week_id', selectedWeek.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setAssets(data ?? [])
        setLoadingAssets(false)
      })
  }, [weekId, selectedWeek?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTabChange(newTab) {
    const params = new URLSearchParams(searchParams)
    if (newTab === 'week') {
      params.delete('tab')
    } else {
      params.set('tab', newTab)
    }
    setSearchParams(params, { replace: true })
  }

  const isAdmin   = currentUser.role === 'admin'
  const canUpload = isAdmin || currentUser.role === CONTENT_ROLE

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white sticky top-0 z-30">
        <div>
          <h1 className="text-2xl font-bold text-[#8B1A2B]">Content Hub</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {currentUser.role === 'admin' ? 'Admin' : 'Content Manager'} · {currentUser.full_name}
          </p>
        </div>
      </div>

      <div className="flex gap-1 px-6 pt-4 pb-2 bg-white border-b border-gray-50 flex-shrink-0 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
              tab === t.key
                ? 'bg-white shadow-sm border border-red-100 text-[#8B1A2B]'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 px-6 py-5 max-w-4xl">
        {tab === 'week' && (
          selectedWeek ? (
            loadingAssets ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-gray-200 border-t-[#8B1A2B] rounded-full" />
              </div>
            ) : (
              <ThisWeekView
                week={selectedWeek}
                assets={assets}
                canUpload={canUpload}
                onAssetAdded={a => {
                  setAssets(prev => [...prev, a])
                  setWeeks(prev => prev.map(w =>
                    w.id === selectedWeek.id ? { ...w, asset_count: (w.asset_count || 0) + 1 } : w
                  ))
                }}
              />
            )
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-base font-bold text-gray-700">No active week</p>
              <p className="text-sm text-gray-400 mt-1.5">
                {isAdmin
                  ? 'Go to the Calendar tab to create a week and set it to Active.'
                  : 'No content has been published for this week yet. Check back soon.'}
              </p>
            </div>
          )
        )}

        {tab === 'calendar' && (
          <CalendarView
            weeks={weeks}
            isAdmin={isAdmin}
            onWeekCreated={w => {
              setWeeks(prev => [w, ...prev])
              handleTabChange('week')
            }}
            onWeekActivated={wId =>
              setWeeks(prev => prev.map(w => ({
                ...w,
                status: w.id === wId ? 'active' : w.status === 'active' ? 'completed' : w.status,
              })))
            }
          />
        )}

        {tab === 'board' && (
          <ContentBoardView
            posts={boardPosts}
            reactions={boardReactions}
            currentUserId={currentUser.id}
            isAdmin={isAdmin}
          />
        )}
      </div>
    </div>
  )
}
