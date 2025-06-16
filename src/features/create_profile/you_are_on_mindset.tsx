import Button from "@/components/Button";
import FormParent from "@/components/FormParent";
import LogoHeaderWithTitle from "@/components/LogoHeaderWithTitle";

export default function YouAreOnMindset() {
  return (
    <FormParent className="w-[40.625rem]">
      <LogoHeaderWithTitle
        title="You're on Mindset!"
        description="We've put together a quick assessment to help you kick things off right where you fit in."
      />
      <hr className="border-gray-6" />
      <div className="grid grid-cols-2 gap-9">
        <Button
          size="lg"
          type="neutral"
          className="!rounded-lg !justify-center"
        >
          Skip
        </Button>
        <Button size="lg" type="action">
          Take Assessment
        </Button>
      </div>
    </FormParent>
  );
}
