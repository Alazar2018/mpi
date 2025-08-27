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
      className={`relative isolate w-full p-6 sm:p-8 bg-white rounded-[20px] flex flex-col gap-6 sm:gap-8 max-h-[90vh] overflow-y-auto ${className}`}>
      <img src='/shape.png' className="absolute top-0 left-1/2 -translate-x-1/2 -z-10"/>
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
