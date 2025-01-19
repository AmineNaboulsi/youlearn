import { BrowserRouter , Routes , Route } from "react-router";
import Home from './Pages/page'
import SignIn from './Pages/SignIn'
import SignUp from './Pages/SignUp'
import NotFound from './Pages/NotFound'
import Courses from './Pages/Courses'
import Course from './Pages/Course'
import Profile from './Pages/Profile'
import Unauthorized from './Pages/Unauthorized'
import Dashborad from './Pages/admin/Dashborad'
import ManageCourse from './Pages/Courses/Page'
import AuthValidation from './Middleware/AuthValidation'

const ProfileWithValidation = AuthValidation(Profile,'etudiant');
const CourseWithValidation = AuthValidation(Course,'etudiant');
const DashboradWithValidation = AuthValidation(Dashborad,['admin','enseignant']);
const ManageCourseWithValidation = AuthValidation(ManageCourse,['admin','enseignant']);
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
