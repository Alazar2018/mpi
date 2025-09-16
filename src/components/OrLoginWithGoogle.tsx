import type React from "react";
import Button from "./Button";
import icons from "@/utils/icons";

export default function OrLoginWithGoogle(props: {children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <span className="center-line text-xs text-gray-500 text-center">
        <span>or</span>
      </span>
      {props?.children ?? null}
      <Button 
        icon={icons.google} 
        type="secondary"
        className="!bg-[#EEF0FF] text-[#4E5969] !justify-center border border-gray-200 hover:!bg-[#E0E4F0] hover:!border-gray-300 transition-all duration-300"
      >
        Register with Google
      </Button>
    </div>
  );
}
