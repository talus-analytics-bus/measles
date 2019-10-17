import React from 'react'
import Popup from 'reactjs-popup'
import axios from 'axios'
import { Link } from 'react-router-dom'
import Chart from '../../chart/Chart.js'
import SlidingLine from './content/SlidingLine.js'

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

  // Track whether the sliding line chart has been drawn
  const [ slidingLine, setSlidingLine ]  = React.useState(null);

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
        label: 'None',
        color: 'red',
        value: score,
      };
  	} else if (score < 2.5) {
      return {
        label: 'Limited',
        color: 'yellow',
        value: score,
      };
  	} else if (score < 3.5) {
      return {
        label: 'Developed',
        color: 'yellow',
        value: score,
      };
  	} else if (score < 4.5) {
      return {
        label: 'Demonstrated',
        color: 'lightgreen',
        value: score,
      };
    }
    return {
      label: 'Sustainable',
      color: 'green',
      value: score,
    };
  };

  /**
   * Get JSX for rendering JEE scores.
   * @method getScoreJsx
   */
  const getScoreJsx = (score) => {
    const scoreLabeling = getScoreLabeling(score);
    return (
      <div className={classNames(styles.jee, styles[scoreLabeling.color])} style={ { 'borderStyle': 'solid', 'borderWidth': '0 0 0 10px' } }>
        {scoreLabeling.label}
      </div>
    );
  };

  const getVaccinationChartBin = (val) => {
    // 0, '#d6f0b2',
    // 0.35, '#b9d7a8',
    // 0.5, '#7fcdbb',
    // 0.65, '#41b6c4',
    // 0.8, '#2c7fb8',
    // 0.95, '#303d91'

    if (val < 35) {
      return {
        i: 0,
        color: '#d6f0b2',
      };
    }
    else if (val < 5) {
      return {
        i: 1,
        color: '#b9d7a8',
      };
    }
    else if (val < 65) {
      return {
        i: 2,
        color: '#7fcdbb',
      };
    }
    else if (val < 8) {
      return {
        i: 3,
        color: '#41b6c4',
      };
    }
    else if (val < 95) {
      return {
        i: 4,
        color: '#2c7fb8',
      };
    }
    else if (val <= 100) {
      return {
        i: 5,
        color: '#303d91',
      };
    } else {
      return {
        i: -9999,
        color: 'gray',
      };
    }
  };

  const getWedgeChartBin = () => {
    const val = props.countryIncidenceQuartile;
    switch (val) {
      case 0:
        return {
          i: 0,
          color: '#d6f0b2',
        };
      case 1:
        return {
          i: 1,
          color: '#b9d7a8',
        };
      case 2:
        return {
          i: 2,
          color: '#41b6c4',
        };
      case 3:
        return {
          i: 3,
          color: 'red',
        };
      default:
        return {
          i: -9999,
          color: 'gray',
        };
    }
  };

  const getWedgeChart = (val) => {
    // Get vaccination chart bins
    const binData = getWedgeChartBin();
    return (
      <div className={classNames(styles.chart, styles.vaccChart)}>
        {
          [0,1,2,3].map(bin =>
            <div className={styles.trapezoidContainer}>
              <div
              className={classNames(
                styles.trapezoid,
                styles.shape,
                styles['trapezoid-' + (bin + 1)],
                {
                  [styles.active]: bin === binData.i,
                }
              )}
              style={{
                'color': binData.i > 3 ? 'white' : '',
              }}
              >
                <div
                  className={styles.top}
                />
                <div
                  className={styles.bottom}
                />
              </div>
              {
                // Label if first
                (bin === 0) && <div className={styles.labelLeft}>Low relative<br/>incidence</div>
              }
              {
                // Label if last
                (bin === 3) && <div className={styles.labelRight}>High relative<br/>incidence</div>
              }
              {
                // (binData.i === bin) && <span>{Util.percentize(val)}</span>
              }
            </div>
          )
        }
      </div>
    )
  };

  /**
   * Get vaccination chart JSX.
   * @method getVaccChart
   */
  const getVaccChart = (val) => {
    // Get vaccination chart bins
    const binData = getVaccinationChartBin(val);
    return (
      <div className={classNames(styles.chart, styles.vaccChart)}>
        {
          [0,1,2,3,4,5].map(bin =>
            <div className={styles.rectContainer}>
              <div
              className={classNames(
                styles.rect,
                {
                  [styles.active]: bin === binData.i,
                }
              )}
              style={{
                // 'borderColor': bin === binData.i ? 'gray' : '',
                'backgroundColor': bin === binData.i ? binData.color : '',
                'color': binData.i > 3 ? 'white' : '',
              }}
              >
                {
                  binData.i === bin ? Util.percentize(val) : ''
                }
              </div>
              {
                // Label if first
                (bin === 0) && <div className={styles.labelLeft}>Low<br/>coverage</div>
              }
              {
                // Label if last
                (bin === 5) && <div className={styles.labelRight}>High<br/>coverage</div>
              }
            </div>
          )
        }
      </div>
    )
  };

  // Effect hook to load API data.
  React.useEffect(() => {

    // For sliding line chart, only use "trimmed" data.

    const chartParams = {
      data: props.countryIncidenceHistory,
      vaccData: props.countryVaccHistory,
      noResizeEvent: true,
      margin: {
        top: 20,
        right: 110,
        bottom: 30,
        left: 60,
      },
    };

    // Sliding line chart defined in SlidingLine.js
    setSlidingLine(
      new SlidingLine(

        // Selector of DOM element in Resilience.js component where the chart
        // should be drawn.
        '.' + styles.slidingLine,

        // Chart parameters consumed by Chart.js and ResilienceRadarChart.js,
        // defined above.
        chartParams,
      )
    );
  }, [])


  // If loading do not show JSX content.
  console.log('props')
  console.log(props)
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
                      'hideSource': true,
                      'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'year')}, // TODO
                      ...(props.countryJeeImmun ? props.countryJeeImmun : {value: null}),
                    },
                    {
                      'title': 'Real-time surveillance capacity',
                      'value_fmt': getScoreJsx,
                      'hideSource': true,
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
                    <div className={styles.itemContainer}>
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
                        </div>
                        {
                          // Display data source text if available.
                          (item.data_source && !item.notAvail && !item.hideSource) &&
                            <div className={'dataSource'}>
                              Source: {item.data_source}{ item.updated_at && (
                                  ' as of ' + new Date(item.updated_at).toLocaleString('en-us', {
                                    month: 'short',
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
              <div className={styles.main}>
              {
                [
                  {
                    'title': 'Vaccination coverage',
                    'chart_jsx': getVaccChart,
                    'value_fmt': Util.percentize,
                    'value_label': 'of infants',
                    'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'year')},
                    ...(props.countryVaccLatest.value !== undefined ? props.countryVaccLatest : { value: null }),
                  },
                  {
                    'title': 'Recent monthly incidence of measles',
                    'chart_jsx': getWedgeChart,
                    'value_fmt': Util.formatIncidence,
                    'value_label': 'cases per 1M population',
                    'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'month')},
                    ...(props.countryIncidenceLatest.value !== undefined ? props.countryIncidenceLatest : { value: null }),
                  },
                  {
                    'title': 'Incidence over time',
                    'chart_jsx': () => <div className={styles.slidingLine} />,
                    'date_time_fmt': Util.getDateTimeRange,
                    ...(props.countryIncidenceHistory.length > 0 ? { value: props.countryIncidenceHistory } : { value: null }),
                  },
                ].map(item =>
                  <div className={styles.itemContainer}>
                    <div className={styles.item}>
                      <span className={styles.title}>
                        {item.title} {item.date_time_fmt(item)}
                      </span>
                      <div className={styles.content}>
                        {
                          // Display formatted value and label
                          ((item.value !== null && typeof item.value !== 'object') && (
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
                          // Display chart if there is one
                          (item.chart_jsx !== undefined) &&
                            item.chart_jsx(item.value)
                        }
                      </div>
                      {
                        // Display data source text if available.
                        (item.data_source && !item.notAvail) &&
                          <div className={'dataSource'}>
                            Source: {item.data_source}{ item.updated_at && (
                                ' as of ' + new Date(item.updated_at).toLocaleString('en-us', {
                                  month: 'short',
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
            </div>
    );
  }
};

export default Details
