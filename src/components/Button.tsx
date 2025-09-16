import icons from "@/utils/icons";

const style = {
  primary: "bg-primary text-white hover:bg-primary/90",
  secondary: "border border-primary text-[var(--text-primary)] hover:bg-primary/10",
  action: "bg-secondary text-white justify-center hover:bg-secondary/90",
  neutral: "rounded-full bg-[var(--bg-tertiary)] border-0 text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/80",
  danger: `rounded-full bg-danger text-white hover:bg-danger/90`,
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
  disabled = false,
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
  disabled?: boolean;
}) {
  return (
    <button
      name={name ?? ""}
      {...(onClick && !disabled ? { onClick } : {})}
      tabIndex={tabIndex}
      disabled={disabled}
      className={`relative overflow-hidden rounded-lg flex items-center gap-4 text-left h-11 px-8 py-2.5 ${style[type]} ${btnSize[size]} ${className} transition-all duration-300 ${
        disabled 
          ? 'cursor-not-allowed opacity-50' 
          : 'cursor-pointer'
      }`}
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
