import { BrowserRouter , Routes , Route } from "react-router";
import Home from './Pages/Home'
import SignIn from './Pages/SignIn'
import SignUp from './Pages/SignUp'
import NotFound from './Pages/NotFound'
import AuthValidation from './Middleware/AuthValidation'

const HomeWithValidation = AuthValidation(Home);
function App() {

  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" index element={<HomeWithValidation />} />
      <Route path="/signup" index element={<SignUp />} />
      <Route path="/signin" index element={<SignIn />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
  )
}

export default App
