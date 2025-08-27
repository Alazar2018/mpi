import { useState, useEffect } from "react";
import Button from "@/components/Button";
import FormParent from "@/components/FormParent";
import LogoHeaderWithTitle from "@/components/LogoHeaderWithTitle";
import { useProfileForm } from "@/context/profile_context";
import icons from "@/utils/icons";

export default function CreateRole() {
    const form = useProfileForm();
    const [selected, setSelected] = useState(form?.values?.role || "player");

    useEffect(() => {
        if (form?.values?.role) {
            setSelected(form.values.role);
        }
    }, [form?.values?.role]);

    function setRole() {
        if (form) {
            form.setFormValue("role", selected);
            form.next();
        }
    }

    return (
        <FormParent className="w-full max-w-md mx-auto">
            <LogoHeaderWithTitle
                title="What is your role?"
                description="Choosing a role helps us create the best in-app experience for users."
            />
            <hr className="w-32 mx-auto border-gray-6" />
            <div className="grid grid-cols-2 gap-4">
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
                            className={`cursor-pointer flex justify-center items-center gap-3 h-16 rounded-lg capitalize text-lg transition-all duration-200 ${
                                selected == el.name ? "bg-green-2 shadow-lg" : "bg-gray-7 hover:bg-gray-6"
                            }`}
                        >
                            <i
                                className="w-5 h-5"
                                dangerouslySetInnerHTML={{ __html: el.icon }}
                            />
                            <span>{el.name}</span>
                        </div>
                    );
                })}
            </div>
            <hr className="border-gray-6" />
            <Button onClick={setRole} type="action" size="lg" className="w-full">
                Continue
            </Button>
        </FormParent>
    );
}