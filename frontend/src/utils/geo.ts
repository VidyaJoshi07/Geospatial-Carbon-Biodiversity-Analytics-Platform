const EARTH_RADIUS_METERS = 6378137.0;

export function calculatePolygonAreaHectares(coords: number[][]): number {
  if (!coords || coords.length < 4) return 0;

  let total = 0;
  const numPts = coords.length;

  for (let i = 0; i < numPts - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];

    const lon1 = (p1[0] * Math.PI) / 180.0;
    const lat1 = (p1[1] * Math.PI) / 180.0;
    const lon2 = (p2[0] * Math.PI) / 180.0;
    const lat2 = (p2[1] * Math.PI) / 180.0;

    total += (lon2 - lon1) * (2.0 + Math.sin(lat1) + Math.sin(lat2));
  }

  total = Math.abs((total * Math.pow(EARTH_RADIUS_METERS, 2)) / 2.0);
  // Convert m² to hectares (1 ha = 10,000 m²)
  return Math.round((total / 10000.0) * 100) / 100;
}

export function computeBoundsFromCoordinates(allCoords: number[][]): [[number, number], [number, number]] | null {
  if (!allCoords || allCoords.length === 0) return null;

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const pt of allCoords) {
    const [lng, lat] = pt;
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }

  if (minLng === Infinity || minLat === Infinity) return null;

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}
