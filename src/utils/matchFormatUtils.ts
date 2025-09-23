// Match Format Utility Functions
// This file provides utilities to handle different tennis match formats dynamically

export type MatchFormat = 
  | 'oneSet'
  | 'bestOfThree'
  | 'bestOfFive'
  | 'shortSets'
  | 'proSet8'
  | 'tiebreak7'
  | 'tiebreak10'
  | 'tiebreak21';

export type ScoringVariation = 
  | 'standard'
  | 'finalSetTiebreak10'
  | 'oneSetTiebreak10';

export type TrackingLevel = 
  | 'level1'
  | 'level2'
  | 'level3';

export interface MatchFormatConfig {
  format: MatchFormat;
  description: string;
  maxSets: number;
  setsToWin: number;
  gamesPerSet: number;
  tiebreakAt: number;
  defaultTiebreakRule: number;
  noAdScoring: boolean;
  trackingLevels: string[];
}

export interface MatchRules {
  setsToWin: number;
  maxSets: number;
  gamesPerSet: number;
  tiebreakAt: number;
  tiebreakRule: number;
  finalSetTiebreakRule: number; // Different tiebreak rule for final set
  noAdScoring: boolean;
  isTiebreakOnly: boolean;
  isProSet: boolean;
}

// Match format configurations based on tennis rules
const MATCH_FORMATS: Record<MatchFormat, MatchFormatConfig> = {
  oneSet: {
    format: 'oneSet',
    description: 'One Set with 7-point tiebreak at 6-6',
    maxSets: 1,
    setsToWin: 1,
    gamesPerSet: 6,
    tiebreakAt: 6,
    defaultTiebreakRule: 7,
    noAdScoring: false,
    trackingLevels: ['level1', 'level2', 'level3']
  },
  bestOfThree: {
    format: 'bestOfThree',
    description: '2 out of 3 sets with 7-point tiebreak at 6-6, final set 10-point tiebreak',
    maxSets: 3,
    setsToWin: 2,
    gamesPerSet: 6,
    tiebreakAt: 6,
    defaultTiebreakRule: 7, // First 2 sets use 7-point, final set uses 10-point
    noAdScoring: false,
    trackingLevels: ['level1', 'level2', 'level3']
  },
  bestOfFive: {
    format: 'bestOfFive',
    description: '3 out of 5 sets with 7-point tiebreak at 6-6, final set 10-point tiebreak',
    maxSets: 5,
    setsToWin: 3,
    gamesPerSet: 6,
    tiebreakAt: 6,
    defaultTiebreakRule: 7, // First 4 sets use 7-point, final set uses 10-point
    noAdScoring: false,
    trackingLevels: ['level1', 'level2', 'level3']
  },
  shortSets: {
    format: 'shortSets',
    description: '4 out of 7 sets (no-ad scoring and 7-point tiebreak at 3-3)',
    maxSets: 7,
    setsToWin: 4,
    gamesPerSet: 4,
    tiebreakAt: 3, // Tiebreak at 3-3 for short sets
    defaultTiebreakRule: 7,
    noAdScoring: true, // No-ad scoring for short sets
    trackingLevels: ['level1', 'level2', 'level3']
  },
  proSet8: {
    format: 'proSet8',
    description: '8-game pro set with 7-point tiebreak at 8-8',
    maxSets: 1,
    setsToWin: 1,
    gamesPerSet: 8,
    tiebreakAt: 8, // Tiebreak at 8-8
    defaultTiebreakRule: 7,
    noAdScoring: false,
    trackingLevels: ['level1', 'level2', 'level3']
  },
  tiebreak7: {
    format: 'tiebreak7',
    description: 'Single 7-Point Tiebreaker',
    maxSets: 1,
    setsToWin: 1,
    gamesPerSet: 0, // No games, just tiebreak
    tiebreakAt: 0,
    defaultTiebreakRule: 7,
    noAdScoring: false,
    trackingLevels: ['level1', 'level2', 'level3']
  },
  tiebreak10: {
    format: 'tiebreak10',
    description: 'Single 10-Point Tiebreaker',
    maxSets: 1,
    setsToWin: 1,
    gamesPerSet: 0, // No games, just tiebreak
    tiebreakAt: 0,
    defaultTiebreakRule: 10,
    noAdScoring: false,
    trackingLevels: ['level1', 'level2', 'level3']
  },
  tiebreak21: {
    format: 'tiebreak21',
    description: 'Single 21-Point Tiebreaker',
    maxSets: 1,
    setsToWin: 1,
    gamesPerSet: 0, // No games, just tiebreak
    tiebreakAt: 0,
    defaultTiebreakRule: 21,
    noAdScoring: false,
    trackingLevels: ['level1', 'level2', 'level3']
  }
};

/**
 * Get match format configuration
 */
export function getMatchFormatConfig(format: MatchFormat): MatchFormatConfig {
  return MATCH_FORMATS[format];
}

/**
 * Get match rules based on format and variations
 */
export function getMatchRules(
  format: MatchFormat, 
  scoringVariation?: ScoringVariation,
  customTiebreakRules?: Record<string, number>,
  noAdScoring?: boolean
): MatchRules {
  const config = getMatchFormatConfig(format);
  
  // Handle scoring variations
  let tiebreakRule = config.defaultTiebreakRule;
  let gamesPerSet = config.gamesPerSet;
  let tiebreakAt = config.tiebreakAt;
  
  // Apply tennis rules for different formats
  if (format === 'bestOfThree') {
    // 2 out of 3 sets: first 2 sets use 7-point tiebreak, final set uses 10-point
    tiebreakRule = 7; // Default for first sets
  } else if (format === 'bestOfFive') {
    // 3 out of 5 sets: first 4 sets use 7-point tiebreak, final set uses 10-point
    tiebreakRule = 7; // Default for first sets
  } else if (format === 'shortSets') {
    // 4 out of 7 sets: no-ad scoring, 7-point tiebreak at 3-3
    tiebreakRule = 7;
    gamesPerSet = 4;
    tiebreakAt = 3;
  } else if (format === 'proSet8') {
    // 8-game pro set: 7-point tiebreak at 8-8
    tiebreakRule = 7;
    gamesPerSet = 8;
    tiebreakAt = 8;
  }
  
  // Handle scoring variations
  if (scoringVariation === 'finalSetTiebreak10' && (format === 'bestOfThree' || format === 'bestOfFive')) {
    // Final set uses 10-point tiebreak
    tiebreakRule = 10;
  } else if (scoringVariation === 'oneSetTiebreak10' && format === 'oneSet') {
    // Single set with 10-point tiebreak
    tiebreakRule = 10;
  }
  
  // Apply custom tiebreak rules
  if (customTiebreakRules) {
    // For now, use the first custom rule or default
    const customRule = Object.values(customTiebreakRules)[0];
    if (customRule && customRule >= 7 && customRule <= 21) {
      tiebreakRule = customRule;
    }
  }
  
  // Override no-ad scoring if specified
  const finalNoAdScoring = noAdScoring !== undefined ? noAdScoring : config.noAdScoring;
  
  // Determine final set tiebreak rule
  let finalSetTiebreakRule = tiebreakRule;
  if (format === 'bestOfThree' || format === 'bestOfFive') {
    // Final set uses 10-point tiebreak for best of 3/5
    finalSetTiebreakRule = 10;
  }

  return {
    setsToWin: config.setsToWin,
    maxSets: config.maxSets,
    gamesPerSet,
    tiebreakAt,
    tiebreakRule,
    finalSetTiebreakRule,
    noAdScoring: finalNoAdScoring,
    isTiebreakOnly: format.startsWith('tiebreak'),
    isProSet: format === 'proSet8'
  };
}

/**
 * Check if match is complete based on format rules
 */
export function isMatchComplete(
  sets: Array<{ player1: number; player2: number }>,
  rules: MatchRules
): boolean {
  const p1Sets = sets.filter(set => set.player1 > set.player2).length;
  const p2Sets = sets.filter(set => set.player2 > set.player1).length;
  
  return p1Sets >= rules.setsToWin || p2Sets >= rules.setsToWin;
}

/**
 * Check if set is complete based on format rules
 */
export function isSetComplete(
  p1Games: number,
  p2Games: number,
  rules: MatchRules,
  setNumber: number = 1
): boolean {
  // Handle tiebreak-only formats
  if (rules.isTiebreakOnly) {
    return false; // Tiebreak-only sets are handled differently
  }
  
  // Handle pro set format
  if (rules.isProSet) {
    return (p1Games >= rules.gamesPerSet && p1Games - p2Games >= 2) ||
           (p2Games >= rules.gamesPerSet && p2Games - p1Games >= 2) ||
           (p1Games >= rules.gamesPerSet && p2Games >= rules.gamesPerSet && Math.abs(p1Games - p2Games) >= 2);
  }
  
  // Standard set logic
  const gamesToWin = rules.gamesPerSet;
  const leadRequired = rules.noAdScoring ? 1 : 2;
  
  return (p1Games >= gamesToWin && p1Games - p2Games >= leadRequired) ||
         (p2Games >= gamesToWin && p2Games - p1Games >= leadRequired);
}

/**
 * Check if tiebreak should start
 */
export function shouldStartTiebreak(
  p1Games: number,
  p2Games: number,
  rules: MatchRules
): boolean {
  if (rules.isTiebreakOnly) {
    return true; // Always in tiebreak mode
  }
  
  return p1Games >= rules.tiebreakAt && p2Games >= rules.tiebreakAt && p1Games === p2Games;
}

/**
 * Get winner of a set
 */
export function getSetWinner(
  p1Games: number,
  p2Games: number,
  rules: MatchRules
): 1 | 2 | null {
  if (rules.isTiebreakOnly) {
    return null; // Tiebreak-only sets are handled differently
  }
  
  if (isSetComplete(p1Games, p2Games, rules)) {
    return p1Games > p2Games ? 1 : 2;
  }
  
  return null;
}

/**
 * Get match winner
 */
export function getMatchWinner(
  sets: Array<{ player1: number; player2: number }>,
  rules: MatchRules
): 1 | 2 | null {
  if (!isMatchComplete(sets, rules)) {
    return null;
  }
  
  const p1Sets = sets.filter(set => set.player1 > set.player2).length;
  const p2Sets = sets.filter(set => set.player2 > set.player1).length;
  
  return p1Sets >= rules.setsToWin ? 1 : 2;
}

/**
 * Get display name for match format
 */
export function getMatchFormatDisplayName(format: MatchFormat): string {
  return getMatchFormatConfig(format).description;
}

/**
 * Get match progress description
 */
export function getMatchProgressDescription(
  sets: Array<{ player1: number; player2: number }>,
  rules: MatchRules
): string {
  const p1Sets = sets.filter(set => set.player1 > set.player2).length;
  const p2Sets = sets.filter(set => set.player2 > set.player1).length;
  
  if (rules.isTiebreakOnly) {
    return `${rules.tiebreakRule}-point tiebreak only`;
  }
  
  if (rules.isProSet) {
    return `Pro set to ${rules.gamesPerSet} games`;
  }
  
  return `Best of ${rules.maxSets} - Need ${rules.setsToWin} sets to win`;
}

/**
 * Get current set progress description
 */
export function getSetProgressDescription(
  p1Games: number,
  p2Games: number,
  rules: MatchRules,
  isTiebreak: boolean = false
): string {
  if (rules.isTiebreakOnly) {
    return `${rules.tiebreakRule}-point tiebreak`;
  }
  
  if (isTiebreak) {
    return `Tiebreak (${rules.tiebreakRule} points)`;
  }
  
  if (rules.isProSet) {
    return `Pro set to ${rules.gamesPerSet}`;
  }
  
  const gamesToWin = rules.gamesPerSet;
  const leadRequired = rules.noAdScoring ? 1 : 2;
  
  return `Set to ${gamesToWin}${rules.noAdScoring ? ' (no-ad)' : ''}`;
}

/**
 * Convert legacy matchType to new format
 */
export function convertLegacyMatchType(matchType: 'one' | 'three' | 'five'): MatchFormat {
  switch (matchType) {
    case 'one': return 'oneSet';
    case 'three': return 'bestOfThree';
    case 'five': return 'bestOfFive';
    default: return 'bestOfThree';
  }
}

/**
 * Get tiebreak rule for a specific set
 */
export function getTiebreakRuleForSet(
  setNumber: number,
  rules: MatchRules,
  format: MatchFormat
): number {
  // For best of 3/5, final set uses different tiebreak rule
  if ((format === 'bestOfThree' || format === 'bestOfFive') && 
      setNumber === rules.maxSets) {
    return rules.finalSetTiebreakRule;
  }
  
  return rules.tiebreakRule;
}

/**
 * Check if format is compatible with scoring variation
 */
export function isFormatCompatibleWithVariation(
  format: MatchFormat, 
  variation: ScoringVariation
): boolean {
  const compatibility = {
    oneSet: ['standard', 'oneSetTiebreak10'], // One set can have 10-point tiebreak
    bestOfThree: ['standard', 'finalSetTiebreak10'], // 2 out of 3 can have final set 10-point tiebreak
    bestOfFive: ['standard', 'finalSetTiebreak10'], // 3 out of 5 can have final set 10-point tiebreak
    shortSets: ['standard'], // Short sets only use standard scoring
    proSet8: ['standard'], // Pro set only uses standard scoring
    tiebreak7: ['standard'], // Tiebreak-only formats only use standard scoring
    tiebreak10: ['standard'],
    tiebreak21: ['standard']
  };
  
  return compatibility[format]?.includes(variation) || false;
}


/**
 * Get display name for scoring variation
 */
export function getScoringVariationDisplayName(variation: ScoringVariation): string {
  const displayNames = {
    standard: 'Standard Scoring',
    finalSetTiebreak10: 'Final Set 10-Point Tiebreak',
    oneSetTiebreak10: 'One Set 10-Point Tiebreak'
  };
  
  return displayNames[variation] || variation;
}

/**
 * Get display name for tracking level
 */
export function getTrackingLevelDisplayName(level: TrackingLevel): string {
  const displayNames = {
    level1: 'Basic Tracking',
    level2: 'Advanced Tracking',
    level3: 'Professional Tracking'
  };
  
  return displayNames[level] || level;
}
