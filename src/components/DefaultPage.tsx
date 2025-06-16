import { useNavigate } from "react-router";
import icons from "@/utils/icons";

export default function DefaultPage({
	rightAction,
  title,
  children,
  className,
  showHeader = true
}: {
  showHeader?: boolean,
  title?: string;
  className?: string;
  children: React.ReactNode;
  rightAction?: React.ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <div
      className={`flex flex-col gap-4 bg-white rounded-3xl p-4 px-6 ${className}`}
    >
      {
        showHeader &&
        <div
          className="flex items-center justify-between gap-2"
        >
          <div onClick={() => navigate(-1)} className="flex items-center gap-2">
            <i dangerouslySetInnerHTML={{ __html: icons.back }} />
            {title && <span>{title}</span>}
          </div>
          {
            rightAction && <>{rightAction}</>
          }
        </div>
      }
      {children}
    </div>
  );
}
