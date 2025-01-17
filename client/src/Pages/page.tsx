import Header from '../Components/Nav/Header'
import SliderBanner from '../Components/Sliders/SliderBanner'
import CoursesList from '../Components/CoursesList'
function Home() {
  return (
    <>
        <Header />
        <SliderBanner />
        <section className='mt-10'>
          <div className="container">
            <h2 className='text-3xl font-semibold'>All the skills you need in one place</h2>
            <h3 className='text-md font-normal mt-2 text-gray-600'>
                From critical skills to technical topics, Youlearn supports your professional development.
            </h3>
          </div>
        </section>
        <CoursesList />
        <div className="mt-52">...</div>
    </>
  )
}

export default Home