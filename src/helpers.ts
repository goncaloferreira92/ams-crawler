const DEFAULT_VALUE = 60000;
const MS_RATIO = 1000;
const DECIMAL_PLACES = 3;
/**
 * 
 * @param bottomBoundaryS 
 * @param upperBoundaryS 
 * @returns `number` -> time in milliseconds
 */
export function randomTimeRange(bottomBoundaryS = 60, upperBoundaryS = 120): number {
  if (bottomBoundaryS >= upperBoundaryS) {
    console.error(new Error("Bad arguments to generate the time range!"));
    return DEFAULT_VALUE;
  }
  const diff = upperBoundaryS - bottomBoundaryS;
  const randomValue = Math.random() * diff + bottomBoundaryS;
  const randomValueMs =
    Number(randomValue.toFixed(DECIMAL_PLACES)) * MS_RATIO;
  return randomValueMs;
}
