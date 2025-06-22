import { useEffect, useRef } from "react";

export default function ResizableTextArea({onChange, ref}: {ref?: React.RefObject<HTMLTextAreaElement | null>, onChange?: (ev: Event) => void}) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const onInput = () => {
    const initHeight = 24;

    if (
      textarea.current &&
      textarea.current?.style &&
      textarea.current.style?.height &&
      initHeight * 5 > textarea.current?.scrollHeight
    ) {
      textarea.current.style.height = "auto";
      textarea.current.style.height = textarea.current?.scrollHeight + "px";
    }
  };

  useEffect(() => {
    const current = textarea.current;
    if(ref && current){
      ref.current = current;
    }

    current?.addEventListener("input", onInput);
    if(onChange){
      current?.addEventListener("input", onChange);
    }
    return () => {
      current?.removeEventListener("input", onInput);
      if(onChange){
        current?.removeEventListener("input", onChange);
      }
    };
  }, []);
	
  return (
    <textarea
      style={{ height: "24px" }}
      ref={textarea}
      rows={1}
      placeholder="Type a message"
      className="font-bold placeholder:opacity-50 placeholder:font-normal w-full pl-5 focus:shadow-none resize-none "
    />
  );
}
