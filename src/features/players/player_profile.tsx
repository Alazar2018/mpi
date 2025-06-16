export default function PlayerProfile() {
	return (
		<>
			<div className="grid grid-cols-2 gap- border-t pt-8 border-gray-1 gap-6" >
					<span className="col-span-2" >Parents</span>
					{
						Array(2).fill(1).map((el, idx) => {
							return (
								<div key={idx} className="flex gap-4 rounded-[1.25rem] p-4 border border-green-0.5" >
									<div className="size-12 rounded-full bg-gray-200" ></div>
									<div className="flex flex-col justify-center" >
										<span className="text-base" >Araya Mebrahtu</span>
										<span className="text-gray-2 text-xs" >arayamebrahtu@gmail.com</span>
									</div>
								</div>
							)
						})
					}
				</div>
				<div className="grid grid-cols-3 gap- border-t pt-8 border-gray-1 gap-6" >
					<span className="col-span-3" >Coaches</span>
					{
						Array(3).fill(1).map((el, idx) => {
							return (
								<div key={idx} className="flex gap-4 rounded-[1.25rem] p-4 border border-green-0.5" >
									<div className="size-12 rounded-full bg-gray-200" ></div>
									<div className="flex flex-col justify-center" >
										<span className="text-base" >Araya Mebrahtu</span>
										<span className="text-gray-2 text-xs" >arayamebrahtu@gmail.com</span>
									</div>
								</div>
							)
						})
					}
				</div>	
		</>
	)
}