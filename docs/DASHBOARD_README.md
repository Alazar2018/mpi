# Dashboard Page

## Overview
The dashboard page has been created and is accessible at the `/admin` route. It provides a comprehensive overview of the sports management system with key metrics, charts, and task management.

## Features

### 1. Header Section
- Personalized greeting with user's name
- Two action buttons:
  - "General Dashboard" (primary blue button)
  - "Select Player" (secondary dropdown button)

### 2. Key Metrics Cards
- **Players**: Shows total number of players (45)
- **Matches**: Shows total number of matches (123)
- **Sessions**: Shows total number of sessions (76)

### 3. Timeframe Selection
- Interactive buttons for different time periods
- Options: All, 1W, 1M, 3M, 6M, 1Y
- Currently selected timeframe is highlighted in blue

### 4. Weekly Sessions Chart
- Bar chart showing sessions per day of the week
- Y-axis shows session count from 0-4
- Background bars indicate maximum capacity
- Blue bars show actual sessions
- Total sessions displayed on the right

### 5. Today's Todo List
- List of tasks with completion status
- Each task shows:
  - Task number
  - Description
  - Due date/time
  - Completion checkbox
- "View All" button to see complete task list

## Technical Details

### File Location
- Component: `src/pages/Dashboard.tsx`
- Route: `/admin` (default route when accessing admin section)

### Dependencies
- React 19.1.0
- TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- React Router for navigation

### Styling
- Uses Tailwind CSS classes
- Responsive design (mobile-first approach)
- Modern card-based layout with shadows
- Consistent color scheme (blue primary, gray secondary)

### State Management
- Local state for timeframe selection
- Static data for metrics and charts (can be connected to API later)
- Todo list with completion status

## Usage

1. Navigate to `/admin` in your application
2. The dashboard will automatically load with all sections
3. Click on timeframe buttons to change the view (currently static)
4. View task completion status in the todo list
5. Use the action buttons in the header for navigation

## Future Enhancements

- Connect metrics to real API data
- Add interactive charts with real-time updates
- Implement task management functionality
- Add user authentication and role-based access
- Implement responsive navigation for mobile devices
- Add data export functionality
- Implement real-time notifications

## Browser Compatibility
- Modern browsers with ES2020 support
- Responsive design for mobile and desktop
- Optimized for React 19+ features
