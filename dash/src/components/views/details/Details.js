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
  // const [countryName, setCountryName] = React.useState('');
  // const [countryIso2, setCountryIso2] = React.useState('');
  //
  // // total population
  // const [countryPop, setCountryPop] = React.useState({});
  //
  // // GDP per capita
  // const [countryGDP, setCountryGDP] = React.useState({});
  //
  // // JEE Score
  // const [countryJEE, setCountryJEE] = React.useState({});

  //Policies (doubt we get this by October?)

  // // Vaccination coverage
  // const coverage = props.coverage;
  //
  // // Reported cases
  // const cases = props.cases;
  //
  // // Reported cases over time
  // const [caseHistory, setCaseHistory]  = React.useState([]);
  //
  // // Vaccination coverage over time
  // const [coverageHistory, setCoverageHistory] = React.useState([]);

  /**
   * Returns JEE score colors and labels
   * @method getScoreName
   */
  const getScoreLabeling = (score) => {
  	if (score < 1.5) {
      return {
        label: 'No capacity',
        color: 'red',
        value: score,
      };
  	} else if (score < 2.5) {
      return {
        label: 'Limited capacity',
        color: 'yellow',
        value: score,
      };
  	} else if (score < 3.5) {
      return {
        label: 'Developed capacity',
        color: 'yellow',
        value: score,
      };
  	} else if (score < 4.5) {
      return {
        label: 'Demonstrated capacity',
        color: 'green',
        value: score,
      };
    }
    return {
      label: 'Sustainable capacity',
      color: 'green',
      value: score,
    };
  };

  console.log('styles')
  console.log(styles)
  /**
   * Get JSX for rendering JEE scores.
   * @method getScoreJsx
   */
  const getScoreJsx = (score) => {
    const scoreLabeling = getScoreLabeling(score);
    return (
      <div className={classNames(styles.jee, styles[scoreLabeling.color])} style={ { 'border-style': 'solid', 'border-width': '0 0 0 10px' } }>
        {scoreLabeling.label}
      </div>
    );
  };

  // Effect hook to load API data.
  React.useEffect(() => {
    // getDetailsData();
  }, [])


  // If loading do not show JSX content.
  if (false) return (<div></div>);
  else {

    return (<div className={styles.details}>
              <div className={styles.sidebar}>
                <div className={styles.title}>
                  {props.countryIso2 && <img src={`/flags/${props.countryIso2}.png`} className={styles.flag} />}
                  {props.countryName}
                </div>
                <div className={styles.map}>
                  {
                    <MiniMap countryIso2={props.countryIso2}/>
                  }
                </div>
                {
                  [
                    {
                      'title': 'Population',
                      'value_fmt': Util.comma,
                      'value_label': 'people',
                      'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'year')}, // TODO
                      // 'dataSource': obs['data_source'],
                      // 'dataSourceLastUpdated': new Date (obs['updated_at']),
                      ...props.countryPop,
                    },
                    {
                      'title': 'Gross domestic product per capita',
                      'value_fmt': Util.money,
                      'value_label': 'USD',
                      'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'year')}, // TODO
                      ...props.countryGDP,
                    },
                    {
                      'title': 'Immunization capacity',
                      'value_fmt': getScoreJsx,
                      'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'year')}, // TODO
                      ...(props.countryJeeImmun ? props.countryJeeImmun : {value: null}),
                    },
                    {
                      'title': 'Real-time surveillance capacity',
                      'value_fmt': getScoreJsx,
                      'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'year')}, // TODO
                      ...(props.countryJeeSurv ? props.countryJeeSurv : {value: null}),
                    },
                    {
                      'title': 'Medical countermeasures capacity',
                      'value_fmt': getScoreJsx,
                      'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'year')}, // TODO
                      ...(props.countryJeeMcm ? props.countryJeeMcm : {value: null}),
                    },
                  ].map(item =>
                    <div className={styles.item}>
                      <span className={styles.title}>
                        {item.title} {item.date_time_fmt(item)}
                      </span>
                      <div className={styles.content}>
                        {
                          // Display formatted value and label
                          (item.value !== null && (
                            <span>
                              <span className={styles.value}>
                                {item.value_fmt(item.value)}
                              </span>
                              {
                                item.value_label && <span className={styles.label}>
                                  &nbsp;{item.value_label}
                                </span>
                              }
                            </span>
                          ))
                        }
                        {
                          // Data not available message, if applicable.
                          (item.value === null && (
                            <span className={'notAvail'}>
                              Data not available
                            </span>
                          ))
                        }
                        {
                          // Display data source text if available.
                          (item.data_source && !item.notAvail) &&
                            <div className={'dataSource'}>
                              Source: {item.data_source}{ item.updated_at && (
                                  ' as of ' + new Date(item.updated_at).toLocaleString('en-us', {
                                    month: 'long',
                                    year: 'numeric',
                                  })
                                )
                              }
                            </div>
                        }
                      </div>

                    </div>
                  )
                }
              </div>
              <div className={styles.main} />
            </div>
    );
  }
};

export default Details
