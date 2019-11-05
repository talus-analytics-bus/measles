import React from 'react'
import Popup from 'reactjs-popup'
import axios from 'axios'
import { Link } from 'react-router-dom'
import Chart from '../../chart/Chart.js'
import SlidingLine from './content/SlidingLine.js'
import SparkLine from './content/SparkLine.js'
import ReactTooltip from 'react-tooltip';
import InfoTooltip from '../../../components/misc/InfoTooltip.js';
import infoTooltipStyles from '../../../components/misc/infotooltip.module.scss';

import MiniMap from '../../../components/map/MiniMap.js'

// Utilities (date formatting, etc.)
import Util from '../../../components/misc/Util.js'
import * as d3 from 'd3/dist/d3.min';

import classNames from 'classnames'
import styles from './details.module.scss'
import stylesTooltip from './tooltip.module.scss'

// FC for Details.
const Details = (props) => {

  // Manage loading state (don't show if loading, etc.)
  const [loading, setLoading] = React.useState(true)

  // Track whether the sliding line chart has been drawn
  const [ slidingLine, setSlidingLine ]  = React.useState(null);

  // Track whether the sliding line chart has been drawn
  const [ slidingLineMetric, setSlidingLineMetric ]  = React.useState('caseload_totalpop');

  // Track SlidingLine chart tooltip data
  const [ tooltipData, setTooltipData ]  = React.useState(null);

  // Track county summary for sliding line window view
  const [ countSummary, setCountSummary ]  = React.useState(null);
  const [ countSummaryDateRange, setCountSummaryDateRange ]  = React.useState(null);

  // Track whether to show reset view button on sliding line chart
  const [ showReset, setShowReset ]  = React.useState(false);

  // Get data for current country.
  const country = props.id;

  const jeeLabels = [
  {
    label: 'None',
    color: 'red',
    i: 0,
  },
  {
    label: 'Limited',
    color: 'lightyellow',
    i: 1,
  },
  {
    label: 'Developed',
    color: 'yellow',
    i: 2,
  },
  {
    label: 'Demonstrated',
    color: 'lightgreen',
    i: 3,
  },
  {
    label: 'Sustainable',
    color: 'green',
    i: 4,
  },
];

  /**
   * Returns JEE score colors and labels
   * @method getScoreName
   */
  const getScoreLabeling = (score) => {
  	if (score < 2) {
      return jeeLabels[0];

  	} else if (score < 3) {
      return jeeLabels[1];

  	} else if (score < 4) {
      return jeeLabels[2];

  	} else if (score < 5) {
      return jeeLabels[3];
    }
    return jeeLabels[4];
  };

  /**
   * Get JSX for rendering JEE scores.
   * @method getScoreJsx
   */
  const getScoreJsx = (score) => {
    const scoreLabeling = getScoreLabeling(score);
    return (
      <div className={classNames(styles.jee, styles[scoreLabeling.color])}>
        <div className={styles.jeeBlocks}>
        {
          [4, 3, 2, 1, 0].map(i =>
            (i <= scoreLabeling.i) ? <div style={ { 'backgroundColor': '#cecece' } } className={classNames(styles.jeeBlock, styles[scoreLabeling.color])} />
              : <div className={classNames(styles.jeeBlock)} />
          )
        }
        </div>
        <span>{scoreLabeling.label}</span>
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

    const stepFrac = 100/6;
    if (val === null) {
      return {
        i: -9999,
        color: 'gray',
      };
    }
    else if (val < stepFrac*1) {
      return {
        i: 0,
        color: '#d6f0b2',
      };
    }
    else if (val < stepFrac*2) {
      return {
        i: 1,
        color: '#b9d7a8',
      };
    }
    else if (val < stepFrac*3) {
      return {
        i: 2,
        color: '#7fcdbb',
      };
    }
    else if (val < stepFrac*4) {
      return {
        i: 3,
        color: '#41b6c4',
      };
    }
    else if (val < stepFrac*5) {
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
    if (props.countryIncidenceLatest.value === 0) return -9999;
    const val = props.countryIncidenceQuantile;
    return {
      i: val !== null? val : -9999,
    };
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

  // // Color scale for measles reds to use in wedge.
  // const wedgeColorScale = d3.scaleLinear()
  //   .domain([0, 1])
  //   .range(['#e6c1c6', '#9d3e4c']);

  const binData = getWedgeChartBin();

  const getWedgeChart = (val) => {
    if (val === 0) return (
        <div className={classNames(styles.noCases, 'notAvail')}>
        No cases reported
        </div>
    );

    // Get vaccination chart bins


    const wedgeColor = '#9d3e4c';
    // const wedgeColor = wedgeColorScale(binData.i / 4);

    return (
      <div data-tip={true} data-for={'wedgeTooltip'} className={classNames(styles.chart, styles.measlesWedgeChart, styles.shapes)}>
        <div className={classNames(styles.trapezoidContainers)}>
          {
            [0,1,2,3,4].map(bin =>
              <div className={styles.trapezoidContainer}>
                <div
                className={classNames(
                  styles.shape,
                  styles.trapezoid,
                  styles['trapezoid-' + bin],
                  {
                    [styles.active]: bin === binData.i,
                  }
                )}
                >
                  <div
                    className={styles.top}
                  />
                  <div
                    className={styles.bottom}
                  />
                </div>
              </div>
            )
          }
          </div>
          <div className={styles.wedgeLabels}>
            <div className={styles.labelLeft}>Low relative<br/>incidence</div>
            <div className={styles.labelRight}>High relative<br/>incidence</div>
          </div>
      </div>
    )
  };

  // Return a wedge chart for the JEE scores
  const getJeeChart = (score) => {

    // Return legend graphic if score is 'legend', otherwise return the
    // corresponding score graphic.
    if (score === 'legend') {

      return (
        <div className={
          classNames(
            styles.jeeChart,
            styles.legend,
          )
        }>
          <div className={styles.value}>
            <div className={classNames(styles.chart)}>
              {
                [0,1,2,3,4].map(bin =>
                  <div className={styles.trapezoidContainer}>
                    <div
                    className={classNames(
                      styles.trapezoid,
                      styles.shape,
                      styles.jeeCircle,
                      styles.legend,
                      styles['trapezoid-' + (bin+1)],
                    )}
                    >
                      <div className={styles.jeeScoreValue}>
                        {
                          (bin+1)
                        }
                      </div>
                    </div>
                    <div className={classNames(
                      styles.jeeCircleLegendLabel,
                      {
                        [styles.labelBottom]: bin % 2 === 0,
                        [styles.labelTop]: bin % 2 === 1,
                      },
                    )}>
                      {
                        (jeeLabels[bin].label)
                      }
                    </div>
                  </div>
                )
              }
            </div>
          </div>
        </div>
      )
    }
    else {
      const scoreLabeling = getScoreLabeling(score);
      // OLD: JSX for jee score appearing below the label. Currently it appears
      // below the bin of the wedge it applies to.
      // <br/>
      // <span className={styles.jeeScoreValue}>(
      //   {
      //     // Add score (e.g., 4.6)
      //     Util.decimalizeOne(score)
      //   }
      // )
      // </span>
      return (
        <div className={
          classNames(
            styles.jeeChart,
            styles[scoreLabeling.color],
          )
        }>
          <div className={styles.jeeLabel}>
          {
            // Add label (e.g., Demonstrated)
            scoreLabeling.label
          }
          </div>
          <div className={styles.value}>
            <div className={classNames(styles.chart)}>
              {
                [0,1,2,3,4].map(bin =>
                  <div className={styles.trapezoidContainer}>
                    <div
                    className={classNames(
                      styles.trapezoid,
                      styles.shape,
                      styles.jeeCircle,
                      {
                        [styles.active]: scoreLabeling.i === bin,
                      },
                    )}
                    >
                      {
                        (scoreLabeling.i === bin) &&
                        <div className={styles.jeeScoreValue}>
                          {
                            // Add score (e.g., 4)
                            Math.floor(score)
                          }
                        </div>

                        // // Old trapezoid code below.
                        // <div
                        //   className={styles.top}
                        // />
                        // <div
                        //   className={styles.bottom}
                        // />
                      }
                    </div>
                  </div>
                )
              }
            </div>
          </div>
        </div>
      )
    }
  };

  // Returns sensible position for vaccination bullet chart wedge.
  const gutterWidth = 608;
  const getVaccActiveWedgePos = (val) => {
    val = 5;
    const thresh = 66.8; // width of active wedgeColor
    const targetPos = ((val/100) * gutterWidth) - thresh;
    const finalPos = targetPos >= thresh ? targetPos
      : 0;
    return finalPos;
  };
  const getVaccActiveWedgeWidth = (val) => {
    return (val/100) * gutterWidth;
  };

  // Get continuous vacc color scale
  const vaccColor = Util.getColorScaleForMetric('coverage_mcv1_infant', [0, 100]);

  /**
   * Get vaccination chart JSX.
   * @method getVaccChart
   */
  const getVaccChart = (val) => {
    // Get vaccination chart bins
    const binData = getVaccinationChartBin(val);

    // Get continuous scale color.
    const tooSmall = 15;
    return (
      <div className={classNames(styles.chart, styles.vaccChart, styles.shapes)}>
        <div className={classNames(styles.trapezoidContainers)}>
          {
            [0, 1].map(bin =>
              <div className={styles.rectContainer}>
                <div
                className={classNames(
                  styles.rect,
                  {
                    [styles.active]: bin === 1 && binData.i > 0,
                    [styles.gutter]: bin === 0,
                  }
                )}
                style={{
                  // 'borderColor': bin === binData.i ? 'gray' : '',
                  'backgroundColor': bin === 1 ? vaccColor(val) : '',
                  'color': (val >= tooSmall && binData.i > 3) ? 'white' : '',
                  'width': bin === 1 ? getVaccActiveWedgeWidth(val) : '',
                }}
                >
                  <div
                    style = {{
                      'position': 'absolute',
                      'top': bin === 1 ? 2 : null,
                      'right': bin === 1 && val < tooSmall ? null : 5,
                      'left': bin === 1 && val < tooSmall ? getVaccActiveWedgeWidth(val) + 5 : null,
                    }}
                  >
                  {
                    (bin === 1 && binData.i > 0) ? <span><span>{Util.percentize(val)}</span><span className={styles.barValUnit}></span></span>: ''
                  }
                  </div>
                </div>
              </div>
            )
          }
        </div>
        <div className={styles.wedgeLabels}>
          <div className={styles.labelLeft}>No<br/>coverage</div>
          <div className={styles.labelRight}>Full<br/>coverage</div>
        </div>
      </div>
    )
  };

  // Get count summary labeling
  const metricParams = Util.getMetricChartParams(slidingLineMetric);

  /**
   * Render sliding line chart containers and legend.
   * @method getSlidingLineJsx
   */
  const getSlidingLineJsx = () => {

    // If no line data, do not render chart at all.
    const legendEntries = noLineData ? [] :
      [
        {
          label: slidingLineMetric === 'incidence_monthly' ? 'Monthly incidence rate' : 'New cases',
          class: styles.monthlyIncidence,
          shape: 'line',
        },
        {
          label: 'Vaccination coverage',
          class: styles.vaccinationCoverage,
          shape: 'line',
          skip: props.countryVaccHistory.length === 0,
        },
        {
          label: slidingLineMetric === 'incidence_monthly' ? 'Incidence not reported' : 'Cases not reported',
          class: styles.noIncidence,
          shape: 'rect',
          skip: !props.countryCaseloadHistory.some(d => d.value === null),
        },
      ];

    // Legend JSX
    const legend = (
      <div className={styles.slidingLineLegend}>
        {
          legendEntries.map(entry =>
            (entry.skip !== true) &&
            <div className={styles.entry}>
              <svg width="18" height="18">
              {
                entry.shape === 'line' ?
                    <line className={classNames(styles.symbol, entry.class)} x1="0" x2="18" y1="9" y2="9" />
                    :  <rect className={classNames(styles.symbol, entry.class)} x="0" y="0" height="18" width="18" />
              }
              </svg>
              <div className={styles.label}>
                {entry.label}
              </div>
            </div>
          )
        }
      </div>
    );

    // Data toggles: monthly incidence rate or case counts
    const dataToggles = (
      <div className={
          styles.dataToggles
      }>
      <span>View caseload by</span>
      {
        [
          {
            metric: 'caseload_totalpop',
            label: 'number of cases',
          },
          {
            metric: 'incidence_monthly',
            label: 'monthly incidence rate',
          },
        ].map((entry, i) =>
          <div className={styles.dataToggle}>
            <label for={entry.value}>
              <input
                type="radio"
                name="bubbleData"
                id={entry.metric}
                value={entry.metric}
                checked={slidingLineMetric === entry.metric}
                onClick={() => {
                  setSlidingLineMetric(entry.metric)
                }}
              />
              {entry.label}
            </label>
          </div>
        )
      }
      </div>
    )


    const countSummaryJsx = (
      (countSummary !== null) && <div className={styles.countSummary}>
        <span className={styles.value}>
        {
            metricParams.tickFormat(countSummary)
        }
        </span>
        <span className={styles.label}>&nbsp;
        {
            metricParams.getUnits(countSummary)
        }
        </span>
        <span> during selected window (
          {
            countSummaryDateRange
          }
        )</span>
      </div>
    );

    // Add reset button, visible when chart sliding window is adjusted.
    const resetButton = (
      <button
        onClick={
          () => {
            if (slidingLine && slidingLine.resetView) {
              slidingLine.resetView();
            }
          }
        }
        className={
          classNames(
            'btn-secondary btn-sm',
          )
        }
        style={
          {
            'opacity': showReset ? 1 : 0,
            'visibility': showReset ? 'visible' : 'hidden',
          }
        }
        >
        Reset view
      </button>
    );

    return (
      <div className={styles.slidingLineContainer}>
        { dataToggles }
        { countSummaryJsx }
        { legend }
        {
          !noLineData &&
          <div className={styles.slidingLineChartWrapper}>
            <div className={styles.slidingLine}>
            </div>
            { resetButton }
          </div>
        }
      </div>
    );
  };

  // Get delta JSX from a datum's delta data if applicable.
  const getDeltaJsx = (datum, period = '') => {
    const deltaData = datum.deltaData;
    return (deltaData && deltaData.delta !== undefined) && !datum.notAvail && <div className={classNames(styles.delta, {
        [styles['inc']]: deltaData.delta > 0,
        [styles['dec']]: deltaData.delta < 0,
        [styles['same']]: deltaData.delta === 0,
      })}>
        <div className={classNames(
          styles.deltaBadge,
          {
            [styles['inc']]: deltaData.delta > 0,
            [styles['dec']]: deltaData.delta < 0,
            [styles['same']]: deltaData.delta === 0,
          },
        )
          }>
          <i className={classNames('material-icons')}>play_arrow</i>
          <span className={styles['delta-value']}>
            {
              // Don't include sign for now since it's redundant
              // <span className={styles['sign']}>{d.deltaSign}</span>
            }
            <span className={styles['num']}>{deltaData.deltaFmt}</span>
          </span>
        </div>
        <span className={styles['delta-text']}>{Util.getDeltaWord(deltaData.delta)} from<br/>previous {period}</span>
      </div>
  };

  /**
   * Return correct data source text for sliding line chart (vaccination and
   * incidence).
   * @method getSlidingLineDataSources
   */
  const getSlidingLineDataSources = () => {

    if (slidingLine === null) return;

    let ySource, vaccineSource;

    const yDatum = slidingLine.data.vals[0];
    if (yDatum === undefined) ySource = null;
    else {
      const yUpdated = new Date(yDatum.updated_at).toLocaleString('en-us', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });
      ySource = `Source for ${metricParams.name.toLowerCase()}: ${yDatum.data_source} as of ${yUpdated}.`;
    }

    const vaccineDatum = props.countryVaccHistory[0];
    if (vaccineDatum === undefined) vaccineSource = '';
    else {
      const vaccineUpdated = new Date(vaccineDatum.updated_at).toLocaleString('en-us', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });
      vaccineSource = `Source for vaccination coverage: ${vaccineDatum.data_source} as of ${vaccineUpdated}.`;
    }
    const sources = [];
    if (yDatum) sources.push(ySource);
    if (vaccineSource) sources.push(vaccineSource);
    return sources.join(' ');
  };

  // Get caseload and delta data
  // Return data for rendering caseload and delta value sub-component of
  // "recent cases" section.
  const getCaseloadAndDeltaData = (obsTmp, trend) => {

    // If observation unavailable, use placeholder null data.
    const obs = obsTmp === undefined ? {
      value: null,
      deltaData: {},
    }
    : obsTmp;

    // Get and return data for cases and delta values.
    const data = {
      slug: 'cases',
      value: obs.value > 0 ? Util.comma(obs['value']) : null,
      label: Util.getPeopleNoun(obs['value']),
      deltaData: Util.getDeltaData(trend),
      notAvail: obs['value'] === null,
    };
    return data;
  };

  // Get caseload and delta JSX
  const getCaseloadAndDeltaJsx = () => {
    const obs = props.countryCaseloadHistory[
      props.countryCaseloadHistory.length - 1
    ];

    const trend = props.countryTrendCaseload1Months;

    // const trend = props.countryCaseloadTrend[
    //   props.countryCaseloadTrend.length - 1
    // ]; // Should only be one

    const caseloadAndDeltaData = getCaseloadAndDeltaData(obs, trend);
    const deltaData = caseloadAndDeltaData.deltaData;

    const caseloadAndDeltaJsx = (
      <div className={styles.value2Content}>
      {
        // If value2 exists, add that
        (caseloadAndDeltaData.value !== undefined && caseloadAndDeltaData.value !== null) && (
          <span>
            <span className={styles.value}>{caseloadAndDeltaData.value}</span>
            &nbsp;
            <span className={styles.label}>{caseloadAndDeltaData.label}</span>
          </span>
        )
      }
      {
        // If delta exists, add that
        (deltaData && deltaData.delta !== undefined) && !caseloadAndDeltaData.notAvail && <div className={classNames(styles.delta, {
          [styles['inc']]: deltaData.delta > 0,
          [styles['dec']]: deltaData.delta < 0,
          [styles['same']]: deltaData.delta === 0,
        })}>
          <i className={classNames('material-icons')}>play_arrow</i>
          <span className={styles['delta-value']}>
            {
              // Don't include sign for now since it's redundant
              // <span className={styles['sign']}>{d.deltaSign}</span>
            }
            <span className={styles['num']}>{deltaData.deltaFmt}</span>
          </span>
          <span className={styles['delta-text']}>{Util.getDeltaWord(deltaData.delta)} from<br/>previous month</span>
        </div>
      }
      </div>
    );
    return caseloadAndDeltaJsx;
  };

  // Is there any line data to plot?
  const noLineData =
    props.countryIncidenceHistory.length === 0
    && props.countryVaccHistory.length === 0;

  // Effect hook to load API data.
  React.useEffect(() => {

    // Scroll to top of window afer loading.
    window.scrollTo(0,0);

    // Animate JEE block colors
    const jeeBlocks = document.getElementsByClassName(styles.jeeBlock);
    for (let i = 0; i < jeeBlocks.length; i++) {
      const el = jeeBlocks[i];
      el.style.backgroundColor = '';
    }

    // Setup sliding line chart params
    const chartParams = {
      data: {
        y: props.countryCaseloadHistory,
        y2: props.countryIncidenceHistory,
      },
      vaccData: props.countryVaccHistory,
      noResizeEvent: true,
      setTooltipData: setTooltipData,
      tooltipClassName: stylesTooltip.slidingLineTooltip,
      setShowReset: setShowReset,
      metric: slidingLineMetric,
      setSlidingLine: setSlidingLine,
      setCountSummary: setCountSummary,
      setCountSummaryDateRange: setCountSummaryDateRange,
      margin: {
        top: 20,
        right: 98,
        bottom: 60,
        left: 100,
      },
    };

    // Sliding line chart defined in SlidingLine.js
    if (!noLineData) {
      const slidingLineChart = new SlidingLine(

        // Selector of DOM element in Resilience.js component where the chart
        // should be drawn.
        '.' + styles.slidingLine,

        // Chart parameters consumed by Chart.js and ResilienceRadarChart.js,
        // defined above.
        chartParams,
      );
      setSlidingLine(
        slidingLineChart
      );
    }

    // Rebuild tooltips after the chart is drawn
    ReactTooltip.rebuild();
  }, [])

  React.useEffect(function changeSlidingLineMetric () {
    if (slidingLine) {
      // Remove countSummary for the moment
      setCountSummary(null);

      // Update selected metric.
      slidingLine.params.metric = slidingLineMetric;

      // Is the reset button currently showing, meaning the default window
      // is being viewed?
      slidingLine.params.onDefaultWindow = showReset === false;

      slidingLine.update(slidingLineMetric);
    }
    ReactTooltip.rebuild();
  },
  [slidingLineMetric]);

  // Get severity tooltip text, which is dynamic.
  const getSeverityTooltip = (item) => {
    console.log(item);
    return `Five caseload severity levels were determined based on the quintiles of monthly incidence values for all countries from Jan 2011 through Aug 2019. In this way, the severity of a caseload in a given country is assessed relative to historical, global trends in measles incidence over time.`;
  };

  // Get data for measles caseload items
  const getMeaslesCaseloadItems = () => {

    const sparklineBaseData = JSON.parse(JSON.stringify(props.countryCaseloadHistory)).reverse().slice(0, 24);
    sparklineBaseData.reverse();

    const items = {
      'title': 'Measles caseload',
      'type': ['multi'],
      'values': [
        {
          'title': 'Last reported',
          'value_fmt': Util.formatSIInteger,
          'value_label': 'cases',
          'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'month')},
          'deltaData': props.countryTrendCaseload1Months ? Util.getDeltaData(
            props.countryTrendCaseload1Months
          ) : undefined,
          'period': 'month',
          'hideSource': true,
          'chart_jsx': (deltaData, i) => <SparkLine
            data={sparklineBaseData}
            window={2}
            i={i}
            direction={
              deltaData.delta > 0 ? 'inc' :
                (deltaData.delta < 0 ? 'dec' : 'same')
            }
          />,
          ...(props.countryCaseloadHistory ? props.countryCaseloadHistory[props.countryCaseloadHistory.length - 1] : {value: null}),
        },
        {
          'title': '6-month cumulative',
          'value_fmt': Util.formatSIInteger,
          'value_label': 'cases',
          'date_time_fmt': (date_time) => {return Util.getDateTimeRange({value: date_time})},
          'deltaData': props.countryTrendCaseload6Months ? Util.getDeltaData(
            props.countryTrendCaseload6Months
          ) : undefined,
          'hideSource': true,
          'chart_jsx': (deltaData, i) => <SparkLine
            data={sparklineBaseData}
            window={12}
            i={i}
            direction={
              deltaData.delta > 0 ? 'inc' :
                (deltaData.delta < 0 ? 'dec' : 'same')
            }
          />,
          'period': '6 months',
          dateTimeObs: [
            {date_time: props.countryCaseload6MonthsCalc.start},
            {date_time: props.countryCaseload6MonthsCalc.end},
          ],
          ...(props.countryCaseload6MonthsCalc ? props.countryCaseload6MonthsCalc : {value: null}),
        },
        {
          'title': '12-month cumulative',
          'value_fmt': Util.formatSIInteger,
          'value_label': 'cases',
          'date_time_fmt': (date_time) => {return Util.getDateTimeRange({value: date_time})},
          'deltaData': props.countryTrendCaseload6Months ? Util.getDeltaData(
            props.countryTrendCaseload12Months
          ) : undefined,
          'hideSource': false,
          'chart_jsx': (deltaData, i) => <SparkLine
            data={sparklineBaseData}
            window={24}
            i={i}
            direction={
              deltaData.delta > 0 ? 'inc' :
                (deltaData.delta < 0 ? 'dec' : 'same')
            }
          />,
          'period': '12 months',
          dateTimeObs: [
            {date_time: props.countryCaseload12MonthsCalc.start},
            {date_time: props.countryCaseload12MonthsCalc.end},
          ],
          ...(props.countryCaseload12MonthsCalc ? props.countryCaseload12MonthsCalc : {value: null}),
        },
      ]
    };
    const firstDatum = items.values[0];
    console.log('items')
    console.log(items)
    items.data_source = firstDatum.data_source;
    items.updated_at = firstDatum.updated_at;
    return items;
  };

  // Get qualitative label for wedge bins.
  const getWedgeChartLabel = (bin) => {
    switch (bin) {
      case 0:
        return 'low';
      case 1:
        return 'low to average';
      case 2:
        return 'average';
      case 3:
        return 'average to high';
      case 4:
        return 'high';
    }
  };

  // Get tooltip data for hover-over on recent caseload severity chart
  const getWedgeTooltipContent = () => {
    // Get wedge chart data: measles caseload and the population for that year
    const recentIncidence = props.countryIncidenceHistory[
      props.countryIncidenceHistory.length - 1
    ];
    const recentCaseload = props.countryCaseloadHistory[
      props.countryCaseloadHistory.length - 1
    ];

    return (
      <div className={styles.wedgeTooltip}>
        There were <span>{Util.comma(recentCaseload.value)} measles cases in {props.countryName} in {Util.getDatetimeStamp(recentCaseload, 'month')}</span>, or about {Util.formatIncidence(recentIncidence.value)} cases per 1M people. Compared to historical global trends, this is a <span>relatively {getWedgeChartLabel(binData.i)} measles incidence</span>.
      </div>
    );
  };

  // If loading do not show JSX content.
  console.log('props')
  console.log(props)
  return (<div className={styles.details}>
            <div className={styles.sidebars}>
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
                    getMeaslesCaseloadItems(),
                    // {
                    //   'title': 'Population',
                    //   'value_fmt': Util.formatSI,
                    //   'value_label': 'people',
                    //   'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'year')}, // TODO
                    //   ...(props.countryPop ? props.countryPop : {value: null}),
                    // },
                    // {
                    //   'title': 'Gross domestic product per capita',
                    //   'value_fmt': Util.formatSI,
                    //   // 'value_fmt': Util.money,
                    //   'value_label': 'USD',
                    //   'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'year')}, // TODO
                    //   ...(props.countryGDP ? props.countryGDP : {value: null}),
                    // },
                  ].map(item =>
                    <div className={styles.itemContainer}>
                    {
                      // For normal non-JEE items:
                      (!item.type.includes('multi')) &&
                        <div className={styles.item}>
                          <span className={styles.title}>
                            <span>
                            {
                              item.title
                            }
                            </span>
                            <span className={'dateTimeStamp'}>
                            {
                              item.value !== null ? `${item.date_time_fmt(
                                (item.dateTimeObs || item)
                              )}` : ''
                            }
                            </span>
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
                              ((item.value === null || item.notAvail === true) && (
                                <span className={'notAvail'}>
                                  Data not available
                                </span>
                              ))
                            }
                          </div>
                          {
                            // Display data source text if available.
                            (item.data_source && item.value !== null && !item.notAvail && !item.hideSource) &&
                              <div className={classNames('dataSource', styles.source)}>
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
                    }
                    {
                      // For multi items:
                      (item.type.includes('multi')) &&
                        <div className={classNames(
                          styles.item,
                          {
                            [styles.jee]: item.type.includes('jee'),
                          },
                        )}>
                          <span className={styles.title}>
                            <span className={styles.text}>
                              {item.title}
                              {
                                // If info tooltip text, render one
                                (item.infoTooltipText) && <InfoTooltip text={item.infoTooltipText} />
                              }
                            </span>
                            {item.legend_jsx && item.legend_jsx()}
                          </span>
                          <div className={classNames(styles.content, styles.jee)}>
                          {
                            item.values.map((jeeItem, i) =>
                              <div className={styles.subsection}>
                                <div className={styles.left}>
                                  {
                                    <span className={styles.title}>
                                      <span>{jeeItem.title}</span>
                                      <span className={'dateTimeStamp'}>{jeeItem.date_time_fmt(jeeItem.dateTimeObs || jeeItem)}</span>
                                    </span>
                                  }
                                  {
                                    // Display formatted value and label
                                    jeeItem.value !== null && (
                                      <span className={styles.value}>
                                        {jeeItem.value_fmt(jeeItem.value)}
                                      </span>
                                    )
                                  }
                                  {
                                    (jeeItem.value_label) &&
                                    <span className={styles.label}>
                                      &nbsp;{jeeItem.value_label}
                                    </span>
                                  }
                                  {
                                    // Data not available message, if applicable.
                                    (jeeItem.value === null && (
                                      <span className={'notAvail'}>
                                        Data not available
                                      </span>
                                    ))
                                  }
                                </div>
                                <div className={styles.right}>
                                  {
                                    // display chart
                                    (jeeItem.chart_jsx !== undefined) &&
                                      <div className={styles.chart}>
                                        { jeeItem.chart_jsx(jeeItem.deltaData, i) }
                                      </div>
                                  }
                                  {
                                    // Display secondary value content if it exists
                                    getDeltaJsx(jeeItem, jeeItem.period)
                                  }
                                </div>
                              </div>
                            )
                          }
                          </div>
                          {
                            // Display data source text if available.
                            (item.data_source && item.value !== null && !item.notAvail && !item.hideSource) &&
                              <div className={classNames('dataSource', styles.source)}>
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
                    }
                    </div>
                  )
                }
              </div>
              <div className={styles.sidebar}>
                {
                  [
                    {
                      'title': 'JEE country capacity',
                      'infoTooltipText': () => <span className={classNames(styles.item, styles.jee)}><span>The Joint External Evaluation tool (JEE) measures country-specific progress in developing the capacities needed to prevent, detect, and respond to public health threats. <span className={styles.title}>{ getJeeChart('legend') }</span></span></span>,
                      'type': ['jee', 'multi'],
                      // 'legend_jsx': () => getJeeChart('legend'),
                      'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'year')}, // TODO
                      'values': [
                        {
                          'title': 'Immunization capacity',
                          'value_fmt': getJeeChart,
                          'score_labeling': (score) => getScoreLabeling(score),
                          'hideSource': true,
                          ...(props.countryJeeImmun ? props.countryJeeImmun : {value: null}),
                        },
                        {
                          'title': 'Real-time surveillance capacity',
                          'value_fmt': getJeeChart,
                          'score_labeling': (score) => getScoreLabeling(score),
                          'hideSource': true,
                          ...(props.countryJeeSurv ? props.countryJeeSurv : {value: null}),
                        },
                        {
                          'title': 'Medical countermeasures capacity',
                          'score_labeling': (score) => getScoreLabeling(score),
                          'value_fmt': getJeeChart,
                          ...(props.countryJeeMcm ? props.countryJeeMcm : {value: null}),
                        },
                      ],
                      ...(props.countryJeeImmun ? props.countryJeeImmun : {value: null}),
                    },
                  ].map(item =>
                    <div className={styles.itemContainer}>
                    {
                      // For normal non-JEE items:
                      (item.type === undefined || !item.type.includes('multi')) &&
                        <div className={styles.item}>
                          <span className={styles.title}>
                            {item.title}
                            {
                              // If info tooltip text, render one
                              (item.infoTooltipText) && <InfoTooltip text={item.infoTooltipText} />
                            }
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
                              <div className={classNames('dataSource', styles.source)}>
                                Data for {item.value !== null ? `${item.date_time_fmt(item)}` : ''}.
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
                    }
                    {
                      // For JEE items:
                      (item.type.includes('jee')) &&
                        <div className={classNames(
                          styles.item,
                          styles.jee,
                        )}>
                          <span className={styles.title}>
                            <span className={styles.text}>
                              {item.title}
                              {
                                // If info tooltip text, render one
                                (item.infoTooltipText) && <InfoTooltip text={item.infoTooltipText(item)} />
                              }
                            </span>
                            {item.legend_jsx && item.legend_jsx()}
                          </span>
                          <div className={classNames(styles.content, styles.jee)}>
                          {
                            item.values.map(jeeItem =>
                              <div className={styles.subsection}>
                              {
                                // Display title
                                <div className={styles.title}>{jeeItem.title}</div>
                              }
                              {
                                // Display formatted value and label
                                (jeeItem.value !== null && (
                                  jeeItem.value_fmt(jeeItem.value)
                                ))
                              }
                              {
                                // Data not available message, if applicable.
                                (jeeItem.value === null && (
                                  <span className={'notAvail'}>
                                    Data not available
                                  </span>
                                ))
                              }
                              </div>
                            )
                          }
                          </div>
                          {
                            // Display data source text if available.
                            (item.data_source && item.value !== null && !item.notAvail && !item.hideSource) &&
                              <div className={classNames('dataSource', styles.source)}>
                                Data for {item.value !== null ? `${item.date_time_fmt(item)}` : ''}.
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
                    }
                    </div>
                  )
                }
              </div>
            </div>
            <div className={styles.main}>
            {
              [
                {
                  'title': slidingLineMetric === 'caseload_totalpop' ? 'Measles cases and vaccination over time' : 'Monthly incidence rate and vaccination over time',
                  'chart_jsx': getSlidingLineJsx,
                  'date_time_fmt': Util.getDateTimeRange,
                  'data_source': getSlidingLineDataSources,
                  ...(props.countryIncidenceHistory.length > 0 ? { value: props.countryIncidenceHistory } : { value: null }),
                },
                {
                  'title': 'Vaccination coverage (% of infants)',
                  'chart_jsx': getVaccChart,
                  'value_fmt': Util.percentize,
                  'value_label': 'of infants',
                  'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'year')},
                  ...(props.countryVaccLatest.value !== undefined ? props.countryVaccLatest : { value: null }),
                },
                {
                  'title': 'Recent caseload severity',
                  'chart_jsx': getWedgeChart,
                  'value_fmt': Util.formatIncidence,
                  'value_label': 'cases per 1M population',
                  'infoTooltipText': (item) => getSeverityTooltip(item),
                  // 'value2_jsx': getCaseloadAndDeltaJsx,
                  'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'month')},
                  ...(props.countryIncidenceLatest.value !== undefined ? props.countryIncidenceLatest : { value: null }),
                },
              ].map(item =>
                <div className={styles.itemContainer}>
                  <div className={styles.item}>
                    <span className={styles.title}>
                      <span>
                        {item.title}
                        {
                          // If info tooltip text, render one
                          (item.infoTooltipText) && <InfoTooltip text={item.infoTooltipText(item)} />
                        }
                      </span>
                      {item.value !== null ? <span className={'dateTimeStamp'}>{item.date_time_fmt(item)}</span> : ''}
                    </span>
                    <div className={styles.content}>
                      <div className={styles.stackedValues}>
                      {
                        // // Display formatted value and label
                        // ((item.value !== null && typeof item.value !== 'object') && (
                        //   <span>
                        //     <span className={styles.value}>
                        //       {item.value_fmt(item.value)}
                        //     </span>
                        //     {
                        //       item.value_label && <span className={styles.label}>
                        //         &nbsp;{item.value_label}
                        //       </span>
                        //     }
                        //   </span>
                        // ))
                      }
                      {
                        // Data not available message, if applicable.
                        ((item.value === null || item.notAvail === true) && (
                          <span className={'notAvail'}>
                            Recent data not available
                          </span>
                        ))
                      }
                      {
                        // Display secondary value content if it exists
                        (item.value2_jsx !== undefined) && item.value2_jsx()
                      }
                      </div>
                      {
                        // Display chart if there is one
                        (item.value !== null  && item.chart_jsx !== undefined) &&
                          item.chart_jsx(item.value)
                      }
                    </div>
                    {
                      // Display data source text if available.
                      (typeof item.data_source !== 'function' && item.data_source && !item.notAvail) &&
                        <div className={classNames('dataSource', styles.source)}>
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
                        <div className={classNames('dataSource', styles.source)}>
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
                tooltipData &&
                  <div className={stylesTooltip.tooltipContainer}>
                    <div className={stylesTooltip.tooltipContent}>
                    {
                      tooltipData.items.map(item =>
                        <div className={stylesTooltip.item}>
                          <div className={stylesTooltip.name}>
                            <span>
                              {item.name}
                            </span>
                            <span className={'dateTimeStamp'}>
                              {Util.getDatetimeStamp(item.datum, item.period)}
                            </span>
                          </div>
                          <div className={stylesTooltip.content}>
                            <span className={stylesTooltip.value}>{item.value}</span>
                            <span className={stylesTooltip.unit}>{item.label}</span>
                          </div>
                        </div>
                      )
                    }
                    </div>
                  </div>
              }
              />
            {
              // Tooltip for info tooltip icons.
              <ReactTooltip
                id={'infoTooltip'}
                type='light'
                className={infoTooltipStyles.infoTooltipContainer}
                place="top"
                effect="float"
                html={true}
                getContent={ (tooltipData) =>
                  tooltipData
                }
                />
            }
            {
              // Tooltip for wedge chart
              <ReactTooltip
                id={'wedgeTooltip'}
                type='light'
                className={infoTooltipStyles.infoTooltipContainer}
                place="top"
                effect="float"
                getContent={ getWedgeTooltipContent }
                />
            }
          </div>
    );
};

export default Details
