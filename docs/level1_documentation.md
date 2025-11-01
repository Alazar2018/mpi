# Level 1 - Basic Scoring Documentation

## Overview
Level 1 provides the most basic tennis match tracking with minimal data requirements. Perfect for casual matches or when you only need essential scoring information.

## 🎯 **What Level 1 Tracks**

### **Required Fields (4 fields only):**
- ✅ `p1Score` - Player 1's score (0, 15, 30, 40, AD)
- ✅ `p2Score` - Player 2's score (0, 15, 30, 40, AD)  
- ✅ `pointWinner` - Who won the point ("playerOne" or "playerTwo")
- ✅ `isSecondService` - Whether it was first or second service (true/false)

### **All Other Fields: NULL**
- ❌ `p1Reaction` - Always null
- ❌ `p2Reaction` - Always null
- ❌ `missedShot` - Always null
- ❌ `placement` - Always null
- ❌ `missedShotWay` - Always null
- ❌ `type` - Always null
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
- 🎯 **Simple button clicks** - no complex tracking

## 🔌 **API Integration**

### **Request Payload Structure:**
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

### **Key API Features:**
- 🎯 **Last point duplicated** in each game's scores array
- 🎯 **Minimal data** - only essential scoring information
- 🎯 **Clean payload** - no unnecessary fields
- 🎯 **Fast processing** - lightweight data structure

## 📱 **User Experience**

### **Match Flow:**
1. **Select Server** - Choose who serves first
2. **Start Match** - Click "Start Match" button
3. **Score Points** - Click court areas to add points
4. **Track Games** - Automatic game/set progression
5. **Complete Match** - Submit final result

### **Visual Indicators:**
- 🎾 **Green court** with clear scoring areas
- 📊 **Real-time score updates** on court
- 🏆 **Automatic winner detection** for games/sets
- ⏱️ **Game timer** showing match duration

### **Data Persistence:**
- 💾 **Auto-save** to localStorage
- 📤 **Manual save** to API
- 🔄 **Resume matches** from saved state
- 📊 **Progress tracking** throughout match

## 🚀 **Use Cases**

### **Perfect For:**
- 🎾 **Casual tennis matches**
- 🏫 **Tennis lessons and coaching**
- 📊 **Basic match statistics**
- 🎯 **Quick score tracking**

### **Not Suitable For:**
- 📈 **Advanced analytics**
- 🎯 **Shot placement tracking**
- 🧠 **Player reaction analysis**
- 📊 **Detailed performance metrics**

## 🔧 **Technical Implementation**

### **State Management:**
```typescript
interface PointScore {
  p1Score: string;
  p2Score: string;
  pointWinner: "playerOne" | "playerTwo";
  isSecondService: boolean;
  // All other fields: null
}
```

### **Data Flow:**
1. **User clicks court** → `addPoint()` called
2. **Point processed** → `endPoint()` updates scores
3. **Game state updated** → Automatic progression
4. **Data saved** → localStorage + API submission

### **Performance:**
- ⚡ **Lightweight** - minimal data processing
- 💾 **Efficient storage** - small payload sizes
- 🔄 **Fast updates** - simple state changes
- 📱 **Mobile optimized** - responsive design

## 📋 **Summary**

Level 1 provides the **simplest possible tennis match tracking** while maintaining all essential scoring functionality. It's perfect for users who want to track matches without complexity, focusing purely on the core tennis scoring system.

**Key Benefits:**
- 🎯 **Simple and intuitive** interface
- 📊 **Essential scoring** without distractions
- 🚀 **Fast and lightweight** operation
- 💾 **Reliable data persistence**
- 📱 **Mobile-friendly** design
