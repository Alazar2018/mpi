# Tennis Match Tracking - Complete Integration Guide

## Overview
This guide provides comprehensive documentation for integrating the three-level tennis match tracking system into your applications. Each level offers different complexity and data richness for various use cases.

## 🎯 **Level Comparison**

| Feature | Level 1 | Level 2 | Level 3 |
|---------|---------|---------|---------|
| **Complexity** | Basic | Intermediate | Advanced |
| **Data Fields** | 4 | 7 | 15+ |
| **Use Case** | Casual | Competitive | Professional |
| **Interface** | Simple buttons | Enhanced modals | Court zones |
| **Analytics** | Basic scoring | Shot analysis | Comprehensive |

## 🔌 **API Endpoints**

### **Base URL**
```
https://your-api-domain.com/api/tennis
```

### **Available Endpoints**
- `POST /matches` - Create new match
- `PUT /matches/{id}/progress` - Save match progress
- `PUT /matches/{id}/result` - Submit final match result
- `GET /matches/{id}` - Retrieve match data

## 📊 **Data Structures**

### **Common Fields (All Levels)**
```typescript
interface BaseMatchData {
  trackingLevel: "level1" | "level2" | "level3";
  totalGameTime: number;  // Total match time in seconds
  sets: SetScore[];
}

interface SetScore {
  p1TotalScore: number;   // Games won by Player 1
  p2TotalScore: number;   // Games won by Player 2
  games: GameScore[];
  tieBreak?: TiebreakScore;
}

interface GameScore {
  gameNumber: number;      // Sequential game number
  scores: PointScore[];    // Array of point scores
  server: string;          // "playerOne" or "playerTwo"
}
```

### **Level 1 - Basic Scoring**
```typescript
interface Level1PointScore {
  p1Score: string;                    // "0", "15", "30", "40", "AD"
  p2Score: string;                    // "0", "15", "30", "40", "AD"
  pointWinner: "playerOne" | "playerTwo";
  isSecondService: boolean;
  
  // All other fields: null
  p1Reaction: null;
  p2Reaction: null;
  missedShot: null;
  placement: null;
  missedShotWay: null;
  type: null;
  rallies: null;
  servePlacement: null;
  courtPosition: null;
  betweenPointDuration: null;
}
```

### **Level 2 - Enhanced Tracking**
```typescript
interface Level2PointScore {
  p1Score: string;                    // "0", "15", "30", "40", "AD"
  p2Score: string;                    // "0", "15", "30", "40", "AD"
  pointWinner: "playerOne" | "playerTwo";
  isSecondService: boolean;
  type: string;                       // Point outcome type
  p1Reaction: string;                 // Player 1 reaction
  p2Reaction: string;                 // Player 2 reaction
  
  // All other fields: null
  missedShot: null;
  placement: null;
  missedShotWay: null;
  rallies: null;
  servePlacement: null;
  courtPosition: null;
  betweenPointDuration: null;
}
```

### **Level 3 - Advanced Charting**
```typescript
interface Level3PointScore {
  p1Score: string;                    // "0", "15", "30", "40", "AD"
  p2Score: string;                    // "0", "15", "30", "40", "AD"
  pointWinner: "playerOne" | "playerTwo";
  isSecondService: boolean;
  type: string;                       // Point outcome type
  p1Reaction: string;                 // Player 1 reaction
  p2Reaction: string;                 // Player 2 reaction
  missedShot: string | null;          // Shot error type
  placement: string | null;           // Shot placement
  missedShotWay: string | null;       // Shot technique
  rallies: string;                    // Rally length
  servePlacement: string | null;      // Serve placement
  courtPosition: string | null;       // Court zone
  betweenPointDuration: number;       // Time between points
}
```

## 🎾 **Field Value Specifications**

### **Score Values**
```typescript
type ScoreValue = "0" | "15" | "30" | "40" | "AD" | "Deuce";
```

### **Point Winner Values**
```typescript
type PointWinner = "playerOne" | "playerTwo";
```

### **Point Outcome Types (Level 2 & 3)**
```typescript
type PointOutcome = 
  | "ace"                    // Unreturnable serve
  | "service_winner"         // Serve that wins point
  | "returnWinner"           // Return shot that wins
  | "double_fault"           // Two consecutive faults
  | "return_unforced_error"  // Opponent error on return
  | "return_forcing_shot"    // Good return forces error
  | "in_play_neutral";       // Point continues normally
```

### **Player Reactions (Level 2 & 3)**
```typescript
type PlayerReaction = 
  | "positiveResponse"       // Celebration, satisfaction
  | "negativeResponse"       // Frustration, disappointment
  | "negativeSelfTalk"       // Self-criticism
  | "positiveSelfTalk"       // Self-encouragement
  | "noResponse";            // Neutral, no visible reaction
```

### **Shot Types (Level 3)**
```typescript
type ShotType = 
  | "forehand"               // Forehand shot
  | "backhand"               // Backhand shot
  | "volley"                 // Volley (any type)
  | "forehandSlice"          // Forehand slice
  | "backhandSlice"          // Backhand slice
  | "overhead"               // Overhead/smash
  | "forehandDropShot"       // Forehand drop shot
  | "backhandDropShot";      // Backhand drop shot
```

### **Shot Placement (Level 3)**
```typescript
type ShotPlacement = 
  | "downTheLine"            // Down the line shot
  | "crossCourt";            // Cross-court shot
```

### **Missed Shot Types (Level 3)**
```typescript
type MissedShotType = 
  | "net"                    // Ball hits net
  | "long"                   // Ball goes long
  | "wide"                   // Ball goes wide
  | "let";                   // Let (net cord)
```

### **Serve Placement (Level 3)**
```typescript
type ServePlacement = 
  | "wide"                   // Wide serve
  | "body"                   // Body serve
  | "t"                      // T-serve (center)
  | "net";                   // Net serve
```

### **Court Positions (Level 3)**
```typescript
type CourtPosition = 
  | "leftCourt"              // Left side of court
  | "rightCourt"             // Right side of court
  | "out";                   // Ball out of bounds
```

### **Rally Lengths (Level 3)**
```typescript
type RallyLength = 
  | "oneToFour"              // 1-4 shots
  | "fiveToEight"            // 5-8 shots
  | "nineToTwelve"           // 9-12 shots
  | "thirteenToTwenty"       // 13-20 shots
  | "twentyOnePlus";         // 21+ shots
```

## 🔌 **API Request Examples**

### **Level 1 - Basic Scoring**
```json
{
  "trackingLevel": "level1",
  "totalGameTime": 1800,
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
              "isSecondService": false
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

### **Level 2 - Enhanced Tracking**
```json
{
  "trackingLevel": "level2",
  "totalGameTime": 2400,
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
              "isSecondService": false,
              "type": "ace",
              "p1Reaction": "positiveResponse",
              "p2Reaction": "negativeResponse"
            },
            {
              "p1Score": "30",
              "p2Score": "0",
              "pointWinner": "playerOne",
              "isSecondService": false,
              "type": "service_winner",
              "p1Reaction": "positiveResponse",
              "p2Reaction": "negativeResponse"
            },
            {
              "p1Score": "40",
              "p2Score": "0",
              "pointWinner": "playerOne",
              "isSecondService": false,
              "type": "winner",
              "p1Reaction": "positiveResponse",
              "p2Reaction": "negativeResponse"
            },
            {
              "p1Score": "40",
              "p2Score": "0",
              "pointWinner": "playerOne",
              "isSecondService": false,
              "type": "winner",
              "p1Reaction": "positiveResponse",
              "p2Reaction": "negativeResponse"
            }
          ],
          "server": "playerOne"
        }
      ]
    }
  ]
}
```

### **Level 3 - Advanced Charting**
```json
{
  "trackingLevel": "level3",
  "totalGameTime": 3600,
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
              "isSecondService": false,
              "type": "ace",
              "p1Reaction": "positiveResponse",
              "p2Reaction": "negativeResponse",
              "missedShot": null,
              "placement": null,
              "missedShotWay": null,
              "rallies": "oneToFour",
              "servePlacement": "t",
              "courtPosition": "leftCourt",
              "betweenPointDuration": 25
            },
            {
              "p1Score": "30",
              "p2Score": "0",
              "pointWinner": "playerOne",
              "isSecondService": false,
              "type": "service_winner",
              "p1Reaction": "positiveResponse",
              "p2Reaction": "negativeResponse",
              "missedShot": null,
              "placement": null,
              "missedShotWay": null,
              "rallies": "fiveToEight",
              "servePlacement": "wide",
              "courtPosition": "rightCourt",
              "betweenPointDuration": 18
            },
            {
              "p1Score": "40",
              "p2Score": "0",
              "pointWinner": "playerOne",
              "isSecondService": false,
              "type": "winner",
              "p1Reaction": "positiveResponse",
              "p2Reaction": "negativeResponse",
              "missedShot": null,
              "placement": "crossCourt",
              "missedShotWay": "forehand",
              "rallies": "nineToTwelve",
              "servePlacement": "body",
              "courtPosition": "leftCourt",
              "betweenPointDuration": 22
            },
            {
              "p1Score": "40",
              "p2Score": "0",
              "pointWinner": "playerOne",
              "isSecondService": false,
              "type": "winner",
              "p1Reaction": "positiveResponse",
              "p2Reaction": "negativeResponse",
              "missedShot": null,
              "placement": "crossCourt",
              "missedShotWay": "forehand",
              "rallies": "nineToTwelve",
              "servePlacement": "body",
              "courtPosition": "leftCourt",
              "betweenPointDuration": 22
            }
          ],
          "server": "playerOne"
        }
      ]
    }
  ]
}
```

## 📱 **Implementation Guidelines**

### **Frontend Integration**

#### **1. Level Selection**
```typescript
// Allow users to select tracking level
const trackingLevels = [
  { value: 1, label: "Basic Scoring", description: "Essential match data only" },
  { value: 2, label: "Enhanced Tracking", description: "Shot analysis + reactions" },
  { value: 3, label: "Advanced Charting", description: "Professional-grade tracking" }
];
```

#### **2. Data Collection**
```typescript
// Collect data based on selected level
const collectPointData = (level: number, pointData: any) => {
  if (level === 1) {
    return {
      p1Score: pointData.p1Score,
      p2Score: pointData.p2Score,
      pointWinner: pointData.pointWinner,
      isSecondService: pointData.isSecondService
    };
  } else if (level === 2) {
    return {
      ...collectPointData(1, pointData),
      type: pointData.type,
      p1Reaction: pointData.p1Reaction,
      p2Reaction: pointData.p2Reaction
    };
  } else {
    return pointData; // Level 3: All fields
  }
};
```

#### **3. API Submission**
```typescript
const submitMatchData = async (matchData: any) => {
  const response = await fetch('/api/tennis/matches', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(matchData)
  });
  
  return response.json();
};
```

### **Backend Processing**

#### **1. Data Validation**
```typescript
const validateMatchData = (data: any) => {
  const { trackingLevel, sets } = data;
  
  // Validate required fields based on level
  if (trackingLevel === 'level1') {
    return validateLevel1Data(data);
  } else if (trackingLevel === 'level2') {
    return validateLevel2Data(data);
  } else if (trackingLevel === 'level3') {
    return validateLevel3Data(data);
  }
  
  throw new Error('Invalid tracking level');
};
```

#### **2. Data Storage**
```typescript
const storeMatchData = async (matchData: any) => {
  const { trackingLevel, sets, totalGameTime } = matchData;
  
  // Store base match data
  const match = await Match.create({
    trackingLevel,
    totalGameTime,
    status: 'in_progress'
  });
  
  // Store sets and games
  for (const setData of sets) {
    const set = await Set.create({
      matchId: match.id,
      p1TotalScore: setData.p1TotalScore,
      p2TotalScore: setData.p2TotalScore
    });
    
    // Store games within set
    for (const gameData of setData.games) {
      await Game.create({
        setId: set.id,
        gameNumber: gameData.gameNumber,
        server: gameData.server,
        scores: gameData.scores
      });
    }
  }
  
  return match;
};
```

## 📊 **Data Analytics**

### **Level 1 Analytics**
- Basic scoring statistics
- Match duration analysis
- Win/loss patterns
- Service effectiveness

### **Level 2 Analytics**
- Point outcome analysis
- Player reaction patterns
- Shot type effectiveness
- Mental game insights

### **Level 3 Analytics**
- Comprehensive shot analysis
- Court positioning heat maps
- Rally length endurance metrics
- Advanced tactical insights
- Professional performance metrics

## 🔒 **Security & Validation**

### **Input Validation**
```typescript
const validatePointScore = (score: any, level: number) => {
  // Required fields for all levels
  if (!score.p1Score || !score.p2Score || !score.pointWinner) {
    throw new Error('Missing required fields');
  }
  
  // Level-specific validation
  if (level >= 2) {
    if (!score.type || !score.p1Reaction || !score.p2Reaction) {
      throw new Error('Missing Level 2 required fields');
    }
  }
  
  if (level === 3) {
    if (!score.rallies || !score.betweenPointDuration) {
      throw new Error('Missing Level 3 required fields');
    }
  }
};
```

### **Data Sanitization**
```typescript
const sanitizeMatchData = (data: any) => {
  // Remove any potentially harmful fields
  const { trackingLevel, totalGameTime, sets } = data;
  
  return {
    trackingLevel,
    totalGameTime: Math.max(0, Math.min(totalGameTime, 86400)), // Max 24 hours
    sets: sets.map(sanitizeSetData)
  };
};
```

## 📋 **Best Practices**

### **1. Level Selection**
- Start with Level 1 for basic needs
- Upgrade to Level 2 for competitive play
- Use Level 3 for professional analysis

### **2. Data Collection**
- Collect only what you need
- Validate data at the source
- Handle missing data gracefully

### **3. Performance**
- Batch API calls when possible
- Cache frequently accessed data
- Optimize for mobile devices

### **4. User Experience**
- Provide clear level descriptions
- Show data collection progress
- Offer data export options

## 🚀 **Getting Started**

### **1. Choose Your Level**
- **Level 1**: Basic scoring for casual play
- **Level 2**: Enhanced tracking for competitive players
- **Level 3**: Advanced charting for professionals

### **2. Implement Data Collection**
- Follow the field specifications
- Implement level-appropriate validation
- Handle data persistence

### **3. Integrate with Your App**
- Use the provided API endpoints
- Implement proper error handling
- Add analytics and insights

### **4. Test and Validate**
- Test with sample data
- Validate API responses
- Ensure data integrity

## 📞 **Support & Resources**

### **Documentation**
- [Level 1 Documentation](./level1_documentation.md)
- [Level 2 Documentation](./level2_documentation.md)
- [Level 3 Documentation](./level3_documentation.md)

### **API Reference**
- Base URL: `https://your-api-domain.com/api/tennis`
- Authentication: Bearer token required
- Rate limiting: 100 requests per minute

### **Contact**
- Technical support: tech@tennistracking.com
- API issues: api@tennistracking.com
- General questions: support@tennistracking.com

---

**Happy Tennis Tracking! 🎾📊**
