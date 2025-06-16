import icons from "@/utils/icons";
import Button from "./Button";

export default function WeeklyLearnProgress() {
  return (
    <div className="hover:bg-green-0.5 flex flex-col gap-4 p-6 rounded-lg border border-gray-7">
      <div className="border-gray-6 border-b pb-2 flex justify-between items-center w-full">
        <span className="text-base font-bold">Week 1</span>
        <span className="text-xs text-gray-2">4 Lessons (1Hr 30Min)</span>
      </div>
      <span className="text-sm text-gray-2">Mindfulness unleashed </span>
      <div className="h-[6px] rounded-full bg-gray-7"></div>
      <div className="flex gap-2">
        <div className="max-w-max flex gap-2 justify-center items-center bg-gray-5 truncate text-[13px] rounded-lg px-2 py-1">
          4/5 <i className="*:size-2" dangerouslySetInnerHTML={{__html: icons.star}} />
        </div>
        <Button
          className="!h-[30px] !flex-1 justify-center !rounded font-bold !text-[13px]"
          type="action"
        >
          Open Course
        </Button>
      </div>
    </div>
  );
}
