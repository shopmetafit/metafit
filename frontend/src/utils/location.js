/**
 * Reverse-geocodes latitude and longitude coordinates into a formatted "[District], [State]" string.
 * Coordinates are processed purely in-memory and are never saved or stored.
 *
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<string|null>} - Formatted string e.g. "Kota, Rajasthan" or null if detection fails
 */
async function reverseGeocode(lat, lon) {
  // Strategy 1: Nominatim OpenStreetMap API
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};

      const state = addr.state || addr.region || addr.territory || '';

      // Extracted district using India-specific administrative field hierarchy
      let rawDistrict =
        addr.state_district ||
        addr.district ||
        addr.county ||
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.subdistrict ||
        '';

      // Clean up common suffix like " District" if present
      const district = rawDistrict.replace(/\s+district$/i, '').trim();

      if (district && state) {
        if (district.toLowerCase() === state.toLowerCase()) {
          return `${state}, India`;
        }
        return `${district}, ${state}`;
      } else if (state) {
        return `${state}, India`;
      } else if (district) {
        return `${district}, India`;
      }
    }
  } catch (err) {
    console.warn('Nominatim reverse-geocoding failed, trying fallback:', err);
  }

  // Strategy 2: Fallback to BigDataCloud Free Reverse Geocoding API
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    if (response.ok) {
      const data = await response.json();
      const state = data.principalSubdivision || '';

      // Look through localityInfo administrative entries or city/locality
      let district = data.locality || data.city || '';
      if (!district && Array.isArray(data.localityInfo?.administrative)) {
        // Look for admin level 4 or 3 (typically district level in India)
        const adminEntry = data.localityInfo.administrative.find(
          (item) => item.adminLevel === 4 || item.adminLevel === 3
        );
        if (adminEntry && adminEntry.name) {
          district = adminEntry.name;
        }
      }

      district = district.replace(/\s+district$/i, '').trim();

      if (district && state) {
        if (district.toLowerCase() === state.toLowerCase()) {
          return `${state}, India`;
        }
        return `${district}, ${state}`;
      } else if (state) {
        return `${state}, India`;
      } else if (district) {
        return `${district}, India`;
      }
    }
  } catch (err) {
    console.warn('BigDataCloud reverse-geocoding failed:', err);
  }

  return null;
}

/**
 * Requests browser Geolocation and converts coordinates into District + State.
 * Never stores or displays raw coordinates.
 *
 * @returns {Promise<string>} - Returns formatted location or fallback "India"
 */
export async function detectDistrictAndState() {
  if (!('geolocation' in navigator)) {
    console.warn('Browser geolocation is not supported.');
    return 'India';
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const formattedLocation = await reverseGeocode(latitude, longitude);

          if (formattedLocation) {
            resolve(formattedLocation);
          } else {
            resolve('India');
          }
        } catch (error) {
          console.error('Error during reverse-geocoding:', error);
          resolve('India');
        }
      },
      (error) => {
        console.warn('Geolocation position request failed/denied:', error.message);
        resolve('India');
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // cache coordinates for 5 mins in browser
      }
    );
  });
}
