import DefaultPage from "@components/DefaultPage.tsx";
import vsbg from "@/assets/vs-bg.png";
import icons from "@/utils/icons";
import { Outlet, useParams } from "react-router-dom";
import { useApiRequest } from "@/hooks/useApiRequest";
import { useEffect } from "react";
import { getMatchById } from "./api/matchs.api";
import MatchSkeleton from "@/components/skeletons/MatchSkeleton";
 

export default function MatchDetail() {
	const params = useParams()	
	const matchesReq = useApiRequest({
		cacheKey: "match_" + params?.matchId,
		freshDuration: 1000 * 60 * 5,
		staleWhileRevalidate: true,
	});
	
	useEffect(() => {
		if(!params?.matchId) return
		matchesReq.send(
			() => getMatchById(params.matchId as string),
			(res) => {
				if (res.success && res.data) {
					console.log(res.data);
				}
			}
		);
	}, [params]);
	
  return (
    <DefaultPage className="!p-6">
      <div className="h-[88px] rounded-2xl overflow-hidden skewed-bg">
        <i className="absolute-center z-30"  dangerouslySetInnerHTML={{ __html: icons.tennis }} />
        <img
          className="inset-0 object-cover absolute z-20 h-full  w-full  rounded-2xl  "
          src={vsbg}
          alt="versus"
        />
				<div className="absolute inset-0 z-50 grid grid-cols-2" >
					<div className="flex justify-end gap-5 items-center pr-14" >
						<div className='font-gor font-bold flex flex-col gap-0.5 items-end justify-center ' >
							<span className=" text-xl" >{matchesReq.response?.p1?.firstName} {matchesReq.response?.p1?.lastName}</span>
							<span className="text-xs" >USDTA : 19</span>
						</div>
						<div className="size-[54px] shadow-2xl rounded-full bg-gray-4" ></div>
					</div>
					<div className="flex gap-5 items-center pl-14" >
						<div className="size-[54px] shadow-2xl rounded-full bg-gray-4" ></div>
						<div className='font-gor text-white font-bold flex flex-col gap-0.5  justify-center ' >
							<span className=" text-xl" >{matchesReq.response?.p2?.firstName ?? matchesReq.response?.p2Name} {matchesReq.response?.p2?.lastName}</span>
							<span className="text-xs" >USDTA : 19</span>
						</div>
					</div>
				</div>
      </div>
			{
				matchesReq.pending ? <MatchSkeleton /> : <Outlet />
			}
    </DefaultPage>
  );
}
