// client/src/components/Modal.js
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n) || 0))

const Modal = ({ mode, setShowModal, getData, task }) => {
  const editMode = mode === 'edit'
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [data, setData] = useState({
    title: editMode ? task.title : '',
    progress: editMode ? clamp(task.progress, 0, 100) : 50,
    date: editMode ? task.date : new Date().toISOString(),
    completed: editMode ? Boolean(task.completed) : false,
    priority: editMode ? Number(task.priority ?? 2) : 2, // 1..3
  })

  // lock body scroll and esc-to-close
  useEffect(() => {
    const { style } = document.body
    const prevOverflow = style.overflow
    style.overflow = 'hidden'

    const onKey = (e) => {
      if (e.key === 'Escape' && !isSubmitting) setShowModal(false)
    }
    window.addEventListener('keydown', onKey)

    return () => {
      style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [setShowModal, isSubmitting])

  const handleChange = (e) => {
    const { name, value } = e.target
    setData((prev) => ({
      ...prev,
      [name]: name === 'progress' ? clamp(value, 0, 100) : value,
      date: new Date().toISOString(),
    }))
  }

  const handleToggle = (e) => {
    const { name, checked } = e.target
    setData((prev) => ({
      ...prev,
      [name]: checked,
      date: new Date().toISOString(),
    }))
  }

  const handlePriority = (e) => {
    const val = Number(e.target.value)
    setData((prev) => ({
      ...prev,
      priority: val,
      date: new Date().toISOString(),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return

    const title = String(data.title || '').trim()
    if (!title) {
      setError('Please enter your task')
      return
    }
    setError('')
    setIsSubmitting(true)

    const payload = {
      title,
      progress: clamp(data.progress, 0, 100),
      date: new Date().toISOString(),
      completed: Boolean(data.completed),
      priority: Number(data.priority ?? 2),
    }

    const url = editMode
      ? `${process.env.REACT_APP_SERVERURL}/todos/${task.id}`
      : `${process.env.REACT_APP_SERVERURL}/todos`

    const method = editMode ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setShowModal(false)
        getData()
      } else {
        const msg = await res.json().catch(() => ({}))
        setError(msg.detail || (editMode ? 'Failed to update task' : 'Failed to create task'))
      }
    } catch (err) {
      console.error(err)
      setError('Network error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const modalEl = (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      onMouseDown={(e) => {
        if (!isSubmitting && e.target === e.currentTarget) setShowModal(false)
      }}
    >
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="form-title-container">
          <h3 id="task-modal-title">Let&apos;s {mode} your task</h3>
          <button onClick={() => !isSubmitting && setShowModal(false)} aria-label="Close modal" disabled={isSubmitting}>
            X
          </button>
        </div>

        <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
          <input
            required
            maxLength={120}
            placeholder="Your task goes here"
            name="title"
            value={data.title || ''}
            onChange={handleChange}
            aria-label="Task title"
            disabled={isSubmitting}
            autoFocus
          />

          <label htmlFor="range">Drag to select your current progress</label>
          <input
            className="range"
            required
            type="range"
            id="range"
            min="0"
            max="100"
            name="progress"
            value={data.progress}
            onChange={handleChange}
            disabled={isSubmitting}
          />

          {/* Priority pills + Completed toggle in one row */}
          <div className="modal-row">
            <div className="priority-group">
              <span className="field-label">Priority</span>
              <div className="pill-group" role="radiogroup" aria-label="Priority">
                <label className={`pill ${data.priority === 1 ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="priority"
                    value={1}
                    checked={data.priority === 1}
                    onChange={handlePriority}
                    disabled={isSubmitting}
                  />
                  <span>Low</span>
                </label>
                <label className={`pill ${data.priority === 2 ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="priority"
                    value={2}
                    checked={data.priority === 2}
                    onChange={handlePriority}
                    disabled={isSubmitting}
                  />
                  <span>Medium</span>
                </label>
                <label className={`pill ${data.priority === 3 ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="priority"
                    value={3}
                    checked={data.priority === 3}
                    onChange={handlePriority}
                    disabled={isSubmitting}
                  />
                  <span>High</span>
                </label>
              </div>
            </div>

            <label className="toggle" style={{ marginLeft: 'auto' }}>
              <span>Completed</span>
              <input
                type="checkbox"
                name="completed"
                checked={data.completed}
                onChange={handleToggle}
                aria-checked={data.completed}
                disabled={isSubmitting}
              />
              <span className="switch" aria-hidden="true" />
            </label>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button className={`btn primary wide ${mode}`} type="submit" disabled={isSubmitting}>
            {isSubmitting ? (editMode ? 'Saving…' : 'Creating…') : editMode ? 'Save' : 'Create'}
          </button>
        </form>
      </div>
    </div>
  )

  return createPortal(modalEl, document.body)
}

export default Modal
