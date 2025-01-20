
function PanelStatistics() {
  return (
    <div className="p-3">
        <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border-[1px] border-gray-200 flex flex-col gap-2 px-8 py-3 rounded-md">
                <span className="text-md">Total Enrolls</span>
                <span className="font-bold text-xl">15246</span>
            </div>
            <div className="bg-white border-[1px] border-gray-200 flex flex-col gap-2 px-8 py-3 rounded-md">
                <span className="text-md">Total Courses</span>
                <span className="font-bold text-xl">15246</span>
            </div>
            <div className="bg-white border-[1px] border-gray-200 flex flex-col gap-2 px-8 py-3 rounded-md">
                <span className="text-md">Avg Enroll per Course</span>
                <span className="font-bold text-xl">15246</span>
            </div>
        </div>
    </div>
  )
}

export default PanelStatistics