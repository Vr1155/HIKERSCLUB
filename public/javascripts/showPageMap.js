// authenticate access token for mapbox-gl using this script.
// Note that this script is used in show.ejs view.

mapboxgl.accessToken = mapToken;

// console.log(campground);

// creates map with styling, centering and zooming:
const map = new mapboxgl.Map({
  container: "map", // container ID
  style: "mapbox://styles/mapbox/satellite-streets-v12", // map style URL from mapbox
  center: campground.geometry.coordinates, // starting position [long, lat]
  zoom: 10 // starting zoom
});

// This will add a marker (along with its popup and html inside the popup) to the centered location to the map:
new mapboxgl.Marker()
  .setLngLat(campground.geometry.coordinates)
  .setPopup(
    new mapboxgl.Popup({ offset: 25 }).setHTML(
      `<h3>${campground.title}</h3>
      <p>${campground.location}</p>`
    )
  )
  .addTo(map);
