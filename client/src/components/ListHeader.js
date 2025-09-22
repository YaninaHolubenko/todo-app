// client/src/components/ListHeader.js
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Modal from './Modal'
import './ListHeader.css'

const ListHeader = ({ listName, getData }) => {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="list-header">
      <h1>{listName}</h1>

      <div className="button-container">
        <button className="create" onClick={() => setShowModal(true)}>
          ADD NEW
        </button>
      </div>

      <AnimatePresence>
        {showModal && (
          <Modal mode="create" setShowModal={setShowModal} getData={getData} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default ListHeader
