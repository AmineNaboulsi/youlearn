import Header from '../Components/Header'
import CoursesListPanel from '../Components/CoursesPage/CoursesListPanel'
function Courses() {

  return (
    <>
        <Header />
        <section>
            <div className="container">
            <div className="max-w-container mx-auto px-4 bg-[#F5F5F3]">
              <h1 className="font-bold text-4xl ">Courses</h1>
              <div className="flex items-center gap-1">
                  <div className="">Home </div>
                  <span>{' > '}Courses</span>
              </div>
              <CoursesListPanel />
            </div>
            </div>

        </section>
    </>
  )

      

}

export default Courses