import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const BRAND_PRIMARY = '#8B1A2B'
const APP_HOME_PATH = '/'

function initials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const NAV = [
  {
    href: '/content-hub', label: 'This Week', exact: true, icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    href: '/content-hub?tab=calendar', label: 'Calendar', exact: false, icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
      </svg>
    ),
  },
  {
    href: '/content-hub?tab=board', label: 'Message Board', exact: false, icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    href: '/content-hub/guide', label: 'Strategy Guide', exact: false, icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
]

export function ContentSidebar({ user }) {
  const { pathname, search } = useLocation()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  function isActive(item) {
    if (item.href === '/content-hub/guide') return pathname.startsWith('/content-hub/guide')
    if (item.exact) return pathname === '/content-hub' && !search.includes('tab=')
    if (item.href.includes('tab=calendar')) return search.includes('tab=calendar')
    if (item.href.includes('tab=board')) return search.includes('tab=board')
    return false
  }

  async function handleSignOut() {
    await signOut()
    navigate('/content-hub/login')
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-[220px] flex-shrink-0 flex-col h-screen fixed left-0 top-0 z-40"
        style={{ background: 'linear-gradient(180deg, #1a0f0d 0%, #0f0d0a 100%)' }}
      >
        <div className="px-4 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: BRAND_PRIMARY }}>
              BR
            </div>
            <span className="text-white font-bold text-sm">BlackRock</span>
          </div>
          <p className="text-white/40 text-[10px] tracking-widest uppercase mt-2">Content Hub</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {NAV.map(item => {
            const active = isActive(item)
            return (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  active ? 'text-white font-semibold' : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
                style={active ? { background: 'rgba(139,26,43,0.25)', color: '#e87b8a' } : {}}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}

          <div className="pt-2 mt-2 border-t border-white/10">
            <Link
              to={APP_HOME_PATH}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:bg-white/5 hover:text-white/70 transition-colors"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Restaurant Site
            </Link>
          </div>
        </nav>

        {user && (
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: BRAND_PRIMARY }}>
                <span className="text-xs font-bold text-white">{initials(user.full_name)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
                <p className="text-[11px] text-white/50 capitalize">{user.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/60 hover:bg-white/5 hover:text-white/90 transition-colors"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </button>
          </div>
        )}
      </aside>

      {/* Mobile header */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 border-b border-white/10"
        style={{ background: '#1a0f0d' }}
      >
        <div className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{ background: BRAND_PRIMARY }}>
          BR
        </div>
        <p className="text-white font-bold text-sm flex-1">Content Hub</p>
        {user && (
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: BRAND_PRIMARY }}>
            <span className="text-[10px] font-bold text-white">{initials(user.full_name)}</span>
          </div>
        )}
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex">
        {[
          { href: '/content-hub', label: 'This Week', exact: true, icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          )},
          { href: '/content-hub?tab=calendar', label: 'Calendar', exact: false, icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          )},
          { href: '/content-hub?tab=board', label: 'Board', exact: false, icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          )},
          { href: '/content-hub/guide', label: 'Guide', exact: false, icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          )},
          { href: '/', label: 'Home', exact: false, icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          )},
        ].map(item => {
          const active = item.exact
            ? pathname === '/content-hub' && !search.includes('tab=')
            : item.href.startsWith('/content-hub/guide')
              ? pathname.startsWith('/content-hub/guide')
              : item.href.includes('tab=calendar') ? search.includes('tab=calendar')
              : item.href.includes('tab=board') ? search.includes('tab=board')
              : false
          return (
            <Link
              key={item.label}
              to={item.href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[52px] py-2 transition-colors"
              style={{ color: active ? BRAND_PRIMARY : '#9CA3AF' }}
            >
              {item.icon}
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </>
  )
}
