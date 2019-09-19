import React from 'react'
import { Route, Switch, BrowserRouter } from 'react-router-dom'
import axios from 'axios'

// layout
import Alert from './components/layout/alert/Alert'
import Logo from './components/layout/logo/Logo'

// views
import Alerts from './components/views/alerts/Alerts.js'
import Details from './components/views/details/Details'

// styles
import styles from './App.module.scss'
import 'material-design-icons/iconfont/material-icons.css'

var API_BASE = process.env.REACT_APP_API_BASE_URL
if (typeof API_BASE === 'undefined') {
  API_BASE = 'http://localhost:5002'
}

var DEMO_DATE = process.env.DEMO_DATE
if (typeof DEMO_DATE === 'undefined') {
  DEMO_DATE = '2025-07-04T23:56:00'
}

console.log('DEMO_DATE')
console.log(DEMO_DATE)

//: React.FC
const App = () => {
  console.log('Render App')

  const [showWm, setShowWm] = React.useState(false)

  const [bubbleObservations, setBubbleObservations] = React.useState(() => {
    const initialState = [];
    return initialState;
  });

  const [fillObservations, setFillObservations] = React.useState(() => {
    const initialState = [];
    return initialState;
  });

  // Hide the "How to use this map" modal if it has already been displayed
  // once to the user.
  // turning off always until we need interval
  const [shownMapModal, setShownMapModal] = React.useState(true);

  // Track whether the component is still loading.
  const [loading, setLoading] = React.useState(true)

  /**
   * Get observation data from API. Updates the observation data and loading status
   * when complete.
   * @method getObservations
   */
  async function getObservations(metric_id, temporal_resolution, start_date, end_date=null, country='all') {
    if (end_date === null) {end_date = start_date};

    var params = {
      metric_id: metric_id,
      temporal_resolution: temporal_resolution,
      spatial_resolution: 'country',
      start: start_date,
      end: end_date
    };

    if (country !== 'all') { params['place_id'] = 'country'};

    const res = await axios(`${API_BASE}/observations`, {
      params
    });

    return res.data.data
  }

  async function getMapObservations() {
    // get the bubble data
    setBubbleObservations(await getObservations(6, 'monthly', '2019-07-01'));
    // get the fill data
    setFillObservations(await getObservations(4, 'yearly', '2018-01-01'));
    setLoading(false);
  }

  React.useEffect(() => {
    getMapObservations()
  }, [])

  // Functions to render each page's elements.
  const renderAlerts = loading ? <div /> :
    <Alerts // map page
      fillObservations={fillObservations} // observation data for map
      bubbleObservations={bubbleObservations} // observation data for map
      shownMapModal={shownMapModal} // don't show help modal more than once
      setShownMapModal={setShownMapModal} // update modal display status
      />

  const renderDetails = id => {
    if (loading) return <div />
    else {
      // if no selected country, load the correct one based on the ID
      const coverage = fillObservations.find(o => +o.place_id === +id)
      const cases = bubbleObservations.find(o => +o.place_id === +id)

      return <Details id={id} coverage={coverage} cases={cases} />
    }
  }

  // JSX for main app. Switch component allows links in the header to be used to
  // determine main app content.
  return (
    <div className={styles.app}>
      <BrowserRouter>
        <Logo />
        <Switch>
          <div>
            <Route exact path='/alerts' render={() => renderAlerts} />
            <Route exact path='/' component={() => renderAlerts} />
            <Route
              path='/details/:id'
              render={d => {
                return renderDetails(d.match.params.id)
              }}
            />
          </div>
        </Switch>
      </BrowserRouter>
    </div>
  )
}

export default App
