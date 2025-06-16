import { Link } from "react-router-dom";
import Button from "@/components/Button";
import PlayersCard from "@/components/PlayersCard";
import icons from "@/utils/icons";


export default function Players() {
  return (
    <>
      <div className="relative isolate rounded-2xl overflow-hidden min-h-[13.5rem] max-h-[13.5rem]">
        <div className="absolute pb-4 bg-primary/60 inset-0 flex flex-col justify-end gap-4 items-center">
          <span className="font-bold text-xl text-white">
            Invite new player via email
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center w-80 bg-white rounded-full pr-3">
              <input
                placeholder="Enter Email"
                className="w-full placeholder:text-gray-3 text-xs pl-3 h-[2.375rem] bg-white rounded-full"
              />
              <div className="grid place-items-center">
                <i dangerouslySetInnerHTML={{ __html: icons.mail }} />
              </div>
            </div>
            <Button className="bg-white rounded-full !h-10">Invite</Button>
          </div>
        </div>
        <img
          src="/stuff.jpg"
          className="max-w-full object-cover w-full h-full"
        />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="rounded-3xl flex flex-col gap-4 p-4 px-6 bg-white col-span-2">
          <span>Your Players</span>
          <div
            className="rounded-3xl  grid grid-cols-3 gap-4
					 bg-white"
          >
            {Array(3)
              .fill(1)
              .map((el, idx) => {
                return (
                  <Link to={`detail/${idx + 1}`} key={idx}>
                    <PlayersCard />
                  </Link>
                );
              })}
          </div>
        </div>
        <div className="rounded-3xl flex flex-col gap-4 p-4 px-6 bg-white">
          <span className="font-bold text-base">Recent Invitations</span>
          <div className="flex flex-col gap-4">
            {Array(3)
              .fill(1)
              .map((el, idx) => {
                return <PlayersCard key={idx} />;
              })}
          </div>
        </div>
      </div>
    </>
  );
}
