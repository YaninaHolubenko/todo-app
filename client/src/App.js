// client/src/App.js
import ListHeader from './components/ListHeader'
import ListItem from './components/ListItem'
import Auth from './components/Auth'
import { useEffect, useMemo, useState } from 'react'

const App = () => {
  const [userEmail, setUserEmail] = useState(null)   // comes from /me
  const [checkingSession, setCheckingSession] = useState(true)

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')        // all | active | completed
  const [sortKey, setSortKey] = useState('date')     // date | priority | progress

  // verify session and get current user
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_SERVERURL}/me`, {
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          setUserEmail(data.email || null)
        } else {
          setUserEmail(null)
        }
      } catch (e) {
        console.error(e)
        setUserEmail(null)
      } finally {
        setCheckingSession(false)
      }
    }
    checkAuth()
  }, [])

  const getData = async () => {
    if (!userEmail) return
    try {
      setLoading(true)
      const response = await fetch(
        `${process.env.REACT_APP_SERVERURL}/todos/${userEmail}`,
        { credentials: 'include' } // send httpOnly auth cookie
      )
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
    if (userEmail) getData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail])

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

  const btnStyle = (active) => ({
    padding: '6px 10px',
    borderRadius: 12,
    border: '1px solid #e6e8ec',
    backgroundColor: active ? 'rgb(252, 229, 154)' : '#fff',
    cursor: 'pointer',
    fontSize: 12,
  })

  // while checking session
  if (checkingSession) {
    return (
      <div className="app">
        <p>Loading…</p>
      </div>
    )
  }

  // no session → show auth
  if (!userEmail) {
    return (
      <div className="app">
        <Auth />
      </div>
    )
  }

  // authorized UI
  return (
    <div className="app">
      <ListHeader listName={'My to-do list'} getData={getData} />
      <p className="user-email">Welcome back {userEmail}</p>

      <input
        placeholder="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search tasks"
      />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '8px 0 12px' }}>
        <div role="tablist" aria-label="Filter tasks" style={{ display: 'flex', gap: 8 }}>
          <button style={btnStyle(filter === 'all')} onClick={() => setFilter('all')}>All</button>
          <button style={btnStyle(filter === 'active')} onClick={() => setFilter('active')}>Active</button>
          <button style={btnStyle(filter === 'completed')} onClick={() => setFilter('completed')}>Completed</button>
        </div>
        <div role="tablist" aria-label="Sort tasks" style={{ display: 'flex', gap: 8 }}>
          <button style={btnStyle(sortKey === 'date')} onClick={() => setSortKey('date')}>Date</button>
          <button style={btnStyle(sortKey === 'priority')} onClick={() => setSortKey('priority')}>Priority</button>
          <button style={btnStyle(sortKey === 'progress')} onClick={() => setSortKey('progress')}>Progress</button>
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
  )
}

export default App
