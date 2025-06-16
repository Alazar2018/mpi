import Button from "@/components/Button";
import { useProfileForm } from "@/context/profile_context";
import icons from "@/utils/icons";

export default function CreateProfile() {
  const form = useProfileForm();

  return (
    <div className="flex relative flex-col isolate rounded-[20px] bg-white ">
      <div className="absolute h-20 z-20 w-full px-9 flex justify-between items-center gap-4">
        {
          <Button
            className={`${form?.active == "role" ? "invisible" : ""}`}
            onClick={form?.prev}
            type="neutral"
          >
            <i dangerouslySetInnerHTML={{ __html: icons.back }} />
          </Button>
        }
        <div className="ml-auto flex justify-between items-center gap-4">
          {form?.components.map((el) => {
            return (
              <div
                onClick={() => form?.setActive?.(el.name)}
                key={el.name}
                className={`cursor-pointer rounded-xl h-[5px] ${
                  form?.active == el.name ? "bg-secondary w-8" : "bg-gray-6 w-4"
                }`}
              ></div>
            );
          })}
        </div>
      </div>
      {form?.component}
    </div>
  );
}
