// client/src/components/ListHeader.js
import { useState } from 'react'
import Modal from './Modal'
import { useCookies } from 'react-cookie'

const ListHeader = ({ listName, getData }) => {
  const [, , removeCookie] = useCookies(null)
  const [showModal, setShowModal] = useState(false)

  const signOut = async () => {
    try {
      await fetch(`${process.env.REACT_APP_SERVERURL}/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      console.error(err)
    } finally {
      removeCookie('Email')
      removeCookie('AuthToken')
      window.location.reload()
    }
  }

  return (
    <div className="list-header">
      <h1>{listName}</h1>
      <div className="button-container">
        <button className="create" onClick={() => setShowModal(true)}>ADD NEW</button>
        <button className="signout" onClick={signOut}>SIGN OUT</button>
      </div>
      {showModal && <Modal mode="create" setShowModal={setShowModal} getData={getData} />}
    </div>
  )
}

export default ListHeader
