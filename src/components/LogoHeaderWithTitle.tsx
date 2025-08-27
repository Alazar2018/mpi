export default function LogoHeaderWithTitle(props: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-8 sm:gap-12 lg:gap-16">
      <img src="/logo.png" className="max-w-full w-20 sm:w-24 lg:w-32" />      
      <div className="flex flex-col items-center gap-3 sm:gap-4 lg:gap-5 text-center">
        <span className="font-bold text-xl sm:text-2xl lg:text-3xl px-4">{props.title}</span>
        <span className="max-w-xs sm:max-w-md lg:max-w-lg text-sm sm:text-base text-gray-600 px-4 leading-relaxed">{props.description}</span>
      </div>
    </div>
  );
}
