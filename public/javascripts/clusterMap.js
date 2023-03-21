// mapToken was passed from index.ejs
mapboxgl.accessToken = mapToken;

// For docs on cluster map using mapbox,
// see: https://docs.mapbox.com/mapbox-gl-js/example/cluster/
// read the code chunk by chunk.

// The map accepts geojson format,
// an example of geojson (earthquakes in usa): https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson

// Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
// from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.

// This is what data from above link looks like:
// const data = {
//   features: [
//     ...,
//     {
//       type: "Feature",
//       properties: {
//         id: "ak16994298",
//         mag: 2.4,
//         time: 1507419370097,
//         felt: null,
//         tsunami: 0
//       },
//       geometry: { type: "Point", coordinates: [-148.789, 63.1725, 7.5] }
//     }
//   ],
//   ...
// };

// As you can see it expects an obj with features key and an array of data points as value.

// mapbox expects data in following fashion specified in docs: https://docs.mapbox.com/help/getting-started/creating-data/

// As you can see, "geometry" obj needs to be inside "properties" obj which is inside "features" obj,
// but in our case it was directly inside "campground" obj (which is inside "features" obj which is inside "campgrounds" array)
// We can fix this with virtual properties in mongoose.

// Alternative way to do it will be to restructuring the json with a loop on client side,
// but that will add extra computation on client side, which can be excessive if no. of campgrounds is high.
// Best strategy is to add virtual properties in mongoose.

const map = new mapboxgl.Map({
  container: "map",
  // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
  style: "mapbox://styles/mapbox/light-v10",
  // initially center cluster map here:
  center: [-103.5917, 40.6699],
  zoom: 3
});

// Just for testing:
// console.log(campgrounds);

// specifies what to load in the map:
map.on("load", () => {
  // Just for testing:
  // console.log("map loaded!");

  // Add a new source from our GeoJSON data and
  // set the 'cluster' option to true. GL-JS will
  // add the point_count property to your source data.
  // since we are using campgrounds data, specify "campgrounds" everywhere as source:
  map.addSource("campgrounds", {
    type: "geojson",
    // campgrounds array is passed from index.ejs
    data: campgrounds,
    cluster: true,
    clusterMaxZoom: 14, // Max zoom to cluster points on
    clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
  });

  // addLayer() adds different layers to the map:

  // adds circle for cluster:
  map.addLayer({
    id: "clusters",
    type: "circle",
    source: "campgrounds",
    filter: ["has", "point_count"],
    paint: {
      // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
      // with three steps to implement three types of circles:
      //   * Blue, 20px circles when point count is less than 100
      //   * Yellow, 30px circles when point count is between 100 and 750
      //   * Pink, 40px circles when point count is greater than or equal to 750

      // In circle radius,
      // first number is pixel width, second number is step.
      "circle-color": [
        "step",
        ["get", "point_count"],
        "#00BCD4",
        10,
        "#2196F3",
        30,
        "#4c35fc"
      ],
      "circle-radius": ["step", ["get", "point_count"], 15, 10, 20, 30, 25]
    }
  });

  // adds count inside the cluster circle:
  map.addLayer({
    id: "cluster-count",
    type: "symbol",
    source: "campgrounds",
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 13
    }
  });

  // adds unclustered point to the map:
  map.addLayer({
    id: "unclustered-point",
    type: "circle",
    source: "campgrounds",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": "#11b4da",
      "circle-radius": 7,
      "circle-stroke-width": 1,
      "circle-stroke-color": "#fff"
    }
  });

  // inspect a cluster on click
  map.on("click", "clusters", e => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ["clusters"]
    });
    const clusterId = features[0].properties.cluster_id;
    map
      .getSource("campgrounds")
      .getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;

        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom
        });
      });
  });

  // When a click event occurs on a feature in
  // the unclustered-point layer, open a popup at
  // the location of the feature, with
  // description HTML from its properties.
  map.on("click", "unclustered-point", e => {
    // Just for testing:
    // console.log("clicked on unclustered pt!");
    // console.log(e.features[0].properties.popUpMarkup);

    // html element to show when user clicks on unclustered point
    const { popUpMarkup } = e.features[0].properties;

    const coordinates = e.features[0].geometry.coordinates.slice();

    // Ensure that if the map is zoomed out such that
    // multiple copies of the feature are visible, the
    // popup appears over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    new mapboxgl.Popup().setLngLat(coordinates).setHTML(popUpMarkup).addTo(map);
  });

  map.on("mouseenter", "clusters", () => {
    // Just for testing:
    // console.log("mousing over a cluster!");

    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "clusters", () => {
    // Just for testing:
    // console.log("leaving mouse over a cluster!");

    map.getCanvas().style.cursor = "";
  });

  map.on("mouseenter", "unclustered-point", () => {
    // Just for testing:
    // console.log("mousing over a unclustered-point!");

    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "unclustered-point", () => {
    // Just for testing:
    // console.log("leaving mouse over a unclustered-point!");

    map.getCanvas().style.cursor = "";
  });
});
