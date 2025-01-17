import { IoDocumentTextOutline } from "react-icons/io5";

type TagType = {
  id: number,
  title: string
}

type PropsType = {
  details : CourseType | undefined 
}
type CourseType = {
  id : number,
  title : string,
  subtitle : string,
  description : string,
  content : string,
  isprojected : boolean,
  img : string,
  cat_id : number,
  category : string,
  price : number
  contenttype: string | null,
  tags : []
}
function page({details}:PropsType) {
    return (
      <div className="px-4 h-[50vh] overflow-y-scroll">
         <div className="flex flex-col pb-3">
               {details?.img ? 
             <>
               <div className="bg-white h-[100%]">
                <img 
                 className="w-full h-full object-contain" 
                 src={details?.img}
                alt="" />
             </div>
             </>
             :
               <>
                  <div className="bg-white h-[100%] grid justify-center items-center ">
                 <IoDocumentTextOutline size={70} className='opacity-10' />
              </div>
              </>}
          </div>
        <div className="px-4 sm:px-0">
          <h3 className="text-base/7 font-semibold text-gray-900">{details?.title ?? 'NA'}</h3>
          <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">{details?.subtitle ?? 'NA'}.</p>
        </div>
        <div className="mt-6 border-t border-gray-100">
          <dl className="divide-y divide-gray-100">
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm/6 font-medium text-gray-900">Description</dt>
              <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{details?.description ?? 'NA'}</dd>
            </div>
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm/6 font-medium text-gray-900">Category</dt>
              <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{details?.category ?? 'NA'}</dd>
            </div>
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm/6 font-medium text-gray-900">Price</dt>
              <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{details?.price ? `$${details?.price}`: 'FREE'}</dd>
            </div>
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm/6 font-medium text-gray-900">Tags</dt>
              <dd className="mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0 flex flex-wrap gap-2">
                {details?.tags.map((tag:TagType) => (
                  <span className="border-2 px-3 rounded-md" key={tag?.id}>{tag?.title}</span>
                ))}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    )

  }
  
  export default page