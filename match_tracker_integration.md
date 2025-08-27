# Match Tracker Integration Documentation

## Overview

This document outlines the integration of the new match tracking API endpoints with the existing MatchTracker component. The integration enables real-time match data tracking, progress saving, and result submission using the MPI Global API.

**Important Note**: The `totalGameTime` field in API requests must be sent as a number (integer) representing the total game time in seconds, not as a date string.

## API Endpoints Integrated

### 1. Save Match Progress
**Endpoint:** `POST /api/v1/matches/:id/save-progress`
**Purpose:** Saves current match progress with tracking data
**Authentication:** JWT Bearer token required

**Request Body:**
```json
{
  "trackingLevel": "string",          // Required: "level1", "level2", "level3"
  "sets": [{
    "p1TotalScore": "number",
    "p2TotalScore": "number",
    "games": [{
      "gameNumber": "number",
      "scores": [{
        "p1Score": "string",
        "p2Score": "string",
        "isSecondService": "boolean",   // Level 2+
        "p1Reaction": "string",         // Level 2+
        "p2Reaction": "string",         // Level 2+
        "missedShot": "string",         // Level 2+
        "placement": "string",          // Level 2+
        "missedShotWay": "string",      // Level 3
        "betweenPointDuration": "number",
        "type": "string",               // Level 2+
        "rallies": "string",            // Level 3
        "servePlacement": "string"      // Level 2+
      }],
      "changeoverDuration": "number",
      "server": "string"
    }],
    "tieBreak": {                      // Optional
      "scores": [...],
      "winner": "string"
    }
  }]
}
```

### 2. Submit Match Result
**Endpoint:** `POST /api/v1/matches/:id/submit`
**Purpose:** Submits final match result with complete tracking data
**Authentication:** JWT Bearer token required

**Request Body:**
```json
{
  "trackingLevel": "string",          // Required: "level1", "level2", "level3"
  "totalGameTime": "number",          // Required: Total game time in seconds (integer)
  "sets": [...]                       // Same format as Save Match Progress
}
```

## Tracking Levels Supported

### Level 1 (Basic)
- **Required Fields:** `p1Score`, `p2Score`, `server`
- **Features:** Basic score tracking, serving player tracking, point winner determination

### Level 2 (Intermediate)
- **Required Fields:** Everything from Level 1 + `type`, `servePlacement`
- **Optional Fields:** `isSecondService`, `p1Reaction`, `p2Reaction`
- **Features:** Shot type analysis, serve placement tracking, player reactions

### Level 3 (Advanced)
- **Required Fields:** Everything from Level 2 + `missedShotWay`, court position tracking
- **Optional Fields:** `rallies`, `placement`, rally details
- **Features:** Full statistical analysis, court positioning, rally length tracking

## Data Types & Enums

### Shot Types
```
"ace", "fault", "p1Winner", "p2Winner", "p1UnforcedError", 
"p2UnforcedError", "p1ForcedError", "p2ForcedError", 
"doubleFault", "returnWinner", "returnError", "forcedError", 
"forcedReturnError"
```

### Player Reactions
```
"negativeResponse", "positiveResponse", "negativeSelfTalk", 
"positiveSelfTalk", "noResponse"
```

### Serve Placements
```
"wide", "body", "t", "net"
```

### Shot Ways (Level 3)
```
"forehand", "backhand", "forehandVolley", "backhandVolley", 
"forehandSwingingVolley", "backhandSwingingVolley", 
"forehandSlice", "backhandSlice", "overhead", 
"forehandDropShot", "backhandDropShot"
```

### Rally Types (Level 3)
```
"oneToFour", "fiveToEight", "nineToTwelve", 
"thirteenToTwenty", "twentyOnePlus"
```

## Implementation Details

### 1. Service Layer (`src/service/matchs.server.ts`)

#### New Interfaces Added:
```typescript
export interface MatchScore {
  p1Score: string;
  p2Score: string;
  isSecondService?: boolean;
  p1Reaction?: string;
  p2Reaction?: string;
  missedShot?: string;
  placement?: string;
  missedShotWay?: string;
  betweenPointDuration?: number;
  type?: string;
  rallies?: string;
  servePlacement?: string;
}

export interface MatchGameData {
  gameNumber: number;
  scores: MatchScore[];
  changeoverDuration?: number;
  server: string;
}

export interface MatchSetData {
  p1TotalScore: number;
  p2TotalScore: number;
  games: MatchGameData[];
  tieBreak?: MatchTieBreak;
}

export interface SaveMatchProgressRequest {
  trackingLevel: "level1" | "level2" | "level3";
  sets: MatchSetData[];
}

export interface SubmitMatchResultRequest {
  trackingLevel: "level1" | "level2" | "level3";
  totalGameTime: string;
  sets: MatchSetData[];
}
```

#### New Service Methods:
```typescript
/**
 * Save match progress with tracking data
 */
async saveMatchProgress(matchId: string, data: SaveMatchProgressRequest): Promise<MatchesListResponse>

/**
 * Submit final match result with tracking data
 */
async submitMatchResult(matchId: string, data: SubmitMatchResultRequest): Promise<MatchesListResponse>
```

### 2. API Layer (`src/features/matchs/api/matchs.api.tsx`)

#### Wrapper Functions:
```typescript
/**
 * Save match progress with tracking data
 */
export const saveMatchProgress = async (matchId: string, data: SaveMatchProgressRequest): Promise<AsyncResponse<MatchesListResponse>>

/**
 * Submit final match result with tracking data
 */
export const submitMatchResult = async (matchId: string, data: SubmitMatchResultRequest): Promise<AsyncResponse<MatchesListResponse>>
```

### 3. Component Integration (`src/features/matchs/match_tracker.tsx`)

#### Key Changes Made:
1. **Real Data Integration**: Fetches actual match data using `matchId` from URL
2. **Dynamic Player Names**: Displays real player names from match data
3. **Automatic Set Configuration**: Sets correct number of sets based on match type
4. **Level Integration**: Uses tracking level selected in match details
5. **API Integration**: Implements save progress and submit result functionality
6. **Winning Modal Integration**: Automatically submits match result when "Done" is clicked
7. **Info Modal System**: Comprehensive match information display accessible via info button

#### New Functions Added:
```typescript
// Save match progress to API
const saveMatchProgressToAPI = async () => {
  // Converts match state to API format and calls saveMatchProgress
}

// Submit final match result to API
const submitMatchResultToAPI = async () => {
  // Converts match result to API format and calls submitMatchResult
}

// Info modal state management
const [showInfoModal, setShowInfoModal] = useState(false);

// Winning modal integration with API submission
const handleWinningModalDone = async () => {
  try {
    await submitMatchResultToAPI();
    // Cleanup and navigation
  } catch (error) {
    // Error handling with fallback navigation
  }
}
```

#### New UI Elements:
- **Save Progress Button**: Green button with save icon for saving current progress
- **Submit Result Button**: Blue button with checkmark icon for submitting final results
- **Info Button**: Blue "i" button in controls section for viewing match details
- **Info Modal**: Comprehensive match information display with transparent backdrop

#### Info Modal Features:
- **Match Details**: Match type, tracking level, court surface, indoor/outdoor status, current set, server
- **Player Information**: Player names, avatars, registration status (registered vs. custom)
- **Current Score**: Real-time sets, games, and points for both players
- **Match State**: Game time, match status (active/paused), additional match information
- **Match Notes**: Recent notes with timestamps (shows up to 3 notes + total count)
- **Responsive Design**: Works on all screen sizes with proper mobile optimization
- **Performance Optimized**: Uses existing component state - no additional API calls or data loading

## Usage Flow

### 1. Match Creation
1. User creates match in `new_match.tsx`
2. Match is saved with basic information (no tracking level yet)

### 2. Match Details
1. User views match details in `match_detail.tsx`
2. User selects tracking level (1, 2, or 3)
3. User clicks "Start Match" to begin tracking

### 3. Match Tracking
1. User is navigated to `match_tracker.tsx` with `matchId` in URL
2. Component automatically loads real match data
3. Player names and match settings are populated from API
4. User can track match progress using existing UI

### 4. Progress Saving
1. User clicks "Save Progress" button during match
2. Current match state is converted to API format
3. Progress is saved to API using `saveMatchProgress` endpoint
4. User receives confirmation of successful save

### 5. Result Submission
1. User clicks "Submit Result" button when match is complete
2. Final match state is converted to API format
3. Result is submitted using `submitMatchResult` endpoint
4. User is automatically navigated back to matches list

### 6. Match Information Access
1. User clicks the blue "i" info button in the controls section
2. Info modal opens instantly displaying comprehensive match details
3. Modal shows real-time match data from existing component state (no loading)
4. User can close modal and continue tracking without any disruption

### 7. Winning Modal Integration
1. When a player wins, the winning modal appears
2. Clicking "Done" automatically submits the final match result to the API
3. After successful submission, user is navigated back to matches list
4. All match state is properly cleaned up (localStorage, sessionStorage)

## Data Conversion

### From Component State to API Format:
```typescript
// Component state
const matchState = {
  sets: [{ player1: 6, player2: 4 }],
  games: [{ player1: 4, player2: 2 }],
  server: 1
};

// API format
const apiData = {
  trackingLevel: "level2",
  sets: [{
    p1TotalScore: 6,
    p2TotalScore: 4,
    games: [{
      gameNumber: 1,
      scores: [], // Point-level data would be populated here
      server: "playerOne"
    }]
  }]
};
```

## Error Handling

### API Error Responses:
- **200**: Success
- **400**: Bad Request (validation errors)
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Internal Server Error

### Error Response Format:
```json
{
  "error": {
    "message": "Error description",
    "status": 400
  }
}
```

### Component Error Handling:
- API errors are logged to console
- User receives feedback through console messages
- Failed operations can be retried
- Graceful fallback to local storage for offline functionality

## Configuration

### Environment Variables:
- **Base URL**: `https://www.mpiglobal.org/api/v1/matches`
- **Authentication**: JWT Bearer token in Authorization header

### API Headers:
```http
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

## Testing

### Curl Examples:

#### Save Match Progress (Level 2):
```bash
curl -X POST "mpiglobal.org/api/v1/matches/MATCH_ID/save-progress" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trackingLevel": "level2",
    "sets": [{
      "p1TotalScore": 6,
      "p2TotalScore": 4,
      "games": [{
        "gameNumber": 1,
        "scores": [{
          "p1Score": "15",
          "p2Score": "0",
          "isSecondService": false,
          "type": "ace",
          "servePlacement": "t",
          "betweenPointDuration": 20
        }],
        "server": "playerOne"
      }]
    }]
  }'
```

#### Submit Final Result (Level 3):
```bash
curl -X POST "mpiglobal.org/api/v1/matches/MATCH_ID/submit" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trackingLevel": "level3",
    "totalGameTime": 180,
    "sets": [{
      "p1TotalScore": 6,
      "p2TotalScore": 4,
      "games": [{
        "gameNumber": 1,
        "scores": [{
          "p1Score": "15",
          "p2Score": "0",
          "isSecondService": false,
          "type": "ace",
          "servePlacement": "t",
          "betweenPointDuration": 20,
          "rallies": "oneToFour",
          "missedShotWay": "forehand"
        }],
        "server": "playerOne"
      }]
    }]
  }'
```

## Future Enhancements

### Planned Features:
1. **Real-time Sync**: WebSocket integration for live match updates
2. **Offline Support**: Enhanced local storage with sync when online
3. **Advanced Analytics**: Detailed performance metrics and reports
4. **Multi-language Support**: Internationalization for global users
5. **Mobile Optimization**: Responsive design improvements for mobile devices

### Recently Implemented Features:
1. **Winning Modal Integration**: Automatic match result submission when match ends
2. **Info Modal System**: Comprehensive match information display with transparent backdrop
3. **Enhanced User Experience**: Seamless flow from match completion to result submission
4. **Improved State Management**: Better modal state handling and cleanup
5. **Previous Match Data Persistence Fix**: Resolved issue where previous match data was being restored when starting new matches
6. **Corrected totalGameTime Type**: Fixed API submission to send game time as seconds (integer) instead of date string

### Potential API Extensions:
1. **Match Templates**: Pre-configured match settings
2. **Player Statistics**: Historical performance data
3. **Tournament Integration**: Automated tournament progression
4. **Social Features**: Match sharing and social media integration

## Troubleshooting

### Common Issues:

#### 1. Authentication Errors
- **Symptom**: 401 Unauthorized responses
- **Solution**: Verify JWT token is valid and not expired
- **Check**: Token in localStorage and Authorization header

#### 2. Data Type Mismatches
- **Symptom**: 400 Bad Request with validation errors
- **Solution**: Verify request body matches API schema exactly
- **Check**: All required fields are present and correctly typed
- **Important**: `totalGameTime` must be a number (seconds), not a date string

#### 3. Network Issues
- **Symptom**: Failed API calls or timeouts
- **Solution**: Check network connectivity and API endpoint availability
- **Check**: Console for detailed error messages

#### 4. Component State Issues
- **Symptom**: Player names not displaying or incorrect data
- **Solution**: Verify match data is being fetched correctly
- **Check**: Browser console for API response data

#### 5. Info Modal Issues
- **Symptom**: Info modal not opening or displaying incorrect data
- **Solution**: Check if `showInfoModal` state is properly managed
- **Check**: Verify info button click handler and modal state updates
- **Performance**: Modal uses existing component state - no additional data loading required

#### 6. Winning Modal Integration Issues
- **Symptom**: Match result not submitted when clicking "Done"
- **Solution**: Verify API endpoints and authentication
- **Check**: Console for API call success/failure messages

#### 7. Previous Match Data Persistence Issues
- **Symptom**: Old match scores/data appearing when starting new matches
- **Solution**: This has been fixed - new matches now start with fresh state
- **Check**: Verify match status is 'pending' or 'confirmed' for new matches
- **Note**: Saved matches (status: 'saved') will still resume with previous state as expected

### Debug Information:
- Enable console logging for detailed API interaction information
- Check Network tab in browser DevTools for API request/response details
- Verify localStorage for saved match state data

## Support

For technical support or questions about the match tracker integration:

1. **Documentation**: Refer to this document and API specifications
2. **Console Logs**: Check browser console for detailed error information
3. **API Testing**: Use provided curl examples to test endpoints directly
4. **Development Team**: Contact the development team for complex issues

---

**Last Updated**: January 2025
**Version**: 1.1.0
**Status**: Production Ready with Enhanced Features
