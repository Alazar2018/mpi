import { Link } from "react-router-dom";
import Button from "@/components/Button";
import DefaultPage from "@/components/DefaultPage";
import WeeklyLearnProgress from "@/components/WeeklyLearnProgress";

export default function Learn() {
  return (
    <DefaultPage showHeader={false} >
      <div className="grid grid-cols-3 gap-6 py-2">
        <div className="h-[4.75rem] px-6 py-3.5 bg-secondary text-white rounded-lg flex items-center justify-between">
          <span className="font-bold text-[32px]">3%</span>
          <span className="text-base leading-[150%]">Overall Progress</span>
        </div>
        <div className="h-[4.75rem] px-6 py-3.5 bg-gray-7 rounded-lg flex items-center justify-between">
          <span className="font-bold text-[32px]">1/8</span>
          <span className="text-base leading-[150%]">Weeks</span>
        </div>
        <div className="h-[4.75rem] px-6 py-3.5 bg-gray-7 rounded-lg flex items-center justify-between">
          <span className="font-bold text-[32px]">2/12</span>
          <span className="text-base leading-[150%]">Chapters</span>
        </div>
      </div>
      <div className="py-6 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <span>Weeks</span>
          <Button type="neutral">View All</Button>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {Array(8)
            .fill(1)
            .map((el, idx) => {
              return (
								<Link to={`${idx + 1}`} key={idx} >
									<WeeklyLearnProgress />
								</Link>
							)
            })}
        </div>
      </div>
    </DefaultPage>
  );
}
