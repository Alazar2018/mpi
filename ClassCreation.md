# 🎾 Class Creation Form Documentation

## Overview
The Class Creation form is a dynamic, role-based event creation system that allows coaches to create tennis classes with complex objective hierarchies and validation rules. The form automatically adapts its fields based on user selections, ensuring data integrity and providing an intuitive user experience.

## 🏗️ Architecture

### Component Structure
- **File**: `src/components/CreateEvent.tsx`
- **Type**: Modal form component
- **Role-Based Access**: Only coaches and admins can create classes
- **State Management**: React hooks with complex nested state objects

### Key Features
- **Dynamic Field Rendering**: Fields appear/disappear based on selections
- **Cascading Validation**: Dependent fields reset when parent selections change
- **Role-Based Restrictions**: Individual sessions limited to 1 player
- **Real-time Validation**: Form adapts to user input in real-time

## 📋 Form Properties

### Core Event Properties
```typescript
interface ClassFormData {
  type: 'class'                    // Event type (fixed for classes)
  date: string                     // Class date (required)
  time: string                     // Start time (required)
  endTime: string                  // End time (required, class only)
}
```

### Session Configuration
```typescript
interface SessionConfig {
  sessionType: 'individual' | 'group' | 'assessment' | 'recovery'
  levelPlan: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  goal: string                     // Required for individual sessions
}
```

### Objective Hierarchy
```typescript
interface ObjectiveStructure {
  objective: 'physical' | 'technical' | 'tactics' | 'mental' | 'recovery'
  subObjective: string             // Dynamic based on objective
  nestedSubObjective: string       // Conditional for specific sub-objectives
}
```

### Technical Fields (Conditional)
```typescript
interface TechnicalFields {
  technicalStroke: string          // Required when objective is 'technical'
  technicalProblem: string         // Required when technicalStroke is present
  videoUrl: string                 // Required for technical objectives
}
```

### Tactics Fields (Conditional)
```typescript
interface TacticsFields {
  tacticsType: string              // Required for tactics consistency/placement
  placementDetails: PlacementDetails
  consistencyResult: ConsistencyResult
}
```

### Player Management
```typescript
interface PlayerManagement {
  selectedClassPlayers: string[]   // Array of player IDs
  // Individual sessions: max 1 player
  // Group sessions: unlimited players
}
```

## 🔄 Dynamic Field Behavior

### 1. Objective-Based Field Rendering

#### Physical Objectives
- **Available Sub-Objectives**: endurance, speed, agility, flexibility, coordination, balance, recovery, other
- **Dynamic Fields**: None (simple selection)

#### Technical Objectives
- **Available Sub-Objectives**: allFundamentalStrokes, advancedShots
- **Dynamic Fields**: 
  - Technical Stroke (required)
  - Technical Problem (required)
  - Video URL (required)

#### Tactics Objectives
- **Available Sub-Objectives**: consistency, placement, gamePlan, gameStyle, fiveGameSituations, anticipation, percentagePlay, reducingUnforcedErrors, ruleNumberOne, workingWeakness
- **Dynamic Fields**:
  - Tactics Type (for consistency/placement)
  - Nested Sub-Objective (for gameStyle/fiveGameSituations)

#### Mental Objectives
- **Available Sub-Objectives**: motivation, concentration, emotionRegulation, selfTalk, selfConfidence, relaxation, routine, goalSetting, mindfulness, momentum
- **Dynamic Fields**: None (simple selection)

#### Recovery Objectives
- **Available Sub-Objectives**: sleep, coldTherapy, mental, nutrition, hydration, physical
- **Dynamic Fields**: None (simple selection)

### 2. Nested Sub-Objective Logic

#### Game Style (when subObjective = 'gameStyle')
- **Options**: serveAndVolley, aggressiveBaseLiner, counterPuncher, allAround
- **Labels**: "Serve and Volley", "Aggressive Base Liner", "Counter Puncher", "All Around"

#### Five Game Situations (when subObjective = 'fiveGameSituations')
- **Options**: serving, returning, rallyingFromTheBaseline, passing, approachingVolleying
- **Labels**: "Serving", "Returning", "Rallying from the Baseline", "Passing", "Approaching & Volleying"

### 3. Technical Stroke Options

#### Fundamental Strokes
- forehand, backhand, serve, lob, slice, overhead, volley

#### Advanced Shots
- insideOutForehand, insideInForehand, topspinLob, disguisingShots, dropShots, halfVolley

### 4. Tactics Type Options

#### Consistency Tactics
- **Options**: rallyLength1-4, rallyLength5-8, rallyLength9+
- **Labels**: "Rally Length 1-4", "Rally Length 5-8", "Rally Length 9+"
- **Dynamic Fields**: Consistency Result with rally length inputs

#### Placement Tactics
- **Options**: crossCourt, downTheLine, downTheMiddle, shortAngle, dropShorts, insideOut, insideIn, halfVolley
- **Labels**: "Cross Court", "Down the Line", "Down the Middle", "Short Angle", "Drop Shorts", "Inside Out", "Inside In", "Half Volley"
- **Dynamic Fields**: Placement Details with stroke-specific number inputs

## ✅ Validation Rules

### Required Fields
1. **Session Type** - Must be selected
2. **Level Plan** - Must be selected
3. **Objective** - Must be selected
4. **Sub-Objective** - Must be selected
5. **Date** - Must be provided
6. **Start Time** - Must be provided
7. **End Time** - Must be provided (class only)
8. **Players** - At least one player must be selected

### Conditional Requirements

#### Individual Session Restrictions
- **Goal Field**: Required when `sessionType === 'individual'`
- **Player Limit**: Maximum 1 player allowed
- **Validation**: Form prevents adding multiple players

#### Technical Objective Requirements
- **Technical Stroke**: Required when `objective === 'technical'`
- **Technical Problem**: Required when `technicalStroke` is present
- **Video URL**: Required for technical analysis

#### Tactics Objective Requirements
- **Tactics Type**: Required when `subObjective` is 'consistency' or 'placement'
- **Placement Details**: Required when `subObjective === 'placement'` and `tacticsType` is selected
- **Consistency Result**: Required when `subObjective === 'consistency'` and `tacticsType` is selected

### Field Dependencies

#### Cascading Resets
When a parent field changes, all dependent fields are automatically reset:

```typescript
// Example: When objective changes
handleObjectiveChange(objective) {
  setFormData(prev => ({
    ...prev,
    objective,
    subObjective: '',           // Reset
    nestedSubObjective: '',     // Reset
    technicalStroke: '',        // Reset
    technicalProblem: '',       // Reset
    videoUrl: '',              // Reset
    tacticsType: '',           // Reset
    placementDetails: { ... }, // Reset to defaults
    consistencyResult: { ... }  // Reset to defaults
  }));
}
```

#### Placement Details Structure
```typescript
interface PlacementDetails {
  crossCourtForehand: number
  crossCourtBackhand: number
  downTheLineForehand: number
  downTheLineBackhand: number
  downTheMiddleForehand: number
  downTheMiddleBackhand: number
  shortAngleForehand: number
  shortAngleBackhand: number
  dropShortsForehand: number
  dropShortsBackhand: number
  insideOutForehand: number
  insideInForehand: number
  halfVolleyForehand: number
  halfVolleyBackhand: number
  total: number
}
```

#### Consistency Result Structure
```typescript
interface ConsistencyResult {
  rallyLength1to4: number      // For rallyLength1-4 tactics
  rallyLength5to8: number      // For rallyLength5-8 tactics
  rallyLength9Plus: number     // For rallyLength9+ tactics
  total: number                // Required total
}
```

## 🎨 User Interface Features

### Visual Indicators
- **Required Fields**: Marked with red asterisk (*)
- **Individual Session Warning**: Yellow info box explaining player restrictions
- **Role-Based Labels**: Clear indication of coach-only features
- **Dynamic Placeholders**: Context-aware input placeholders

### Player Selection UX
- **Search Functionality**: Real-time player search with name/email
- **Temporary Selection**: Users can select multiple players before adding
- **Batch Addition**: "Add Selected" button for efficient player management
- **Visual Feedback**: Color-coded selection states (blue for temp, green for added)

### Form State Management
- **Smart Defaults**: Coaches default to 'training' event type
- **Persistent State**: Form maintains selections during navigation
- **Auto-Correction**: Invalid states automatically corrected
- **Reset Logic**: Comprehensive form reset with role-based defaults

## 🔧 Technical Implementation

### State Management
```typescript
const [formData, setFormData] = useState({
  // Core fields
  type: 'class',
  date: selectedDate || '',
  time: '',
  endTime: '',
  
  // Session config
  sessionType: '',
  levelPlan: '',
  goal: '',
  
  // Objective hierarchy
  objective: '',
  subObjective: '',
  nestedSubObjective: '',
  
  // Technical fields
  technicalStroke: '',
  technicalProblem: '',
  videoUrl: '',
  
  // Tactics fields
  tacticsType: '',
  placementDetails: { /* detailed structure */ },
  consistencyResult: { /* detailed structure */ },
  
  // Additional fields
  additionalInfo: '',
  selectedClassPlayers: []
});
```

### Helper Functions
```typescript
// Conditional rendering helpers
const shouldShowNestedSubObjective = () => {
  return formData.objective === 'tactics' && 
         (formData.subObjective === 'gameStyle' || 
          formData.subObjective === 'fiveGameSituations');
};

const shouldShowTechnicalFields = () => {
  return formData.objective === 'technical' && 
         (formData.subObjective === 'allFundamentalStrokes' || 
          formData.subObjective === 'advancedShots');
};

const shouldShowTacticsType = () => {
  return formData.objective === 'tactics' && 
         (formData.subObjective === 'consistency' || 
          formData.subObjective === 'placement');
};
```

### Event Handlers
```typescript
// Session type change handler
const handleSessionTypeChange = (sessionType: string) => {
  setFormData(prev => ({ ...prev, sessionType }));
  
  // Auto-correct player count for individual sessions
  if (sessionType === 'individual') {
    if (formData.selectedClassPlayers.length > 1) {
      setFormData(prev => ({
        ...prev,
        selectedClassPlayers: prev.selectedClassPlayers.slice(0, 1)
      }));
    }
    setTempSelectedClassPlayers([]);
  }
};
```

## 🚀 Future Enhancements

### Potential Improvements
1. **API Integration**: Connect to `class.server.ts` for backend validation
2. **Real-time Validation**: Server-side validation feedback
3. **Template System**: Save and reuse class configurations
4. **Bulk Operations**: Create multiple classes with similar settings
5. **Advanced Analytics**: Track class effectiveness and player progress

### Backend Integration Points
- **Class Creation**: POST to `/api/v1/classes`
- **Player Validation**: Verify player IDs exist and are accessible
- **Schedule Validation**: Check for time conflicts and court availability
- **Objective Validation**: Server-side validation of complex field dependencies

## 📚 Usage Examples

### Creating a Technical Class
1. Select "Class" event type
2. Choose "Individual Session" and "Advanced" level
3. Enter session goal (required for individual)
4. Select "Technical" objective
5. Choose "All Fundamental Strokes" sub-objective
6. Select specific technical stroke (e.g., "Forehand")
7. Describe technical problem
8. Provide video URL for analysis
9. Select single player (individual session restriction)
10. Set date and time range

### Creating a Tactics Class
1. Select "Class" event type
2. Choose "Group Session" and "Intermediate" level
3. Select "Tactics" objective
4. Choose "Placement" sub-objective
5. Select "Cross Court" tactics type
6. Enter placement details for forehand/backhand
7. Set total placement goal
8. Select multiple players (group session)
9. Set date and time range

## 🎯 Key Takeaways

1. **Dynamic Nature**: Form adapts to user selections in real-time
2. **Validation Logic**: Complex business rules enforced at UI level
3. **User Experience**: Intuitive interface with clear visual feedback
4. **Data Integrity**: Cascading resets prevent invalid states
5. **Role-Based Access**: Coaches have full access, players are restricted
6. **Scalable Architecture**: Easy to add new objectives and fields

This documentation provides a comprehensive understanding of the Class Creation form's capabilities, validation rules, and dynamic behavior for your development team.
