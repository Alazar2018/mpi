# Level 3 - Advanced Charting Documentation

## Overview
Level 3 provides the most comprehensive tennis match tracking with advanced shot analysis, court positioning, rally tracking, and detailed performance metrics. This is the professional-grade tracking system used by coaches, analysts, and serious players.

## 🎯 **What Level 3 Tracks**

### **All Fields Populated:**
- ✅ `p1Score` - Player 1's score (0, 15, 30, 40, AD)
- ✅ `p2Score` - Player 2's score (0, 15, 30, 40, AD)  
- ✅ `pointWinner` - Who won the point ("playerOne" or "playerTwo")
- ✅ `isSecondService` - Whether it was first or second service (true/false)
- ✅ `type` - Point outcome type (ace, winner, double_fault, etc.)
- ✅ `p1Reaction` - Player 1's emotional response
- ✅ `p2Reaction` - Player 2's emotional response
- ✅ `missedShot` - Type of missed shot (net, long, wide, let)
- ✅ `placement` - Shot placement (downTheLine, crossCourt)
- ✅ `missedShotWay` - Shot technique used (forehand, backhand, volley, etc.)
- ✅ `rallies` - Rally length category (oneToFour, fiveToEight, etc.)
- ✅ `servePlacement` - Serve placement (wide, body, t, net)
- ✅ `courtPosition` - Court zone where ball landed
- ✅ `betweenPointDuration` - Time between points in seconds

## 🎾 **Scoring Rules**

### **Game Scoring:**
- **0 → 15 → 30 → 40 → Game Win**
- **Deuce**: When both players reach 40-40
- **Advantage**: Player must win 2 consecutive points after deuce
- **Game Win**: 4+ points with 2+ point lead

### **Set Scoring:**
- **6 games** to win a set
- **2+ game lead** required (except tiebreak)
- **Tiebreak**: At 6-6, first to 7 points with 2+ point lead

### **Match Scoring:**
- **Best of 1, 3, or 5 sets**
- **2 sets** needed to win Best of 3
- **3 sets** needed to win Best of 5

## 🖥️ **User Interface**

### **Court Display:**
- ❌ **NO "TAP TO ADD POINT"** buttons (not needed)
- ❌ **NO score numbers** displayed on court
- ✅ **Court zone clicks** for advanced tracking
- ✅ **Interactive court areas** for shot placement
- ✅ **Clean, professional appearance**

### **Scoring Method:**
- 🎯 **Click court zones** to track shot placement
- 🎯 **Advanced modals** for detailed shot analysis
- 🎯 **Rally length tracking** for point duration
- 🎯 **Comprehensive shot details** for analysis

## 🔌 **API Integration**

### **Request Payload Structure:**
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

### **Key API Features:**
- 🎯 **Last point duplicated** in each game's scores array
- 🎯 **Complete shot analysis** for every point
- 🎯 **Court positioning data** for tactical analysis
- 🎯 **Rally length tracking** for endurance metrics
- 🎯 **Professional-grade data** for advanced analytics

## 📱 **User Experience**

### **Match Flow:**
1. **Select Server** - Choose who serves first
2. **Start Match** - Click "Start Match" button
3. **Track Points** - Use court zone clicks and modals
4. **Record Shot Details** - Comprehensive shot analysis
5. **Monitor Rally Length** - Track point duration
6. **Complete Match** - Submit final result

### **Point Outcome Selection:**
- 🎯 **Ace** - Unreturnable serve
- 🎯 **Ball In Court** - Ball lands in play
- 🎯 **Return Error** - Opponent makes mistake
- 🎯 **Double Fault** - Two consecutive service faults

### **Shot Analysis:**
- 🎾 **Shot Type**: forehand, backhand, volley, slice, overhead, drop shot
- 🎯 **Shot Placement**: downTheLine, crossCourt
- 🏟️ **Court Position**: leftCourt, rightCourt, out
- 🎾 **Serve Placement**: wide, body, t, net
- ⏱️ **Rally Length**: oneToFour, fiveToEight, nineToTwelve, thirteenToTwenty, twentyOnePlus

### **Player Reactions:**
- 😊 **Positive Response** - Celebration, satisfaction
- 😔 **Negative Response** - Frustration, disappointment
- 🗣️ **Negative Self Talk** - Self-criticism
- 💪 **Positive Self Talk** - Self-encouragement
- 😐 **No Response** - Neutral, no visible reaction

### **Visual Indicators:**
- 🎾 **Clean court** with interactive zones
- 📊 **Real-time tracking** through modals
- 🏆 **Automatic progression** for games/sets
- ⏱️ **Game timer** and in-between time tracking
- 🎯 **Advanced modals** for detailed input

### **Data Persistence:**
- 💾 **Auto-save** to localStorage
- 📤 **Manual save** to API
- 🔄 **Resume matches** from saved state
- 📊 **Comprehensive tracking** throughout match

## 🚀 **Use Cases**

### **Perfect For:**
- 🎾 **Professional tennis matches**
- 🏫 **Elite coaching and analysis**
- 📊 **Advanced performance tracking**
- 🎯 **Tactical match analysis**
- 📈 **Professional statistics**
- 🏆 **Tournament tracking**
- 🧠 **Psychological analysis**

### **Not Suitable For:**
- 🎾 **Casual recreational play**
- 📱 **Quick score tracking**
- 🎯 **Simple match recording**

## 🔧 **Technical Implementation**

### **State Management:**
```typescript
interface PointScore {
  p1Score: string;
  p2Score: string;
  pointWinner: "playerOne" | "playerTwo";
  isSecondService: boolean;
  type: string | null;                    // Point outcome
  p1Reaction: string | null;              // Player 1 reaction
  p2Reaction: string | null;              // Player 2 reaction
  missedShot: string | null;              // Shot error type
  placement: string | null;               // Shot placement
  missedShotWay: string | null;           // Shot technique
  rallies: string | null;                 // Rally length
  servePlacement: string | null;          // Serve placement
  courtPosition: string | null;           // Court zone
  betweenPointDuration: number | null;    // Time between points
}
```

### **Data Flow:**
1. **User clicks court zone** → `handleCourtZoneClick()` called
2. **Advanced modal opens** → User selects shot details
3. **Point processed** → `trackPointWithLevel()` with level 3
4. **Comprehensive data** → All fields populated
5. **Game state updated** → Automatic progression
6. **Data saved** → localStorage + API submission

### **Performance:**
- ⚡ **Advanced processing** - comprehensive data collection
- 💾 **Efficient storage** - optimized for professional use
- 🔄 **Fast updates** - streamlined advanced workflow
- 📱 **Mobile optimized** - responsive professional interface

## 📊 **Analytics & Insights**

### **Available Statistics:**
- 🎯 **Complete shot analysis** by type and placement
- 🏟️ **Court positioning** heat maps and patterns
- ⏱️ **Rally length analysis** for endurance metrics
- 🎾 **Serve effectiveness** by placement and type
- 📈 **Return performance** with detailed shot tracking
- 🧠 **Mental game analysis** through reaction patterns
- 📊 **Match flow** and momentum analysis

### **Performance Metrics:**
- 🎾 **Shot success rates** by technique and placement
- 🏟️ **Court coverage** and positioning efficiency
- ⏱️ **Rally endurance** and stamina patterns
- 🎯 **Serve placement** effectiveness
- 📈 **Return strategy** success rates
- ❌ **Error patterns** by shot type and situation
- 🧠 **Mental resilience** through reaction tracking

### **Advanced Analytics:**
- 📊 **Heat maps** of court usage
- 📈 **Performance trends** over time
- 🎯 **Tactical analysis** of shot selection
- ⏱️ **Pacing analysis** for match strategy
- 🏆 **Competitive insights** for improvement

## 🎯 **Court Zone System**

### **Zone Layout (6 zones per side):**
```
Player 1 (Left)          Player 2 (Right)
┌─────────┬─────────┐    ┌─────────┬─────────┐
│   W1    │   W1    │    │   W1    │   W1    │
├─────────┼─────────┤    ├─────────┼─────────┤
│   B1    │   B1    │    │   B1    │   B1    │
├─────────┼─────────┤    ├─────────┼─────────┤
│   T1    │   T1    │    │   T1    │   T1    │
├─────────┼─────────┤    ├─────────┼─────────┤
│   T2    │   T2    │    │   T2    │   T2    │
├─────────┼─────────┤    ├─────────┼─────────┤
│   B2    │   B2    │    │   B2    │   B2    │
├─────────┼─────────┤    ├─────────┼─────────┤
│   W2    │   W2    │    │   W2    │   W2    │
└─────────┴─────────┘    └─────────┴─────────┘
```

### **Zone Types:**
- **W (Wide)**: Side areas for wide shots
- **B (Back)**: Backcourt areas for deep shots
- **T (Top)**: Mid-court areas for approach shots

## 📋 **Summary**

Level 3 provides **professional-grade tennis match tracking** with comprehensive shot analysis, court positioning, and advanced performance metrics. This is the ultimate tracking system for serious players, coaches, and analysts who need detailed insights for performance improvement.

**Key Benefits:**
- 🎯 **Complete shot analysis** for every point
- 🏟️ **Advanced court positioning** tracking
- ⏱️ **Rally length analysis** for endurance metrics
- 📊 **Professional statistics** and insights
- 🧠 **Mental game analysis** through reactions
- 🎾 **Tactical insights** for strategy development
- 📈 **Comprehensive performance** tracking
