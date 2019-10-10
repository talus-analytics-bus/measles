import React from 'react'
import Popup from 'reactjs-popup'
import axios from 'axios'
import { Link } from 'react-router-dom'
import Chart from '../../chart/Chart.js'

import MiniMap from '../../../components/map/MiniMap.js'

// Utilities (date formatting, etc.)
import Util from '../../../components/misc/Util.js'
import worldMap from '../../../assets/images/world-map.svg'
import ObservationQuery from '../../../components/misc/ObservationQuery.js'
import * as d3 from 'd3/dist/d3.min';

import classNames from 'classnames'
import styles from './details.module.scss'

// If DEMO_DATE exists, use it (frames all data in site relative to the demo
// date that is specified). Otherwise, today's date will be used ("now").
var DEMO_DATE = process.env.DEMO_DATE
if (typeof DEMO_DATE === 'undefined') {
  DEMO_DATE = '2025-07-04T23:56:00'
}

const now = DEMO_DATE !== undefined ? new Date(DEMO_DATE) : new Date();

// import { facility } from '../../../types/index'
const API_BASE = process.env.REACT_APP_API_BASE_URL;

// FC for Details.
const Details = (props) => {

  // Manage loading state (don't show if loading, etc.)
  const [loading, setLoading] = React.useState(true)

  // Get data for current country.
  const country = props.id;
  const [countryName, setCountryName] = React.useState('');
  const [countryIso2, setCountryIso2] = React.useState('');

  // total population
  const [countryPop, setCountryPop] = React.useState({});

  // GDP per capita
  const [countryGDP, setCountryGDP] = React.useState({});

  // JEE Score
  const [countryJEE, setCountryJEE] = React.useState({});

  //Policies (doubt we get this by October?)

  // Vaccination coverage
  const coverage = props.coverage;

  // Reported cases
  const cases = props.cases;

  // Reported cases over time
  const [caseHistory, setCaseHistory]  = React.useState([]);

  // Vaccination coverage over time
  const [coverageHistory, setCoverageHistory] = React.useState([]);

  // Function to make API calls to get data for the state variables above.
  const getDetailsData = async () => {
    var countryPopQ = await ObservationQuery(3, 'yearly', '2018-01-01', '2018-01-01', country);
    setCountryPop(countryPopQ[0]);
    setCountryName(countryPopQ[0]['place_name'])
    setCountryIso2(countryPopQ[0]['place_iso'])

    var countryGDPQ = await ObservationQuery(14, 'yearly', '2018-01-01', '2018-01-01', country);
    console.log(countryGDPQ)
    setCountryGDP(countryGDPQ[0]);

    var countryJEEQ = await ObservationQuery(6, 'monthly', '2019-08-01', '2019-08-01', country);
    setCountryJEE(countryJEEQ[0]);

    setCaseHistory(await ObservationQuery(6, 'monthly', '2010-01-01', '2018-01-01', country));
    setCoverageHistory(await ObservationQuery(4, 'yearly', '2010-01-01', '2018-01-01', country));

    setLoading(false);
  }

  // Effect hook to load API data.
  React.useEffect(() => {
    getDetailsData();
  }, [])

  const debugPrinter = (item) => {
    console.log(item)
  }
  // If loading do not show JSX content.
  if (loading) return (<div></div>);
  else {
    console.log('countryGDP')
    console.log(countryGDP)
    return (<div className={styles.details}>
              <div className={styles.sidebar}>
                <div className={styles.title}>
                  {countryIso2 && <img src={`/flags/${countryIso2}.png`} className={styles.flag} />}
                  {countryName}
                </div>
                <div className={styles.map}>
                  {
                    <MiniMap />
                    // <img src={worldMap} />
                  }
                </div>
                {
                  [
                    {
                      'title': 'Population',
                      'value_fmt': Util.comma,
                      'value_label': 'people',
                      'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'year')}, // TODO
                      ...countryPop,
                    },
                    {
                      'title': 'Gross domestic product per capita',
                      'value_fmt': Util.money,
                      'value_label': '',
                      'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'year')}, // TODO
                      ...countryGDP,
                    },
                  ].map(item =>
                    <div className={styles.item}>
                      <span className={styles.title}>
                        {debugPrinter(item)}
                        {item.title} {item.date_time_fmt(item)}
                      </span>
                      <div className={styles.content}>
                        {
                          (item.value !== null && (
                            <span>
                              <span className={styles.value}>
                                {item.value_fmt(item.value)}
                              </span>
                              <span className={styles.label}>
                                &nbsp;{item.value_label}
                              </span>
                            </span>
                          ))
                        }
                        {
                          (item.value === null && (
                            <span className={'notAvail'}>
                              Data not available
                            </span>
                          ))
                        }
                      </div>

                    </div>
                  )
                }
              </div>
              <div className={styles.main} />
            </div>
    );
    // Original page content from before Mike is below.
    // return (<div>
    //           <div>
    //             <p>{countryName}</p>
    //             <p>Country Population: {countryPop}</p>
    //             <p>GDP per-capita: {countryGDP}</p>
    //             <p>JEE: {countryJEE}</p>
    //           </div>
    //           <div>
    //             <p>Coverage</p>
    //             <Chart
    //               metric={coverageHistory}
    //             />
    //           </div>
    //           <div>
    //             <p>Cases</p>
    //             <Chart
    //               metric={caseHistory}
    //             />
    //           </div>
    //         </div>
    // );
  }
};

export default Details
