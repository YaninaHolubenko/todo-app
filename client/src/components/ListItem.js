import { useState } from 'react'
import TickIcon from './TickIcon'
import Modal from './Modal'
import ProgressBar from './ProgressBar'




const ListItem = ({ task, getData }) => {
  
  const [showModal, setShowModal] = useState(false)
  const deleteItem = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_SERVERURL}/todos/${task.id}`, {
        method: 'DELETE'
      })
      if (response.status === 200) {
        getData()
      }
    } catch (err) {
      console.error(err)
    }
  }
  return (
    <li className="list-item">

      <div className="info-container">
        <TickIcon />
        <p className="task-title">{task.title}</p>
        <p className='task-date'>{ task.date.substring(0,4) + task.date.substring(4,8) + task.date.substring(8,10) /* + ' time:' + task.date.substring(11,16) */} </p>
        <ProgressBar progress={task.progress}/>
      </div>

      <div className='button-container'>
        <button className='edit' onClick={() => setShowModal(true)}>EDIT</button>
        <button className='delete' onClick={deleteItem}>DELETE</button>
      </div>
      {showModal && <Modal mode={'edit'} setShowModal={setShowModal} getData={getData} task={task} />}
    </li>


  )
}

export default ListItem

//