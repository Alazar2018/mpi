export default function LogoHeaderWithTitle(props: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-16">
      <img src="/logo.png" className="max-w-full w-[8rem]" />      
      <div className="flex flex-col items-center gap-5">
        <span className="font-bold text-2xl">{props.title}</span>
        <span className="w-[25.5625rem] text-center">{props.description}</span>
      </div>
    </div>
  );
}
