import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const CONTENT_ROLE = 'content_manager'

export default function ContentHubGuide() {
  const { user, profile, loading } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/content-hub/login" replace />
  if (profile?.role !== 'admin' && profile?.role !== CONTENT_ROLE) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen pb-12">
      <div className="px-6 py-5 border-b border-gray-100 bg-white sticky top-0 z-20">
        <h1 className="text-xl font-bold text-[#8B1A2B]">Strategy Guide</h1>
        <p className="text-xs text-gray-400 mt-0.5">Content direction & brand guidelines</p>
      </div>

      <div className="px-6 py-8 max-w-3xl space-y-8">

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">Brand Voice</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            BlackRock speaks with quiet confidence. We don't shout. We don't beg for likes.
            Our tone is warm, knowledgeable, and Lagos-proud — the kind of voice you'd hear from a friend who knows every good table in Ikeja.
          </p>
          <ul className="mt-4 space-y-2">
            {['Confident, never arrogant', 'Local, never parochial', 'Warm, never casual', 'Concise — say it in fewer words'].map(p => (
              <li key={p} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-[#8B1A2B] mt-0.5">→</span> {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">Content Mix</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { pct: '40%', label: 'Food & Drinks', color: '#8B1A2B' },
              { pct: '25%', label: 'Atmosphere',    color: '#C9A84C' },
              { pct: '20%', label: 'Stories',       color: '#6B7280' },
              { pct: '15%', label: 'Offers',        color: '#374151' },
            ].map(item => (
              <div key={item.label} className="text-center p-3 rounded-xl border border-gray-100">
                <div className="text-2xl font-bold" style={{ color: item.color }}>{item.pct}</div>
                <div className="text-xs text-gray-500 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">Posting Schedule</h2>
          <div className="space-y-3">
            {[
              { day: 'Monday',    time: '12:00pm',   note: 'Week-opening food shot' },
              { day: 'Wednesday', time: '6:00pm',    note: 'Atmosphere / ambiance' },
              { day: 'Friday',    time: '12:00pm',   note: 'Weekend teaser or offer' },
              { day: 'Saturday',  time: '7:00pm',    note: 'Live service / reels' },
              { day: 'Sunday',    time: '2:00pm',    note: 'Brunch content or recap' },
            ].map(row => (
              <div key={row.day} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#8B1A2B] bg-red-50 px-2 py-0.5 rounded-full w-24 text-center">{row.day}</span>
                  <span className="text-sm text-gray-700">{row.note}</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">{row.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">Platform Notes</h2>
          <div className="space-y-4">
            {[
              { platform: 'Instagram', color: '#E1306C', notes: 'Aesthetic-first. Show the room and the plate equally. Reels outperform static by 3×. Use carousel for multi-dish.' },
              { platform: 'TikTok',    color: '#69C9D0', notes: 'Energy-driven. Behind-the-scenes and chef moments perform best. Keep under 45 seconds. Native audio or trending sounds.' },
              { platform: 'Facebook',  color: '#1877F2', notes: 'Longer captions work here. Event announcements, reservations, and menus get engagement. Boosting events is effective.' },
              { platform: 'X',         color: '#1DA1F2', notes: 'Short, quotable takes. Food takes, Lagos cultural moments, witty one-liners. 280 chars — leave room for retweets.' },
            ].map(item => (
              <div key={item.platform} className="border-l-2 pl-4" style={{ borderColor: item.color }}>
                <p className="text-sm font-bold mb-1" style={{ color: item.color }}>{item.platform}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{item.notes}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
