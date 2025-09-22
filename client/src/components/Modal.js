import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import './Modal.css'

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

const Modal = ({ mode, setShowModal, getData, task }) => {
  const editMode = mode === 'edit'
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [data, setData] = useState({
    title: editMode ? task.title : '',
    progress: editMode ? clamp(task.progress, 0, 100) : 50,
    date: editMode ? task.date : new Date().toISOString(),
    completed: editMode ? Boolean(task.completed) : false,
    priority: editMode ? toPriorityNum(task.priority) : 2, // 1 low, 2 medium, 3 high
  })

  useEffect(() => {
    const onEsc = (e) => e.key === 'Escape' && setShowModal(false)
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [setShowModal])

  const validate = () => {
    if (!data.title || data.title.trim().length < 2) {
      setError('Title must be at least 2 characters')
      return false
    }
    if (data.progress < 0 || data.progress > 100) {
      setError('Progress must be between 0 and 100')
      return false
    }
    setError('')
    return true
  }

  const submitCreate = async (e) => {
    e.preventDefault()
    if (!validate()) return
    try {
      setIsSubmitting(true)
      const res = await fetch(`${process.env.REACT_APP_SERVERURL}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create task')
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
    if (!validate()) return
    try {
      setIsSubmitting(true)
      const res = await fetch(`${process.env.REACT_APP_SERVERURL}/todos/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update task')
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
            maxLength={140}
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
          />

          <label className="field-label" htmlFor="progress">Progress</label>
          <input
            id="progress"
            className="range"
            type="range"
            min="0"
            max="100"
            value={data.progress}
            onChange={(e) => setData({ ...data, progress: clamp(e.target.value, 0, 100) })}
          />

          <div className="modal-row">
            <div className="pill-group" role="group" aria-label="Priority">
              {[{ val: 1, label: 'Low' }, { val: 2, label: 'Medium' }, { val: 3, label: 'High' }].map(({ val, label }) => (
                <label key={val} className="pill">
                  <input
                    type="radio"
                    name="priority"
                    value={val}
                    checked={data.priority === val}
                    onChange={(e) => setData({ ...data, priority: toPriorityNum(e.target.value) })}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <label className="toggle">
              <span>Completed</span>
              <input
                type="checkbox"
                checked={data.completed}
                onChange={(e) => setData({ ...data, completed: e.target.checked })}
              />
            </label>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button className="btn primary wide" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (editMode ? 'Saving…' : 'Creating…') : editMode ? 'Save' : 'Create'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )

  return createPortal(modalEl, document.body)
}

export default Modal
