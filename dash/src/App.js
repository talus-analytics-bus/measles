import React from 'react'
import { Route, Switch, BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import Modal from 'reactjs-popup'
import classNames from 'classnames';
import * as d3 from 'd3/dist/d3.min';

// layout
import Logo from './components/layout/logo/Logo.js'

// map
import Map from './components/map/Map'
import Util from './components/misc/Util.js'

// views
//import Alerts from './components/views/alerts/Alerts.js'
import Details from './components/views/details/Details.js'

// styles
import styles from './App.module.scss'
import 'material-design-icons/iconfont/material-icons.css'

// queries
import ObservationQuery from './components/misc/ObservationQuery.js'
import PlaceQuery from './components/misc/PlaceQuery.js'

//: React.FC
const App = () => {

  // Track which page is being shown to keep the logo bar updated.
  const [page, setPage] = React.useState('')

  const [showWm, setShowWm] = React.useState(false)

  const [bubbleObservations, setBubbleObservations] = React.useState(() => {
    const initialState = [];
    return initialState;
  });

  const [incidenceObservations, setIncidenceObservations] = React.useState(() => {
    const initialState = [];
    return initialState;
  });

  const [fillObservations, setFillObservations] = React.useState(() => {
    const initialState = [];
    return initialState;
  });

  const [places, setPlaces] = React.useState(() => {
    const initialState = [];
    return initialState;
  });

  // Hide the "How to use this map" modal if it has already been displayed
  // once to the user.
  // turning off always until we need interval
  const [shownMapModal, setShownMapModal] = React.useState(true);

  // Track whether the welcome modal has been shown once yet.
  const [showWelcomeModal, setShowWelcomeModal] = React.useState(false)

  // Track whether the component is still loading.
  const [loading, setLoading] = React.useState(true)

  // Track whether navbar loading spinner should show
  const [loadingNav, setLoadingNav] = React.useState(true)

  // Track details component
  const [detailsComponent, setDetailsComponent] = React.useState(null)

  async function getAppData() {
    const placesParams = {
      place_id: null,
      by_region: true,
    };
    const queries = {
      caseload: ObservationQuery(6, 'monthly', Util.formatDatetimeApi(Util.today())),
      incidence: ObservationQuery(15, 'monthly', Util.formatDatetimeApi(Util.today())),
      vaccination: ObservationQuery(4, 'yearly', '2018-01-01'),
      places: PlaceQuery(placesParams.place_id, placesParams.by_region),
    };

    const results = {};
    for (let q in queries) {
      results[q] = await queries[q];
    }
    // get the bubble data
    setBubbleObservations(results['caseload']);

    // get the incidence data
    setIncidenceObservations(results['incidence']);

    // get the places data
    setPlaces(results['places']);

    // get the fill data
    // TODO make this work the same way as the other "get most recent data queries", since it doesn't seem to
    setFillObservations(results['vaccination']);
    setLoading(false);
  }

  // Track whether the welcome modal has been shown yet. If so, do not show it
  // again.
  let alreadyShowedWelcomeModal = false;
  React.useEffect(() => {
    getAppData()

    // If welcome modal isn't being shown currently and it has not already been
    // shown, show it, and mark it as already shown.
    if (!showWelcomeModal && !alreadyShowedWelcomeModal) {
      setShowWelcomeModal(true);
      alreadyShowedWelcomeModal = true;
    }
  }, [])

  // Functions to render each page's elements.
  const renderMap = loading ? <div /> :
    <Map // map page
      fillObservations={fillObservations} // observation data for map
      bubbleObservations={bubbleObservations} // observation data for map
      incidenceObservations={incidenceObservations} // observation data for map
      shownMapModal={shownMapModal} // don't show help modal more than once
      setShownMapModal={setShownMapModal} // update modal display status
      setLoadingNav={setLoadingNav}
      className={'map'}
      />

  const getIncidenceQuantile = (allObsTmp, countryObs) => {

    // 0.2, 0.6, 1.4, and 4.1
    const quantiles = [
      .2,
      .6,
      1.4,
      4.1,
    ];

    for (let i = 0; i < quantiles.length; i++) {
      if (countryObs.value < quantiles[i]) {
        return i;
      } else if (i === quantiles.length - 1 && countryObs.value >= quantiles[i]) {
        return (i + 1);
      }
    }
    return null;

    // const allObs = allObsTmp.filter(o => {
    //   return o.value && o.value !== null && o.value > 0;
    // })
    // .map(o => o.value)
    // .sort();
    //
    // const quartiles = [
    //   d3.quantile(allObs, .25),
    //   d3.quantile(allObs, .5),
    //   d3.quantile(allObs, .75),
    // ];
    //
    //
    // if (countryObs.value < quartiles[0]) {
    //   return 0;
    // }
    // else if (countryObs.value < quartiles[1]) {
    //   return 1;
    // }
    // else if (countryObs.value < quartiles[2]) {
    //   return 2;
    // }
    // else if (countryObs.value >= quartiles[2]) {
    //   return 3;
    // } else return null;
  };

  const renderDetails = id => {
    if (loading) {
      return <div />
    }
    else if (detailsComponent === null || (detailsComponent && detailsComponent.props.id !== id)) {
      // // if no selected country, load the correct one based on the ID
      // const coverage = fillObservations.find(o => +o.place_id === +id)
      // const cases = bubbleObservations.find(o => +o.place_id === +id)

      // Function to make API calls to get data for the state variables above.
      const getDetailsData = async (country) => {

        // Get all needed values in parallel
        const queries = {
          countryPopQ: ObservationQuery(3, 'yearly', '2018-01-01', '2018-01-01', country),
          countryGDPQ: ObservationQuery(14, 'yearly', '2018-01-01', '2018-01-01', country),
          countryJeeImmunQ: ObservationQuery(16, 'occasion', undefined, undefined, country),
          countryJeeSurvQ: ObservationQuery(17, 'occasion', undefined, undefined, country),
          countryJeeMcmQ: ObservationQuery(18, 'occasion', undefined, undefined, country),
          countryIncidenceHistoryFull: ObservationQuery(15, 'monthly', '2019-10-01', '2010-01-01', country),
          countryVaccHistory: ObservationQuery(4, 'yearly', '2018-01-01', '2010-01-01', country),
        };

        const results = {};
        for (let q in queries) {
          results[q] = await queries[q];
        }

        // Country basic info
        const countryPop = results.countryPopQ[0];
        const countryName = results.countryPopQ[0]['place_name'];
        const countryIso2 = results.countryPopQ[0]['place_iso'];
        const countryGDP = results.countryGDPQ[0];

        // Latest relevant JEE scores.
        const countryJeeImmun = results.countryJeeImmunQ[0];
        const countryJeeSurv = results.countryJeeSurvQ[0];
        const countryJeeMcm = results.countryJeeMcmQ[0];

        // Incidence history and latest observation
        // Do not show null values in data for now
        const foundNotNullVal = {
          fromStart: false,
          fromEnd: false,
        };
        const countryIncidenceHistory = results.countryIncidenceHistoryFull
            .filter(d => {
              if (foundNotNullVal.fromStart) return true;
              else {
                if (d.value === null) return false;
                else {
                  foundNotNullVal.fromStart = true;
                  return true;
                }
              }
            })
            .reverse()
            .filter(d => {
              if (foundNotNullVal.fromEnd) return true;
              else {
                if (d.value === null) return false;
                else {
                  foundNotNullVal.fromEnd = true;
                  return true;
                }
              }
            })
            .reverse();

        // const countryIncidenceHistory = results.countryIncidenceHistoryFull
        //   .filter(d => d.value !== null);

        const countryIncidenceLatest = countryIncidenceHistory.length > 0 ? countryIncidenceHistory[countryIncidenceHistory.length - 1] : {};

        // Vacc. coverage history and latest observation
        const countryVaccLatest = results.countryVaccHistory.length > 0 ? results.countryVaccHistory[results.countryVaccHistory.length - 1] : {};

        // Get quartile of incidence
        const countryIncidenceQuantile = getIncidenceQuantile(incidenceObservations, countryIncidenceLatest);

        // Currently unused
        // const caseHistoryQ = await ObservationQuery(6, 'monthly', '2010-01-01', '2018-01-01', country);

        setDetailsComponent(<Details
          id={country}
          countryPop={countryPop}
          countryName={countryName}
          countryIso2={countryIso2}
          countryGDP={countryGDP}
          countryJeeImmun={countryJeeImmun}
          countryJeeSurv={countryJeeSurv}
          countryJeeMcm={countryJeeMcm}
          countryIncidenceHistory={countryIncidenceHistory}
          countryIncidenceLatest={countryIncidenceLatest}
          countryIncidenceQuantile={countryIncidenceQuantile}
          countryVaccHistory={results.countryVaccHistory}
          countryVaccLatest={countryVaccLatest}
        />);
      }
      getDetailsData(id);
      return <div />;
    } else {
      setLoadingNav(false);
      return detailsComponent;
    }
  }

  // JSX for main app. Switch component allows links in the header to be used to
  // determine main app content.
  return (
    <div className={styles.app}>
      <BrowserRouter>
        <Logo page={page} loadingNav={loadingNav} places={places} />
        <Switch>
          <div>
            <Route exact path='/' component={ () => { setPage('map'); setLoadingNav(true); return renderMap; } } />
            <Route exact path='/map' component={ () => { setPage('map'); setLoadingNav(true); return renderMap; } } />
            <Route exact path='/global' component={ () => { setPage('global'); return <div className={'dev global'}>The global page is currently being developed.</div>; } } />
            <Route
              path='/details/:id'
              component={d => {
                setPage('details');
                setLoadingNav(true);
                return renderDetails(d.match.params.id)
              }}
            />
          </div>
        </Switch>
        {
          showWelcomeModal && (
            <Modal
              position="top center"
              on="click"
              closeOnDocumentClick
              defaultOpen={showWelcomeModal}
              modal
            >
              {
                close => (
                  <div className={styles.modal}>
                    <div className={styles.header}>
                      Welcome to the Measles Tracker
                    </div>
                    <div className={styles.content}>
                      <div className={styles.text}>
                        <p>The Measles Tracker integrates, analyzes, and visualizes measles surveillance and vaccination data to provide a comprehensive overview of the current status of the measles outbreak globally, including the populations and regions most at risk. The dashboard was developed by Talus Analytics and is designed to be used in Chrome or Firefox.</p>
                      </div>
                      <button className={classNames('button', 'modal')} onClick={close}>Continue</button>
                    </div>
                  </div>
                )
              }
            </Modal>
          )
        }
      </BrowserRouter>
    </div>
  )
}

export default App
