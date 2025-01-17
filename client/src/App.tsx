import { BrowserRouter , Routes , Route } from "react-router";
import Home from './Pages/page'
import SignIn from './Pages/SignIn'
import SignUp from './Pages/SignUp'
import NotFound from './Pages/NotFound'
import Courses from './Pages/Courses'
import Course from './Pages/Course'
import Profile from './Pages/Profile'
import Unauthorized from './Pages/Unauthorized'
import Dashborad from './Pages/admin/Page'
import ManageCourse from './Pages/Courses/page'
import AuthValidation from './Middleware/AuthValidation'

const ProfileWithValidation = AuthValidation(Profile);
const CourseWithValidation = AuthValidation(Course);
const DashboradWithValidation = AuthValidation(Dashborad);
const ManageCourseWithValidation = AuthValidation(ManageCourse);
function App() {

  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" index element={<Home />} />
      <Route path="/courses" index element={<Courses />} />
      <Route path="/profile" index element={<ProfileWithValidation />} />
      <Route path="/Course" index element={<CourseWithValidation />} />
      <Route path="/signup" index element={<SignUp />} />
      <Route path="/signin" index element={<SignIn />} />
      <Route path="/unauthorized" index element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
      <Route path="/dashborad" index element={<DashboradWithValidation />} />
      <Route path="/dashborad/course" index element={<ManageCourseWithValidation />} />
    </Routes>
   
  </BrowserRouter>
  )
}

export default App
