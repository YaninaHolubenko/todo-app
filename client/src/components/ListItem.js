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

  return (
    <li className="list-item">
      <div className="info-container">
        <TickIcon active={isDone} onClick={toggleCompleted} />
        <p
          className="task-title"
          style={{ textDecoration: isDone ? 'line-through' : 'none' }}
        >
          {task.title}
        </p>
        <p className="task-date">{formatDateTime(task.date)}</p>
        <ProgressBar progress={task.progress} />
      </div>

      <div className="button-container">
        <button className="edit" onClick={() => setShowModal(true)}>EDIT</button>
        <button className="delete" onClick={deleteItem}>DELETE</button>
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
