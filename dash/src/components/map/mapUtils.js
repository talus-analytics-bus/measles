// import ReactMapGL, { NavigationControl, Popup } from 'react-map-gl'

import circleImg from '../../assets/images/circle@3x.png'
import Util from '../../components/misc/Util.js'
const initMap = (
  map,
  fillObservations,
  bubbleObservations,
  incidenceObservations,
  trendObservations,
  bubbleMetric,
  callback
) => {
  map.on('load', function() {
    initGeoms(fillObservations, bubbleObservations, incidenceObservations)
  })

  const initGeoms = (
    fillObservations,
    bubbleObservations,
    incidenceObservations
  ) => {
    if (!map.getSource('geoms'))
      map.addSource('geoms', {
        type: 'vector',
        url: 'mapbox://traethethird.4kh7sxxt'
      })

    if (!map.getSource('centroids'))
      map.addSource('centroids', {
        type: 'vector',
        url: 'mapbox://traethethird.civp15xl'
        // url: 'mapbox://traethethird.69p1vezr'
        // url: 'mapbox://traethethird.9g6e0amc'
      })

    fillObservations.forEach(observation => {
      const value = observation['value']
      const place_id = observation['place_id']

      map.setFeatureState(
        { source: 'geoms', sourceLayer: 'countries_id_rpr', id: place_id },
        { clicked: false }
      )
      if (!value) {
        map.setFeatureState(
          { source: 'geoms', sourceLayer: 'countries_id_rpr', id: place_id },
          { value: 0 }
        )
      } else {
        //const state = { value: Math.floor(256 * value)};
        const state = { value: value / 100 }
        map.setFeatureState(
          { source: 'geoms', sourceLayer: 'countries_id_rpr', id: place_id },
          state
        )
      }
    })

    const stepFrac = 1 / 6
    map.addLayer(
      {
        id: 'geom-fills',
        type: 'fill',
        source: 'geoms',
        'source-layer': 'countries_id_rpr',
        paint: {
          'fill-color': [
            'case',
            ['==', ['feature-state', 'value'], null],
            'rgb(179, 179, 179)',
            [
              'step',
              ['feature-state', 'value'],
              '#b3b3b3',
              0,
              '#d6f0b2',
              stepFrac * 1,
              '#b9d7a8',
              stepFrac * 2,
              '#7fcdbb',
              stepFrac * 3,
              '#41b6c4',
              stepFrac * 4,
              '#2c7fb8',
              stepFrac * 5,
              '#303d91'
            ]
          ],
          'fill-opacity': 1
        }
      },
      'country-small'
    )

    map.addLayer(
      {
        id: 'geom-line',
        type: 'line',
        source: 'geoms',
        'source-layer': 'countries_id_rpr',
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'clicked'], true],
            '#ffffff',
            '#d3d3d3'
          ],
          'line-width': [
            'case',
            ['==', ['feature-state', 'clicked'], true],
            3,
            ['==', ['feature-state', 'hover'], true],
            3,
            0.5
          ]
        }
      },
      'country-small'
    )

    map.on('render', afterChangeComplete) // warning: this fires many times per second!

    function afterChangeComplete() {
      if (!map.loaded()) {
        return
      } // still not loaded; bail out.

      /**
       * Returns true if datum is 3 or more months old, false otherwise.
       * @method getStaleStatus
       */
      const getStaleStatus = (obs, timeFrame = 'month') => {
        if (obs['stale_flag'] === true) {
          const today = Util.today()
          const date_time = obs['date_time'].replace(/-/g, '/')
          const then = new Date(date_time)
          switch (timeFrame) {
            case 'month':
              if (today.getUTCMonth() - then.getUTCMonth() > 3) return true
              else return false
            case 'year':
              if (today.getUTCYear() - then.getUTCYear() > 3) return true
              else return false
          }
        } else return false
      }

      const setupCircleBubbleState = () => {
        incidenceObservations.forEach(observation => {
          const caseLoadObservation = bubbleObservations.find(
            bubObs => bubObs.place_id === observation.place_id
          )
          const trendObservation = trendObservations.find(
            tndObs => tndObs.place_id === observation.place_id
          )
          const value = observation['value']
          let value2, value3
          if (caseLoadObservation) {
            value2 = caseLoadObservation['value']
          }
          if (trendObservation) {
            if (Util.yearlyReportIso2.includes(trendObservation.place_iso)) {
              value3 = null
            } else {
              value3 = trendObservation['percent_change']
            }
          }
          const place_id = +observation['place_id']
          const stale = getStaleStatus(observation, 'month')

          if (!value) {
            map.setFeatureState(
              {
                source: 'centroids',
                sourceLayer: 'mvmupdatescentroidsv2',
                id: place_id
              },
              {
                value: 0,
                value2: value2 !== null ? value2 : null,
                stale: stale
              }
            )
          } else {
            const state = {
              value: value,
              value2: value2 !== null ? value2 : null,
              value3: value3 !== null ? value3 : null,
              stale: stale
            }
            map.setFeatureState(
              {
                source: 'centroids',
                sourceLayer: 'mvmupdatescentroidsv2',
                id: place_id
              },
              state
            )
          }
        })
      }
      setupCircleBubbleState()

      // /**
      //  * Draw circles as symbols. Issues: small circles appear pixelated and border thickness differs.
      //  * Potential solution: change native size of circle SVG?
      //  * @method setupSymbolCircles
      //  * @return {[type]}           [description]
      //  */
      // const setupSymbolCircles = () => {
      //
      //   // Load centroids
      //   const centroids = map.querySourceFeatures('centroids', {
      //     sourceLayer: 'mvmupdatescentroidsv2',
      //   });
      //
      //   const markerData = {
      //     type: 'FeatureCollection',
      //     features: [],
      //   };
      //
      //   incidenceObservations.forEach(( observation) => {
      //     const value = observation['value'];
      //     const place_id = +observation['place_id']
      //
      //     if (!value) {
      //       map.setFeatureState({source: 'centroids', sourceLayer: 'mvmupdatescentroidsv2', id: place_id }, {
      //         value: 0,
      //         lat: null,
      //         lon: null,
      //       }
      //     );
      //
      //     } else {
      //
      //       // Get matching centroid's lat/lon to store in state.
      //       const centroidTmp = centroids.find(d => d.id === place_id);
      //       const centroid = centroidTmp ? centroidTmp : {properties: {lat: null, lon: null}};
      //       const state = {
      //         value: value,
      //         lat: centroid.properties.lat,
      //         lon: centroid.properties.lon,
      //       };
      //       map.setFeatureState({source: 'centroids', sourceLayer: 'mvmupdatescentroidsv2', id: place_id }, state);
      //       markerData.features.push(
      //         {
      //           type: 'Feature',
      //           properties: {
      //             'value': value,
      //             'image': 'circle', // TODO set to hatch if applicable
      //           },
      //           geometry: {
      //             type: 'Point',
      //             coordinates: [state.lon, state.lat],
      //           }
      //         }
      //       );
      //     }
      //   });
      //
      //   // Set map symbol data
      //   map.getSource('markers').setData(markerData);
      //
      // };
      // setupSymbolCircles();

      map.off('render', afterChangeComplete) // remove this handler now that we're done.
      callback()
    }

    // Display circles as circle layer.
    const setupCircleBubbles = () => {
      // Add centroids to map so they can be accessed via getSourceFeatures.
      // Monthly incidence layer
      const s = 1.5811388300841895
      map.addLayer(
        {
          id: 'metric-bubbles-incidence_monthly',
          layout: {
            visibility: 'none'
          },
          type: 'circle',
          source: 'centroids',
          'source-layer': 'mvmupdatescentroidsv2',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['feature-state', 'value'],
              0,
              0,
              1,
              20 / s,
              20,
              20,
              100,
              20 * s,
              1000,
              20 * s * s
              // 10000,
              // 20 * s * s * s
              // 100000,
              // 20 * s * s * s * s // 50
              // 0,
              // 0,
              // 0.1,
              // 5,
              // 1,
              // 10,
              // 10,
              // 20,
              // 100,
              // 40,
              // 1000,
              // 50
            ],
            'circle-color': [
              'case',
              ['==', ['feature-state', 'stale'], false],
              '#b02c3a',
              ['==', ['feature-state', 'stale'], true],
              '#b02c3a',
              'white'
            ],
            'circle-opacity': [
              'case',
              ['==', ['feature-state', 'stale'], null],
              0,
              ['==', ['feature-state', 'clicked'], true],
              1,
              0.85
            ],
            // 'circle-stroke-width': 0,
            'circle-stroke-width': [
              'case',
              ['==', ['feature-state', 'stale'], null],
              0,
              ['==', ['feature-state', 'value'], 0],
              0,
              ['==', ['feature-state', 'clicked'], true],
              2,
              ['==', ['feature-state', 'hover'], true],
              2,
              1
            ],
            'circle-stroke-color': [
              'case',
              ['==', ['feature-state', 'stale'], false],
              '#ffffff',
              '#979797'
            ]
          }
        },
        'country-small'
      )

      // Number of cases layer
      map.addLayer(
        {
          id: 'metric-bubbles-caseload_totalpop',
          layout: {
            visibility: 'none'
          },
          type: 'circle',
          source: 'centroids',
          'source-layer': 'mvmupdatescentroidsv2',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['feature-state', 'value2'],
              0,
              0,
              1,
              5,
              3000,
              50
            ],
            'circle-color': [
              'case',
              ['==', ['feature-state', 'stale'], false],
              '#b02c3a',
              ['==', ['feature-state', 'stale'], true],
              '#b3b3b3',
              'white'
            ],
            'circle-opacity': [
              'case',
              ['==', ['feature-state', 'stale'], null],
              0,
              ['==', ['feature-state', 'clicked'], true],
              1,
              0.85
            ],
            // 'circle-stroke-width': 0,
            'circle-stroke-width': [
              'case',
              ['==', ['feature-state', 'stale'], null],
              0,
              ['==', ['feature-state', 'value2'], 0],
              0,
              ['==', ['feature-state', 'clicked'], true],
              2,
              ['==', ['feature-state', 'hover'], true],
              2,
              1
            ],
            'circle-stroke-color': [
              'case',
              ['==', ['feature-state', 'stale'], false],
              '#ffffff',
              '#979797'
            ]
          }
        },
        'country-small'
      )
    }

    setupCircleBubbles()
  }
}

export const initMiniMap = (
  map,
  fillObservations,
  bubbleObservations,
  incidenceObservations,
  callback
) => {
  map.on('load', function() {
    initGeoms(fillObservations, bubbleObservations, incidenceObservations)
  })

  const initGeoms = (
    fillObservations,
    bubbleObservations,
    incidenceObservations
  ) => {
    if (!map.getSource('geoms'))
      map.addSource('geoms', {
        type: 'vector',
        url: 'mapbox://traethethird.4kh7sxxt'
      })

    if (!map.getSource('centroids'))
      map.addSource('centroids', {
        type: 'vector',
        url: 'mapbox://traethethird.civp15xl'
        // url: 'mapbox://traethethird.9g6e0amc'
        // url: 'mapbox://traethethird.5u7sntcb'
      })

    fillObservations.forEach(observation => {
      const value = observation['value']
      const place_id = observation['place_id']

      map.setFeatureState(
        { source: 'geoms', sourceLayer: 'countries_id_rpr', id: place_id },
        { clicked: false }
      )
      if (!value) {
        map.setFeatureState(
          { source: 'geoms', sourceLayer: 'countries_id_rpr', id: place_id },
          { value: 0 }
        )
      } else {
        //const state = { value: Math.floor(256 * value)};
        const state = { value: value / 100 }
        map.setFeatureState(
          { source: 'geoms', sourceLayer: 'countries_id_rpr', id: place_id },
          state
        )
      }
    })

    map.on('render', afterChangeComplete) // warning: this fires many times per second!

    function afterChangeComplete() {
      if (!map.loaded()) {
        return
      } // still not loaded; bail out.

      map.off('render', afterChangeComplete) // remove this handler now that we're done.
      callback()
    }

    // Display circles as circle layer.
    const setupCircleBubbles = () => {
      // Add centroids to map so they can be accessed via getSourceFeatures.
      map.addLayer({
        id: 'metric-bubbles',
        type: 'circle',
        source: 'centroids',
        'source-layer': 'mvmupdatescentroidsv2',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['feature-state', 'value'],
            0,
            0,
            0.001,
            5,
            100,
            150
          ],
          'circle-color': [
            'case',
            ['==', ['feature-state', 'stale'], false],
            '#b02c3a',
            ['==', ['feature-state', 'stale'], true],
            '#b3b3b3',
            'white'
          ],
          'circle-opacity': [
            'case',
            ['==', ['feature-state', 'stale'], null],
            0,
            ['==', ['feature-state', 'clicked'], true],
            1,
            0.85
          ],
          // 'circle-stroke-width': 0,
          'circle-stroke-width': [
            'case',
            ['==', ['feature-state', 'stale'], null],
            0,
            ['==', ['feature-state', 'value'], 0],
            0,
            ['==', ['feature-state', 'clicked'], true],
            2,
            ['==', ['feature-state', 'hover'], true],
            2,
            1
          ],
          'circle-stroke-color': [
            'case',
            ['==', ['feature-state', 'stale'], false],
            '#ffffff',
            '#979797'
          ]
        }
      })
    }

    setupCircleBubbles()
  }
}
export default initMap
