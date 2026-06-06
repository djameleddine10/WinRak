import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

type Pt = { lat: number; lng: number } | null | undefined;

function html(pickup: Pt, dropoff: Pt, driver: Pt) {
  const p = pickup ? [pickup.lat, pickup.lng] : null;
  const d = dropoff ? [dropoff.lat, dropoff.lng] : null;
  const dr = driver ? [driver.lat, driver.lng] : null;
  const center = p || d || [36.752, 3.042];

  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{height:100%;margin:0;padding:0;background:#e8eef2}
.pin{font-size:28px;line-height:28px;text-align:center;filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var map = L.map('map',{zoomControl:true,attributionControl:false}).setView([${center[0]},${center[1]}], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
function icon(e){return L.divIcon({html:'<div class="pin">'+e+'</div>',className:'',iconSize:[28,28],iconAnchor:[14,28]});}
var pts=[];
${p ? `var mp=L.marker([${p[0]},${p[1]}],{icon:icon('🟢')}).addTo(map).bindPopup('نقطة الانطلاق');pts.push([${p[0]},${p[1]}]);` : ''}
${d ? `var md=L.marker([${d[0]},${d[1]}],{icon:icon('🔴')}).addTo(map).bindPopup('الوجهة');pts.push([${d[0]},${d[1]}]);` : ''}
${dr ? `var mdr=L.marker([${dr[0]},${dr[1]}],{icon:icon('🚗')}).addTo(map).bindPopup('السائق');pts.push([${dr[0]},${dr[1]}]);` : ''}
${p && d ? `L.polyline([[${p[0]},${p[1]}],[${d[0]},${d[1]}]],{color:'#F5A623',weight:4,opacity:.8}).addTo(map);` : ''}
${dr && p ? `L.polyline([[${dr[0]},${dr[1]}],[${p[0]},${p[1]}]],{color:'#00D4AA',weight:3,dashArray:'6,8'}).addTo(map);` : ''}
if(pts.length>1){map.fitBounds(pts,{padding:[40,40]});}else if(pts.length===1){map.setView(pts[0],14);}
</script></body></html>`;
}

export default function RideMap({ pickup, dropoff, driver, height = 220 }: { pickup?: Pt; dropoff?: Pt; driver?: Pt; height?: number }) {
  // key forces reload only when points meaningfully change
  const key = `${pickup?.lat?.toFixed(4)}_${dropoff?.lat?.toFixed(4)}_${driver ? driver.lat.toFixed(4) : 'x'}`;
  return (
    <View style={{ height, borderRadius: 16, overflow: 'hidden', backgroundColor: '#e8eef2' }}>
      <WebView
        key={key}
        originWhitelist={['*']}
        source={{ html: html(pickup, dropoff, driver) }}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}
