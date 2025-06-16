import icons from "@/utils/icons";

const style = {
  primary: "bg-primary text-white",
  secondary: "border border-primary",
  action: "bg-secondary text-white justify-center",
  neutral: "rounded-full bg-gray-1 border-0",
  danger: `rounded-full bg-danger text-white`,
  none: "",
};

const btnSize = {
  lg: `h-16 text-xl !font-normal`,
  xs: "bg-primary text-white",
  secondary: "border border-primary",
  none: "",
};

export default function Button({
  onClick,
  name,
  pending = false,
  icon = "",
  type = "secondary",
  className = "",
  size = "none",
  children,
  tabIndex = 0,
}: {
  onClick?: (ev: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  name?: string;
  icon?: string;
  pending?: boolean;
  size?: keyof typeof btnSize;
  type?: keyof typeof style;
  tabIndex?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      name={name ?? ""}
      {...(onClick ? { onClick } : {})}
      tabIndex={tabIndex}
      className={`relative overflow-hidden rounded-lg cursor-pointer flex items-center gap-4 text-left h-11 px-8 py-2.5 ${style[type]} ${btnSize[size]} ${className}`}
    >
      {pending && (
        <div className="absolute inset-0 backdrop-blur-md bg-inherit grid place-items-center">
          <i
            dangerouslySetInnerHTML={{ __html: icons.spinner }}
            className="animate-spin"
          />
        </div>
      )}
      {icon && <i dangerouslySetInnerHTML={{ __html: icon }} />}
      {children}
    </button>
  );
}
