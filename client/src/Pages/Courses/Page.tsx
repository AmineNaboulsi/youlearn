import { useEffect, useState ,useRef} from 'react';
import HeaderDashborad from '../../Components/Nav/HeaderDashborad'
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Select from 'react-select'
import { useNavigate } from 'react-router';
import Cookies from 'js-cookie'
type TagType = {
  id: number,
  title: string
}
type CategorieType = {
  id : number,
  name : string
}

function Page() {
  const [value, setValue] = useState('');
  
  const navigate = useNavigate();
  const [CourseSelected, setCourseSelected] = useState();
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCategorie, setSelectedCategorie] = useState();
  const [ModeAdding , isModeAdding] = useState(true);
  const [isVideo, setisVideo] = useState(false);
    const [optionsCategorie , setoptionsCategorie] = useState<{ value: number; label: string }[]>([]);
    const [optionsTag , setoptionsTag] = useState<{ value: number; label: string }[]>([]);

    const FetchCategories = async() =>{
      const url = import.meta.env.VITE_APP_URL;
      const res = await fetch(`${url}/getcategories`);
      const data = await res.json();
      const mappedCategories = data.map((category: CategorieType) => ({
        value: category.id,
        label: category.name,
      }));
      setoptionsCategorie(mappedCategories);
    }

    const FetchTags = async() =>{
      const url = import.meta.env.VITE_APP_URL;
      const res = await fetch(`${url}/gettags`);
      const data = await res.json();
      const mappedTags = data.map((tag: TagType) => ({
        value: tag.id,
        label: tag.title,
      }));
      setoptionsTag(mappedTags);
    }
    const FetchCourseData = async() =>{
      const queryParams = new URLSearchParams(window.location.search)
      const id = queryParams.get("id")
      if(id){
        isModeAdding(false)
        const url = import.meta.env.VITE_APP_URL;
        const res = await fetch(`${url}/getcourses?id=${id}`);
        const data = await res.json();
        if(data){
          setCourseSelected(data)
          setValue(data?.description)
          setSelectedTags(data?.tags)
          setSelectedCategorie(data?.cat_id)
        }else{
          navigate('/dashborad')
          return;
        }
      }else{
        isModeAdding(true)
      }
     
    }
      useEffect(()=>{

        FetchCourseData();
        FetchTags();
        FetchCategories();
      },[])
      const customStyles = {
        menu: (provided: any) => ({
          ...provided,
          overflowY: 'auto', 
        }),
      };
      const handleChangeTags = (selectedOptions) => {
        setSelectedTags(selectedOptions); 
        
      };
      const handleChangeCategorie = (selctedCategories) =>{
        setSelectedCategorie(selctedCategories?.value)
      }
      const OnSubmitCourse = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if(ModeAdding){
          AddCourse();
        }else{
          //
        }
      };
    const AddCourse = async() =>{
      if (formRef.current) {
        const formData = new FormData(formRef.current);
        const data: Record<string, string> = {};
        formData.forEach((value, key) => {
          data[key] = value.toString();
        });
        const file = formData.get("fileupload") as File | null;
        if (file.size==0) {
          alert("Please select a file to upload.");
          return;
        }
        const newCourse = {
          title : ""+data.title ,
          description : value  ,
          category : selectedCategorie  ,
          content : ""+data.content  ,
          tags : selectedTags.map((tag)=>({ id :tag.value })) ,
        }
        const url = import.meta.env.VITE_APP_URL;
        const token = Cookies.get('auth-token')
        const res = await fetch(`${url}/addcourse`,{
            method : 'POST',
            body : JSON.stringify(newCourse),
            headers :
            {
                Authorization : `Bearer ${token}`
            }
        });
        const response = await res.json();
        console.log(response);
      }
    } 
  return (
    <div className='h-full'>
      <HeaderDashborad />
      <section className='bg-gray-100 h-full '>
        <div className="container">
        <form ref={formRef} method='POST' onSubmit={OnSubmitCourse}>
              <h2 className="text-base/7 font-semibold text-gray-900">New Course </h2>
              <p className="mt-1 text-sm/6 text-gray-600">This information will be displayed publicly so be careful what you share.</p>
            <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-3 h-auto">
                     <div className="bg-white p-3 rounded-md">
                        <div className="sm:col-span-1 mt-4">
                          <label  className="block text-sm/6 font-medium text-gray-900">Title</label>
                          <div className="mt-2">
                            <input type="text" placeholder='Title' required name="title" value={CourseSelected?.title} className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
                          </div>
                        </div>

                        <div className="sm:col-span-2 mt-4">
                          <label  className="block text-sm/6 font-medium text-gray-900">Sub Title</label>
                          <div className="mt-2">
                            <input type="text" placeholder='Subtitle' required name="subtitle" value={CourseSelected?.subtitle} className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
                          </div>
                        </div>

                        <div className="sm:col-span-2 mt-4">
                          <label  className="block text-sm/6 font-medium text-gray-900">Category</label>
                          {(   ModeAdding || (optionsCategorie.length > 0 && CourseSelected)  ) && (
                                    <Select
                                      styles={customStyles}
                                      defaultValue={optionsCategorie.find(option => option.label === CourseSelected?.Categorie)}
                                      onChange={handleChangeCategorie}
                                      options={optionsCategorie}
                                    />
                                  )}

                        </div>
                        <div className="sm:col-span-2 mt-4">
                          <label  className="block text-sm/6 font-medium text-gray-900">Tags</label>
                          {optionsTag.length > 0 && (
                              <Select
                                styles={customStyles}
                                isMulti
                                defaultValue={CourseSelected?.tags.map((tag: TagType) => ({
                                  value: tag.id,
                                  label: tag.title,
                                }))}
                                onChange={handleChangeTags}
                                options={optionsTag}
                              />)}
                          </div>
                     </div>
                     <div className="bg-white p-3 rounded-md">
                        <div className="sm:col-span-2 mt-4">
                          <div className="">
                          <div className="relative flex justify-between items-center  gap-4 mt-6 rounded-md ">
                                  <label  className="block text-sm/6 font-medium text-gray-900">Content</label>
                                    <div className="relative grid grid-cols-2">
                                        <div className={`absolute h-full transition-all ${isVideo ? 'left-0':'left-[50%]' }  w-[50%] bg-blue-300 rounded-md`}></div>
                                        <div 
                                        onClick={()=>{
                                          setisVideo(true)
                                            }}
                                        className="z-[0] flex justify-center py-0 px-5  cursor-pointer">
                                            <span>Video</span>  
                                        </div>
                                        <div 
                                        onClick={()=>{setisVideo(false)
                                        }}
                                        className="z-[0] flex justify-center py-0 px-5  cursor-pointer">
                                            <span>Document</span>  
                                        </div> 
                                    </div>
                                  </div>
                          </div>
                              <div className="mt-2">
                                <input type="text" name="content" required placeholder='URL' className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
                              </div>
                        </div>
                     </div>
                     <div className="mt-0 flex items-center justify-between gap-x-6">
                      <div className="">
                      <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 px-4 py-2" role="alert">
                            <p className="font-bold text-md">Warning</p>
                            <p className='text-xs'>Missing parametres. Fill all required text fields</p>
                          </div>           
                      </div>
                      <div className="flex items-center justify-between gap-x-6">
                        <button type="button" className="text-sm/6 font-semibold text-gray-900">Cancel</button>
                        <button className="flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                              <div className="">
                                <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" className="animate-spin text-center justify-self-center will-change-transform" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                              </div>
                              <span>Save</span>
                      </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                      <div className="bg-white p-3 rounded-md">
                          <label className="block text-sm/6 font-medium text-gray-900">Description</label>
                          <ReactQuill
                              className='w-full  mt-2'
                              theme="snow" 
                              value={value}
                              onChange={setValue}
                              placeholder="Start typing here..."
                            />
                        </div>
                        <div className="bg-white p-3 rounded-md">
                        <div className="">
                              <label  className="block text-sm/6 font-medium text-gray-900">Cover Course</label>
                              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                                <div className="text-center">
                                  <svg className="mx-auto size-12 text-gray-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" data-slot="icon">
                                    <path fill-rule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clip-rule="evenodd" />
                                  </svg>
                                  <div className="mt-4 flex text-sm/6 text-gray-600">
                                    <label  className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500">
                                      <span>Upload a file</span>
                                      <input name="fileupload" type="file" className="sr-only" />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                  </div>
                                  <p className="text-xs/5 text-gray-600">PNG, JPG, GIF up to 10MB</p>
                                </div>
                              </div>
                        </div>
                        </div>
                  </div>
            </div>
      

           
          </form>
        </div>
      </section>
    </div>
  )
}

export default Page