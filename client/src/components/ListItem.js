import { useState } from 'react'
import { motion } from 'framer-motion'
import TickIcon from './TickIcon'
import Modal from './Modal'
import ProgressBar from './ProgressBar'
import Button from './ui/Button'
import './ListItem.css'

const formatDateTime = (value) => {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

const getPriorityMeta = (p) => {
  const val = Number(p) || 2
  if (val >= 3) return { label: 'High', className: 'priority-pill high' }
  if (val <= 1) return { label: 'Low', className: 'priority-pill low' }
  return { label: 'Medium', className: 'priority-pill medium' }
}

const ListItem = ({ task, getData }) => {
  const [showModal, setShowModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [error, setError] = useState('')

  const deleteItem = async () => {
    if (isDeleting) return
    if (!window.confirm('Delete this task?')) return
    setError('')
    setIsDeleting(true)
    try {
      const response = await fetch(`${process.env.REACT_APP_SERVERURL}/todos/${task.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (response.ok) {
        await getData()
      } else {
        const msg = await response.json().catch(() => ({}))
        setError(msg.detail || 'Failed to delete task')
      }
    } catch (err) {
      console.error(err)
      setError('Network error')
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleCompleted = async () => {
    if (isToggling) return
    setError('')
    setIsToggling(true)
    try {
      const response = await fetch(`${process.env.REACT_APP_SERVERURL}/todos/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ completed: !task.completed }),
      })
      if (response.ok) {
        await getData()
      } else {
        const msg = await response.json().catch(() => ({}))
        setError(msg.detail || 'Failed to update task')
      }
    } catch (err) {
      console.error(err)
      setError('Network error')
    } finally {
      setIsToggling(false)
    }
  }

  const isDone = Boolean(task.completed)
  const prio = getPriorityMeta(task.priority)
  const busy = isDeleting || isToggling

  return (
    <motion.li
      className="list-item"
      aria-busy={busy}
      initial={{ opacity: 0, y: 8, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.995 }}
      layout
      transition={{ type: 'spring', stiffness: 280, damping: 26, mass: 0.6 }}
    >
      <div className="item-head">
        <div className={`info-container ${isToggling ? 'is-busy' : ''}`}>
          <TickIcon active={isDone} onClick={busy ? undefined : toggleCompleted} />
          <p
            className={`task-title ${isDone ? 'done' : ''}`}
            title={task.title}
          >
            {task.title}
          </p>
        </div>

        <div className="meta">
          <p className="task-date">{formatDateTime(task.date)}</p>
          <span className={prio.className} aria-label={`Priority ${prio.label}`} title={`Priority: ${prio.label}`}>
            <span className="dot" />
            {prio.label}
          </span>
        </div>
      </div>

      <div className="item-foot">
        <div className="progress-wrap">
          <ProgressBar progress={task.progress} />
        </div>

        <div className="button-container">
          <Button
            className="edit"
            variant="ghost"
            size="sm"
            onClick={() => setShowModal(true)}
            disabled={isDeleting}
          >
            {isDeleting ? '...' : 'EDIT'}
          </Button>

          <Button
            className="delete"
            variant="danger"
            size="sm"
            onClick={deleteItem}
            disabled={isDeleting}
            loading={isDeleting}
          >
            {isDeleting ? 'DELETING…' : 'DELETE'}
          </Button>
        </div>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      {showModal && (
        <Modal
          mode="edit"
          setShowModal={setShowModal}
          getData={getData}
          task={task}
        />
      )}
    </motion.li>
  )
}

export default ListItem
