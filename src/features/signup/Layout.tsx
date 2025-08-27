import { Outlet } from "react-router";

export default function AccountLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:grid lg:grid-cols-5">
      {/* Background Image Section - Hidden on mobile, visible on large screens */}
      <div
        style={{
          backgroundImage: 'url("/bg-image.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        className="hidden lg:block relative col-span-3 min-h-[400px] lg:min-h-screen"
      >
        <div
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(30, 30, 30, 0) 0%, rgba(30, 30, 30, 0.7) 47.6%)",
          }}
          className="absolute flex justify-center items-end font-semibold text-2xl lg:text-4xl text-white py-8 lg:py-16 inset-0 px-4"
        >
          <span className="max-w-[25ch] text-center leading-relaxed">
            Champions keep playing until they get it right, not because it's easy,
            but because they refuse to quit.
          </span>
        </div>
      </div>
      
      {/* Form Section - Full width on mobile, 2 columns on large screens */}
      <div className="flex-1 lg:col-span-2 p-4 sm:p-6 lg:p-10 overflow-auto flex items-center justify-center">
        <Outlet />
      </div>
    </div>
  );
}
