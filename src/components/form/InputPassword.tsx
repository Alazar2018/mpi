import { required } from "@/utils/utils";
import Input from "./Input";
import { useState } from "react";
import icons from "@/utils/icons";

export default function InputPassword({name, label, validation}: {name?: string, label?: string | null, validation?: any}) {
  const [password, setPassword] = useState(true);
  return (
    <>
      <Input
				password={password}
        right={
          <div onClick={() => setPassword(!password)}  className="h-full w-6 grid place-items-center">
            <i dangerouslySetInnerHTML={{ __html: icons.eyeSlash }} />
          </div>
        }
        validation={{ required: required, ...(validation ?? {}) }}
        name={name ?? "password"}
        label={label ?? "Password"}
        placeholder="Enter Your Passwrod"
      />
    </>
  );
}
