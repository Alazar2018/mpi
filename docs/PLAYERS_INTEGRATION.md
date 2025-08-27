# Players Integration

This document describes the integration of the Players section with the backend API.

## Overview

The Players section has been integrated with the backend API to provide real-time data for coaches to view and manage their players. The integration includes:

- **API Service Layer**: `src/service/players.server.ts`
- **Custom Hook**: `src/hooks/usePlayers.ts`
- **Updated Component**: `src/features/players/players.tsx`
- **API Configuration**: Updated `src/config/api.config.ts`

## API Endpoints

### View Players (Coaches)
```http
GET /users/players
```
**Description**: Get list of players for coach users  
**Access**: Coaches only  
**Response**: Array of player profiles with pagination

**Query Parameters**:
- `page` (optional): Page number for pagination
- `limit` (optional): Number of players per page
- `status` (optional): Filter by player status (`active`, `inactive`, `away`)
- `sortBy` (optional): Sort by field (`rating`, `usdta`, `name`)
- `sortOrder` (optional): Sort order (`asc`, `desc`)

### View Specific Player
```http
GET /users/players/:id
```
**Description**: Get detailed information about a specific player  
**Access**: Coaches only  
**Parameters**: `id` - Player user ID

### Search Players
```http
GET /users/players/search?q=searchTerm
```
**Description**: Search players by name or email  
**Access**: Coaches only  
**Parameters**: `q` - Search query

### Player Statistics
```http
GET /users/players/:id/stats
```
**Description**: Get player statistics and performance data  
**Access**: Coaches only  
**Parameters**: `id` - Player user ID

## Data Models

### Player Interface
```typescript
interface Player {
  _id: string;
  name: string;
  email: string;
  initials?: string;
  usdta?: number;
  rating?: number;
  status: 'active' | 'inactive' | 'away';
  lastSeen?: string;
  avatarColor?: string;
  profilePicture?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  coachId?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Player Statistics Interface
```typescript
interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winPercentage: number;
  averageRating: number;
  totalUSDTA: number;
}
```

## Service Layer

The `PlayersService` class provides methods for:

- `getPlayers()` - Fetch paginated list of players
- `getPlayerById()` - Get specific player details
- `getPlayerWithStats()` - Get player with statistics
- `searchPlayers()` - Search players by query
- `getPlayersByStatus()` - Filter players by status
- `getPlayersSortedByRating()` - Sort players by rating
- `getPlayersSortedByUSDTA()` - Sort players by USDTA
- Utility methods for formatting and data transformation

## Custom Hook

The `usePlayers` hook provides:

- **State Management**: Players data, loading states, error handling
- **Pagination**: Page management and navigation
- **Search**: Search functionality with debouncing
- **Filtering**: Status and sorting options
- **Data Fetching**: Automatic data fetching and error handling

### Usage Example
```typescript
const {
  players,
  loading,
  error,
  totalPlayers,
  currentPage,
  totalPages,
  fetchPlayers,
  searchPlayers,
  clearSearch,
  refreshPlayers
} = usePlayers({ 
  limit: 9,
  sortBy: 'rating',
  sortOrder: 'desc'
});
```

## Component Integration

The `Players` component now:

- **Fetches Real Data**: Uses API instead of hardcoded data
- **Provides Search**: Search players by name or email
- **Shows Loading States**: Skeleton loaders while fetching data
- **Handles Errors**: Error states with retry functionality
- **Supports Pagination**: Navigate through player lists
- **Responsive Design**: Grid layout that adapts to screen size

## Features

### Search Functionality
- Real-time search as you type
- Search by player name or email
- Clear search functionality
- Search results with pagination

### Status Management
- Visual status indicators (active, inactive, away)
- Status-based filtering
- Last seen timestamps
- Online/offline detection

### Data Display
- Player avatars with initials
- Rating system display
- USDTA (United States Tennis Association) ratings
- Contact information
- Performance statistics

### Pagination
- Configurable page sizes
- Page navigation controls
- Total count display
- Efficient data loading

## Error Handling

The integration includes comprehensive error handling:

- **Network Errors**: Connection issues and timeouts
- **API Errors**: Server errors and invalid responses
- **Data Validation**: Invalid or missing data
- **User Feedback**: Clear error messages and retry options

## Performance Optimizations

- **Lazy Loading**: Load data only when needed
- **Pagination**: Limit data transfer per request
- **Caching**: Efficient state management
- **Debounced Search**: Reduce API calls during typing

## Security

- **Authentication**: JWT token-based authentication
- **Authorization**: Coach-only access to player data
- **Data Validation**: Input sanitization and validation
- **Secure Headers**: HTTPS and proper CORS configuration

## Future Enhancements

Potential improvements for the players integration:

- **Real-time Updates**: WebSocket integration for live status updates
- **Advanced Filtering**: Date ranges, age groups, skill levels
- **Export Functionality**: CSV/PDF export of player data
- **Bulk Operations**: Mass actions on multiple players
- **Analytics Dashboard**: Player performance insights
- **Communication Tools**: Direct messaging to players

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Check JWT token validity and refresh
2. **Network Timeouts**: Verify API endpoint accessibility
3. **Data Loading Issues**: Check API response format
4. **Search Not Working**: Verify search endpoint configuration

### Debug Information

Enable console logging for debugging:
```typescript
// In players.server.ts
console.log('API Response:', response.data);
```

## Dependencies

- **Axios**: HTTP client for API requests
- **React Hooks**: State management and side effects
- **TypeScript**: Type safety and interfaces
- **Tailwind CSS**: Styling and responsive design

## Testing

The integration can be tested using:

- **API Testing**: Postman or similar tools
- **Component Testing**: React Testing Library
- **Integration Testing**: End-to-end testing
- **Performance Testing**: Load testing for large datasets
