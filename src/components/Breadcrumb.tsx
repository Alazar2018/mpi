import { useLocation } from "react-router-dom";
import icons from "@/utils/icons";

// Mapping of path segments to display names and icons
const pathConfig = {
    admin: { name: "Dashboard", icon: icons.dashboard },
    learn: { name: "Learn", icon: icons.book },
    matchs: { name: "Matches", icon: icons.matchs },
    players: { name: "Players", icon: icons.players },
    children: { name: "Children", icon: icons.family },
    journals: { name: "Journals", icon: icons.journals },
    connect: { name: "Connect", icon: icons.connect },
    profile: { name: "Profile", icon: icons.users },
    matches: { name: "Matches", icon: icons.matchs },
    goals: { name: "Goals", icon: icons.trophy },
    classes: { name: "Classes", icon: icons.book },
    sot: { name: "SOT", icon: icons.book },
    // Add week mappings
    "1": { name: "Week 1", icon: icons.calender },
    "2": { name: "Week 2", icon: icons.calender },
    "3": { name: "Week 3", icon: icons.calender },
    // Add more weeks as needed
    "chapter-1": { name: "Chapter 1", icon: icons.book },
    // ... add more as needed
};

export default function Breadcrumb() {
    const location = useLocation();
    const pathSegments = location.pathname.split('/').filter(segment => segment !== '');

    const getBreadcrumbItems = () => {
        const items = [];
        let currentPath = '';

        pathSegments.forEach((segment, index) => {
            currentPath += `/${segment}`;
            const isLast = index === pathSegments.length - 1;

            // Handle MongoDB IDs (player IDs) FIRST - before numeric segments
            if (segment.match(/^[0-9a-f]{24}$/)) {
                // Check if this is a player detail route
                const isPlayerRoute = pathSegments.includes('players') && pathSegments.includes('detail');
                const isChildRoute = pathSegments.includes('children') && pathSegments.includes('detail');
                const isMatchRoute = pathSegments.includes('matchs') && pathSegments.includes('detail');
                
                if (isPlayerRoute) {
                    items.push({
                        name: "Player Detail",
                        icon: icons.players,
                        path: currentPath,
                        isActive: isLast
                    });
                } else if (isChildRoute) {
                    items.push({
                        name: "Child Details",
                        icon: icons.family,
                        path: currentPath,
                        isActive: isLast
                    });
                } else if (isMatchRoute) {
                    // This is a match detail route - don't add "Details" here
                    // The match detail component will handle its own breadcrumbs
                    return;
                } else {
                    items.push({
                        name: "Details",
                        icon: icons.book,
                        path: currentPath,
                        isActive: isLast
                    });
                }
                return;
            }

            // Handle numeric segments (weeks) - only if they're not MongoDB IDs
            if (!isNaN(Number(segment)) && segment.length < 24) {
                items.push({
                    name: `Week ${segment}`,
                    icon: icons.calender,
                    path: currentPath,
                    isActive: isLast
                });
                return;
            }

            // Skip "detail" segment for player/child/match routes as it's handled by ID processing
            if (segment === 'detail' && (pathSegments.includes('players') || pathSegments.includes('children') || pathSegments.includes('matchs'))) {
                return;
            }

            // Try to find matching config, fallback to generic if not found
            const config = pathConfig[segment as keyof typeof pathConfig] || {
                name: segment.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
                icon: icons.book // Default icon
            };

            // Special handling for tab routes in player detail
            if (segment === 'matches' && pathSegments.includes('players') && pathSegments.includes('detail')) {
                items.push({
                    name: "Player Matches",
                    icon: icons.matchs,
                    path: currentPath,
                    isActive: isLast
                });
                return;
            }

            if (segment === 'goals' && pathSegments.includes('players') && pathSegments.includes('detail')) {
                items.push({
                    name: "Player Goals",
                    icon: icons.trophy,
                    path: currentPath,
                    isActive: isLast
                });
                return;
            }

            if (segment === 'classes' && pathSegments.includes('players') && pathSegments.includes('detail')) {
                items.push({
                    name: "Player Classes",
                    icon: icons.book,
                    path: currentPath,
                    isActive: isLast
                });
                return;
            }

            if (segment === 'sot' && pathSegments.includes('players') && pathSegments.includes('detail')) {
                items.push({
                    name: "Player SOT",
                    icon: icons.book,
                    path: currentPath,
                    isActive: isLast
                });
                return;
            }

            // Special handling for tab routes in child detail
            if (segment === 'matches' && pathSegments.includes('children') && pathSegments.includes('detail')) {
                items.push({
                    name: "Child Matches",
                    icon: icons.matchs,
                    path: currentPath,
                    isActive: isLast
                });
                return;
            }

            if (segment === 'goals' && pathSegments.includes('children') && pathSegments.includes('detail')) {
                items.push({
                    name: "Child Goals",
                    icon: icons.trophy,
                    path: currentPath,
                    isActive: isLast
                });
                return;
            }

            if (segment === 'classes' && pathSegments.includes('children') && pathSegments.includes('detail')) {
                items.push({
                    name: "Child Classes",
                    icon: icons.book,
                    path: currentPath,
                    isActive: isLast
                });
                return;
            }

            if (segment === 'sot' && pathSegments.includes('children') && pathSegments.includes('detail')) {
                items.push({
                    name: "Child SOT",
                    icon: icons.book,
                    path: currentPath,
                    isActive: isLast
                });
                return;
            }

            items.push({
                name: config.name,
                icon: config.icon,
                path: currentPath,
                isActive: isLast
            });
        });

        // Always ensure Dashboard is first if we're not already on it
        if (pathSegments[0] !== 'admin') {
            items.unshift({
                name: "Dashboard",
                icon: icons.dashboard,
                path: "/admin",
                isActive: false
            });
        }

        return items;
    };

    const breadcrumbItems = getBreadcrumbItems();

    return (
        <div className="flex items-center flex-wrap gap-2 px-4 md:px-8 py-2 md:py-3 text-xs md:text-sm transition-colors duration-300 bg-[var(--bg-card)] rounded-lg mx-2 border border-[var(--border-primary)]">
            {breadcrumbItems.map((item, index) => (
                <div key={`${item.path}-${index}`} className="flex items-center gap-2">
                    {/* Clickable link except for current page */}
                    {!item.isActive ? (
                        <a
                            href={item.path}
                            className={`flex items-center gap-2 hover:text-primary hover:bg-[var(--bg-secondary)] dark:hover:bg-[var(--bg-tertiary)] px-2 py-1 rounded transition-colors ${
                                item.isActive ? 'text-primary font-medium' : 'text-[var(--text-primary)] dark:text-white'
                            }`}
                        >
                            {index === 0 && (
                                <i
                                    className="*:size-3 md:*:size-4 text-[var(--text-primary)] dark:text-white"
                                    dangerouslySetInnerHTML={{ __html: item.icon }}
                                />
                            )}
                            <span>{item.name}</span>
                        </a>
                    ) : (
                        <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-3 py-2 rounded-lg">
                            {index === 0 && (
                                <i
                                    className="*:size-3 md:*:size-4 text-green-600 dark:text-green-400"
                                    dangerouslySetInnerHTML={{ __html: item.icon }}
                                />
                            )}
                            <span className="text-green-700 dark:text-green-300 font-semibold">{item.name}</span>
                        </div>
                    )}

                    {/* Separator (except for last item) */}
                    {index < breadcrumbItems.length - 1 && (
                        <i
                            className="*:size-2 md:*:size-3 text-[var(--text-tertiary)]"
                            dangerouslySetInnerHTML={{ __html: icons.chevronRight || '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 18L18 12L10 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' }}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}