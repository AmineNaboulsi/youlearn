import { useEffect , useState } from 'react'
import Header from '../Components/Nav/Header'
import { useNavigate } from 'react-router';
function Course() {
  const [Course , setCourse] = useState();
  const navigate = useNavigate()

    useEffect(()=>{
      const CheckCourse = async() =>{
        const queryParams = new URLSearchParams(window.location.search)
        const id = queryParams.get("id")
        if(id){
          const url = import.meta.env.VITE_APP_URL;
          const res = await fetch(`${url}/getcourses?id=${id}`);
          const data = await res.json();
          if(data){
            setCourse(data)
          }else{
            navigate('/courses')
            return;
          }
        }else{
          // isModeAdding(true)
        }
        
      }
      CheckCourse()
    },[])
  return (
    <div>
      <Header />
      <div className="container flex justify-center mt-10">
          {Course ? 
            <>
              <iframe width="560" height="315" src={Course.content} title="video player" q allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
            </>
          : <>
          </>}
      </div>
      
    </div>
  )
}

export default Course