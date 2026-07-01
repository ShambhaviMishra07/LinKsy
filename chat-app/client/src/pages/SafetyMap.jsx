// client/src/pages/SafetyMap.jsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { colors as c } from '../theme';

// Fix Leaflet's default marker icon — known issue with webpack/vite bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored markers for different place types
const createColoredIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
});

const icons = {
  hospital: createColoredIcon('red'),
  police: createColoredIcon('blue'),
  pharmacy: createColoredIcon('green'),
  fuel: createColoredIcon('orange'),
  user: createColoredIcon('violet')
};

// Overpass API query — completely free, no key needed
// Finds amenities within 1500m radius of given coordinates
const buildOverpassQuery = (lat, lng) => `
  [out:json][timeout:25];
  (
    node["amenity"="hospital"](around:1500,${lat},${lng});
    node["amenity"="police"](around:1500,${lat},${lng});
    node["amenity"="pharmacy"](around:1500,${lat},${lng});
    node["amenity"="fuel"](around:1500,${lat},${lng});
  );
  out body;
`;

const amenityLabel = (type) => {
  const labels = {
    hospital: '🏥 Hospital',
    police: '👮 Police',
    pharmacy: '💊 Pharmacy',
    fuel: '⛽ Petrol pump'
  };
  return labels[type] || type;
};

// Straight-line distance in meters using Haversine formula
const distanceBetween = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

export default function SafetyMap() {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [nearest, setNearest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Step 1: get user's current location
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });
        await fetchNearbyPlaces(lat, lng);
        setLoading(false);
      },
      (err) => {
        setError('Location permission denied. Please enable it to use the safety map.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  const fetchNearbyPlaces = async (lat, lng) => {
    try {
      const query = buildOverpassQuery(lat, lng);

      // Overpass API — completely free, returns OSM data
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`
      });

      const data = await response.json();

      const parsedPlaces = data.elements.map(el => ({
        id: el.id,
        name: el.tags?.name || amenityLabel(el.tags?.amenity),
        type: el.tags?.amenity,
        lat: el.lat,
        lng: el.lon,
        distance: distanceBetween(lat, lng, el.lat, el.lon)
      }));

      // Sort by distance — nearest first
      parsedPlaces.sort((a, b) => a.distance - b.distance);
      setPlaces(parsedPlaces);

      if (parsedPlaces.length > 0) {
        setNearest(parsedPlaces[0]);
      }

    } catch (err) {
      console.error('Overpass API error:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ background: c.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.textMuted }}>
        Finding your location...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: c.bg, minHeight: '100vh', padding: 24, color: c.danger }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: c.textPrimary, fontSize: 20, cursor: 'pointer', marginBottom: 16 }}>←</button>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ background: c.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px 20px', borderBottom: `0.5px solid ${c.border}`
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: c.textPrimary, fontSize: 20, cursor: 'pointer' }}>←</button>
        <span style={{ fontSize: 16, fontWeight: 500 }}>Safety Map</span>
      </div>

      {/* Map — takes most of the screen */}
      {userLocation && (
        <MapContainer
          center={[userLocation.lat, userLocation.lng]}
          zoom={15}
          style={{ height: '55vh', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User's position */}
          <Marker position={[userLocation.lat, userLocation.lng]} icon={icons.user}>
            <Popup>You are here</Popup>
          </Marker>

          {/* 1.5km search radius circle */}
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={1500}
            pathOptions={{ color: c.pink, fillColor: c.pink, fillOpacity: 0.05, weight: 1 }}
          />

          {/* Nearby places */}
          {places.map(place => (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={icons[place.type] || icons.hospital}
            >
              <Popup>
                <strong>{place.name}</strong><br />
                {amenityLabel(place.type)}<br />
                {Math.round(place.distance)}m away
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}

      {/* Nearest place highlight */}
      {nearest && (
        <div style={{ padding: '14px 20px', background: c.surface, borderBottom: `0.5px solid ${c.border}` }}>
          <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 4 }}>Nearest safe place</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: c.textPrimary }}>{nearest.name}</div>
          <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>
            {amenityLabel(nearest.type)} · {Math.round(nearest.distance)}m away
          </div>
          
           <a href={`https://www.google.com/maps/dir/?api=1&destination=${nearest.lat},${nearest.lng}&travelmode=walking`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block', marginTop: 10, padding: '7px 16px',
              background: c.pink, color: '#fff', borderRadius: 8,
              textDecoration: 'none', fontSize: 13, fontWeight: 500
            }}
          >
            Get walking directions →
          </a>
        </div>
      )}

      {/* List of all nearby places */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
        <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 10 }}>
          {places.length} safe places within 1.5km
        </div>
        {places.map(place => (
          <div key={place.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 0', borderBottom: `0.5px solid ${c.border}`
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>
              {{ hospital: '🏥', police: '👮', pharmacy: '💊', fuel: '⛽' }[place.type] || '📍'}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: c.textPrimary }}>{place.name}</div>
              <div style={{ fontSize: 11, color: c.textMuted }}>{Math.round(place.distance)}m away</div>
            </div>
            
           <a href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&travelmode=walking`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: c.pinkLight, fontSize: 12, textDecoration: 'none', flexShrink: 0 }}
            >
              Directions →
            </a>
          </div>
        ))}
        {places.length === 0 && (
          <div style={{ textAlign: 'center', color: c.textMuted, fontSize: 13, padding: '30px 0' }}>
            No hospitals, police or pharmacies found within 1.5km
          </div>
        )}
      </div>
    </div>
  );
}