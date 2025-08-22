import { useState } from 'react'
import CommunityCalendar from './components/calender'

function App() {
  const [count, setCount] = useState(0)

  return (
    <CommunityCalendar />
  )
}

export default App
