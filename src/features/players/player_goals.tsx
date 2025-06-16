import Button from "@/components/Button";
import type { Goal, GoalTerm, GoalType } from "@/interface";
import icons from "@/utils/icons";
import { useCallback, useState } from "react";

const typeStyles: { [key in GoalType]: string } = {
  physical: "bg-orange-5",
  tactical: "bg-indego-5",
  nutrition: "bg-yellow-5",
  mental: "bg-sky-5",
  technical: "",
};

const cardStyles = {
  boxShadow: "0px 18px 40px 0px rgba(112, 144, 176, 0.12)",
};

type CardProp = {
  title: string;
  goal: GoalType;
  due: string;
  onToggle: () => void;
  open: boolean;
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        boxShadow: cardStyles.boxShadow,
      }}
      className="rounded-2xl bg-white p-4 gap-[20px] flex flex-col "
    >
      {children}
    </div>
  );
}

function Card({ title, goal, due, onToggle, open }: CardProp) {
  return (
    <>
      <div className="flex justify-between items-start">
        <span className="flex-1 font-bold">{title}</span>
        <button onClick={onToggle} className="size-6 grid place-items-center">
          <i
            dangerouslySetInnerHTML={{ __html: open ? icons.edit : icons.down }}
          />
        </button>
      </div>
      <div className="h-11 self-start flex gap-2  rounded-full bg-gray-7 p-2">
        <div
          className={`text-[13px] capitalize flex items-center text-white font-normal px-3.5 rounded-full ${typeStyles[goal]}`}
        >
          {goal}
        </div>
        <div className="border border-gray-2 text-[13px] font-normal px-3.5 rounded-full">
          Due: {due}
        </div>
      </div>
    </>
  );
}

function LongCard(props: Goal) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => {
    setOpen(!open);
  }, [open]);

  return (
    <Wrapper>
      <Card
        onToggle={toggle}
        open={open}
        title={props.description}
        goal={props.goal}
        due={props.achievementDate}
      />
      {open && (
        <>
          <div className="flex flex-col gap-4 text-[13px] text-gray-2">
            <span className="font-bold">Measurement Type</span>
            <span>{props.measurement}</span>
          </div>
          {props.actions.length > 0 && (
            <>
              <div className="flex flex-col gap-4 text-[13px] text-gray-2">
                <span className="font-bold">Actions</span>
                {props.actions.map((action) => (
                  <div
                    key={action._id}
                    className="bg-gray-7 py-2 px-4 rounded-full"
                  >
                    {action.description}
                  </div>
                ))}
              </div>
            </>
          )}
          {props.obstacles.length > 0 && (
            <>
              <div className="flex flex-col gap-4 text-[13px] text-gray-2">
                <span className="font-bold">Potential obstacles</span>
                <ul className="list-disc pl-4">
                  {props.obstacles.map((obstacle) => (
                    <li key={obstacle._id}>{obstacle.description}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
          <hr className="border border-gray-7" />
          <Button
            type="action"
            className="self-end font-bold text-[13px] !text-secondary !bg-green-2"
          >
            Mark as Achieved
          </Button>
        </>
      )}
    </Wrapper>
  );
}

function GoalCard(type: GoalTerm, goals: Goal[]) {
  return (
    <div className="bg-gray-7 flex flex-col gap-4 p-4 rounded-[20px]">
      <div className="flex justify-between items-center">
        <span className="font-bold text-xl capitalize">{type} Goals</span>
        <button className="min-w-[34px] min-h-[34px] bg-white rounded-full grid place-items-center">
          <i
            className="*:w-[15px] *:h-[15px] text-secondary"
            dangerouslySetInnerHTML={{ __html: icons.plus }}
          />
        </button>
      </div>
      <div className="flex h-[34px] items-center gap-3">
        <button className="h-full bg-text-clr rounded-md text-white px-4">
          Planned
        </button>
        <button>Achieved</button>
      </div>
      <div className="flex flex-col gap-4">
        {goals.map((goal) => (
          <LongCard key={goal._id} {...goal} />
        ))}
      </div>
    </div>
  );
}

export default function PlayerGoals() {
  const goals: Goal[] = [
    {
      _id: `${Math.random()}`,
      description: "Strengthen Backhand Consistency",
      goal: "physical",
      term: "short",
      actions: [],
      obstacles: [],
      measurement: "",
      achievementDate: "May 11 2025",
    },
    {
      _id: `${Math.random()}`,
      description: "Improve First Serve Accuracy",
      goal: "tactical",
      achievementDate: "May 11 2025",
      term: "short",
      actions: [
        {
          description: "Practice 50 first serves daily to target zones",
          date: "May 11 2025",
          isDone: false,
          _id: "1",
        },
        {
          description: "Record and review serve sessions",
          date: "May 11 2025",
          isDone: false,
          _id: "2",
        },
        {
          description: "Get weekly feedback from coach",
          date: "May 11 2025",
          isDone: false,
          _id: "3",
        },
      ],
      obstacles: [
        {
          description: "Inconsistent toss",
          isOvercome: false,
          _id: "1",
        },
        {
          description: "Fatigue or poor form",
          isOvercome: false,
          _id: "2",
        },
        {
          description: "Limited practice time",
          isOvercome: false,
          _id: "3",
        },
      ],
      measurement:
        "Achieve 70% first serve accuracy in practice within 2 weeks.",
    },
    {
      _id: `${Math.random()}`,
      description: "Apply Point-Building Strategies",
      goal: "tactical",
      achievementDate: "May 11 2025",
      term: "medium",
      actions: [],
      obstacles: [],
      measurement: "",
    },
    {
      _id: `${Math.random()}`,
      description: "Stay Properly Hydrated and Fueled",
      goal: "nutrition",
      term: "medium",
      actions: [],
      obstacles: [],
      measurement: "",
      achievementDate: "May 11 2025",
    },
    {
      _id: `${Math.random()}`,
      description: "Control Emotions Under Pressure",
      goal: "mental",
      achievementDate: "May 11 2025",
      term: "medium",
      actions: [
        {
          description: "Practice positive self-talk routines",
          date: "May 11 2025",
          isDone: false,
          _id: "1",
        },
        {
          description: "Use deep breathing during breaks",
          date: "May 11 2025",
          isDone: false,
          _id: "2",
        },
        {
          description: "Reflect on emotional responses after matches",
          date: "May 11 2025",
          isDone: false,
          _id: "3",
        },
      ],
      obstacles: [
        {
          description: "High-pressure moments",
          isOvercome: false,
          _id: "1",
        },
        {
          description: "Overthinking mistakes",
          isOvercome: false,
          _id: "2",
        },
        {
          description: "Lack of match experience",
          isOvercome: false,
          _id: "3",
        },
      ],
      measurement:
        "Stay emotionally balanced during matches by using coping techniques over the next 3 weeks.",
    },
    {
      _id: `${Math.random()}`,
      description: "Optimize Match-Day Nutrition Routine",
      goal: "nutrition",
      achievementDate: "May 11 2025",
      term: "long",
      actions: [],
      obstacles: [],
      measurement: "",
    },
    {
      _id: `${Math.random()}`,
      description: "Master Match Strategy Across Different Opponent Styles",
      goal: "tactical",
      achievementDate: "May 11 2025",
      term: "long",
      actions: [],
      obstacles: [],
      measurement: "",
    },
    {
      _id: `${Math.random()}`,
      description: "Develop Mental Toughness for Competitive Matches",
      goal: "mental",
      achievementDate: "May 11 2025",
      term: "long",
      actions: [
        {
          description: "Work with coach on mental routines weekly",
          date: "May 11 2025",
          isDone: false,
          _id: "1",
        },
        {
          description: "Practice visualization and match preparation",
          date: "May 11 2025",
          isDone: false,
          _id: "2",
        },
        {
          description: "Keep a mindset journal after matches and practices",
          date: "May 11 2025",
          isDone: false,
          _id: "3",
        },
      ],
      obstacles: [
        {
          description: "Inconsistent application of routines",
          isOvercome: false,
          _id: "1",
        },
        {
          description: "High stress in competitive environments",
          isOvercome: false,
          _id: "2",
        },
        {
          description: "Limited match play exposure",
          isOvercome: false,
          _id: "3",
        },
      ],
      measurement:
        "Build long-term mental resilience to stay calm, focused, and confident in high-pressure tournament settings over the next 6 months.",
    },
  ];

  const group = goals.reduce((acc, goal) => {
    if (acc[goal.term]) {
      acc[goal.term].push(goal);
    } else {
      acc[goal.term] = [goal];
    }
    return acc;
  }, {} as Record<GoalTerm, Goal[]>);

  return (
    <div className="grid grid-cols-3 gap-4">
      {Object.entries(group).map(([term, goals]) =>
        GoalCard(term as GoalTerm, goals)
      )}
    </div>
  );
}
