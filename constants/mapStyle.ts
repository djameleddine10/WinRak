// Dark map style for Google Maps (react-native-maps customMapStyle).
export const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#212a31' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a95a3' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212a31' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d343c' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#222834' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a424c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1a2026' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#26303a' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1f2a24' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
]
