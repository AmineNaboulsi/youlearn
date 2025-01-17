import Header from '../Components/Nav/Header'
import CoursesListPanel from '../Components/CoursesPage/CoursesListPanel'
function Courses() {

  return (
    <>
        <Header />
        <section className='h-full'>
            <div className="container h-full">
              <div className="max-w-container mx-auto  bg-[#F5F5F3]  h-full">
                <h1 className="font-bold text-4xl ">Courses</h1>
                <div className="flex items-center gap-1">
                    <div className="">Home </div>
                    <span>{' > '}Courses</span>
                </div>
                <CoursesListPanel  />
              </div>
            </div>
        </section>
    </>
  )

      

}

export default Courses