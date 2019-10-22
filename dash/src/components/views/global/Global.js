import React from 'react'
import Popup from 'reactjs-popup'
import ReactTooltip from 'react-tooltip'; // for sliding line
// import SlidingLine from './content/SlidingLine.js'

import MiniMap from '../../../components/map/MiniMap.js'

// Utilities (date formatting, etc.)
import Util from '../../../components/misc/Util.js'
import * as d3 from 'd3/dist/d3.min';

import classNames from 'classnames'
import styles from './global.module.scss'
import stylesTooltip from './tooltip.module.scss'

// FC for Global.
const Global = (props) => {

  // Manage loading state (don't show if loading, etc.)
  const [loading, setLoading] = React.useState(true)

  // Track whether the first mini line chart has been drawn
  const [ charts, setCharts ]  = React.useState([]);
  //
  // // Track SlidingLine chart tooltip data
  // const [ tooltipData, setTooltipData ]  = React.useState(null);
  //
  // // Track whether to show reset view button on sliding line chart
  // const [ showReset, setShowReset ]  = React.useState(false);

  // Get data for current country.
  const country = props.id;

  // Effect hook to load API data.
  React.useEffect(() => {


    // Update chart variables
    const chartsToSet = [];
    for (let chartTypeName in props.chartParams) {
      // If multiple charts of this type, add all of them.
      const chartType = props.chartParams[chartTypeName];
      chartType.forEach(function (chart, i) {
        if (!chart.class) return;
        const chartInstance = new chart.class(
          '.' + chart.class.name + '-' + i,
          chart.params,
        );
        chartsToSet.push(chartInstance);
      });
    }

    console.log('chartsToSet')
    console.log(chartsToSet)
    setCharts(chartsToSet);

    //

    // // Setup mini line chart 1 params
    // const chartParams = {
    //   // data: props.countryIncidenceHistory,
    //   // setTooltipData: setTooltipData,
    //   tooltipClassName: stylesTooltip.slidingLineTooltip,
    //   // setShowReset: setShowReset,
    //   margin: {
    //     top: 20,
    //     right: 98,
    //     bottom: 60,
    //     left: 100,
    //   },
    // };
    //
    // // Sliding line chart defined in SlidingLine.js
    // if (!noLineData)
    //   setSlidingLine(
    //     new SlidingLine(
    //
    //       // Selector of DOM element in Resilience.js component where the chart
    //       // should be drawn.
    //       '.' + styles.slidingLine,
    //
    //       // Chart parameters consumed by Chart.js and ResilienceRadarChart.js,
    //       // defined above.
    //       chartParams,
    //     )
    //   );

    // Rebuild tooltips after the chart is drawn
    ReactTooltip.rebuild();
  }, [])

  // If loading do not show JSX content.
  console.log('props')
  console.log(props)
  return (<div className={styles.details}>
            <div className={styles.sidebar}>
              <div className={styles.title}>
                Global caseload
              </div>
              <div className={styles.map}>
                {
                  <MiniMap countryIso2={props.countryIso2}/>
                }
              </div>
              <div className={classNames(styles.MiniLine, 'MiniLine-0')} />
              <div className={classNames(styles.MiniLine, 'MiniLine-1')} />
              {
                [
                  // {
                  //   'title': 'Population',
                  //   'value_fmt': Util.comma,
                  //   'value_label': 'people',
                  //   'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'year')}, // TODO
                  //   ...(props.countryPop ? props.countryPop : {value: null}),
                  // },
                  // {
                  //   'title': 'Gross domestic product per capita',
                  //   'value_fmt': Util.money,
                  //   'value_label': 'USD',
                  //   'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'year')}, // TODO
                  //   ...(props.countryGDP ? props.countryGDP : {value: null}),
                  // },
                  // {
                  //   'title': 'Immunization capacity',
                  //   'value_fmt': getScoreJsx,
                  //   'hideSource': true,
                  //   'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'year')}, // TODO
                  //   ...(props.countryJeeImmun ? props.countryJeeImmun : {value: null}),
                  // },
                  // {
                  //   'title': 'Real-time surveillance capacity',
                  //   'value_fmt': getScoreJsx,
                  //   'hideSource': true,
                  //   'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'year')}, // TODO
                  //   ...(props.countryJeeSurv ? props.countryJeeSurv : {value: null}),
                  // },
                  // {
                  //   'title': 'Medical countermeasures capacity',
                  //   'value_fmt': getScoreJsx,
                  //   'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'year')}, // TODO
                  //   ...(props.countryJeeMcm ? props.countryJeeMcm : {value: null}),
                  // },
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
                        (item.data_source && item.value !== null && !item.notAvail && !item.hideSource) &&
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
                // {
                //   'title': 'Vaccination coverage',
                //   'chart_jsx': getVaccChart,
                //   'value_fmt': Util.percentize,
                //   'value_label': 'of infants',
                //   'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'year')},
                //   ...(props.countryVaccLatest.value !== undefined ? props.countryVaccLatest : { value: null }),
                // },
                // {
                //   'title': 'Recent monthly incidence of measles',
                //   'chart_jsx': getWedgeChart,
                //   'value_fmt': Util.formatIncidence,
                //   'value_label': 'cases per 1M population',
                //   'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'month')},
                //   ...(props.countryIncidenceLatest.value !== undefined ? props.countryIncidenceLatest : { value: null }),
                // },
                // {
                //   'title': 'Incidence over time',
                //   'chart_jsx': getSlidingLineJsx,
                //   'date_time_fmt': Util.getDateTimeRange,
                //   'data_source': getSlidingLineDataSources,
                //   ...(props.countryIncidenceHistory.length > 0 ? { value: props.countryIncidenceHistory } : { value: null }),
                // },
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
                      (typeof item.data_source !== 'function' && item.data_source && !item.notAvail) &&
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
                    {
                      (typeof item.data_source === 'function') &&
                        <div className={'dataSource'}>
                        {
                          item.data_source()
                        }
                        </div>
                    }
                  </div>
                </div>
              )
            }
            </div>
            <ReactTooltip
              id={stylesTooltip.slidingLineTooltip}
              type='slidingLine'
              className='slidingLineTooltip'
              place="right"
              effect="float"
              getContent={ () =>
                false &&
                  <div className={stylesTooltip.tooltipContainer}>
                    <div className={stylesTooltip.tooltipContent}>
                    {
                      [].items.map(item =>
                        <div className={stylesTooltip.item}>
                          <div className={stylesTooltip.name}>{item.name} {Util.getDatetimeStamp(item.datum, item.period)}</div>
                          <div>
                            <span className={stylesTooltip.value}>{item.value}</span>
                            &nbsp;
                            <span className={stylesTooltip.label}>{item.label}</span>
                          </div>
                        </div>
                      )
                    }
                    </div>
                  </div>
              }
              />
          </div>
    );
};

export default Global
