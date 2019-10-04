const initMap = (map, fillObservations, bubbleObservations) => {

  map.on('load', function() {
    initGeoms(fillObservations, bubbleObservations)
  })

  const initGeoms = (fillObservations, bubbleObservations) => {
    if (!map.getSource('geoms'))
      map.addSource('geoms', {
        type: 'vector',
        url: 'mapbox://traethethird.4kh7sxxt'
      })

    if (!map.getSource('centroids'))
      map.addSource('centroids', {
        type: 'vector',
        url: 'mapbox://traethethird.5u7sntcb'
      })

    fillObservations.forEach(( observation) => {
      const value = observation['value'];
      const place_id = observation['place_id']
      if (place_id === 16) {
        console.log(observation)
      }

      map.setFeatureState({source: 'geoms', sourceLayer: 'countries_id_rpr', id: place_id }, {clicked: false});
      if (!value) {
        map.setFeatureState({source: 'geoms', sourceLayer: 'countries_id_rpr', id: place_id }, {value: 0});
      } else {
        //const state = { value: Math.floor(256 * value)};
        const state = { value: value / 100};
        map.setFeatureState({source: 'geoms', sourceLayer: 'countries_id_rpr', id: place_id }, state);
      }
    });

    console.log(map.getStyle().layers)

    map.addLayer({
      id: 'geom-fills',
      type: 'fill',
      source: 'geoms',
      'source-layer': 'countries_id_rpr',
      paint: {
        'fill-color': [
          'step',
          ["feature-state", "value"],
              '#b3b3b3',
              0, '#d6f0b2',
              0.35, '#b9d7a8',
              0.5, '#7fcdbb',
              0.65, '#41b6c4',
              0.8, '#2c7fb8',
              0.95, '#303d91'
        ],
        'fill-opacity': 0.9,
      }
    }, "country-small");

    map.addLayer({
      id: 'geom-line',
      type: 'line',
      source: 'geoms',
      'source-layer': 'countries_id_rpr',
      paint: {
        'line-color': [
          'case',
          ['boolean', ['feature-state', 'clicked'], true], '#ffffff',
          '#d3d3d3'
        ],
        'line-width': [
          'case',
            ['boolean', ['feature-state', 'clicked'], true], 5,
            1
          ],
      }
    }, "country-small");

    map.on('render', afterChangeComplete); // warning: this fires many times per second!

    function afterChangeComplete () {
      if (!map.loaded()) { return } // still not loaded; bail out.

      const relatedFeatures = map.querySourceFeatures('geoms', {
        sourceLayer: 'countries_id_rpr',
        //filter: ['has', 'id']
      });

      console.log(relatedFeatures)

      map.off('render', afterChangeComplete); // remove this handler now that we're done.
    }

    //var relatedFeatures = map.queryRenderedFeatures({ layers: ['geom-fills'] });


    bubbleObservations.forEach(( observation) => {
      const value = observation['value'];
      const place_id = observation['place_id']

      if (!value) {
        map.setFeatureState({source: 'centroids', sourceLayer: 'centroids_id_rpr', id: place_id }, {value: 0});
      } else {
        //const state = { value: Math.floor(256 * value)};
        const state = {value: value};
        map.setFeatureState({source: 'centroids', sourceLayer: 'centroids_id_rpr', id: place_id }, state);
      }
    });

    map.addLayer({
      'id': 'population',
      'type': 'circle',
      'source': 'centroids',
      'source-layer': 'centroids_id_rpr',
      'paint': {
      'circle-radius': [
          'step',
          ["feature-state", "value"],
              0,
              1, 1,
              10, 10,
              25, 20,
              50, 30,
              100, 40,
              500, 50,
              1000, 75
        ],
        'circle-color': '#ff0000',
        'circle-opacity': 0.4,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff'
      }
    }, "country-small");
  }
}

export default initMap
