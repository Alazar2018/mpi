import type { Match } from "@/interface";
import { formatTime, secondDateFormat } from "@/utils/utils";

export default function Versus({match}: {match: Match}) {
	return (
		<div className="rounded-[1.5rem] bg-gray-1 p-4 grid gap-2 grid-cols-8" >
			<div className="col-span-3 flex-col gap-3 bg-white rounded-2xl p-4 card-shadow flex justify-center items-center" >
				<div className="size-10 rounded-full bg-gray-200" >
					<img className="max-w-full h-full w-full rounded-full" src={match.p1?.avatar} />
				</div>
				<div className="flex flex-col items-center " >
					<span className="font-bold text-xs" >{match.p1?.firstName} {match.p1?.lastName}</span>
					<span className="text-xs text-gray-2" >USDTA : 19</span>
				</div>
			</div>
			<div className="col-span-2 flex-col gap-3 bg-white rounded-2xl p-4 card-shadow flex justify-center items-center" >
				<span className="text-xs text-gray-2" >{secondDateFormat(match?.date)}</span>
				<div className="size-8 text-white grid place-items-center text-xs font-bold rounded-full bg-secondary" >
					VS
				</div>
				<span className="bg-green-2 text-xs px-2 rounded-full" >{formatTime(match?.date)}</span>
			</div>
			<div className="col-span-3 flex-col gap-3 bg-white rounded-2xl p-4 card-shadow flex justify-center items-center" >
				<div className="size-10 rounded-full bg-gray-200" ></div>
				<div className="flex flex-col items-center " >
					<span className="font-bold text-xs" >{match?.p2Name}</span>
					<span className="text-xs text-gray-2" >USDTA : 19</span>
				</div>
			</div>
		</div>
	)
}