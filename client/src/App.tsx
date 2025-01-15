import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Home from './pages/Home'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import NotFound from './pages/NotFound'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <BrowserRouter>

    <Routes>
      <Route path="/" index element={<HomeWithAuth />} />
      <Route path="/signup" index element={<SignUp />} />
      <Route path="/signin" index element={<SignIn />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
  )
}

export default App
