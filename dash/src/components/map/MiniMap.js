import React from 'react'
import ReactMapGL, { Marker, NavigationControl, Popup } from 'react-map-gl'
import * as d3 from 'd3/dist/d3.min';

import 'mapbox-gl/dist/mapbox-gl.css'
import './map.scss'

import {initMiniMap} from './mapUtils.js'

import Legend from './legend/Legend'
import ResetZoom from './resetZoom/ResetZoom'
import GeomPopup from './geomPopup/GeomPopup.js'

const TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN

const MiniMap = (props) => {

  const defaultViewport = {
    width: '100%',
    height: '100%',
    longitude: 10.342874999994592,
    latitude: 42.22287158145244,
    zoom: 0,
  };
  const [viewport, setViewport] = React.useState(defaultViewport);
  const [markerCoords, setMarkerCoords] = React.useState({ready: false, latitude: 0, longitude: 0,});

  let mapRef = React.createRef()

  React.useEffect(() => {
    const map = mapRef.getMap();

    console.log('map')
    console.log(map)

    initMiniMap(
      map,
      [],
      [],
      [],
      function afterMapLoaded () {

        const centroidFeatures = map.querySourceFeatures('centroids', {
          sourceLayer: 'centroids_id_rpr_latlon',
        });

        const countryFeature = centroidFeatures.find(f => {
          return f.properties.ISO_A2 === props.countryIso2;
        });

        if (countryFeature) {
          setMarkerCoords(
            {
              longitude: countryFeature.properties.lon,
              latitude: countryFeature.properties.lat,
              ready: true,
            }
          );
        }
      });

    }, [])

  const handleStyleLoad = map => (map.resize())

  return (
    <ReactMapGL
      ref={map => { mapRef = map; }}
      mapboxApiAccessToken={TOKEN}
      mapStyle='mapbox://styles/traethethird/ck1s9omx85bwe1dpe1oeq1878'
      {...viewport}
      onViewportChange={v => {
        // Update viewport.
        setViewport(v);
      }}
      onStyleLoad={handleStyleLoad}
      doubleClickZoom={false} //remove 300ms delay on clicking
      // dragPan={false}
      minZoom={0}
      maxZoom={0}
      wrapAroundWorld={false}
    >
      {
        <Marker latitude={markerCoords.latitude} longitude={markerCoords.longitude}>
          <div
            style={{'opacity': markerCoords.ready ? 1 : 0 }}
            className={'general-marker'}>
          </div>
        </Marker>
      }
    </ReactMapGL>
  )
}

export default MiniMap
