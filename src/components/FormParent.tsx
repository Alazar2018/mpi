export default function FormParent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div 
      style={{
        boxShadow: "0px 16px 44px 0px rgba(0, 0, 0, 0.07)",
      }}
      className={`relative isolate w-full p-9 bg-white rounded-[20px] flex flex-col gap-[46px] ${className}`}>
      <img src='/shape.png' className="absolute top-0 left-1/2 -translate-x-1/2 -z-10"/>
      {children}
    </div>
  );
}
