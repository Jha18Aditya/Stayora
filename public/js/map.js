(() => {
  const mapElement = document.getElementById("map");
  if (!mapElement) return;

  const coordinates = JSON.parse(mapElement.dataset.mapCoordinates || "null");
  if (!coordinates || coordinates.length !== 2) {
    mapElement.textContent = "Map coordinates are unavailable for this listing.";
    return;
  }

  mapboxgl.accessToken = mapElement.dataset.mapboxAccessToken;

  const map = new mapboxgl.Map({
    container: mapElement,
    style: "mapbox://styles/mapbox/streets-v12",
    center: coordinates,
    zoom: 11,
  });

  map.addControl(new mapboxgl.NavigationControl());
  map.addControl(new mapboxgl.FullscreenControl());
  map.scrollZoom.disable();
  map.on("load", () => map.resize());

  const markerElement = document.createElement("div");
  markerElement.className = "map-marker";
  markerElement.setAttribute("aria-label", "Listing location");
  markerElement.innerHTML = '<span class="map-marker-pin"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Zm6 11v-6h6v6"/></svg></span><span class="map-marker-label">Listing location</span>';

  const popup = new mapboxgl.Popup({ offset: 34, maxWidth: "min(320px, calc(100vw - 48px))", closeButton: true, closeOnClick: false })
    .setText(mapElement.dataset.mapPopup);

  new mapboxgl.Marker({ element: markerElement, anchor: "bottom" })
    .setLngLat(coordinates)
    .setPopup(popup)
    .addTo(map);
})();
