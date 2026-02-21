/**
 * Parse stat values like "+50%", "-5%", "+144" into numbers
 */
export const parseStatValue = (value: string | undefined): number => {
  if (!value) return 0;
  const numericPart = parseFloat(value.replace(/,/g, ''));
  if (isNaN(numericPart)) return 0;
  return numericPart;
};

/**
 * Format a number back to a stat value string (preserving % if original had it)
 */
export const formatStatValue = (value: number, originalValue: string): string => {
  const hasPercent = originalValue.includes('%');
  if (hasPercent) {
    return value >= 0 ? `+${value}%` : `${value}%`;
  }
  return value >= 0 ? `+${value}` : `${value}`;
};

/**
 * Get fated bonus for a specific stat from the fated relationship description
 */
export const getFatedBonus = (
  fatedDescription: string | undefined,
  statName: string
): number => {
  if (!fatedDescription) return 0;
  
  const desc = fatedDescription.toLowerCase();
  const statNameLower = statName.toLowerCase();
  
  // Example: "Attack Speed +4%, Channeling Speed +4%"
  if (desc.includes(statNameLower)) {
    // Use regex to find the value associated with the stat
    const regex = new RegExp(`${statNameLower}[^\\d-]*([+-]?\\d*\\.?\\d+\\s?%?)`, 'i');
    const match = desc.match(regex);
    
    if (match && match[1]) {
      return parseStatValue(match[1]);
    }
  }
  
  return 0;
};

/**
 * Calculate total stat value (base + fated bonus)
 */
export const calculateTotalStat = (
  baseValue: string,
  fatedDescription: string | undefined,
  statName: string,
  isFatedActive: boolean
): { base: number; bonus: number; total: number; formattedTotal: string } => {
  const base = parseStatValue(baseValue);
  const bonus = isFatedActive ? getFatedBonus(fatedDescription, statName) : 0;
  const total = base + bonus;
  const formattedTotal = formatStatValue(total, baseValue);
  
  return { base, bonus, total, formattedTotal };
};
