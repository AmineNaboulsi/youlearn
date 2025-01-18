import { FaRegUser } from "react-icons/fa6";
import { IoIosNotificationsOutline } from "react-icons/io";

function BannerProfile() {
  return (
    <div className="">
        <section className='bg-white'>
            <div className="container px-10">
                <div className="relative h-[160px]">
                    <div className="absolute border-4 bg-white border-gray-300 w-auto -bottom-9 rounded-full">
                        <img className="h-36 w-36 object-cover rounded-full" src="https://plus.unsplash.com/premium_photo-1673866484792-c5a36a6c025e?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="" srcset="" />
                        {/* <FaRegUser className="h-12 w-12" /> */}
                    </div>
                    <div className="grid grid-cols-[1fr,auto] justify-end items-end h-full">
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col ml-44 justify-end h-full pb-2">
                                <span className="font-semibold text-2xl text-black">Amine Naboulsi</span>
                                <span className="font-normal text-md text-gray-500">naboulsiiamine@gmail.com</span>
                            </div>
                            <IoIosNotificationsOutline size={25} />
                        </div>
                    </div>
                   
                </div>
            </div>
        </section>
    </div>
  )
}

export default BannerProfile