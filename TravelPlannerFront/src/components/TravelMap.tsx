import { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Activity } from '../models/types';
import { MapPin } from 'lucide-react';
 
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
 
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});
 
const tealIcon = new L.DivIcon({
  className: '',
  html: `<div style="
    width:26px; height:26px; background:#0EA5B0; border:2px solid #22D3E0;
    border-radius:50% 50% 50% 0; transform:rotate(-45deg);
    box-shadow:0 0 10px rgba(14,165,176,0.5);
  "></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -30],
});
 
async function geocode(location: string): Promise<[number, number] | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    if (data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (_) {}
  return null;
}
 
const FitBounds = ({ coords }: { coords: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (coords.length === 0) return;
    if (coords.length === 1) {
      map.setView(coords[0], 12);
    } else {
      map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
    }
  }, [coords, map]);
  return null;
};
 
interface TravelMapProps {
  activities: Activity[];
  filterDate?: string;
}
 
export const TravelMap = ({ activities, filterDate }: TravelMapProps) => {
  const [resolvedPoints, setResolvedPoints] = useState<
    { activity: Activity; coords: [number, number] }[]
  >([]);
  const [geocoding, setGeocoding] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(filterDate ?? 'all');
  const geocacheRef = useRef<Map<string, [number, number] | null>>(new Map());
 
  const uniqueDates = Array.from(
    new Set(activities.map(a => a.date.substring(0, 10)))
  ).sort();
 
  const filtered = selectedDate === 'all'
    ? [...activities].sort((a, b) => a.date.localeCompare(b.date))
    : activities
        .filter(a => a.date.substring(0, 10) === selectedDate)
        .sort((a, b) => a.date.localeCompare(b.date));
 
  const locateable = filtered.filter(a => a.location && a.location !== 'TBD');
 
  useEffect(() => {
    if (locateable.length === 0) {
      setResolvedPoints([]);
      return;
    }
 
    let cancelled = false;
    setGeocoding(true);
 
    (async () => {
      const results: { activity: Activity; coords: [number, number] }[] = [];
 
      for (const act of locateable) {
        const key = act.location.trim().toLowerCase();
        let coords: [number, number] | null = null;
 
        if (geocacheRef.current.has(key)) {
          coords = geocacheRef.current.get(key)!;
        } else {
          coords = await geocode(act.location);
          geocacheRef.current.set(key, coords);
          await new Promise(r => setTimeout(r, 1100));
        }
 
        if (cancelled) return;
        if (coords) results.push({ activity: act, coords });
      }
 
      if (!cancelled) {
        setResolvedPoints(results);
        setGeocoding(false);
      }
    })();
 
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, activities.length]);
 
  const coords = resolvedPoints.map(p => p.coords);
 
  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="font-label text-xs uppercase text-slate tracking-wider">Filter by Day:</label>
        <select
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="bg-surface border border-border text-xs font-mono px-2 py-1.5 rounded-lg text-mist focus:outline-none focus:border-teal"
        >
          <option value="all">Full Journey</option>
          {uniqueDates.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        {geocoding && (
          <span className="text-xs font-label text-teal animate-pulse">
            Resolving locations...
          </span>
        )}
      </div>
 
      {/* No locatable activities */}
      {!geocoding && locateable.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-slate">
          <MapPin className="w-8 h-8 text-border" />
          <p className="font-display text-sm">No mapped locations for this selection.</p>
          <p className="text-xs font-body">Add activities with real location names to plot them.</p>
        </div>
      )}
 
      {/* Map */}
      {locateable.length > 0 && (
        <div
          className="border border-border rounded-xl overflow-hidden shadow-lg"
          style={{ height: '480px' }}
        >
          <MapContainer
            center={[48, 15]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
 
            <FitBounds coords={coords} />
 
            {coords.length > 1 && (
              <Polyline
                positions={coords}
                pathOptions={{ color: '#0EA5B0', weight: 3, dashArray: '6 4', opacity: 0.9 }}
              />
            )}
 
            {resolvedPoints.map(({ activity: act, coords: pos }, idx) => (
              <Marker key={act.id} position={pos} icon={tealIcon}>
                <Popup>
                  <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 140 }}>
                    <strong style={{ color: '#0EA5B0', fontSize: 13 }}>
                      {idx + 1}. {act.name}
                    </strong>
                    <br />
                    <span style={{ fontSize: 11, color: '#94A8C0' }}>
                      {act.date.substring(0, 10)} @ {act.date.substring(11, 16)}
                    </span>
                    <br />
                    <span style={{ fontSize: 11, color: '#D0DDE9' }}>{act.location}</span>
                    {act.status && (
                      <>
                        <br />
                        <span style={{ fontSize: 10, color: '#22D3E0', textTransform: 'uppercase' }}>
                          {act.status}
                        </span>
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
 
      {/* Legend */}
      {resolvedPoints.length > 0 && (
        <div className="border border-border bg-surface rounded-xl p-3">
          <h5 className="font-label text-xs uppercase text-slate mb-2 border-b border-border pb-1 tracking-wider">
            Route Order
          </h5>
          <ol className="space-y-1">
            {resolvedPoints.map(({ activity: act }, idx) => (
              <li key={act.id} className="flex items-center gap-2 text-xs">
                <span className="w-5 h-5 flex-shrink-0 rounded-full bg-teal text-navy flex items-center justify-center text-[10px] font-bold">
                  {idx + 1}
                </span>
                <span className="font-label font-medium text-mist">{act.name}</span>
                <span className="font-mono text-[10px] text-slate">— {act.location}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};