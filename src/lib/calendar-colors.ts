/**
 * Calendar Color Constants
 * Priority-based colors for calendar events in light and dark modes
 * Based on GAS implementation
 */

export const CALENDAR_PRIORITY_COLORS = {
  1: '#FFCDD2', // Very Light Red - Urgent
  2: '#FFE0B2', // Very Light Orange - High
  3: '#BBDEFB', // Very Light Blue - Normal
  4: '#C8E6C9', // Very Light Green - Low
} as const;

export const CALENDAR_PRIORITY_COLORS_DARK = {
  1: '#562424', // Dark Red
  2: '#512e20', // Dark Orange
  3: '#283262', // Dark Blue
  4: '#193928', // Dark Green
} as const;

export const CALENDAR_TEXT_COLORS_DARK = {
  1: '#fecaca', // Light Red
  2: '#fed7aa', // Light Orange
  3: '#bfdbfe', // Light Blue
  4: '#bbf7d0', // Light Green
} as const;

/**
 * Get calendar event color based on priority and theme
 */
export function getCalendarColor(priority: number, isDarkMode: boolean): string {
  const priorityId = String(priority || 3) as '1' | '2' | '3' | '4';
  const colorMap = isDarkMode ? CALENDAR_PRIORITY_COLORS_DARK : CALENDAR_PRIORITY_COLORS;
  return colorMap[priorityId] || colorMap['3'];
}

/**
 * Get calendar text color for dark theme
 */
export function getCalendarTextColor(priority: number): string {
  const priorityId = String(priority || 3) as '1' | '2' | '3' | '4';
  return CALENDAR_TEXT_COLORS_DARK[priorityId] || CALENDAR_TEXT_COLORS_DARK['3'];
}
