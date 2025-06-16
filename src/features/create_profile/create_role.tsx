import { useState } from "react";
import Button from "@/components/Button";
import FormParent from "@/components/FormParent";
import LogoHeaderWithTitle from "@/components/LogoHeaderWithTitle";
import { useProfileForm } from "@/context/profile_context";
import icons from "@/utils/icons";

export default function CreateRole() {
  const [selected, setSelected] = useState("player");
  const form = useProfileForm()
  function setRole() {
    form?.setFormValue?.("role", selected);
    form?.next?.();
  }

  return (
    <FormParent className="w-[30.5rem] p-[34px] gap-[34px]">
      <LogoHeaderWithTitle
        title="What is your role?"
        description="Choosing a role helps us create the best in-app experience for users."
      />
      <hr className="w-[218px] mx-auto border-gray-6" />
      <div className="grid grid-cols-2 gap-3.5">
        {[
          { name: "player", icon: icons.matchs },
          { name: "group", icon: icons.users },
          { name: "coach", icon: icons.coach },
          { name: "family", icon: icons.family },
        ].map((el) => {
          return (
            <div
              onClick={() => setSelected(el.name)}
              key={el.name}
              className={`cursor-pointer flex justify-center items-center gap-4 h-16 rounded-[10px] capitalize text-xl ${
                selected == el.name ? "bg-green-2" : "bg-gray-7"
              }`}
            >
              <i
                className="!*:size-4"
                dangerouslySetInnerHTML={{ __html: el.icon }}
              />
              <span>{el.name}</span>
            </div>
          );
        })}
      </div>
      <hr className="border-gray-6" />
      <Button onClick={setRole} type="action" size="lg">
        Continue
      </Button>
    </FormParent>
  );
}
