import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/login.tsx";
import MainLayout from "./layouts/Mainlayout.tsx";
import CreateAccount from "./features/create_account/create_account.tsx";
import AccountLayout from "./features/create_account/Layout.tsx";
import ProfileLayout from "./features/create_profile/Layout.tsx";
import CreateProfile from "./features/create_profile/create_profile.tsx";
import Learn from "./features/learn/learn.tsx";
import LearnDetail from "./features/learn/learn_detail.tsx";
import Matchs from "./features/matchs/matchs.tsx";
import ScheduleMatch from "./features/matchs/new_match.tsx";
import MatchSchedule from "./features/matchs/match_schedule.tsx";
import Players from "./features/players/players.tsx";
import PlayerDetail from "./features/players/player_detail.tsx";
import PlayerProfile from "./features/players/player_profile.tsx";
import PlayerMatches from "./features/players/player_matches.tsx";
import PlayerGoals from "./features/players/player_goals.tsx";
import Connect from "./features/connect/connect.tsx";
import Messages from "./features/connect/messages.tsx";

const routes = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/login", element: <Login /> },
  {
    path: "/create_profile",
    element: <ProfileLayout />,
    children: [
      {
        path: "",
        element: <CreateProfile />,
      },
    ],
  },
  {
    path: "/create_Account",
    element: <AccountLayout />,
    children: [
      {
        path: "",
        element: <CreateAccount />,
      },
    ],
  },
  {
    path: "/admin",
    element: <MainLayout />,
    children: [
      {
        path: "",
        element: <p>Here</p>,
      },
      {
        path: "learn",
        element: <Learn />,
      },
      {
        path: "learn/:week",
        element: <LearnDetail />,
      },
      {
        path: "matchs",
        element: <Matchs />,
      },
      {
        path: "matchs/new",
        element: <ScheduleMatch />,
      },
      {
        path: "matchs/schedule",
        element: <MatchSchedule />,
      },
      {
        path: "players",
        element: <Outlet />,
        children: [
          {
            path: "",
            element: <Players />
          },
          {
            path: "detail/:id",
            element: <PlayerDetail />,
            children: [
              {
                path: '',
                element: <PlayerProfile />
              },
              {
                path: 'matches',
                element: <PlayerMatches />
              },
              {
                path: 'goals',
                element: <PlayerGoals />
              }
            ]
          },
        ]
      },
      {
        path: 'connect',
        element: <Connect />,
        children: [
          {
            path: '',
            element: <Messages />
          }
        ]
      }
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={routes} />
    <Toaster />
  </StrictMode>
);
