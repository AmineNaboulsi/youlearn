import Header from '../Components/Nav/Header'
import Footer from '../Components/Footer/Footer'
import SliderBanner from '../Components/Sliders/SliderBanner'
import { Link } from 'react-router'
import { BookOpen, Clock, Globe, Users } from 'lucide-react'

function Home() {

  const categories = [
    { name: "Programming", icon: <Globe className="h-8 w-8 text-indigo-600" />, count: 238 },
    { name: "Data Science", icon: <BookOpen className="h-8 w-8 text-indigo-600" />, count: 142 },
    { name: "Business", icon: <Users className="h-8 w-8 text-indigo-600" />, count: 187 },
    { name: "Design", icon: <Clock className="h-8 w-8 text-indigo-600" />, count: 104 }
  ];

  const stats = [
    { value: "10K+", label: "Students" },
    { value: "500+", label: "Courses" },
    { value: "100+", label: "Instructors" },
    { value: "50+", label: "Countries" }
  ];

  return (
    <>
      <Header />
      
      <section className="bg-gradient-to-r from-indigo-50 to-indigo-100 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Expand Your Skills with <span className="text-indigo-600">YouLearn</span>
              </h1>
              <p className="text-lg text-gray-700 mb-8">
                Access high-quality courses taught by industry experts. Learn at your own pace and achieve your professional goals.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/courses">
                  <button className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors">
                    Explore Courses
                  </button>
                </Link>
                <Link to="/signup">
                  <button className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg shadow-md border border-indigo-200 hover:bg-indigo-50 transition-colors">
                    Join for Free
                  </button>
                </Link>
              </div>
            </div>
            
          </div>
        </div>
      </section>
      
      <SliderBanner />
      
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Browse Top Categories</h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Explore our diverse range of categories to find the perfect course for your needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <Link to={`/category/${category.name.toLowerCase()}`} key={index}>
                <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center">
                  <div className="inline-block p-3 rounded-full bg-indigo-100 mb-4">
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-gray-600">{category.count} courses</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      <section className="relative isolate overflow-hidden bg-white px-6 py-24 sm:py-32 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),white)] opacity-20"></div>
        <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-white shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-50 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center"></div>
        <div className="mx-auto max-w-2xl lg:max-w-4xl">
          <div className='text-center'><span className='font-semibold text-xl'>YouLearn</span></div>
          <figure className="mt-10">
            <blockquote className="text-center text-xl/8 font-semibold text-gray-900 sm:text-2xl/9">
              <p>"All the skills you need in one place."</p>
              <span>From critical skills to technical topics, YouLearn supports your professional development.</span>
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
      
      <section className="bg-indigo-600 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">YouLearn by the Numbers</h2>
            <p className="mt-4 text-indigo-100 max-w-2xl mx-auto">
              Join our global community of learners and instructors
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="p-6">
                <p className="text-4xl font-bold text-white mb-2">{stat.value}</p>
                <p className="text-indigo-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl p-8 md:p-12 shadow-xl">
            <div className="md:flex items-center justify-between">
              <div className="md:w-2/3 mb-6 md:mb-0">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Ready to start learning?</h2>
                <p className="text-indigo-100">
                  Join thousands of students already learning on YouLearn. Get unlimited access to all courses.
                </p>
              </div>
              <div>
                <Link to="/signup">
                  <button className="w-full md:w-auto px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg shadow-md hover:bg-indigo-50 transition-colors">
                    Get Started
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </>
  )
}

export default Home