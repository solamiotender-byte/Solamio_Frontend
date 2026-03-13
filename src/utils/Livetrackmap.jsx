import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import { useEffect, useState } from "react";

export default function LiveTrackingMap() {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setPoints((prev) => [...prev, [lat, lng]]);

        // send to backend
        fetch("/api/location/point", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng })
        });
      });
    }, 30000); // 30 sec

    return () => clearInterval(interval);
  }, []);

  const center = points.length ? points[points.length - 1] : [20.2961, 85.8245];

  return (
    <MapContainer center={center} zoom={15} style={{ height: "400px" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {points.map((p, i) => (
        <Marker key={i} position={p} />
      ))}

      {points.length > 1 && (
        <Polyline positions={points} color="red" />
      )}
    </MapContainer>
  );
}