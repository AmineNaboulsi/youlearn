import Header from '../Components/Nav/Header'
import SliderBanner from '../Components/Sliders/SliderBanner'
import { Link } from 'react-router'
function Home() {
  return (
    <>
        <Header />
        <SliderBanner />
        <section className='mt-10'>
        </section>
        <section>
          <div className="container py-4 text-center">
              <Link to='/courses'>
                <span className="cursor-pointer rounded-md bg-gray-600  px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                  See Courses
                </span>
              </Link>
          </div>
        </section>
        <section className="relative isolate overflow-hidden bg-white px-6 py-24 sm:py-32 lg:px-8">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),white)] opacity-20"></div>
            <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-white shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-50 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center"></div>
            <div className="mx-auto max-w-2xl lg:max-w-4xl">
              <div className='text-center'><span className='font-semibold text-xl'>You Learn</span></div>
              <figure className="mt-10">
                <blockquote className="text-center text-xl/8 font-semibold text-gray-900 sm:text-2xl/9">
                  <p>“All the skills you need in one place.”</p>
                  <span>From critical skills to technical topics, Youlearn supports your professional development.</span>
                </blockquote>
                <figcaption className="mt-10">
                  <img className="mx-auto size-10 rounded-full" src="https://media.licdn.com/dms/image/v2/D4E03AQEY55PrKlPY1g/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1706394101212?e=1743033600&v=beta&t=Q7mqyPTogZpkEftH5gOiu0K5ARfODZeIlV4y--0fr6I" alt="" />
                  <div className="mt-4 flex items-center justify-center space-x-3 text-base">
                    <div className="font-semibold text-gray-900">Naboulsi Amine</div>
                    <svg viewBox="0 0 2 2" width="3" height="3" aria-hidden="true" className="fill-gray-900">
                      <circle cx="1" cy="1" r="1" />
                    </svg>
                    <div className="text-gray-600">CEO of YouLearn</div>
                  </div>
                </figcaption>
              </figure>
            </div>
          </section>

        <div className="mt-52">...</div>
    </>
  )
}

export default Home