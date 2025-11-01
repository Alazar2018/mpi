# Level 1 Tracking Documentation

## Overview

Level 1 tracking is the most basic level of tennis match tracking, designed for simple score keeping with minimal data requirements. It focuses on essential match information while eliminating complex tracking features.

## Key Features

### 🎯 **Minimal Data Tracking**
- **Player Scores**: Basic point tracking (0, 15, 30, 40, Game)
- **Point Winner**: Records which player won each point
- **Service Tracking**: Basic second service indication
- **No Reactions**: Player reactions are not tracked
- **No Shot Details**: Shot placement, type, and rally length are not recorded

### 📊 **Data Structure**

#### Point Score Object
```typescript
interface PointScore {
  p1Score: string;           // Player 1's score (e.g., "15", "30", "40")
  p2Score: string;           // Player 2's score (e.g., "0", "15", "30")
  pointWinner: "playerOne" | "playerTwo";  // Who won the point
  isSecondService: boolean;   // Whether this was a second service
  p1Reaction: null;          // Always null for Level 1
  p2Reaction: null;          // Always null for Level 1
  missedShot: null;          // Always null for Level 1
  placement: null;           // Always null for Level 1
  missedShotWay: null;       // Always null for Level 1
  betweenPointDuration: null; // Always null for Level 1
  type: null;                // Always null for Level 1
  rallies: null;             // Always null for Level 1
  servePlacement: null;      // Always null for Level 1
  courtPosition: null;       // Always null for Level 1
}
```

#### Backend Payload Structure
```json
{
  "trackingLevel": "level1",
  "totalGameTime": 967,
  "sets": [
    {
      "p1TotalScore": 1,
      "p2TotalScore": 0,
      "games": [
        {
          "gameNumber": 1,
          "scores": [
            {
              "p1Score": "15",
              "p2Score": "0",
              "pointWinner": "playerOne",
              "isSecondService": false
            },
            {
              "p1Score": "30",
              "p2Score": "0",
              "pointWinner": "playerOne",
              "isSecondService": true
            },
            {
              "p1Score": "40",
              "p2Score": "0",
              "pointWinner": "playerOne",
              "isSecondService": false
            },
            {
              "p1Score": "40",
              "p2Score": "0",
              "pointWinner": "playerOne",
              "isSecondService": false
            }
          ],
          "server": "playerOne"
        }
      ]
    }
  ]
}
```

## Implementation Details

### 🔄 **Point Duplication Feature**

**What It Does**: Automatically duplicates the last point in each game's scores array before sending to the backend.

**Why It's Needed**: The final score (e.g., 40-0) represents the game-winning point. Duplicating it shows that the game was won with that score.

**Example**:
```typescript
// Before duplication
scores: [
  { "p1Score": "15", "p2Score": "0", "pointWinner": "playerOne" },
  { "p1Score": "30", "p2Score": "0", "pointWinner": "playerOne" },
  { "p1Score": "40", "p2Score": "0", "pointWinner": "playerOne" }
]

// After duplication
scores: [
  { "p1Score": "15", "p2Score": "0", "pointWinner": "playerOne" },
  { "p1Score": "30", "p2Score": "0", "pointWinner": "playerOne" },
  { "p1Score": "40", "p2Score": "0", "pointWinner": "playerOne" },
  { "p1Score": "40", "p2Score": "0", "pointWinner": "playerOne" }  // Duplicated
]
```

### 🎾 **Game Flow**

1. **Point Addition**: Player clicks "TAP TO ADD A POINT" areas on the court
2. **Score Update**: Points are tracked (0 → 15 → 30 → 40 → Game)
3. **Game Completion**: When a game is won, scores are saved to game history
4. **Multiple Points Per Game**: Level 1 allows multiple points to accumulate within a single game
5. **API Submission**: All points are sent to backend with the last point duplicated

### 🚫 **Disabled Features**

- **Reaction Modals**: No player reaction tracking
- **Shot Detail Modals**: No shot placement, type, or rally length selection
- **Court Zone Tracking**: No detailed court position recording
- **Complex Point Outcomes**: Simplified to basic winner/loser tracking

## API Integration

### 📤 **Save Match Progress**
```typescript
const saveMatchProgressToAPI = async () => {
  // ... existing code ...
  
  // For Level 1, duplicate the last point and only send essential data
  if (match.level === 1) {
    const mappedScores = game.scores.map((score: any) => ({
      p1Score: score.p1Score,
      p2Score: score.p2Score,
      pointWinner: score.pointWinner,
      isSecondService: score.isSecondService
    }));
    
    // Duplicate the last point if there are scores
    if (mappedScores.length > 0) {
      const lastScore = mappedScores[mappedScores.length - 1];
      mappedScores.push({ ...lastScore });
      console.log('🎯 [saveMatchProgressToAPI] Duplicated last point for Level 1:', lastScore);
    }
    
    return mappedScores;
  }
}
```

### 📤 **Submit Match Result**
```typescript
const submitMatchResultToAPI = async () => {
  // ... existing code ...
  
  // For Level 1, duplicate the last point and only send essential data
  if (match.level === 1) {
    const mappedScores = game.scores.map((score: any) => ({
      p1Score: score.p1Score,
      p2Score: score.p2Score,
      pointWinner: score.pointWinner,
      isSecondService: score.isSecondService
    }));
    
    // Duplicate the last point if there are scores
    if (mappedScores.length > 0) {
      const lastScore = mappedScores[mappedScores.length - 1];
      mappedScores.push({ ...lastScore });
      console.log('🎯 [submitMatchResultToAPI] Duplicated last point for Level 1:', lastScore);
    }
    
    return mappedScores;
  }
}
```

## User Experience

### 🎮 **Court Interface**
- **Clickable Areas**: Large "TAP TO ADD A POINT" zones for easy scoring
- **Visual Feedback**: Clear indication of where to click
- **Simple Scoring**: No complex modal interactions

### 📱 **Mobile Friendly**
- **Touch Optimized**: Large touch targets for mobile devices
- **Minimal UI**: Clean, uncluttered interface
- **Fast Scoring**: Quick point entry without distractions

## Console Logging

### 🔍 **Debug Information**
The system provides comprehensive logging for debugging:

```typescript
console.log('🎯 [submitMatchResultToAPI] Duplicated last point for Level 1:', lastScore);
console.log('🎯 [saveMatchProgressToAPI] Duplicated last point for Level 1:', lastScore);
```

### 📊 **State Monitoring**
```typescript
console.log('🎯 [submitMatchResultToAPI] Current state:', {
  matchId,
  matchData: matchData ? 'exists' : 'null',
  currentGameScoresLength: currentGameScores.length,
  gameHistoryLength: gameHistory.length,
  matchLevel: match.level,
  gameTime
});
```

## Configuration

### ⚙️ **Level Selection**
Level 1 is selected via URL parameter or match creation:
```typescript
const levelFromUrl = searchParams.get('level');
if (levelFromUrl) {
  setMatch(prev => ({ ...prev, level: parseInt(levelFromUrl) }));
}
```

### 🔧 **Default Values**
```typescript
// For Level 1, set default reactions and skip reaction modal
if (match.level === 1) {
  completedPoint.pointWinner = winner === 1 ? "playerOne" : "playerTwo";
  completedPoint.p1Reaction = null;
  completedPoint.p2Reaction = null;
  completedPoint.missedShot = null;
  completedPoint.placement = null;
  completedPoint.missedShotWay = null;
  completedPoint.servePlacement = null;
  completedPoint.courtPosition = null;
  completedPoint.rallies = null;
  completedPoint.type = null;
  completedPoint.betweenPointDuration = null;
  completedPoint.isSecondService = false; // Simplify for Level 1
}
```

## Benefits

### ✅ **Advantages**
- **Fast Scoring**: Quick point entry without complex interactions
- **Mobile Optimized**: Large touch targets for mobile devices
- **Minimal Data**: Clean, focused data structure
- **Easy Implementation**: Simple scoring logic
- **Performance**: Reduced processing overhead

### 🎯 **Use Cases**
- **Recreational Matches**: Casual tennis games
- **Quick Scoring**: Fast-paced scoring needs
- **Mobile Users**: Touch-based interfaces
- **Simple Tracking**: Basic match recording
- **Training Sessions**: Basic practice tracking

## Technical Notes

### 🔄 **State Management**
- **Multiple Points Per Game**: `currentPointData` is not reset to `null` for Level 1
- **Game History**: Points accumulate in `currentGameScores` before being saved
- **API Preparation**: Data is filtered and duplicated before submission

### 📊 **Data Flow**
1. User clicks court → Point added to `currentGameScores`
2. Game completed → Scores moved to `gameHistory`
3. API submission → Data filtered and last point duplicated
4. Backend receives clean, minimal data structure

### 🚀 **Performance**
- **Reduced DOM Updates**: Minimal UI state changes
- **Efficient Data Processing**: Simple data transformation
- **Memory Optimization**: No complex object tracking
- **Fast Rendering**: Simplified component logic

## Future Enhancements

### 🔮 **Potential Improvements**
- **Custom Scoring**: Allow custom point values
- **Quick Actions**: Keyboard shortcuts for scoring
- **Voice Commands**: Voice-activated scoring
- **Offline Support**: Local storage for offline matches
- **Export Options**: CSV/PDF export of match data

---

*This documentation covers the Level 1 tracking implementation as of the latest codebase version. For technical questions or implementation details, refer to the source code in `src/features/matchs/match_tracker.tsx`.*
