import type { Match } from "@/interface";
import Button from "./Button";
import { formatTime, getAceCounts, secondDateFormat } from "@/utils/utils";

export default function MatchResultCard({match}: {match: Match}) {
	console.log(match);
	const aces = getAceCounts(match);

	return (
		<div className="flex flex-col gap-4 p-4 rounded-[1.5rem] border border-gray-1" >
			<div className="flex flex-col" >
				<span className="text-base font-bold" >{match?.p1?.firstName} VS {match?.p2?.firstName || match?.p2Name}</span>
				<span className="text-xs text-gray-2" >{secondDateFormat(match.date)} {formatTime(match.date)}</span>
			</div>
			<div className="flex items-center gap-4" >
				<div className="flex items-center gap-2" >
					<span className="text-xs text-gray-2" >Double Fault </span>
					<span className="text-xs text-gray-3">3-9 </span>
				</div>
				<div className="flex items-center gap-2" >
					<span className="text-xs text-gray-2" >Aces </span>
					<span className="text-xs text-gray-3">{aces.p1Aces}-{aces.p2Aces} </span>
				</div>
			</div>
			<div className="grid grid-cols-2 gap-1" >
				<div className="flex justify-center items-center bg-gray-5 truncate text-xs rounded-lg px-2 py-1" >
					6 – 3, 5 – 7, 6 – 4, 6 – 2
				</div>
				<Button className="!h-[30px] justify-center !rounded-lg font-bold !text-[13px]" type="action" >
					Result
				</Button>
			</div>
		</div>
	)
}