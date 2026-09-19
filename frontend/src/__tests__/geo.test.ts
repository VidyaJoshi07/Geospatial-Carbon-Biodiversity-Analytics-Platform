import { calculatePolygonAreaHectares, computeBoundsFromCoordinates } from '../utils/geo';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

console.log('Running geospatial algorithm tests...');

// Sample 4-point polygon (approx 10x10 km in Amazon basin)
const samplePolygon = [
  [-60.12, -2.98],
  [-60.08, -2.98],
  [-60.08, -3.02],
  [-60.12, -3.02],
  [-60.12, -2.98],
];

const areaHa = calculatePolygonAreaHectares(samplePolygon);
assert(areaHa > 1000, `Area must be greater than 1000 ha, got ${areaHa}`);

const bounds = computeBoundsFromCoordinates(samplePolygon);
assert(bounds !== null, 'Bounds must not be null');
assert(bounds![0][0] === -60.12, 'Min Lng matches');
assert(bounds![1][0] === -60.08, 'Max Lng matches');
assert(bounds![0][1] === -3.02, 'Min Lat matches');
assert(bounds![1][1] === -2.98, 'Max Lat matches');

console.log(`✓ All geospatial algorithm tests passed successfully! Computed Area: ${areaHa} ha`);
