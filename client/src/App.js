import ListHeader from './components/ListHeader'
import ListItem from './components/ListItem'
import Auth from './components/Auth'
import { useEffect, useMemo, useState } from 'react'
import { useCookies } from 'react-cookie'

const TOPBAR_H = 64 // visual height of the fixed header

const App = () => {
  // session state
  const [userEmail, setUserEmail] = useState(null)   // comes from /me cookie session
  const [checkingSession, setCheckingSession] = useState(true)
  const [, , removeCookie] = useCookies(null)

  // tasks state
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)

  // UI state
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')        // all | active | completed
  const [sortKey, setSortKey] = useState('date')     // date | priority | progress

  // fetch current session from backend
  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_SERVERURL}/me`, {
          credentials: 'include',
        })
        if (res.ok) {
          const json = await res.json()
          setUserEmail(json?.email || null)
        } else {
          setUserEmail(null)
        }
      } catch (err) {
        console.error(err)
        setUserEmail(null)
      } finally {
        setCheckingSession(false)
      }
    }
    loadSession()
  }, [])

  // when session state changes, toggle a class on <body> so content sticks to the top (not vertically centered)
  useEffect(() => {
    const cls = 'with-topbar'
    if (userEmail) document.body.classList.add(cls)
    else document.body.classList.remove(cls)
    return () => document.body.classList.remove(cls)
  }, [userEmail])

  // fetch tasks for the user
  const getData = async () => {
    if (!userEmail) return
    setLoading(true)
    try {
      const response = await fetch(`${process.env.REACT_APP_SERVERURL}/todos/${encodeURIComponent(userEmail)}`, {
        method: 'GET',
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to load tasks')
      const json = await response.json()
      setTasks(Array.isArray(json) ? json : [])
    } catch (err) {
      console.error(err)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  // load tasks after session resolves
  useEffect(() => {
    if (userEmail) getData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail])

  // sign out moved to top bar
  const signOut = async () => {
    try {
      await fetch(`${process.env.REACT_APP_SERVERURL}/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      console.error(err)
    } finally {
      // legacy cookies cleanup (kept for compatibility)
      removeCookie('Email')
      removeCookie('AuthToken')
      window.location.reload()
    }
  }

  // apply search, filter and sort
  const processedTasks = useMemo(() => {
    let arr = Array.isArray(tasks) ? [...tasks] : []

    if (filter === 'active') arr = arr.filter((t) => !t.completed)
    if (filter === 'completed') arr = arr.filter((t) => !!t.completed)

    const q = query.trim().toLowerCase()
    if (q) arr = arr.filter((t) => (t.title || '').toLowerCase().includes(q))

    arr.sort((a, b) => {
      if (sortKey === 'priority') return (Number(b.priority ?? 2)) - (Number(a.priority ?? 2))
      if (sortKey === 'progress') return (Number(b.progress || 0)) - (Number(a.progress || 0))
      return new Date(b.date) - new Date(a.date)
    })

    return arr
  }, [tasks, query, filter, sortKey])

  // while checking session
  if (checkingSession) {
    return (
      <>
        {/* reserve space for the fixed header while loading */}
        <div style={{ height: TOPBAR_H }} />
        <div className="app">
          <p>Loading…</p>
        </div>
      </>
    )
  }

  // no session → show auth (без шапки)
  if (!userEmail) {
    return (
      <div className="app">
        <Auth />
      </div>
    )
  }

  // app board
  return (
    <>
      {/* Global top bar: outside the centered app container */}
      <header
        className="topbar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          minHeight: TOPBAR_H,
          pointerEvents: 'none', // allow background interactions; buttons enable their own pointer events
        }}
      >
        <div
          style={{
            pointerEvents: 'auto',
            fontSize: 14,
            color: 'var(--muted)',
            background: 'var(--glass)',
            border: '1px solid var(--glass-border)',
            borderRadius: 999,
            padding: '8px 12px',
            boxShadow: 'var(--shadow-soft)',
          }}
        >
          Welcome back <strong>{userEmail}</strong>
        </div>

        <div style={{ pointerEvents: 'auto' }}>
          <button className="signout" onClick={signOut} style={{ height: 38 }}>
            SIGN OUT
          </button>
        </div>
      </header>

      {/* spacer pushes content below the fixed header */}
      <div style={{ height: TOPBAR_H }} aria-hidden />

      <div className="app">
        <ListHeader listName="My to-do list" getData={getData} />

        <input
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search tasks"
        />

        {/* filter & sort chip controls — inside .button-container to inherit styles */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '8px 0 12px' }}>
          <div className="button-container" role="tablist" aria-label="Filter tasks" style={{ gap: 8 }}>
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
            <button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>Active</button>
            <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>Completed</button>
          </div>
          <div className="button-container" role="tablist" aria-label="Sort tasks" style={{ gap: 8 }}>
            <button className={sortKey === 'date' ? 'active' : ''} onClick={() => setSortKey('date')}>Date</button>
            <button className={sortKey === 'priority' ? 'active' : ''} onClick={() => setSortKey('priority')}>Priority</button>
            <button className={sortKey === 'progress' ? 'active' : ''} onClick={() => setSortKey('progress')}>Progress</button>
          </div>
        </div>

        {loading && <p>Loading…</p>}

        {!loading && processedTasks.length === 0 && (
          <p style={{ marginTop: 12 }}>No tasks yet. Create your first one!</p>
        )}

        {!loading &&
          processedTasks.map((task) => (
            <ListItem key={task.id} task={task} getData={getData} />
          ))}
      </div>
    </>
  )
}

export default App
