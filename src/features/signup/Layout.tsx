import { Outlet } from "react-router";

export default function AccountLayout() {
  return (
    <div
      className="bg-gray-5 grid grid-cols-5 w-full h-full">
      <div
        style={{
          backgroundImage: 'url("/bg-image.jpg")',
          backgroundSize: '180%'
        }}
        className="relative bg-right bg-no-repeat col-span-3"
      >
        <div
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(30, 30, 30, 0) 0%, rgba(30, 30, 30, 0.7) 47.6%)",
          }}
          className="absolute flex justify-center items-end font-semibold text-4xl text-white py-16 inset-0"
        >
          <span className="max-w-[25ch] text-center" >
          Champions keep playing until they get it right, not because it's easy,
          but because they refuse to quit.
          </span>
        </div>
      </div>
      <div className="col-span-2 p-10 overflow-auto grid place-items-center">
        <Outlet />
      </div>
    </div>
  );
}
