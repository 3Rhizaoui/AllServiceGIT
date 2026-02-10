'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

// Fix default marker icon paths in Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export type MapPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export function MapView({
  center,
  pins,
  onMarkerClick,
}: {
  center: { lat: number; lng: number };
  pins: MapPin[];
  onMarkerClick?: (id: string) => void;
}) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={12} style={{ height: 420, width: '100%', borderRadius: 16 }} scrollWheelZoom>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      {pins.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          eventHandlers={
            onMarkerClick
              ? {
                  click: () => onMarkerClick(p.id),
                }
              : undefined
          }
        >
          <Popup>{p.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
