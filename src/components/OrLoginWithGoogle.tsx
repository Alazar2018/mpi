import type React from "react";
import Button from "./Button";
import icons from "@/utils/icons";

export default function OrLoginWithGoogle(props: {children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <span className="center-line text-xs text-gray-4 text-center">
        <span>or</span>
      </span>
      {props?.children ?? null}
      <Button icon={icons.google} className="!bg-blue-9 text-white !justify-center">
        Register with Google
      </Button>
    </div>
  );
}
