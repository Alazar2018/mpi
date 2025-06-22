/* eslint-disable @typescript-eslint/no-explicit-any */
import { debounce } from "@/utils/utils";
import { useEffect, useRef, useState, type MouseEvent } from "react";

export default function StickyDate({ date }: { date: string }) {
  const dateRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (!dateRef.current) return;

    let to: number;
    const y = (window as any).chatwrapper.getBoundingClientRect().y;
    const handler = debounce((ev: MouseEvent) => {
      setShow(true);
      const rect = dateRef.current?.getBoundingClientRect();
      const range = Math.round(rect?.y) - Math.round(y);

      if (range < 10 && range > -25) {
        if (to) clearTimeout(to);
        to = setTimeout(() => {
          setShow(false);
        }, 800);
      } else {
        setShow(true);
      }
    });
		
		((window as any).chatwrapper as HTMLDivElement).addEventListener(
      "scroll",
      handler
    );

		handler()
    return () => {
      ((window as any).chatwrapper as HTMLDivElement)?.removeEventListener?.(
        "scroll",
        handler
      );
    };
  }, [date]);
  return (
    <div
      ref={dateRef}
      className="sticky w-full h-7 flex items-center justify-center  text-center top-[-1px]"
    >
      {show && (
        <span className="text-xs rounded-full bg-green-9/20 shadow-2xs text-white px-3 font-bold py-1 ">
          {date}
        </span>
      )}
    </div>
  );
}
