import React from 'react'
import { Route, Switch, BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import Modal from 'reactjs-popup'
import classNames from 'classnames'
import * as d3 from 'd3/dist/d3.min'
import ReactTooltip from 'react-tooltip'
import BrowserDetection from 'react-browser-detection'

// layout
import Nav from './components/layout/nav/Nav.js'
import Footer from './components/layout/footer/Footer.js'

// map
import Map from './components/map/Map'
import Util from './components/misc/Util.js'

// views
import Details from './components/views/details/Details.js'
import Global from './components/views/global/Global.js'
import About from './components/views/about/About.js'

// styles
import styles from './App.module.scss'
import './components/views/details/details.module.scss'
import infoTooltipStyles from './components/misc/infotooltip.module.scss'
import 'material-design-icons/iconfont/material-icons.css'

// queries
import ObservationQuery from './components/misc/ObservationQuery.js'
import PlaceQuery from './components/misc/PlaceQuery.js'
import TrendQuery from './components/misc/TrendQuery.js'

// charts
import MiniLine from './components/views/global/content/MiniLine.js'
import Scatter from './components/views/global/content/Scatter.js'
import PagingBar from './components/views/global/content/PagingBar.js'

//: React.FC
const App = () => {
  // Track which page is being shown to keep the logo bar updated.
  const [page, setPage] = React.useState('')

  const [showWm, setShowWm] = React.useState(false)

  const [bubbleObservations, setBubbleObservations] = React.useState(() => {
    const initialState = []
    return initialState
  })

  const [trendObservations, setTrendObservations] = React.useState(() => {
    const initialState = []
    return initialState
  })

  const [incidenceObservations, setIncidenceObservations] = React.useState(
    () => {
      const initialState = []
      return initialState
    }
  )

  const [fillObservations, setFillObservations] = React.useState(() => {
    const initialState = []
    return initialState
  })

  const [places, setPlaces] = React.useState(() => {
    const initialState = []
    return initialState
  })

  // set nav title
  // const [navTitle, setNavTitle] = React.useState('');

  // // function for setting nav title
  // const changeNavTitle = React.useCallback((newNavTitle) => {
  //   setNavTitle(newNavTitle);
  // }, []);

  // Hide the "How to use this map" modal if it has already been displayed
  // once to the user.
  // turning off always until we need interval
  const [shownMapModal, setShownMapModal] = React.useState(true)

  // Track whether the welcome modal has been shown once yet.
  const [showWelcomeModal, setShowWelcomeModal] = React.useState(false)

  // Track whether the component is still loading.
  const [loading, setLoading] = React.useState(true)

  // Track whether navbar loading spinner should show
  const [loadingNav, setLoadingNav] = React.useState(true)

  // Track details component
  const [detailsComponent, setDetailsComponent] = React.useState(null)

  // Track global component
  const [globalComponent, setGlobalComponent] = React.useState(null)

  async function getAppData() {
    const placesParams = {
      place_id: null,
      by_region: true
    }
    const queries = {
      caseload: ObservationQuery(
        6,
        'monthly',
        Util.formatDatetimeApi(Util.today())
      ),
      incidence: ObservationQuery(
        15,
        'monthly',
        Util.formatDatetimeApi(Util.today())
      ),
      vaccination: ObservationQuery(4, 'yearly', '2018-01-01'),
      trend: TrendQuery(6, Util.formatDatetimeApi(Util.today())),
      places: PlaceQuery(placesParams.place_id, placesParams.by_region)
    }

    // for (const [key, value] of Object.entries(object1)) {
    //     console.log(`${key}: ${value}`);
    // }

    const results = {}
    for (let q in queries) {
      results[q] = await queries[q]
    }
    // get the bubble data
    setBubbleObservations(results['caseload'])

    // get the trend data
    setTrendObservations(results['trend'])

    // get the incidence data
    setIncidenceObservations(results['incidence'])

    // get the places data
    setPlaces(results['places'])

    // get the fill data
    // TODO make this work the same way as the other "get most recent data queries", since it doesn't seem to
    setFillObservations(results['vaccination'])
    setLoading(false)
  }

  // Track whether the welcome modal has been shown yet. If so, do not show it
  // again.
  let alreadyShowedWelcomeModal = false
  React.useEffect(() => {
    getAppData()

    // If welcome modal isn't being shown currently and it has not already been
    // shown, show it, and mark it as already shown.
    if (!showWelcomeModal && !alreadyShowedWelcomeModal) {
      setShowWelcomeModal(true)
      alreadyShowedWelcomeModal = true
    }
  }, [])

  // Functions to render each page's elements.
  const renderMap = loading ? (
    <div />
  ) : (
    <Map // map page
      fillObservations={fillObservations} // observation data for map
      bubbleObservations={bubbleObservations} // observation data for map
      trendObservations={trendObservations} // observation data for map
      incidenceObservations={incidenceObservations} // observation data for map
      shownMapModal={shownMapModal} // don't show help modal more than once
      setShownMapModal={setShownMapModal} // update modal display status
      setLoadingNav={setLoadingNav}
      // setNavTitle={changeNavTitle}
      className={'map'}
    />
  )

  const renderDetails = id => {
    if (loading) {
      return <div />
    } else if (
      detailsComponent === null ||
      (detailsComponent && detailsComponent.props.id !== id)
    ) {
      // // if no selected country, load the correct one based on the ID
      // const coverage = fillObservations.find(o => +o.place_id === +id)
      // const cases = bubbleObservations.find(o => +o.place_id === +id)

      // Function to make API calls to get data for the state variables above.
      const getDetailsData = async country => {
        // Get all needed values in parallel
        const queries = {
          countryBasicsQ: PlaceQuery(country, false),
          countryPopQ: ObservationQuery(
            3,
            'yearly',
            '2018-01-01',
            '2018-01-01',
            country
          ),
          countryGDPQ: ObservationQuery(
            14,
            'yearly',
            '2018-01-01',
            '2018-01-01',
            country
          ),
          countryJeeImmunQ: ObservationQuery(
            16,
            'occasion',
            undefined,
            undefined,
            country
          ),
          countryJeeSurvQ: ObservationQuery(
            17,
            'occasion',
            undefined,
            undefined,
            country
          ),
          countryJeeMcmQ: ObservationQuery(
            18,
            'occasion',
            undefined,
            undefined,
            country
          ),
          countryIncidenceHistoryFull: ObservationQuery(
            15,
            'monthly',
            Util.formatDatetimeApi(Util.today()),
            '2010-01-01',
            country
          ),
          countryCaseloadHistoryFull: ObservationQuery(
            6,
            'monthly',
            Util.formatDatetimeApi(Util.today()),
            '2010-01-01',
            country
          ),
          countryCaseloadTrend: TrendQuery(
            6,
            Util.formatDatetimeApi(Util.today()),
            6,
            country
          ),
          countryVaccHistory: ObservationQuery(
            4,
            'yearly',
            Util.formatDatetimeApi(Util.today()),
            '2010-01-01',
            country
          ),
          caseload_12months: ObservationQuery(
            7,
            'monthly',
            Util.formatDatetimeApi(Util.today()),
            Util.formatDatetimeApi(Util.today()),
            country
          )
        }

        const results = {}
        for (let q in queries) {
          results[q] = await queries[q]
        }

        // Country basic info
        const countryPop = results.countryPopQ[0]
        const countryName = results.countryBasicsQ[0][1]
        const countryIso2 = results.countryBasicsQ[0][2]
        const countryGDP = results.countryGDPQ[0]

        // Latest relevant JEE scores.
        const countryJeeImmun = results.countryJeeImmunQ[0]
        const countryJeeSurv = results.countryJeeSurvQ[0]
        const countryJeeMcm = results.countryJeeMcmQ[0]

        // Clean up incidence and caseload history data
        const cleanHistories = dataName => {
          // Incidence history and latest observation
          // Do not show null values in data for now
          const foundNotNullVal = {
            fromStart: false,
            fromEnd: false
          }

          return results[dataName]
            .filter(d => {
              if (foundNotNullVal.fromStart) return true
              else {
                if (d.value === null) return false
                else {
                  foundNotNullVal.fromStart = true
                  return true
                }
              }
            })
            .reverse()
            .filter(d => {
              if (foundNotNullVal.fromEnd) return true
              else {
                if (d.value === null) return false
                else {
                  foundNotNullVal.fromEnd = true
                  return true
                }
              }
            })
            .reverse()
        }
        const countryIncidenceHistory = cleanHistories(
          'countryIncidenceHistoryFull'
        )
        const countryCaseloadHistory = cleanHistories(
          'countryCaseloadHistoryFull'
        )

        // Calculate 12-month and 6-month case totals
        const countryCaseload12MonthsCalc = Util.getCumulativeCount(
          countryCaseloadHistory,
          12,
          0
        )
        const countryCaseload6MonthsCalc = Util.getCumulativeCount(
          countryCaseloadHistory,
          6,
          0
        )
        const countryCaseload1MonthsCalc = Util.getCumulativeCount(
          countryCaseloadHistory,
          1,
          0
        )

        const countryTrendCaseload12Months = Util.getCumulativeTrend(
          countryCaseloadHistory,
          countryCaseload12MonthsCalc,
          12
        )

        const countryTrendCaseload6Months = Util.getCumulativeTrend(
          countryCaseloadHistory,
          countryCaseload6MonthsCalc,
          6
        )
        const countryTrendCaseload1Months = Util.getCumulativeTrend(
          countryCaseloadHistory,
          countryCaseload1MonthsCalc,
          1
        )

        let countryIncidenceLatest =
          countryIncidenceHistory.length > 0
            ? countryIncidenceHistory[countryIncidenceHistory.length - 1]
            : { value: null }

        if (countryIncidenceLatest.date_time !== undefined) {
          // Don't use it if more than 3 months old.
          const age = Util.getMonthsDiff(
            Util.formatDatetimeApi(Util.today()),
            countryIncidenceLatest.date_time
          )
          if (age > 3) countryIncidenceLatest = { value: null }
        }

        // Vacc. coverage history and latest observation
        const countryVaccLatest =
          results.countryVaccHistory.length > 0
            ? results.countryVaccHistory[results.countryVaccHistory.length - 1]
            : {}

        // Get quartile of incidence
        const countryIncidenceQuantile = Util.getIncidenceQuantile(
          countryIncidenceLatest
        )

        setDetailsComponent(
          <Details
            id={country}
            countryPop={countryPop}
            countryName={countryName}
            countryIso2={countryIso2}
            countryGDP={countryGDP}
            countryJeeImmun={countryJeeImmun}
            countryJeeSurv={countryJeeSurv}
            countryJeeMcm={countryJeeMcm}
            countryIncidenceHistory={countryIncidenceHistory}
            countryCaseloadHistory={countryCaseloadHistory}
            countryCaseload12Months={results.caseload_12months}
            countryCaseload12MonthsCalc={countryCaseload12MonthsCalc}
            countryTrendCaseload12Months={countryTrendCaseload12Months}
            countryTrendCaseload6Months={countryTrendCaseload6Months}
            countryCaseload6MonthsCalc={countryCaseload6MonthsCalc}
            countryTrendCaseload1Months={countryTrendCaseload1Months}
            countryIncidenceLatest={countryIncidenceLatest}
            countryIncidenceQuantile={countryIncidenceQuantile}
            countryVaccHistory={results.countryVaccHistory}
            countryVaccLatest={countryVaccLatest}
          />
        )
      }
      getDetailsData(id)

      return <div />
    } else {
      setLoadingNav(false)
      return detailsComponent
    }
  }

  const renderGlobal = id => {
    if (loading) {
      // Does NOT result in double load
      return <div />
    } else if (globalComponent === null) {
      // ALWAYS results in double load

      // Function to make API calls to get data for the state variables above.
      const getGlobalData = async () => {
        // Initialize chart parameters.
        const chartParams = {
          MiniLine: [
            {
              class: MiniLine,
              params: {
                domain: [new Date('2016/01/01'), Util.globalMaxDate()],
                className: 'MiniLine',
                margin: {
                  top: 35,
                  right: 0,
                  bottom: 22,
                  left: 20
                }
              }
            },
            {
              class: MiniLine,
              params: {
                domain: [new Date('2016/01/01'), Util.globalMaxDate()],
                className: 'MiniLine',
                margin: {
                  top: 35,
                  right: 0,
                  bottom: 22,
                  left: 20
                }
              }
            }
          ],
          Scatter: [
            {
              class: Scatter,
              params: {
                className: 'Scatter',
                domain: [new Date('2016/01/01'), Util.globalMaxDate()],
                margin: {
                  top: 68,
                  right: 20,
                  bottom: 80,
                  left: 120
                }
              }
            }
          ],
          PagingBar: [
            {
              class: PagingBar,
              params: {
                className: 'PagingBar',
                domain: [new Date('2016/01/01'), Util.globalMaxDate()]
              }
            }
          ]
        }

        // Get all needed values in parallel
        // TODO
        const queries = {
          // TODO - make global and yearly
          miniLine1Data: ObservationQuery(
            // global monthly caseload
            23,
            'monthly',
            Util.formatDatetimeApi(chartParams.MiniLine[0].params.domain[1]),
            Util.formatDatetimeApi(chartParams.MiniLine[0].params.domain[0]),
            315, // Global
            'global'
          ),
          // TODO - make global
          miniLine2Data: ObservationQuery(
            4,
            'yearly',
            Util.formatDatetimeApi(chartParams.MiniLine[0].params.domain[1]),
            Util.formatDatetimeApi(chartParams.MiniLine[0].params.domain[0])
          ),
          caseload: ObservationQuery(
            6,
            'monthly',
            Util.formatDatetimeApi(chartParams.Scatter[0].params.domain[1]),
            Util.formatDatetimeApi(chartParams.Scatter[0].params.domain[0])
          ),
          caseload_12months: ObservationQuery(
            // DEBUG: replace with metric 24
            // 6,
            7,
            'monthly',
            Util.formatDatetimeApi(Util.globalMaxDate())
          ),
          incidence: ObservationQuery(
            15,
            'monthly',
            Util.formatDatetimeApi(chartParams.Scatter[0].params.domain[1]),
            Util.formatDatetimeApi(chartParams.Scatter[0].params.domain[0])
          ),
          vaccination: ObservationQuery(
            4,
            'yearly',
            Util.formatDatetimeApi(chartParams.Scatter[0].params.domain[1]),
            Util.formatDatetimeApi(chartParams.Scatter[0].params.domain[0])
          ),
          vaccination_recent: ObservationQuery(
            4,
            'yearly',
            Util.formatDatetimeApi(Util.globalMaxDate())
          ),
          population: ObservationQuery(
            3,
            'yearly',
            Util.formatDatetimeApi(chartParams.Scatter[0].params.domain[1]),
            Util.formatDatetimeApi(chartParams.Scatter[0].params.domain[0])
          )
        }

        const results = {}
        for (let q in queries) {
          results[q] = await queries[q]
        }
        chartParams.MiniLine[0].params.data = results.miniLine1Data

        // Get average vaccination for each year based on average of countries
        // TODO store this in the generalized metric database, or the data
        // source text won't render accurately if we ever use more than one
        // data source for vaccination coverage.
        const averageVaccDataObj = {}
        results.miniLine2Data.forEach(d => {
          if (averageVaccDataObj[d.date_time] === undefined) {
            if (d.value === null) return
            else {
              d.metric = 'avg_coverage_mcv1_infant'
              averageVaccDataObj[d.date_time] = {
                ...d,
                tempValues: [d.value],
                place_name: 'World'
              }
            }
          } else {
            if (d.value === null) return
            else {
              averageVaccDataObj[d.date_time].tempValues.push(d.value)
            }
          }
        })

        // Take averages -- TODO in database view, not in JS.
        const averageVaccData = []
        for (let key in averageVaccDataObj) {
          const curYearDatum = averageVaccDataObj[key]
          curYearDatum.value = d3.mean(curYearDatum.tempValues)
          delete curYearDatum.tempValues
          averageVaccData.push(curYearDatum)
        }
        chartParams.MiniLine[1].params.data = averageVaccData
        // chartParams.MiniLine[1].params.data = results.miniLine2Data;

        chartParams.Scatter[0].params.data = {
          x: results.vaccination,
          y: results.incidence,
          size: results.caseload
        }
        chartParams.PagingBar[0].params.data = {
          y: results.caseload_12months.filter(d => {
            // Only return results with data on the global page max date.
            const date_str = Util.formatDatetimeApi(Util.globalMaxDate())
            return d.date_time.startsWith(date_str)
          }),
          y2: results.vaccination_recent
        }

        setGlobalComponent(
          <Global
            places={places} // for paging bar chart regions
            chartParams={chartParams}
          />
        )
      }
      getGlobalData(id)
      return <div />
    } else {
      // Does NOT result in double load
      setLoadingNav(false)
      return globalComponent
    }
  }

  const modalToShow = Util.mobilecheck()
    ? { default: () => browserModal('a mobile browser') }
    : {
        chrome: () => welcomeModal,
        firefox: () => welcomeModal,
        safari: browser => welcomeModal,
        edge: browser => browserModal('Edge'),
        ie: browser => browserModal('Internet Explorer'),
        opera: browser => browserModal('Opera'),
        default: browser => browserModal('an unsupported browser')
      }

  const welcomeModal = (
    <Modal
      position='top center'
      on='click'
      closeOnDocumentClick
      defaultOpen={showWelcomeModal}
      modal
    >
      {close => (
        <div className={styles.modal}>
          <div className={styles.header}>Welcome to the Measles Tracker</div>
          <div className={styles.content}>
            <div className={styles.text}>
              <p>
                The Measles Tracker integrates, analyzes, and visualizes measles
                surveillance and vaccination data to provide a comprehensive
                overview of the current status of the measles outbreak globally,
                including the populations and regions most at risk. The
                dashboard was developed by{' '}
                <b>
                  <a target='_blank' href='http://talusanalytics.com/'>
                    Talus Analytics
                  </a>
                </b>{' '}
                and is designed to be used in Chrome, Firefox, or Safari desktop
                browsers.
              </p>
            </div>
            <button className={classNames('button', 'modal')} onClick={close}>
              Continue
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
  const browserModal = browser => (
    <Modal
      position='top center'
      on='click'
      closeOnDocumentClick
      defaultOpen={showWelcomeModal}
      modal
    >
      {close => (
        <div className={styles.modal}>
          <div className={styles.header}>Please try a different browser</div>
          <div className={styles.content}>
            <div className={styles.text}>
              <p>
                The Measles Tracker was designed for Chrome, Firefox, and Safari
                desktop browsers, but you seem to be using {browser}.
              </p>
              <p>
                If this is correct, please open the Measles Tracker in Chrome,
                Firefox, or Safari for desktop instead.
              </p>
            </div>
            <button className={classNames('button', 'modal')} onClick={close}>
              Continue
            </button>
          </div>
        </div>
      )}
    </Modal>
  )

  // const modalToShow = (
  //   <BrowserDetection>
  //     {
  //         browserValid
  //     }
  //   </BrowserDetection>
  // );

  // JSX for main app. Switch component allows links in the header to be used to
  // determine main app content.
  return (
    <div
      className={classNames(styles.app, {
        [styles.windowed]: page === 'map'
      })}
    >
      <BrowserRouter>
        <Nav page={page} loadingNav={loadingNav} places={places} />
        <Switch>
          <div>
            <Route
              exact
              path='/'
              component={() => {
                setPage('map')
                setLoadingNav(true)
                return renderMap
              }}
            />
            <Route
              exact
              path='/map'
              component={() => {
                setPage('map')
                setLoadingNav(true)
                return renderMap
              }}
            />
            {false && (
              <Route
                exact
                path='/global'
                component={() => {
                  setPage('global')
                  return (
                    <div className={'dev global'}>
                      The global page is currently being developed.
                    </div>
                  )
                }}
              />
            )}
            <Route
              path='/global'
              render={d => {
                setPage('global')
                setLoadingNav(true)
                // window.scrollTo(0,0);
                return renderGlobal()
              }}
            />
            <Route
              path='/details/:id'
              render={d => {
                setPage('details')
                setLoadingNav(true)
                // window.scrollTo(0,0);
                return renderDetails(d.match.params.id)
              }}
            />
            <Route
              exact
              path='/about'
              component={() => {
                setPage('about')
                setLoadingNav(false)
                // window.scrollTo(0,0);
                return <About />
              }}
            />
          </div>
        </Switch>
        {page !== 'map' && <Footer />}
        {showWelcomeModal && <BrowserDetection>{modalToShow}</BrowserDetection>}
      </BrowserRouter>
    </div>
  )
}

export default App
