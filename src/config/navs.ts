// config/navs.ts
import icons from "@/utils/icons";

export interface NavItem {
    name: string;
    path: string;
    icon: string;
    roles: string[]; // Array of roles that can see this navigation item
}

// Player-specific navigation
export const playerNavs: NavItem[] = [
    {
        name: "Dashboard",
        path: "/admin",
        icon: icons.dashboard,
        roles: ["player", "coach", "parent"]
    },
    {
        name: "Learn",
        path: "/admin/learn",
        icon: icons.learn,
        roles: ["player"]
    },
    {
        name: "Find Coach",
        path: "/admin/find-coach",
        icon: icons.coach,
        roles: ["player", "parent"]
    },
    {
        name: "Journals",
        path: "/admin/journals",
        icon: icons.journals,
        roles: ["player"]
    },
    {
        name: "Matches",
        path: "/admin/matchs",
        icon: icons.matchs,
        roles: ["player", "coach", "parent"]
    },
    {
        name: "Connect",
        path: "/admin/connect",
        icon: icons.connect,
        roles: ["player", "coach", "parent"]
    },
    {
        name: "Calendar",
        path: "/admin/calendar",
        icon: icons.calender,
        roles: ["player", "coach", "parent"]
    },
    {
        name: "Class Schedule",
        path: "/admin/class-schedule",
        icon: icons.schedule,
        roles: ["player", "coach", "parent"]
    },

];

// Coach-specific navigation
export const coachNavs: NavItem[] = [
    {
        name: "Dashboard",
        path: "/admin",
        icon: icons.dashboard,
        roles: ["coach"]
    },
        
    {
        name: "Players",
        path: "/admin/players",
        icon: icons.players,
        roles: ["coach"]
    },
    {
        name: "Matches",
        path: "/admin/matchs",
        icon: icons.matchs,
        roles: ["coach"]
    },
   
    {
        name: "Connect",
        path: "/admin/connect",
        icon: icons.connect,
        roles: ["coach"]
    },
    {
        name: "Calendar",
        path: "/admin/calendar",
        icon: icons.calender,
        roles: ["coach"]
    },
    {
        name: "Class Schedule",
        path: "/admin/class-schedule",
        icon: icons.schedule,
        roles: ["coach"]
    },

];

// Parent-specific navigation
export const parentNavs: NavItem[] = [
    {
        name: "Dashboard",
        path: "/admin",
        icon: icons.dashboard,
        roles: ["parent"]
    },
    {
        name: "Children",
        path: "/admin/children",
        icon: icons.family,
        roles: ["parent"]
    },
    {
        name: "Find Coach",
        path: "/admin/find-coach",
        icon: icons.coach,
        roles: ["parent"]
    },
    {
        name: "Matches",
        path: "/admin/matchs",
        icon: icons.matchs,
        roles: ["parent"]
    },
    {
        name: "Connect",
        path: "/admin/connect",
        icon: icons.connect,
        roles: ["parent"]
    },
    {
        name: "Calendar",
        path: "/admin/calendar",
        icon: icons.calender,
        roles: ["parent"]
    },
    {
        name: "Class Schedule",
        path: "/admin/class-schedule",
        icon: icons.schedule,
        roles: ["parent"]
    },
   
];

// Legacy navs for backward compatibility
export const navs: NavItem[] = playerNavs;

// Function to get navigation items based on user role
export const getNavsByRole = (role: string | null): NavItem[] => {

    
    if (!role) {
        return [];
    }
    
    let result: NavItem[];
    switch (role.toLowerCase()) {
        case "player":
            result = playerNavs;
            break;
        case "coach":
            result = coachNavs;
            break;
        case "parent":
            result = parentNavs;
            break;
        default:
            result = playerNavs; // Default fallback
    }
    
  
    return result;
};