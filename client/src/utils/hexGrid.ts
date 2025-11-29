/**
 * Hex Grid Coordinate System Utilities
 *
 * Implements flat-top hex coordinate system with offset coordinates.
 * Based on Red Blob Games hex grid guide.
 *
 * Coordinate Systems:
 * - Offset coordinates (q, r): Used for storage and grid positioning
 * - Cube coordinates (x, y, z): Used for distance calculations (x + y + z = 0)
 * - Pixel coordinates (x, y): Screen space positions
 */

/** Hex size in pixels (radius from center to vertex) */
export const HEX_SIZE = 25;

/** Grid offset in pixels from top-left corner */
export const GRID_OFFSET = 50;

/** Range band thresholds (in hexes) */
export const RANGE_BANDS = {
  ADJACENT: 1,
  CLOSE: 3,
  MEDIUM: 5,
  LONG: 7,
} as const;

/** Range band names */
export type RangeBand = 'Adjacent' | 'Close' | 'Medium' | 'Long' | 'Very Long';

/** Hex position in offset coordinates */
export interface HexPosition {
  q: number;  // Column
  r: number;  // Row
}

/** Pixel position on screen */
export interface PixelPosition {
  x: number;
  y: number;
}

/**
 * Convert hex offset coordinates to pixel coordinates.
 * Uses flat-top hex orientation.
 *
 * @param q - Column coordinate
 * @param r - Row coordinate
 * @returns Pixel position { x, y }
 */
export function hexToPixel(q: number, r: number): PixelPosition {
  const x = HEX_SIZE * (3/2 * q) + GRID_OFFSET;
  const y = HEX_SIZE * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r) + GRID_OFFSET;
  return { x, y };
}

/**
 * Convert pixel coordinates to hex offset coordinates.
 * Uses flat-top hex orientation with rounding.
 *
 * @param x - Pixel x coordinate
 * @param y - Pixel y coordinate
 * @returns Hex position { q, r }
 */
export function pixelToHex(x: number, y: number): HexPosition {
  const q = Math.round((2/3 * (x - GRID_OFFSET)) / HEX_SIZE);
  const r = Math.round((-(x - GRID_OFFSET)/3 + Math.sqrt(3)/3 * (y - GRID_OFFSET)) / HEX_SIZE);
  return { q, r };
}

/**
 * Calculate hex distance between two positions.
 * Uses cube coordinate conversion for accurate distance.
 *
 * Distance formula: (|x1-x2| + |y1-y2| + |z1-z2|) / 2
 * where x + y + z = 0 (cube coordinate constraint)
 *
 * @param pos1 - First hex position
 * @param pos2 - Second hex position
 * @returns Distance in hexes (integer)
 */
export function hexDistance(pos1: HexPosition, pos2: HexPosition): number {
  // Convert offset to cube coordinates
  const x1 = pos1.q;
  const z1 = pos1.r;
  const y1 = -x1 - z1;

  const x2 = pos2.q;
  const z2 = pos2.r;
  const y2 = -x2 - z2;

  // Manhattan distance in cube coordinates / 2
  return (Math.abs(x1 - x2) + Math.abs(y1 - y2) + Math.abs(z1 - z2)) / 2;
}

/**
 * Convert hex distance to range band name.
 *
 * Range bands:
 * - Adjacent: ≤ 1 hex
 * - Close: 2-3 hexes
 * - Medium: 4-5 hexes
 * - Long: 6-7 hexes
 * - Very Long: > 7 hexes
 *
 * @param distance - Distance in hexes
 * @returns Range band name
 */
export function rangeFromDistance(distance: number): RangeBand {
  if (distance <= RANGE_BANDS.ADJACENT) return 'Adjacent';
  if (distance <= RANGE_BANDS.CLOSE) return 'Close';
  if (distance <= RANGE_BANDS.MEDIUM) return 'Medium';
  if (distance <= RANGE_BANDS.LONG) return 'Long';
  return 'Very Long';
}

/**
 * Calculate the range band between two hex positions.
 * Combines hexDistance and rangeFromDistance.
 *
 * @param pos1 - First hex position
 * @param pos2 - Second hex position
 * @returns Range band name
 */
export function getRange(pos1: HexPosition, pos2: HexPosition): RangeBand {
  const distance = hexDistance(pos1, pos2);
  return rangeFromDistance(distance);
}
