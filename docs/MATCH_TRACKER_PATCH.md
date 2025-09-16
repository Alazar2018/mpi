# Match Tracker Comprehensive Patch

This file contains all the specific code changes needed to update the match tracker for the enhanced API.

## ✅ COMPLETED CHANGES

### 1. Enhanced Imports ✅
```typescript
// ✅ DONE - Added to imports
import { 
  getMatchRules, 
  isMatchComplete as isMatchCompleteUtil, 
  isSetComplete,
  shouldStartTiebreak,
  getMatchWinner,
  getMatchFormatDisplayName,
  getMatchProgressDescription,
  getSetProgressDescription,
  convertLegacyMatchType,
  type MatchFormat,
  type ScoringVariation,
  type MatchRules
} from "@/utils/matchFormatUtils";
```

### 2. Enhanced MatchState Interface ✅
```typescript
// ✅ DONE - Updated interface
interface MatchState {
  bestOf: 1 | 3 | 5; // Legacy field - kept for backward compatibility
  currentSet: number;
  sets: { player1: number; player2: number }[];
  games: { 
    player1: number; 
    player2: number;
    scores: PointScore[];
  }[];
  isTieBreak: boolean;
  isDeuce: boolean;
  hasAdvantage: 1 | 2 | null;
  level: 1 | 2 | 3;
  server: 1 | 2 | null;
  // ✅ Enhanced format fields
  matchFormat?: MatchFormat;
  scoringVariation?: ScoringVariation;
  customTiebreakRules?: Record<string, number>;
  noAdScoring?: boolean;
  tieBreakRule?: number;
}
```

### 3. Enhanced Match State Initialization ✅
```typescript
// ✅ DONE - Updated state initialization
const [match, setMatch] = useState<MatchState>({
  bestOf: 3,
  currentSet: 0,
  sets: Array.from({ length: 3 }, () => ({ player1: 0, player2: 0 })),
  games: [{ player1: 0, player2: 0, scores: [] }],
  isTieBreak: false,
  isDeuce: false,
  hasAdvantage: null,
  level: (selectedLevel ? parseInt(selectedLevel) : 1) as 1 | 2 | 3,
  server: null as 1 | 2 | null,
  // ✅ Enhanced format fields with defaults
  matchFormat: 'bestOfThree',
  scoringVariation: 'standard',
  customTiebreakRules: undefined,
  noAdScoring: false,
  tieBreakRule: 7
});
```

## 🔄 PENDING CHANGES - NEED TO BE APPLIED

### 4. Update Match Data Loading Logic
**Find this pattern in useEffect where matchData is loaded:**

```typescript
// ❌ CURRENT (needs updating)
setMatch(prev => ({
  ...prev,
  bestOf: matchData.matchType === 'one' ? 1 : matchData.matchType === 'three' ? 3 : matchData.matchType === 'five' ? 5 : 3,
  sets: (matchData as any).status === 'saved' ? prev.sets : Array.from({ length: matchData.matchType === 'one' ? 1 : 3 }, () => ({ player1: 0, player2: 0 }))
}));

// ✅ NEW (replace with this)
const matchFormat = matchData.match.matchFormat || convertLegacyMatchType(matchData.match.matchType || 'three');
const rules = getMatchRules(
  matchFormat,
  matchData.match.scoringVariation,
  matchData.match.customTiebreakRules,
  matchData.match.noAdScoring
);

setMatch(prev => ({
  ...prev,
  bestOf: matchData.matchType === 'one' ? 1 : matchData.matchType === 'three' ? 3 : matchData.matchType === 'five' ? 5 : 3,
  matchFormat: matchFormat,
  scoringVariation: matchData.match.scoringVariation,
  customTiebreakRules: matchData.match.customTiebreakRules,
  noAdScoring: matchData.match.noAdScoring,
  tieBreakRule: matchData.match.tieBreakRule || rules.tiebreakRule,
  sets: (matchData as any).status === 'saved' ? prev.sets : Array.from({ length: rules.maxSets }, () => ({ player1: 0, player2: 0 }))
}));
```

### 5. Update All isMatchComplete Functions
**Find ALL instances of this pattern and replace:**

```typescript
// ❌ CURRENT (find and replace)
const isMatchComplete = () => {
  const requiredSets = Math.ceil(match.bestOf / 2);
  const p1Sets = match.sets.filter(set => set.player1 > set.player2).length;
  const p2Sets = match.sets.filter(set => set.player2 > set.player1).length;
  return p1Sets >= requiredSets || p2Sets >= requiredSets;
};

// ✅ NEW (replace with this)
const isMatchComplete = () => {
  const rules = getMatchRules(
    match.matchFormat || convertLegacyMatchType(match.bestOf === 1 ? 'one' : match.bestOf === 3 ? 'three' : 'five'),
    match.scoringVariation,
    match.customTiebreakRules,
    match.noAdScoring
  );
  
  return isMatchCompleteUtil(match.sets, rules);
};
```

### 6. Update checkMatchWinner Function
**Find this function and replace:**

```typescript
// ❌ CURRENT (find and replace)
const checkMatchWinner = (p1Sets: number, p2Sets: number) => {
  const setsNeeded = Math.ceil(match.bestOf / 2);
  return p1Sets >= setsNeeded ? 1 : p2Sets >= setsNeeded ? 2 : null;
};

// ✅ NEW (replace with this)
const checkMatchWinner = (p1Sets: number, p2Sets: number) => {
  const rules = getMatchRules(
    match.matchFormat || convertLegacyMatchType(match.bestOf === 1 ? 'one' : match.bestOf === 3 ? 'three' : 'five'),
    match.scoringVariation,
    match.customTiebreakRules,
    match.noAdScoring
  );
  
  return p1Sets >= rules.setsToWin ? 1 : p2Sets >= rules.setsToWin ? 2 : null;
};
```

### 7. Update submitMatchResultToAPI Validation
**Find this pattern in submitMatchResultToAPI and replace:**

```typescript
// ❌ CURRENT (find and replace)
if (!isMatchComplete()) {
  const requiredSets = Math.ceil(match.bestOf / 2);
  const p1Sets = match.sets.filter(set => set.player1 > set.player2).length;
  const p2Sets = match.sets.filter(set => set.player2 > set.player1).length;
  
  toast.error(`Cannot submit incomplete match! Need ${requiredSets} sets to win. P1: ${p1Sets}, P2: ${p2Sets}`, {
    duration: 5000,
    icon: '⚠️',
  });
  
  console.warn('⚠️ [submitMatchResultToAPI] Attempted to submit incomplete match:', {
    bestOf: match.bestOf,
    requiredSets,
    p1Sets,
    p2Sets
  });
  return;
}

// ✅ NEW (replace with this)
if (!isMatchComplete()) {
  const rules = getMatchRules(
    match.matchFormat || convertLegacyMatchType(match.bestOf === 1 ? 'one' : match.bestOf === 3 ? 'three' : 'five'),
    match.scoringVariation,
    match.customTiebreakRules,
    match.noAdScoring
  );
  
  const p1Sets = match.sets.filter(set => set.player1 > set.player2).length;
  const p2Sets = match.sets.filter(set => set.player2 > set.player1).length;
  
  toast.error(`Cannot submit incomplete match! Need ${rules.setsToWin} sets to win. P1: ${p1Sets}, P2: ${p2Sets}`, {
    duration: 5000,
    icon: '⚠️',
  });
  
  console.warn('⚠️ [submitMatchResultToAPI] Attempted to submit incomplete match:', {
    matchFormat: match.matchFormat,
    rules,
    p1Sets,
    p2Sets
  });
  return;
}
```

### 8. Update UI Progress Display
**Find this pattern in the UI and replace:**

```typescript
// ❌ CURRENT (find and replace)
<div className="text-sm text-blue-700">
  {(() => {
    const requiredSets = Math.ceil(matchData.match.bestOf / 2);
    const p1Sets = matchData.match.sets.filter(set => set.player1 > set.player2).length;
    const p2Sets = matchData.match.sets.filter(set => set.player2 > set.player1).length;
    const totalSets = matchData.match.sets.length;
    
    return (
      <div className="space-y-1">
        <div>Best of {matchData.match.bestOf} - Need {requiredSets} sets to win</div>
        <div className="flex items-center space-x-4">
          <span>P1 Sets: {p1Sets}/{requiredSets}</span>
          <span>P2 Sets: {p2Sets}/{requiredSets}</span>
          <span>Total Sets: {totalSets}</span>
        </div>
        {!isMatchComplete() && (
          <div className="text-yellow-600 font-medium">
            ⚠️ Match cannot be submitted until a player wins {requiredSets} sets
          </div>
        )}
      </div>
    );
  })()}
</div>

// ✅ NEW (replace with this)
<div className="text-sm text-blue-700">
  {(() => {
    const matchFormat = matchData.match.matchFormat || convertLegacyMatchType(matchData.match.matchType || 'three');
    const rules = getMatchRules(
      matchFormat,
      matchData.match.scoringVariation,
      matchData.match.customTiebreakRules,
      matchData.match.noAdScoring
    );
    
    const p1Sets = matchData.match.sets.filter(set => set.player1 > set.player2).length;
    const p2Sets = matchData.match.sets.filter(set => set.player2 > set.player1).length;
    const totalSets = matchData.match.sets.length;
    
    return (
      <div className="space-y-1">
        <div>{getMatchProgressDescription(matchData.match.sets, rules)}</div>
        <div className="flex items-center space-x-4">
          <span>P1 Sets: {p1Sets}/{rules.setsToWin}</span>
          <span>P2 Sets: {p2Sets}/{rules.setsToWin}</span>
          <span>Total Sets: {totalSets}</span>
        </div>
        {!isMatchComplete() && (
          <div className="text-yellow-600 font-medium">
            ⚠️ Match cannot be submitted until a player wins {rules.setsToWin} sets
          </div>
        )}
      </div>
    );
  })()}
</div>
```

### 9. Update Match Type Display in UI
**Find this pattern and replace:**

```typescript
// ❌ CURRENT (find and replace)
<div className="bg-gray-50 rounded-xl p-4">
  <h4 className="font-semibold text-gray-800 mb-2">Match Type</h4>
  <p className="text-gray-600">Best of {match.bestOf} sets</p>
</div>

// ✅ NEW (replace with this)
<div className="bg-gray-50 rounded-xl p-4">
  <h4 className="font-semibold text-gray-800 mb-2">Match Format</h4>
  <p className="text-gray-600">
    {match.matchFormat ? getMatchFormatDisplayName(match.matchFormat) : `Best of ${match.bestOf} sets`}
  </p>
  {match.scoringVariation && match.scoringVariation !== 'standard' && (
    <p className="text-sm text-gray-500 mt-1">
      Scoring: {match.scoringVariation}
    </p>
  )}
  {match.noAdScoring && (
    <p className="text-sm text-gray-500 mt-1">
      No-Ad Scoring
    </p>
  )}
</div>
```

### 10. Update Status Indicator
**Find this pattern and replace:**

```typescript
// ❌ CURRENT (find and replace)
{(() => {
  const requiredSets = Math.ceil(match.bestOf / 2);
  const p1Sets = match.sets.filter(set => set.player1 > set.player2).length;
  const p2Sets = match.sets.filter(set => set.player2 > set.player1).length;
  return `Need ${requiredSets} sets to win. P1: ${p1Sets}, P2: ${p2Sets}`;
})()}

// ✅ NEW (replace with this)
{(() => {
  const rules = getMatchRules(
    match.matchFormat || convertLegacyMatchType(match.bestOf === 1 ? 'one' : match.bestOf === 3 ? 'three' : 'five'),
    match.scoringVariation,
    match.customTiebreakRules,
    match.noAdScoring
  );
  const p1Sets = match.sets.filter(set => set.player1 > set.player2).length;
  const p2Sets = match.sets.filter(set => set.player2 > set.player1).length;
  return `Need ${rules.setsToWin} sets to win. P1: ${p1Sets}, P2: ${p2Sets}`;
})()}
```

### 11. Update Set Boundary Logic
**Find this pattern and replace:**

```typescript
// ❌ CURRENT (find and replace)
if (match.currentSet + 1 < match.bestOf) {
  resetGames[match.currentSet + 1] = { player1: 0, player2: 0, scores: [] };
}

// ✅ NEW (replace with this)
const rules = getMatchRules(
  match.matchFormat || convertLegacyMatchType(match.bestOf === 1 ? 'one' : match.bestOf === 3 ? 'three' : 'five'),
  match.scoringVariation,
  match.customTiebreakRules,
  match.noAdScoring
);

if (match.currentSet + 1 < rules.maxSets) {
  resetGames[match.currentSet + 1] = { player1: 0, player2: 0, scores: [] };
}
```

## 🔍 **How to Apply These Changes**

1. **Search and Replace**: Use your IDE's search and replace functionality to find the "CURRENT" patterns and replace them with the "NEW" versions.

2. **Key Search Terms**:
   - `Math.ceil(match.bestOf / 2)` or `Math.ceil(matchData.match.bestOf / 2)`
   - `requiredSets` variable declarations
   - `Best of {match.bestOf}` or `Best of {matchData.match.bestOf}`
   - `isMatchComplete()` function definitions
   - `checkMatchWinner` function definitions

3. **Testing**: After applying changes, test with different match formats:
   - `oneSet`: Should complete after 1 set
   - `bestOfThree`: Should complete after 2 sets
   - `bestOfFive`: Should complete after 3 sets
   - `shortSets`: Should complete after 4 sets
   - `proSet8`: Should complete after 8 games

## ✅ **Benefits After Applying**

- ✅ **Dynamic Format Support**: All 8 match formats work correctly
- ✅ **Proper Winner Logic**: Correct completion rules for each format
- ✅ **Better UI**: Shows actual format information instead of generic "Best of X"
- ✅ **No-Ad Scoring**: Handles deuce games correctly
- ✅ **Custom Tiebreaks**: Uses correct tiebreak points (7, 10, 21)
- ✅ **Backward Compatible**: Existing matches continue to work

The utility functions handle all the complex logic, so you just need to replace the hardcoded calculations with calls to these functions!
