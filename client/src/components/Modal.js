// client/src/components/Modal.js
import { useState } from 'react'
import { useCookies } from 'react-cookie'

const clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n) || 0))

const Modal = ({ mode, setShowModal, getData, task }) => {
  const [cookies] = useCookies(null)
  const editMode = mode === 'edit'
  const [error, setError] = useState('')

  const [data, setData] = useState({
    user_email: editMode ? task.user_email : cookies.Email,
    title: editMode ? task.title : '',
    progress: editMode ? clamp(task.progress, 0, 100) : 50,
    date: editMode ? task.date : new Date().toISOString(),
    completed: editMode ? Boolean(task.completed) : false,
    priority: editMode ? Number(task.priority ?? 2) : 2,
  })

  const postData = async (e) => {
    e.preventDefault()
    if (!data.title || !data.title.trim()) {
      setError('Please enter your task')
      return
    }
    try {
      const res = await fetch(`${process.env.REACT_APP_SERVERURL}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // send httpOnly token cookie
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setShowModal(false)
        getData()
      } else {
        const msg = await res.json().catch(() => ({}))
        setError(msg.detail || 'Failed to create task')
      }
    } catch (err) {
      console.error(err)
      setError('Network error')
    }
  }

  const editData = async (e) => {
    e.preventDefault()
    if (!data.title || !data.title.trim()) {
      setError('Please enter your task')
      return
    }
    try {
      const res = await fetch(`${process.env.REACT_APP_SERVERURL}/todos/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // send httpOnly token cookie
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setShowModal(false)
        getData()
      } else {
        const msg = await res.json().catch(() => ({}))
        setError(msg.detail || 'Failed to update task')
      }
    } catch (err) {
      console.error(err)
      setError('Network error')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setData((prev) => ({
      ...prev,
      [name]:
        name === 'progress'
          ? clamp(value, 0, 100)
          : name === 'priority'
          ? clamp(value, 1, 3)
          : value,
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

  return (
    <div className="overlay">
      <div className="modal">
        <div className="form-title-container">
          <h3>Let's {mode} your task</h3>
          <button onClick={() => setShowModal(false)}>X</button>
        </div>

        <form onSubmit={editMode ? editData : postData}>
          <input
            required
            maxLength={30}
            placeholder=" Your task goes here"
            name="title"
            value={data.title || ''}
            onChange={handleChange}
          />

          <br />

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
          />

          <br />

          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            name="priority"
            value={data.priority}
            onChange={handleChange}
          >
            <option value={1}>Low</option>
            <option value={2}>Medium</option>
            <option value={3}>High</option>
          </select>

          <label style={{ marginTop: 10 }}>
            <input
              type="checkbox"
              name="completed"
              checked={data.completed}
              onChange={handleToggle}
              style={{ marginRight: 8 }}
            />
            Completed
          </label>

          {error && <p>{error}</p>}

          <button className={mode} type="submit">
            {editMode ? 'Save' : 'Create'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Modal
