// client/src/components/ListItem.js
import { useState } from 'react'
import TickIcon from './TickIcon'
import Modal from './Modal'
import ProgressBar from './ProgressBar'

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
  if (val >= 3) {
    return {
      label: 'High',
      style: {
        background: 'rgba(161,100,80,.10)',
        border: '1px solid rgba(161,100,80,.35)',
        color: 'var(--danger-600)',
      },
    }
  }
  if (val <= 1) {
    return {
      label: 'Low',
      style: {
        background: 'rgba(0,0,0,.06)',
        border: '1px solid rgba(0,0,0,.10)',
        color: 'var(--muted)',
      },
    }
  }
  return {
    label: 'Medium',
    style: {
      background: 'var(--primary-50)',
      border: '1px solid rgba(180,134,98,.45)',
      color: 'var(--primary-600)',
    },
  }
}

const ListItem = ({ task, getData }) => {
  const [showModal, setShowModal] = useState(false)

  const deleteItem = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_SERVERURL}/todos/${task.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (response.ok) getData()
    } catch (err) {
      console.error(err)
    }
  }

  const toggleCompleted = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_SERVERURL}/todos/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ completed: !task.completed }),
      })
      if (response.ok) getData()
    } catch (err) {
      console.error(err)
    }
  }

  const isDone = Boolean(task.completed)
  const prio = getPriorityMeta(task.priority)

  return (
    <li className="list-item">
      {/* Top row: tick + title on the left, date + priority on the right */}
      <div
        className="item-head"
        style={{
          display: 'flex',
          alignItems: 'center',          // center vertically
          justifyContent: 'space-between',
          gap: 12,
          width: '100%',
        }}
      >
        <div
          className="info-container"
          style={{
            display: 'flex',
            alignItems: 'center',        // center vertically
            gap: 12,
            minWidth: 0,
            flex: '1 1 auto',
          }}
        >
          <TickIcon  active={isDone} onClick={toggleCompleted} />
          <p
            className="task-title"
            style={{
              margin: 0,
              flex: '1 1 auto',
              minWidth: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'normal',
              lineHeight: 1.35,
              textDecoration: isDone ? 'line-through' : 'none',
            }}
            title={task.title}
          >
            {task.title}
          </p>
        </div>

        <div
          className="meta"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 6,
            flex: '0 0 auto',
          }}
        >
          <p className="task-date" style={{ margin: 0, textAlign: 'right' }}>
            {formatDateTime(task.date)}
          </p>
          <span
            aria-label={`Priority ${prio.label}`}
            title={`Priority: ${prio.label}`}
            style={{
              ...prio.style,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 12,
              lineHeight: 1,
              fontWeight: 600,
              minWidth: 80,
              textAlign: 'center',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background:
                  prio.label === 'High'
                    ? 'var(--danger-600)'
                    : prio.label === 'Medium'
                    ? 'var(--primary-600)'
                    : 'rgba(0,0,0,.35)',
              }}
            />
            {prio.label}
          </span>
        </div>
      </div>

      {/* Bottom row: progress left, actions right */}
      <div
        className="item-foot"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: 10,
          width: '100%',
          flexWrap: 'wrap',
        }}
      >
        <div className="progress-wrap" style={{ flex: '1 1 260px', minWidth: 220 }}>
          <ProgressBar progress={task.progress} />
        </div>

        <div className="button-container" style={{ gap: 10 }}>
          <button className="edit" onClick={() => setShowModal(true)}>EDIT</button>
          <button className="delete" onClick={deleteItem}>DELETE</button>
        </div>
      </div>

      {showModal && (
        <Modal
          mode="edit"
          setShowModal={setShowModal}
          getData={getData}
          task={task}
        />
      )}
    </li>
  )
}

export default ListItem
