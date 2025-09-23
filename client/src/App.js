// client/src/App.js
import ListHeader from './components/ListHeader'
import ListItem from './components/ListItem'
import Profile from './components/Profile'
import Auth from './components/Auth'
import Topbar from './components/Topbar'
import { AnimatePresence, motion } from 'framer-motion'
import Button from './components/ui/Button'
import './App.css'
import './components/Filters.css'
import { useEffect, useMemo, useState } from 'react'

const MotionButton = motion(Button)

const App = () => {
  // session state
  const [userEmail, setUserEmail] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)

  // tasks state
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)

  // UI state
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [sortKey, setSortKey] = useState('date')
  const [view, setView] = useState('tasks') // 'tasks' | 'profile'

  const hasAuthFlag = () => {
    try { return localStorage.getItem('hasAuth') === '1' } catch { return false }
  }

  useEffect(() => {
    const loadSession = async () => {
      // do not hit /me when we know there is no auth
      if (!hasAuthFlag()) {
        setUserEmail(null)
        setCheckingSession(false)
        return
      }

      try {
        const res = await fetch(`${process.env.REACT_APP_SERVERURL}/me`, {
          credentials: 'include',
        })

        if (res.ok) {
          const json = await res.json()
          setUserEmail(json?.email || null)
        } else {
          // if server says 401, forget the local flag to avoid future calls
          try { localStorage.removeItem('hasAuth') } catch {}
          setUserEmail(null)
        }
      } catch {
        setUserEmail(null)
      } finally {
        setCheckingSession(false)
      }
    }
    loadSession()
  }, [])

  // stick body padding when topbar is visible
  useEffect(() => {
    const cls = 'with-topbar'
    if (userEmail) document.body.classList.add(cls)
    else document.body.classList.remove(cls)
    return () => document.body.classList.remove(cls)
  }, [userEmail])

  const getData = async () => {
    if (!userEmail) return
    setLoading(true)
    try {
      const response = await fetch(
        `${process.env.REACT_APP_SERVERURL}/todos/${encodeURIComponent(userEmail)}`,
        { method: 'GET', credentials: 'include' }
      )
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

  useEffect(() => {
    if (userEmail && view === 'tasks') getData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail, view])

  const clearLegacyCookies = () => {
    try {
      document.cookie = 'Email=; Max-Age=0; path=/'
      document.cookie = 'AuthToken=; Max-Age=0; path=/'
    } catch {}
  }

  const signOut = async () => {
    try {
      await fetch(`${process.env.REACT_APP_SERVERURL}/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      console.error(err)
    } finally {
      try { localStorage.removeItem('hasAuth') } catch {}
      clearLegacyCookies()
      window.location.reload()
    }
  }

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

  if (checkingSession) {
    return (
      <>
        <div className="top-spacer" aria-hidden />
        <div className="app">
          <p>Loading…</p>
        </div>
      </>
    )
  }

  if (!userEmail) {
    return (
      <div className="app">
        <Auth />
      </div>
    )
  }

  return (
    <>
      <Topbar
        userEmail={userEmail}
        view={view}
        onToggle={() => setView(view === 'profile' ? 'tasks' : 'profile')}
        onSignOut={signOut}
      />

      {/* ВАЖНО: динамический спейсер, который увеличивается при открытии меню */}
      <div className="top-spacer" aria-hidden />

      <div className="app">
        {view === 'profile' ? (
          <Profile onUpdated={(email) => setUserEmail(email)} />
        ) : (
          <>
            <ListHeader listName="My to-do list" getData={getData} />

            <input
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search tasks"
            />

            <div className="chiprow">
              <motion.div className="chipbar" role="tablist" aria-label="Filter tasks" layout>
                <MotionButton whileTap={{ scale: 0.98 }} variant="ghost" size="sm"
                  className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
                  All
                </MotionButton>
                <MotionButton whileTap={{ scale: 0.98 }} variant="ghost" size="sm"
                  className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>
                  Active
                </MotionButton>
                <MotionButton whileTap={{ scale: 0.98 }} variant="ghost" size="sm"
                  className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>
                  Completed
                </MotionButton>
              </motion.div>

              <motion.div className="chipbar" role="tablist" aria-label="Sort tasks" layout>
                <MotionButton whileTap={{ scale: 0.98 }} variant="ghost" size="sm"
                  className={sortKey === 'date' ? 'active' : ''} onClick={() => setSortKey('date')}>
                  Date
                </MotionButton>
                <MotionButton whileTap={{ scale: 0.98 }} variant="ghost" size="sm"
                  className={sortKey === 'priority' ? 'active' : ''} onClick={() => setSortKey('priority')}>
                  Priority
                </MotionButton>
                <MotionButton whileTap={{ scale: 0.98 }} variant="ghost" size="sm"
                  className={sortKey === 'progress' ? 'active' : ''} onClick={() => setSortKey('progress')}>
                  Progress
                </MotionButton>
              </motion.div>
            </div>

            {loading && <p>Loading…</p>}

            {!loading && processedTasks.length === 0 && (
              <p className="empty-hint">No tasks yet. Create your first one!</p>
            )}

            {!loading && (
              <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                <AnimatePresence initial={false}>
                  {processedTasks.map((task) => (
                    <ListItem key={task.id} task={task} getData={getData} />
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default App
