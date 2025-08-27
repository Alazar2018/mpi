# Level 2 - Detailed Tracking Documentation

## Overview
Level 2 provides enhanced tennis match tracking with basic shot analysis and player reactions. It builds upon Level 1 by adding point outcomes, player reactions, and basic shot details while maintaining a user-friendly interface.

## 🎯 **What Level 2 Tracks**

### **Required Fields (7 fields total):**
- ✅ `p1Score` - Player 1's score (0, 15, 30, 40, AD)
- ✅ `p2Score` - Player 2's score (0, 15, 30, 40, AD)  
- ✅ `pointWinner` - Who won the point ("playerOne" or "playerTwo")
- ✅ `isSecondService` - Whether it was first or second service (true/false)
- ✅ `type` - Point outcome type (ace, winner, double_fault, etc.)
- ✅ `p1Reaction` - Player 1's emotional response
- ✅ `p2Reaction` - Player 2's emotional response

### **All Other Fields: NULL**
- ❌ `missedShot` - Always null
- ❌ `placement` - Always null
- ❌ `missedShotWay` - Always null
- ❌ `rallies` - Always null
- ❌ `servePlacement` - Always null
- ❌ `courtPosition` - Always null
- ❌ `betweenPointDuration` - Always null

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
- ✅ **"TAP TO ADD POINT"** buttons visible
- ✅ **Score numbers** displayed on court (0, 15, 30, 40, AD, Deuce)
- ✅ **Clickable scoring areas** on left and right sides
- ✅ **Player names** displayed on court sides

### **Scoring Method:**
- 🎯 **Click left court** to add point for Player 1
- 🎯 **Click right court** to add point for Player 2
- 🎯 **Point outcome selection** after scoring
- 🎯 **Player reaction tracking** for emotional analysis

## 🔌 **API Integration**

### **Request Payload Structure:**
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

### **Key API Features:**
- 🎯 **Last point duplicated** in each game's scores array
- 🎯 **Point outcome tracking** for shot analysis
- 🎯 **Player reaction data** for emotional analysis
- 🎯 **Enhanced statistics** without overwhelming complexity

## 📱 **User Experience**

### **Match Flow:**
1. **Select Server** - Choose who serves first
2. **Start Match** - Click "Start Match" button
3. **Score Points** - Click court areas to add points
4. **Select Outcome** - Choose point result (ace, winner, etc.)
5. **Track Reactions** - Record player emotional responses
6. **Complete Match** - Submit final result

### **Point Outcome Selection:**
- 🎯 **Ace** - Unreturnable serve
- 🎯 **Service Winner** - Serve that opponent can't return effectively
- 🎯 **Return Winner** - Return shot that wins the point
- 🎯 **Double Fault** - Two consecutive service faults
- 🎯 **Return Unforced Error** - Opponent makes mistake on return
- 🎯 **Return Forcing Shot** - Good return that forces error
- 🎯 **In Play Neutral** - Point continues normally

### **Player Reactions:**
- 😊 **Positive Response** - Celebration, satisfaction
- 😔 **Negative Response** - Frustration, disappointment
- 🗣️ **Negative Self Talk** - Self-criticism
- 💪 **Positive Self Talk** - Self-encouragement
- 😐 **No Response** - Neutral, no visible reaction

### **Visual Indicators:**
- 🎾 **Green court** with clear scoring areas
- 📊 **Real-time score updates** on court
- 🏆 **Automatic winner detection** for games/sets
- ⏱️ **Game timer** showing match duration
- 🎯 **Point outcome modals** for detailed tracking

### **Data Persistence:**
- 💾 **Auto-save** to localStorage
- 📤 **Manual save** to API
- 🔄 **Resume matches** from saved state
- 📊 **Progress tracking** throughout match

## 🚀 **Use Cases**

### **Perfect For:**
- 🎾 **Competitive tennis matches**
- 🏫 **Tennis coaching and analysis**
- 📊 **Player performance tracking**
- 🎯 **Match strategy analysis**
- 📈 **Basic performance metrics**

### **Not Suitable For:**
- 🎯 **Advanced shot placement tracking**
- 🧠 **Detailed psychological analysis**
- 📊 **Complex statistical modeling**
- 🎾 **Professional tournament tracking**

## 🔧 **Technical Implementation**

### **State Management:**
```typescript
interface PointScore {
  p1Score: string;
  p2Score: string;
  pointWinner: "playerOne" | "playerTwo";
  isSecondService: boolean;
  type: string | null;           // Point outcome
  p1Reaction: string | null;     // Player 1 reaction
  p2Reaction: string | null;     // Player 2 reaction
  // All other fields: null
}
```

### **Data Flow:**
1. **User clicks court** → `addPoint()` called
2. **Point processed** → `trackPointWithLevel()` with level 2
3. **Outcome modal** → User selects point result
4. **Reaction modal** → User records player responses
5. **Game state updated** → Automatic progression
6. **Data saved** → localStorage + API submission

### **Performance:**
- ⚡ **Moderate processing** - enhanced data collection
- 💾 **Efficient storage** - focused on essential details
- 🔄 **Fast updates** - streamlined workflow
- 📱 **Mobile optimized** - responsive design

## 📊 **Analytics & Insights**

### **Available Statistics:**
- 🎯 **Point outcomes** by type and frequency
- 😊 **Player reactions** patterns
- 🏆 **Service effectiveness** (aces, service winners)
- 📈 **Return performance** analysis
- ⏱️ **Match duration** and pacing

### **Performance Metrics:**
- 🎾 **Ace percentage** per player
- 🎯 **Winner frequency** by player
- ❌ **Error patterns** and frequency
- 🧠 **Mental game** through reaction tracking
- 📊 **Match flow** and momentum shifts

## 📋 **Summary**

Level 2 provides **enhanced tennis match tracking** with point outcomes and player reactions, while maintaining an intuitive user experience. It's perfect for players and coaches who want deeper insights without the complexity of advanced tracking.

**Key Benefits:**
- 🎯 **Enhanced scoring** with outcome tracking
- 😊 **Player reaction analysis** for mental game insights
- 📊 **Better statistics** without overwhelming complexity
- 🚀 **Professional tracking** for competitive matches
- 💾 **Comprehensive data** for performance analysis
