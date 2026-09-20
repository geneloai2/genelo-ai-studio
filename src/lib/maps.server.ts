/**
 * Server-only Google Maps helpers (geocoding, places, directions) routed
 * through the Lovable connector gateway. Never call from the browser.
 */
const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";

function creds() {
  const lovable = process.env["LOVABLE_API_KEY"];
  const maps = process.env["GOOGLE_MAPS_API_KEY"];
  if (!lovable || !maps) return null;
  return {
    Authorization: `Bearer ${lovable}`,
    "X-Connection-Api-Key": maps,
  } as Record<string, string>;
}

async function handle(res: Response) {
  const text = await res.text();
  if (!res.ok) {
    console.error("[maps] gateway error", res.status, text);
    return { ok: false as const, error: `Maps request failed (${res.status}): ${text.slice(0, 400)}` };
  }
  try {
    return { ok: true as const, data: JSON.parse(text) };
  } catch {
    return { ok: false as const, error: "Unexpected maps response." };
  }
}

export async function mapsGeocode(address: string) {
  const h = creds();
  if (!h) return { ok: false as const, error: "Google Maps is not connected for this app yet." };
  const res = await fetch(`${GATEWAY}/maps/api/geocode/json?address=${encodeURIComponent(address)}`, {
    headers: h,
  });
  const out = await handle(res);
  if (!out.ok) return out;
  const results = (out.data.results ?? []).slice(0, 3).map((r: any) => ({
    formattedAddress: r.formatted_address,
    location: r.geometry?.location,
    placeId: r.place_id,
    types: r.types,
  }));
  return { ok: true as const, results };
}

export async function mapsPlaces(query: string, limit = 6) {
  const h = creds();
  if (!h) return { ok: false as const, error: "Google Maps is not connected for this app yet." };
  const res = await fetch(`${GATEWAY}/places/v1/places:searchText`, {
    method: "POST",
    headers: {
      ...h,
      "Content-Type": "application/json",
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.websiteUri,places.internationalPhoneNumber",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: Math.min(Math.max(limit, 1), 10) }),
  });
  const out = await handle(res);
  if (!out.ok) return out;
  const places = (out.data.places ?? []).map((p: any) => ({
    name: p.displayName?.text,
    address: p.formattedAddress,
    location: p.location,
    rating: p.rating,
    reviews: p.userRatingCount,
    website: p.websiteUri,
    phone: p.internationalPhoneNumber,
  }));
  return { ok: true as const, places };
}

export async function mapsDirections(origin: string, destination: string, mode = "DRIVE") {
  const h = creds();
  if (!h) return { ok: false as const, error: "Google Maps is not connected for this app yet." };
  const travelMode = ["DRIVE", "WALK", "BICYCLE", "TRANSIT", "TWO_WHEELER"].includes(mode.toUpperCase())
    ? mode.toUpperCase()
    : "DRIVE";
  const res = await fetch(`${GATEWAY}/routes/directions/v2:computeRoutes`, {
    method: "POST",
    headers: {
      ...h,
      "Content-Type": "application/json",
      "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.description",
    },
    body: JSON.stringify({
      origin: { address: origin },
      destination: { address: destination },
      travelMode,
    }),
  });
  const out = await handle(res);
  if (!out.ok) return out;
  const routes = (out.data.routes ?? []).map((r: any) => ({
    summary: r.description,
    distanceKm: r.distanceMeters ? Math.round((r.distanceMeters / 1000) * 10) / 10 : undefined,
    duration: r.duration,
  }));
  return { ok: true as const, travelMode, routes };
}
