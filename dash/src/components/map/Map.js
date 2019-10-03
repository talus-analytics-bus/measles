import React from 'react'
import ReactMapGL, { NavigationControl, Popup } from 'react-map-gl'

import TrendQuery from '../misc/TrendQuery.js'
import ObservationQuery from '../misc/ObservationQuery.js'

import 'mapbox-gl/dist/mapbox-gl.css'
import './map.scss'
//import styles from './map.module.scss'

import initMap from './mapUtils'

import Legend from './legend/Legend'
import ResetZoom from './resetZoom/ResetZoom'
//import Filter from './filter/Filter'
import GeomPopup from './geomPopup/GeomPopup.js'

const TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN

const Map = ({ fillObservations, bubbleObservations, mappedFacilityTypes, setMappedFacilityTypes }) => {

  const defaultViewport = {
    width: '100%',
    height: '100%',
    longitude: 0,
    latitude: 20,
    zoom: 2
  };
  const [viewport, setViewport] = React.useState(defaultViewport);
  const [selectedGeomID, setSelectedGeomID] = React.useState(-1)
  const [cursorLngLat, setCursorLngLat] = React.useState([0, 0])
  const [showGeomPopup, setShowGeomPopup] = React.useState(false)
  const [popupData, setPopupData] = React.useState({})

  // Track state for the trend observations
  const [trendObservations, setTrendObservations] = React.useState(() => {
    const initialState = [];
    return initialState;
  });

  // Track state for the incidence observations
  const [incidenceObservations, setIncidenceObservations] = React.useState(() => {
    const initialState = [];
    return initialState;
  });

  // Whether the reset button is shown or not. Controlled by the viewport
  // setting being other than the default.
  const [showReset, setShowReset] = React.useState(false);

  let mapRef = React.createRef()

  async function getTrendObservations() {
    // get the bubble data
    setTrendObservations(await TrendQuery(6, '2019-07-01'));
  }

  async function getIncidenceObservations() {
    // get the incidence data
    setIncidenceObservations(await ObservationQuery(15, 'monthly', '2019-07-01'));
  }

  React.useEffect(() => {
    const map = mapRef.getMap();
    initMap(map, fillObservations, bubbleObservations);
    getTrendObservations();
    getIncidenceObservations();
  }, [])

  /**
   * Reset the viewport to the default values. This is fired when the "Reset"
   * button is clicked.
   * @method resetViewport
   */
  const resetViewport = () => {

    // Hide the reset button after click.
    setShowReset(false);

    // Hide tooltip
    setShowGeomPopup(false);

    // Change viewport back to default.
    setViewport(defaultViewport);
  };

  /**
   * Fired when mouse moves on map, mainly to handle cursor styling.
   * @method handleMouseMove
   * @param  {obj}        e Mousemove event.
   */
  const handleMouseMove = e => {
    // Get map reference object.
    const map = mapRef.getMap();

    // Get list of features under the mouse cursor.
    const features = map.queryRenderedFeatures(e.point);

    // Use pointer cursor for any country, grab cursor otherwise.
    const onCountry = features.find(f => f['id'] > 0) !== undefined;

    map.getContainer().parentElement.parentElement.style.cursor =
      onCountry ? 'pointer' : 'grab';
  };

  const handleStyleLoad = map => (map.resize())

  /**
   * Fired when map is clicked.
   * @method handleClick
   * @param  {obj}    e Click event.
   */
  const handleClick = e => {
    /**
     * Returns true if user clicked any part of the legend or the filter menus
     * (rather than directly on the map), and false otherwise.
     * @method clickedMenus
     * @param  {obj}      e Click event.
     * @return {bool}        Boolean result (see description).
     */
    const clickedMenus = (e) => {
      try {
        if (
          e.target.className.includes('legend')
          || e.target.className.includes('filter')
          || e.target.offsetParent.className.includes('legend')
          || e.target.offsetParent.className.includes('filter')) {
            return true;
          }
        } catch {
          console.log('[Error] Unexpected click event: ')
          console.log(e);
          return false;
        }
        return false;
    };

    // If the user clicked on the legend and not on the actual map, do nothing.
    // Otherwise, do the correct map interaction.
    if (clickedMenus(e)) return;

    // Otherwise, highlight state and show its tooltip.
    const map = mapRef.getMap()

    // If there is a highlighted country, turn it off
    if (selectedGeomID > 0) {

      map.setFeatureState({source: 'geoms', sourceLayer: 'countries_id_rpr', id: selectedGeomID }, {clicked: false});

      const tooltipArr = document.getElementsByClassName('mapboxgl-popup');
      if (tooltipArr.length > 0) {
        const tooltipEl = tooltipArr[0];
        tooltipEl.classList.remove('fadeIn');
        tooltipEl.classList.add('fadeOut');
      }

      setShowGeomPopup(false)
      setSelectedGeomID(-1)
    }

    const clickedOnGeom = e.features.find(f => f.layer.id === 'geom-fills')

    if (typeof clickedOnGeom === 'undefined') return;

    console.log(clickedOnGeom)

    const id = clickedOnGeom.id
    map.setFeatureState({source: 'geoms', sourceLayer: 'countries_id_rpr', id: id }, {clicked: true});

    const bubbleData = bubbleObservations.find(f => f.place_id === id)
    const fillData = fillObservations.find(f => f.place_id === id)
    const trendData = trendObservations.find(f => f.place_id === id)
    console.log('incidenceObservations')
    console.log(incidenceObservations)
    const incidenceData = incidenceObservations.find(f => f.place_id === id)

    setPopupData(
      {
        'fill': fillData,
        'bubble': bubbleData,
        'trend': trendData,
        'incidence': incidenceData,
      }
    )

    setSelectedGeomID(id)
    setCursorLngLat(e.lngLat)
    setShowGeomPopup(true)

    /**
     * Fly user to specified longlat map location, and (if provided) to the
     * final zoom value -- otherwise the zoom value is 150% of the current
     * zoom value or 8, whichever is smaller.
     * @method flyToLongLat
     * @param  {array}     longlat   Longlat coord in decimal deg
     * @param  {float}     finalZoom Zoom value to end on, or null
     * @param  {object}     viewport  Viewport state variable
     * @param  {object}     mapRef    MapBox map reference object
     * @param  {function}     callback    Optional callback function when done
     */
    const flyToLongLat = (longlat, finalZoom, viewport, mapRef, callback = () => {}) => {

      // Get current zoom level.
      const curZoom = viewport.zoom;

      // Set zoom level to fly to (0 to 24 inclusive). Either zoom in by 20% or
      // the minimum zoom level required to see facilities, whichever is
      // smaller. Use final zoom if it specified.
      const flyZoom = finalZoom !== null ?
        finalZoom : Math.min(4, curZoom*1.50);

      // Start off flying
      let flying = true;

      /**
       * When flying stops, update the viewport position to match the place
       * that was flown to.
       * @method onFlyEnd
       */
      function onFlyEnd () {

        // Get map object reference.
        const map = mapRef.getMap();

        // Delete the event listener for the end of movement (we only want it to
        // be called when the current flight is over).
        map.off('moveend', onFlyEnd);

        // If flying,
        if (flying) {

          // Stop flying,
          flying = false;

          // Set viewport state to the flight destination and zoom level
          const newViewport = {
            width: '100%',
            height: '100%',
            longitude: longlat[0],
            latitude: longlat[1],
            zoom: flyZoom,
          };
          setViewport(newViewport);
          if (callback) callback();
        }
      };

      // Get map object reference.
      const map = mapRef.getMap();

      // Assign event listener so viewport is updated when flight is over.
      map.on('moveend', onFlyEnd);

      // Fly to the position occupied by the clicked cluster on the map.
      map.flyTo({
        center: longlat,
        zoom: flyZoom,
        bearing: 0,
        speed: 2,
        curve: 1,
        easing: function (t) { return t; }
      });

      setShowReset(true);
    };
  }

  const onPopupClose = () => {
    const map = mapRef.getMap()
    const id = selectedGeomID
    map.setFeatureState({source: 'geoms', sourceLayer: 'countries_id_rpr', id: id }, {clicked: false});
    setShowGeomPopup(false)
    setSelectedGeomID(-1)
  }

  return (
    <ReactMapGL
      ref={map => (mapRef = map)}
      mapboxApiAccessToken={TOKEN}
      mapStyle='mapbox://styles/traethethird/ck0ia6pvc2cpc1cpe5nx5b7p5'
      {...viewport}
      maxZoom = {4}
      minZoom = {2}
      onViewportChange={v => {
        // Update viewport.
        setViewport(v);

        // If viewport deviates from the default zoom or longlat, show the
        // "Reset" button in the bottom left. Otherwise, hide it.
        if (
            v.zoom !== defaultViewport.zoom
            || v.longitude !== defaultViewport.longitude
            || v.latitude !== defaultViewport.latitude
          ) setShowReset(true);
        else setShowReset(false);
      }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onStyleLoad={handleStyleLoad}
      doubleClickZoom={false} //remove 300ms delay on clicking
    >
      <div
        style={{
          position: 'absolute',
          bottom: '30px',
          left: 0,
          padding: '10px'
        }}
      >
      <NavigationControl />
      </div>
      <Legend />
      {showReset && (<ResetZoom handleClick={resetViewport}/>)}
      {showGeomPopup && (
        <Popup
          id='tooltip'
          longitude={cursorLngLat[0]}
          latitude={cursorLngLat[1]}
          closeButton={false}
          closeOnClick={false}
          onClose={onPopupClose}
          className={'fadingEffect fadeIn'}
        >
          <GeomPopup
            popupData={popupData}
          />
        </Popup>
      )}
    </ReactMapGL>
  )
}

export default Map
