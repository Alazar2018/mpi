import icons from "@/utils/icons";
import { useEffect, useRef } from "react";

export default function Messages() {
	const textarea = useRef<HTMLTextAreaElement>(null)
	const onInput = () => {
		const initHeight = 24
	console.log(initHeight * 10, textarea.current?.scrollHeight);
		
		if(textarea.current && textarea.current?.style && textarea.current.style?.height && initHeight * 5 > textarea.current?.scrollHeight ) {
			textarea.current.style.height = "auto"
			textarea.current.style.height = textarea.current?.scrollHeight + "px"
		}
	}

	useEffect(() => {
		const current = textarea.current;
		current?.addEventListener("input", onInput)
		return () => {
			current?.removeEventListener("input", onInput)
		}
	}, [])
	
	return (
		<div className="grid grid-cols-3 gap-4 min-h-[calc(100vh-237px)]" >
			<div className="col-span-1 p-4 bg-gray-7 rounded-2xl flex flex-col gap-4" >
				<div className="h-14 rounded-lgg bg-white p-4 flex items-center justify-between" >
					<span className="font-bold" >Messages</span>
					<button className="text-white grid place-items-center min-w-[18px] min-h-[18px] bg-secondary rounded-full" >
						<i className="*:w-2 :h-2" dangerouslySetInnerHTML={{__html: icons.plus}} />
					</button>
				</div>
				<div className="p-4 rounded-lgg flex-1 bg-white flex flex-col gap-6" >
					<div tabIndex={-1} className="sys-focus h-12 rounded-lgg bg-gray-7 flex px-3.5" >
						<input placeholder="Search messages" className='focus:shadow-none h-full w-full text-[13px]' />
						<button tabIndex={-1} >
							<i dangerouslySetInnerHTML={{__html: icons.search}} />
						</button>
					</div>
					<div className="flex flex-col gap-4" >
						<div tabIndex={0} className="relative rounded-lgg bg-white p-2 border-b border-gray-7 gap-4 flex items-center" >
							<div className="absolute right-1 top-2 bg-amber-50 text-[13px] opacity-30 size-5 grid place-items-center-safe" >
								1m
							</div>
							<div className="min-w-12 h-11 rounded-lg bg-gray-8" ></div>
							<div className="max-w-[calc(100%-5rem)] flex-1 flex flex-col justify-center">
								<span className="font-bold truncate" > Elmer Laverty</span>
								<span className="text-black/40 truncate" >Haha oh man 🔥</span>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="col-span-2 rounded-2xl overflow-hidden grid grid-cols-1 grid-rows-[76px_1fr_auto] h-full" >
				<div className="bg-gray-7 p-4 flex items-center justify-between" >
					<div className="flex gap-4 items-center justify-between" >
						<div className="size-10 bg-gray-4 rounded" ></div>
						<div className="" >
							<span className="font-bold leading-none" >Birhane Araya</span>
							<div className="flex gap-2 items-center leading-none" >
								<div className="size-2.5 bg-green-2 rounded-full" ></div>
								<span className="text-[13px] opacity-60" >Online</span>
							</div>
						</div>
					</div>
					<div className="bg-secondary px-4 py-2.5 text-white flex items-center gap-2 rounded-lg" >
						<i dangerouslySetInnerHTML={{__html: icons.call}} />
						<span>Call</span>
					</div>
				</div>
				<div className="" ></div>
				<div className="bg-gray-7 p-4 flex items-center justify-between" >
					<div className="grid w-full grid-cols-[46px_1fr] gap-2" >
						<button className="self-end min-h-[48px] grid bg-white place-items-center rounded-lgg" >
							<i dangerouslySetInnerHTML={{__html: icons.file}} />
						</button>
						<div className="bg-white rounded-lgg p-2 flex items-center gap-2 justify-between" >
							<div className="flex-1 flex items-center" >
								<textarea style={{height: '24px'}} ref={textarea} rows={1} placeholder="Type a message" className="font-bold placeholder:opacity-50 placeholder:font-normal w-full pl-5 focus:shadow-none resize-none " />
							</div>
							<button className="cursor-pointer min-w-10 max-h-[48px] self-end h-full grid place-items-center" >
								<i dangerouslySetInnerHTML={{__html: icons.send}} />
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}