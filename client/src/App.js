import ListHeader from './components/ListHeader'
import ListItem from './components/ListItem'
import Auth from './components/Auth'
import { useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'



const App = () => {
  const [cookies, setCookie, removeCookie] = useCookies(null)
  const authToken = cookies.AuthToken
  const userEmail = cookies.Email
  const [tasks, setTasks] = useState(null)
  const [filteredTasks, setFilteredTasks] = useState([])


  const getData = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_SERVERURL}/todos/${userEmail}`)
      const json = await response.json()
      setTasks(json)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (authToken) {
      getData()
    }
  }
    , [])


  //Sort by date
  const sortedTasks = tasks?.sort((a, b) => new Date(b.date) - new Date(a.date))

  // filterTasks 
  function filterTasks(e) {
    const searchValue = e.currentTarget.value.trim().toLowerCase()
    const result = tasks.filter(task => task.title.toLowerCase().includes(searchValue))
    setFilteredTasks(result)
  }

  return (
    <div className="app">
      {!authToken && <Auth />}
      {authToken && 
      <>
        <ListHeader listName={'😀 My to-do list'} getData={getData} />
        <p className='user-email'>Welcome back {userEmail}</p>
        <input
          placeholder={'Search'}
          onKeyUp={filterTasks}
        />
        {
          filteredTasks.length ? filteredTasks.map((task) => <ListItem key={task.id} task={task} getData={getData} />) : sortedTasks?.map((task) => <ListItem key={task.id} task={task} getData={getData} />)
        }
      </>}
      <p className='copyright'>© Your company name</p>
    </div>
  )
}


export default App


