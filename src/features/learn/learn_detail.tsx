import { useNavigate, useParams } from "react-router";
import Button from "@/components/Button";
import DefaultPage from "@/components/DefaultPage";
import icons from "@/utils/icons";

export default function LearnDetail() {
  const params = useParams();
	const navigate = useNavigate()
  return (
    <DefaultPage className="!py-6" title={`Week ${params?.week}`} >
      <div className="grid grid-cols-3 py-6 gap-2.5">
        <div className="relative col-span-2 h-[35.25rem]">
          <img
            src="/stuff.jpg"
            className="max-w-full h-full w-full object-cover rounded-lg"
          />
          <div className="absolute inset-0 grid place-items-center">
            <Button
              type="action"
              className="!h-[62px] !w-[158px] bg-secondary/65 rounded-full"
            >
              <i dangerouslySetInnerHTML={{ __html: icons.start }} />
            </Button>
          </div>
        </div>
        <div className="bg-blue-1 p-4 flex flex-col gap-4">
          <span>Playlist</span>
          <div className="bg-white flex flex-col gap-4 p-4 rounded-[10px]">
            <div className="h-[52px] bg-gray-7 rounded-lg flex items-center justify-between py-2 px-3">
              <div className="h-full flex items-center gap-2">
                <div className="h-full w-6 grid place-items-center bg-white rounded-md">
                  <span className="text-xs">1</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-primary leading-none">
                    Chapter 1
                  </span>
                  <span className="text-[10px] text-gray-8 leading-none">
                    02:52
                  </span>
                </div>
              </div>
              <div className="size-5 rounded-full grid place-items-center">
                <i
                  className="*:size-5"
                  dangerouslySetInnerHTML={{ __html: icons.check }}
                />
              </div>
            </div>
            <div className="h-[52px] bg-gray-7 rounded-lg flex items-center justify-between py-2 px-3">
              <div className="h-full flex items-center gap-2">
                <div className="h-full w-6 grid place-items-center bg-white rounded-md">
                  <span className="text-xs">?</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-primary leading-none">
                    Assessment
                  </span>
                  <span className="text-[10px] text-gray-8 leading-none">
                    Questions
                  </span>
                </div>
              </div>
              <div className="size-5 rounded-full grid place-items-center">
                <i
                  className="*:size-5"
                  dangerouslySetInnerHTML={{ __html: icons.check }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-4">
        <div className="p-4 flex justify-between border border-gray-7 rounded-[10px]">
          <span>Week {params?.week}: Mindfulness Unleashed</span>
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[13px] rounded-md py-2 px-3.5 bg-gray-7">
                4/5{" "}
                <i
                  className="*:size-3"
                  dangerouslySetInnerHTML={{ __html: icons.star }}
                />
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[13px] rounded-md py-2 px-3.5 bg-gray-7">
                40,000
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[13px] rounded-md py-2 px-3.5 bg-gray-7">
                English
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[13px] rounded-md py-2 px-3.5 bg-gray-7">
                4 Lessons (1Hr 30Min)
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-blue-1 flex flex-col gap-3 col-span-2 rounded-[10px] p-4">
            <span>Introduction</span>
            <p className="text-xs text-gray-2">
              The awareness that emerges through paying attention on purpose, in
              the present moment, and nonjudgmentally to the unfolding of
              experience moment by moment.” (Kabat-Zinn, 2003, p. 145). This
              definition underlines three central elements: awareness,
              non-judgmental, and acceptance. Curious about how mindfulness
              boosts performance? Imagine the power of staying fully present and
              noticing your inner and outer world, free from judgment. Your
              ability to stay attuned helps you deploy your attention where you
              want it and minimize mind wandering. For example, noticing one’s
              thoughts before a match, without labeling them as good or bad,
              simply noticing (Henriksen et al., 2019) can help you stay engaged
              in task-relevant cues. If mindfulness is paying attention to the
              inner and outer world moment by moment, what are the examples of
              mindlessness? Here are examples of mindlessness. Rushing through
              activities without being attentive to them. For example, going
              through the motion with your pre-match, between points, change
              over, and post-match routines. Bouncing the ball on your feet
              while going through serve rituals. Breaking or spilling things
              because of carelessness, inattention, or thinking of something
              else. Failing to notice subtle feelings of physical tension or
              discomfort. Forgetting a person’s name almost as soon as we have
              heard it. Finding ourselves preoccupied with the future or the
              past. Snacking without being aware of... Read More.
            </p>
          </div>
          <div className="self-start p-4 border border-gray-7 rounded-[10px] gap-3 flex flex-col">
            <span>Resources </span>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-2">
                  Definition underlines elements...pdf
                </span>
                <button className="size-5 grid place-items-center">
                  <i dangerouslySetInnerHTML={{ __html: icons.arrowDown }} />
                </button>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-2">
                  Mindfulness is paying attention.pt
                </span>
                <button className="size-5 grid place-items-center">
                  <i dangerouslySetInnerHTML={{ __html: icons.arrowDown }} />
                </button>
              </div>
              <span className="text-xs underline italic">
                Link to a webpage/blog
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 rounded-[10px] border border-gray-7 flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <div className="size-11 bg-secondary rounded-full"></div>
          <div className="flex flex-col justify-center">
            <span className="font-bold leading-none">Damian</span>
            <span className="text-sm text-gray-2">Instructor</span>
          </div>
        </div>
        <p className="text-gray-2 text-sm">
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Labore saepe
          assumenda odio voluptates dolore accusamus, delectus illum eligendi
          dolor voluptatum quis suscipit rerum dolores, cupiditate cum repellat
          architecto? Perferendis, dignissimos.
        </p>
      </div>
      <div className="p-6 rounded-[10px] border border-gray-7 flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <button className="px-6 py-[5px] text-white bg-secondary rounded-md">
            FAQs
          </button>
          <button className="px-6 py-[5px] rounded-md">Reviews</button>
        </div>
				<div className="pl-5 text-gray-2 text-sm mt-4">
					<ul className="list-disc" >
						<li>Lorem ipsum dolor sit amet?</li>
						<li>Consectetur adipisicing elit?</li>
						<li>Labore saepe assumenda odio voluptates dolore accusamus?</li>
						<li>Delectus illum eligendi dolor voluptatum quis suscipit rerum dolores?</li>
						<li>Cupiditate cum repellat architecto? Perferendis, dignissimos?</li>
					</ul>
				</div>
      </div>
    </DefaultPage>
  );
}
