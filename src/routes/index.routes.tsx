import { createBrowserRouter } from "react-router-dom";
import App from "../App.tsx";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "@/features/home.tsx";

import Login from "../pages/login.tsx";
import MainLayout from "../layouts/Mainlayout.tsx";
import Dashboard from "../pages/Dashboard.tsx";
import Admin from "../pages/Admin.tsx";
import Signup from "@/features/signup/signup.tsx";
import AccountLayout from "@/features/signup/Layout.tsx";
import ProfileLayout from "../features/create_profile/Layout.tsx";
import CreateProfile from "../features/create_profile/create_profile.tsx";
import Learn from "../features/learn/learn.tsx";
import LearnDetail from "../features/learn/learn_detail.tsx";
import WeekDetail from "../features/learn/week_detail.tsx";
import Matchs from "../features/matchs/matchs.tsx";
import ScheduleMatch from "../features/matchs/new_match.tsx";

import Players from "../features/players/players.tsx";
import PlayerDetail from "../features/players/player_detail.tsx";
import PlayerProfile from "../features/players/player_profile.tsx";
import PlayerMatches from "../features/players/player_matches.tsx";
import PlayerGoals from "../features/players/player_goals.tsx";
import Connect from "@/features/connect/connect";
import Messages from "@/features/connect/messages";
import Groups from "@/features/connect/groups";
import Friends from "@/features/connect/friends";
import Announcements from "@/features/connect/announcements";
import Community from "@/features/connect/community";
import MatchDetail from "@/features/matchs/match_detail.tsx";
import MatchTracker from "@/features/matchs/match_tracker.tsx";

import Journals from "@/features/journals/journals.tsx";
import AddJournal from "@/features/journals/add_journal.tsx";
import Folders from "@/features/journals/folders.tsx";
import FolderJournals from "@/features/journals/folder-journals.tsx";
import Profile from "@/features/profile/profile.tsx";
import CalendarView from "@/features/calander_view/calendar_view";
import PlayerClass from "@/features/players/player_class.tsx";
import PlayerSOT from "@/features/players/player_sot.tsx";
import Children from "@/features/players/children.tsx";
import ChildDetail from "@/features/players/child_detail.tsx";
import ForgotPassword from "@/features/auth/forgot-password.tsx";
import VerifyPasswordResetOTP from "@/features/auth/verify-password-reset-otp.tsx";
import ClassSchedule from "@/features/class-schedule/classSchedule.tsx";
import ClassDetail from "@/features/class-detail/ClassDetail";
import EditClassPage from "@/features/class-detail/EditClassPage";
import FindCoach from "@/features/find-coach";

import NotificationsPage from "@/features/notifications/notifications";
// routes.tsx
export const routes = createBrowserRouter([
    { path: "/", element: <Home /> },
    { path: "/app", element: <App /> },
    { path: "/login", element: <Login /> },
    { path: "/forgot-password", element: <ForgotPassword /> },
    { path: "/verify-password-reset-otp", element: <VerifyPasswordResetOTP /> },


    {
        path: "/create_profile",
        element: <ProfileLayout />,
        children: [{ path: "", element: <CreateProfile /> }],
    },
    {
        path: "/signup",
        element: <AccountLayout />,
        children: [{ path: "", element: <Signup /> }],
    },
    {
        path: "/admin",
        element: <ProtectedRoute allowedRoles={['player', 'coach', 'parent']}><MainLayout /></ProtectedRoute>,
        children: [
            { 
                path: "", 
                element: <Admin />
            },
            { 
                path: "dashboard", 
                element: <Dashboard />
            },

            // Player-specific routes
            {
                path: "learn",
                element: <Learn />,
            },
            {
                path: "learn/:moduleId",
                element: <LearnDetail />,
            },
            {
                path: "learn/:moduleId/week/:weekId",
                element: <WeekDetail />,
            },
            {
                path: "find-coach",
                element: <FindCoach />,
            },
            {
                path: "journals",
                element: <Journals />,
                children: [
                    { path: "", element: <Journals /> }
                ]
            },
            {
                path: "journals/folders",
                element: <Folders />,
                children: [
                    { path: "", element: <Folders /> }
                ]
            },
            {
                path: "journals/folder/:folderId",
                element: <FolderJournals />,
                children: [
                    { path: "", element: <FolderJournals /> }
                ]
            },
            {
                path: "journals/add",
                element: <AddJournal />,
                children: [
                    { path: "", element: <AddJournal /> }
                ]
            },
            {
                path: "journals/edit/:journalId",
                element: <AddJournal />,
                children: [
                    { path: "", element: <AddJournal /> }
                ]
            },

            // Coach-specific routes
            {
                path: "players",
                element: <Players />,
            },
            {
                path: "players/detail/:id",
                element: <PlayerDetail />,
                children: [
                    { path: "", element: <PlayerProfile /> },
                    { path: "matches", element: <PlayerMatches /> },
                    { path: "goals", element: <PlayerGoals /> },
                    { path: "classes", element: <PlayerClass /> },
                    { path: "sot", element: <PlayerSOT /> }
                ]
            },

            // Parent-specific routes
            {
                path: "children",
                element: <Children />,
            },
            {
                path: "children/detail/:id",
                element: <ChildDetail />,
                children: [
                    { path: "", element: <PlayerProfile /> },
                    { path: "matches", element: <PlayerMatches /> },
                    { path: "goals", element: <PlayerGoals /> },
                    { path: "classes", element: <PlayerClass /> },
                    { path: "sot", element: <PlayerSOT /> }
                ]
            },
            {
                path: "matchs/new",
                element: <ScheduleMatch />
            },

            // Common routes for all roles
            {
                path: "matchs",
                element: <Matchs />,
            },
            {
                path: "matchs/schedule",
                element: <ScheduleMatch />,
            },
            {
                path: "matchs/detail/:matchId",
                element: <MatchDetail />
            },
            {
                path: "matchs/tracking/:matchId",
                element: <MatchTracker />
            },
            {
                path: "connect",
                element: <Connect />,
                children: [
                    { path: "", element: <Messages /> },
                    { path: "groups", element: <Groups /> },
                    { path: "friends", element: <Friends /> },
                    { path: "announcements", element: <Announcements /> },
                    { path: "community", element: <Community /> }
                ]
            },
            {
                path: "calendar",
                element: <CalendarView />
            },
            {
                path: "class/:classId",
                element: <ClassDetail />
            },
            {
                path: "class/:classId/edit",
                element: <EditClassPage />
            },
            {
                path: "class-schedule",
                element: <ClassSchedule />
            },
            {
                path: "profile",
                element: <Profile />
            },
            {
                path: "notifications",
                element: <NotificationsPage />
            }
        ],
    },
]);