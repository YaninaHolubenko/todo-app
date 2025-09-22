// client/src/components/Modal.js
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import Button from './ui/Button'
import './Modal.css'

const MAX_TITLE = 120

const clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n) || 0))
const toPriorityNum = (v) => {
  if (typeof v === 'string') {
    const s = v.toLowerCase()
    if (s === 'low') return 1
    if (s === 'high') return 3
    if (s === 'medium') return 2
    const n = Number(v)
    return Number.isFinite(n) ? Math.min(3, Math.max(1, n)) : 2
  }
  const n = Number(v)
  return Number.isFinite(n) ? Math.min(3, Math.max(1, n)) : 2
}

const stripControlChars = (s) => {
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i)
    out += code < 32 || code === 127 ? ' ' : s[i]
  }
  return out
}

const sanitizeTitle = (input) => {
  if (typeof input !== 'string') return ''
  let v = stripControlChars(input)
    .replace(/<[^>]*>/g, '')
    .replace(/&[^;]{1,10};/g, '')
    .trim()
    .replace(/\s+/g, ' ')
  if (!v) return ''
  if (v.length > MAX_TITLE) v = v.slice(0, MAX_TITLE).trim()
  return v
}

const Modal = ({ mode, setShowModal, getData, task }) => {
  const editMode = mode === 'edit'
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [data, setData] = useState({
    title: editMode ? task.title : '',
    progress: editMode ? clamp(task.progress, 0, 100) : 50,
    date: editMode ? task.date : new Date().toISOString(),
    completed: editMode ? Boolean(task.completed) : false,
    priority: editMode ? toPriorityNum(task.priority) : 2,
  })

  const cleanTitle = useMemo(() => sanitizeTitle(data.title), [data.title])
  const isValid = useMemo(() => {
    if (!cleanTitle || cleanTitle.length < 1) return false
    if (cleanTitle.length > MAX_TITLE) return false
    const p = clamp(data.progress, 0, 100)
    if (!Number.isFinite(p)) return false
    if (p < 0 || p > 100) return false
    const pr = toPriorityNum(data.priority)
    if (pr < 1 || pr > 3) return false
    return true
  }, [cleanTitle, data.progress, data.priority])

  useEffect(() => {
    const onEsc = (e) => e.key === 'Escape' && setShowModal(false)
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [setShowModal])

  const readJson = async (res) => {
    try {
      const text = await res.text()
      if (!text) return null
      return JSON.parse(text)
    } catch {
      return null
    }
  }

  const submitCreate = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    if (!isValid) return
    try {
      setIsSubmitting(true)
      const payload = {
        title: cleanTitle,
        progress: clamp(data.progress, 0, 100),
        date: data.date,
        completed: Boolean(data.completed),
        priority: toPriorityNum(data.priority),
      }
      const res = await fetch(`${process.env.REACT_APP_SERVERURL}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const json = await readJson(res)
      if (!res.ok || (json && json.detail)) {
        throw new Error((json && json.detail) || 'Failed to create task')
      }
      await getData()
      setShowModal(false)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitEdit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    if (!isValid) return
    try {
      setIsSubmitting(true)
      const patch = {}

      const nextTitle = cleanTitle
      if (nextTitle !== task.title) patch.title = nextTitle

      const progNow = clamp(data.progress, 0, 100)
      if (progNow !== clamp(task.progress, 0, 100)) patch.progress = progNow

      const prNow = toPriorityNum(data.priority)
      if (prNow !== toPriorityNum(task.priority)) patch.priority = prNow

      const completedNow = Boolean(data.completed)
      if (completedNow !== Boolean(task.completed)) patch.completed = completedNow

      if (data.date && data.date !== task.date) patch.date = data.date

      if (Object.keys(patch).length === 0) {
        setShowModal(false)
        return
      }

      const res = await fetch(`${process.env.REACT_APP_SERVERURL}/todos/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch),
      })
      const json = await readJson(res)
      if (!res.ok || (json && json.detail)) {
        throw new Error((json && json.detail) || 'Failed to update task')
      }
      await getData()
      setShowModal(false)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const modalEl = (
    <motion.div
      className="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShowModal(false)}
    >
      <motion.div
        className="modal"
        initial={{ y: 14, scale: 0.98, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 8, scale: 0.98, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.6 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={editMode ? 'Edit task dialog' : 'Create task dialog'}
      >
        <div className="form-title-container">
          <h2>{editMode ? 'Edit Task' : 'Create Task'}</h2>
          <button aria-label="Close" onClick={() => setShowModal(false)}>✕</button>
        </div>

        <form onSubmit={editMode ? submitEdit : submitCreate}>
          <label className="field-label" htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            maxLength={MAX_TITLE}
            value={data.title}
            onChange={(e) => {
              setData({ ...data, title: e.target.value })
              if (error) setError('')
            }}
          />

          <label className="field-label" htmlFor="progress">Progress</label>
          <input
            id="progress"
            className="range"
            type="range"
            min="0"
            max="100"
            value={data.progress}
            onChange={(e) => {
              setData({ ...data, progress: clamp(e.target.value, 0, 100) })
              if (error) setError('')
            }}
          />

          <div className="modal-row">
            <div className="priority-field">
              <span className="field-label" id="priority-label">Priority</span>
              <div className="pill-group" role="group" aria-labelledby="priority-label">
                {[{ val: 1, label: 'Low' }, { val: 2, label: 'Medium' }, { val: 3, label: 'High' }].map(({ val, label }) => (
                  <label key={val} className="pill">
                    <input
                      type="radio"
                      name="priority"
                      value={val}
                      checked={toPriorityNum(data.priority) === val}
                      onChange={(e) => {
                        setData({ ...data, priority: toPriorityNum(e.target.value) })
                        if (error) setError('')
                      }}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="toggle">
              <span>Completed</span>
              <input
                type="checkbox"
                checked={Boolean(data.completed)}
                onChange={(e) => {
                  setData({ ...data, completed: e.target.checked })
                  if (error) setError('')
                }}
              />
            </label>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isSubmitting}
            disabled={!isValid}
          >
            {editMode ? 'Save' : 'Create'}
          </Button>
        </form>
      </motion.div>
    </motion.div>
  )

  return createPortal(modalEl, document.body)
}

export default Modal
