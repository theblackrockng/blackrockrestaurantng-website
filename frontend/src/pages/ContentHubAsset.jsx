import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AssetDetailView } from '../components/content/AssetDetailView'

const CONTENT_ROLE = 'content_manager'

function Spinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-[#8B1A2B] rounded-full" />
    </div>
  )
}

export default function ContentHubAsset() {
  const { id } = useParams()
  const { user, profile, loading: authLoading } = useAuth()
  const [asset,   setAsset]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const role      = profile?.role
  const hasAccess = role === 'admin' || role === CONTENT_ROLE

  useEffect(() => {
    if (authLoading || !user || !hasAccess) return
    supabase
      .from('content_assets')
      .select('*, week:content_weeks(id, title, start_date, end_date, week_number), uploader:users!uploaded_by(id, full_name), reviewer:users!reviewed_by(id, full_name), approver:users!approved_by(id, full_name), poster:users!posted_by(id, full_name)')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err || !data) setError('Asset not found.')
        else setAsset(data)
        setLoading(false)
      })
  }, [id, authLoading, user, hasAccess]) // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading) return <Spinner />
  if (!user) return <Navigate to="/content-hub/login" replace />
  if (!hasAccess) return <Navigate to="/" replace />
  if (loading) return <Spinner />

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{error}</p>
      </div>
    )
  }

  return (
    <AssetDetailView
      asset={asset}
      currentUserId={user.id}
      isAdmin={profile.role === 'admin'}
      contentPermission={profile.content_permission ?? null}
    />
  )
}
