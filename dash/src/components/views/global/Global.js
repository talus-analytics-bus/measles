import React from 'react'
import Popup from 'reactjs-popup'
import ReactTooltip from 'react-tooltip';
import Tooltip from 'rc-tooltip';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';

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

  // Track chart tooltip data
  const [ tooltipData, setTooltipData ] = React.useState(null);

  // Track slider label value
  // TODO initialize as first scatter datum
  const scatterDataY = props.chartParams.Scatter[0].params.data.y;
  const nScatterDataY = scatterDataY.length;
  const latestScatterDatum = scatterDataY[nScatterDataY - 1];
  const sliderMax = Util.getUTCDate(
    new Date(latestScatterDatum.date_time.replace(/-/g, '/'))
  );
  const sliderMin = Util.getUTCDate(
    new Date(scatterDataY[0].date_time.replace(/-/g, '/'))
  );
  const [ curSliderVal, setCurSliderVal ] = React.useState(sliderMax);

  // Track whether slider tooltip should be visible
  const [ showSliderTooltip, setShowSliderTooltip ] = React.useState(false);

  // Track whether slider is playing
  const [ playing, setPlaying ] = React.useState(false);

  // Track slider play timeouts
  const [ playTimeouts, setPlayTimeouts ] = React.useState([]);

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
        // Set tooltip data function
        chart.params.setTooltipData = setTooltipData;
        chart.params.noResizeEvent = true;
        chart.params.tooltipClassName = stylesTooltip.globalTooltip;
        if (chart.params.className === 'Scatter') {
          chart.params.curSliderVal = curSliderVal;
        }

        // Create chart instance
        const chartInstance = new chart.class(
          '.' + chart.params.className + '-' + i,
          chart.params,
        );
        chartsToSet.push(chartInstance);
      });
    }
    setCharts(chartsToSet);

    // Set init slider tooltip position and reveal tooltip
    setTimeout(() => {
      const tooltipEl = document.getElementsByClassName('rc-slider-handle')[0];
      setShowSliderTooltip(true);
      ReactTooltip.show(tooltipEl);
    }, 500);

    // Rebuild tooltips after the chart is drawn
    ReactTooltip.rebuild();
  }, [])

  // Effect hook to update tooltip on slider
  React.useEffect(() => {
    // Set slider tooltip position
    const tooltipEl = document.getElementsByClassName('rc-slider-handle')[0];
    ReactTooltip.show(tooltipEl);

  }, [curSliderVal])

  // Updates scatterplot and slider label when slider is changed.
  const handleSliderChange = (valNumeric, a, b) => {
    const utcYear = Math.floor(valNumeric);
    const utcMonth = Math.round((valNumeric - utcYear) * 12);
    const sliderDt = new Date(`${utcYear}/${utcMonth + 1}/1`);

    // Update tooltip position
    const tooltipEl = document.getElementsByClassName('rc-slider-handle')[0];
    ReactTooltip.show(tooltipEl);

    // Set label value
    setCurSliderVal(sliderDt);
  };

  const handleSliderAfterChange = () => {
    // Set scatterplot update
    const scatterChart = charts.find(c => c.params.className === 'Scatter');
    scatterChart.update(curSliderVal);
  };

  const handlePause = () => {
    setPlaying(false);
    while (playTimeouts.length > 0) {
      clearTimeout(playTimeouts.pop());
    }
    setPlayTimeouts([]);
    // playTimeouts.forEach(playTimeout => clearTimeout(playTimeout));
  };
  const handlePlay = () => {
    const scatterChart = charts.find(c => c.params.className === 'Scatter');
    setPlaying(true);


    let prevDt = curSliderVal;
    let i = 0;
    const newPlayTimeouts = [];
    while (prevDt < sliderMax) {
      const curDt = new Date(
        prevDt
      );
      curDt.setUTCMonth(curDt.getUTCMonth() + 1);
      prevDt = curDt;
      const timeoutPrevDt = prevDt;
      newPlayTimeouts.push(
        setTimeout(() => {
          if (timeoutPrevDt >= sliderMax) {
            setPlaying(false);
          }
          scatterChart.update(curDt);
          setCurSliderVal(curDt);
        }, 2000*i)
      );
      i = i + 1;
    }
    setPlayTimeouts(newPlayTimeouts);
  };
  const handleBackForward = (change) => {
    // Update slider
    const newSliderVal = new Date(curSliderVal);
    newSliderVal.setUTCMonth(
      newSliderVal.getUTCMonth() + change
    );
    if (newSliderVal < sliderMin || newSliderVal > sliderMax) return;
    setCurSliderVal(newSliderVal);
    const scatterChart = charts.find(c => c.params.className === 'Scatter');
    scatterChart.update(newSliderVal);
  };

  // Returns slider and chart area for the scatterplot.
  const getScatterJsx = () => {
    const createSliderWithTooltip = Slider.createSliderWithTooltip;
    const Range = createSliderWithTooltip(Slider);
    const Handle = Slider.Handle;

    const handle = (propsHandle) => {
      const { value, dragging, index, ...restProps } = propsHandle;
      return (
        <Handle data-tip={true} data-for={'sliderTooltip'} {...restProps} />
      );
    };
    const wrapperStyle = {
      width: '500px',
      marginLeft: 15,
      // marginTop: 35,
    };
    const trackStyle = { backgroundColor: 'transparent', }
    const handleStyle = {
      backgroundColor: 'rgb(61, 91, 121)',
      borderColor: 'white',
      width: '20px',
      height: '20px',
      marginTop: '-8px',
    }
    const dotStyle = {
      borderColor: '#96dbfa',
    }

    // TODO calculate min and max based on number of months, same with marks.
    const sliderMinValue = sliderMin.getUTCFullYear();
    const sliderMaxValue = sliderMax.getUTCFullYear() + (sliderMax.getUTCMonth() / 12);
    const marks = {};
    let markValue = sliderMinValue;
    while (markValue <= sliderMaxValue + 1) {
      marks[markValue] = markValue;
      markValue = markValue + 1;
    }


    console.log('curSliderVal')
    console.log(curSliderVal)
    console.log('sliderMin')
    console.log(sliderMin)
    const scatterSlider = (
      <div className={styles.sliderWrapper} style={wrapperStyle}>
        <Slider
          min={sliderMinValue}
          max={sliderMaxValue}
          defaultValue={sliderMaxValue}
          value={curSliderVal.getUTCFullYear() + (curSliderVal.getUTCMonth()/12)}
          marks={{ 2016: 2016, 2017: 2017, 2018: 2018, 2019: 2019, }}
          step={1/12}
          handle={handle}
          trackStyle={trackStyle}
          handleStyle={handleStyle}
          dotStyle={dotStyle}
          onChange={handleSliderChange}
          onAfterChange={handleSliderAfterChange}
        />
        <div className={styles.sliderControls}>
          <i
            onClick={() => handleBackForward(-1)}
            className={classNames('material-icons', {
              [styles.disabled]: curSliderVal <= sliderMin,
            })}
          >fast_rewind</i>
          {
            // Show play button if not playing
            (!playing) ? <i onClick={handlePlay} className={classNames('material-icons', {
              [styles.disabled]: curSliderVal >= sliderMax,
            })}>play_arrow</i>
            : <i onClick={handlePause} className={classNames('material-icons')}>pause</i>
          }

          <i onClick={() => handleBackForward(+1)} className={classNames('material-icons', {
            [styles.disabled]: curSliderVal >= sliderMax,
          })}>fast_forward</i>
        </div>
      </div>
    );
    const curSliderValStr = curSliderVal.toLocaleString('en-us', {
      month: 'short',
      year: 'numeric',
      timeZone: 'utc',
    });
    const scatterSliderValue = <div className={styles.scatterSliderValue}>{curSliderValStr}</div>;
    const scatterArea = <div className={classNames(styles.Scatter, 'Scatter-0')} />;
    const scatterJsx = scatterArea;
    return (
      <div>
        {scatterSlider}
        {scatterArea}
      </div>
    );
  };

  const getScatterData = () => {
    return [
      {
        'title': 'Vaccination coverage and incidence by country',
        'chart_jsx': getScatterJsx,
        'date_time_fmt': () => '',
      },
    ]
  };

  const getMiniLineJsx = () => {

    // Get data for miniline infographic
    const miniLineData = [
      props.chartParams.MiniLine[0].params.data,
      props.chartParams.MiniLine[1].params.data
    ];
    const infographicValues = [
      miniLineData[0].length > 0 ?
        miniLineData[0][miniLineData[0].length - 1] :
        {value: null},
        miniLineData[1].length > 0 ?
          miniLineData[1][miniLineData[1].length - 1] :
          {value: null},
    ];
    return [
      {
        'title': 'Global yearly incidence',
        'chart_jsx': () => <div className={classNames(styles.MiniLine, 'MiniLine-0')} />,
        'value_fmt': Util.formatIncidence,
        'value_label': 'cases per 1M population',
        'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'year')},
        ...infographicValues[0]
      },
      {
        'title': 'Global vaccination coverage',
        'chart_jsx': () => <div className={classNames(styles.MiniLine, 'MiniLine-1')} />,
        'value_fmt': Util.percentize,
        'value_label': 'of infants',
        'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'year')},
        ...infographicValues[1]
      },
    ];
  };
  // If loading do not show JSX content.
  console.log('props')
  console.log(props)

  const curSliderValStr = curSliderVal.toLocaleString('en-us', {
    month: 'short',
    year: 'numeric',
    timeZone: 'utc',
  });

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
              {
                [
                  ...getMiniLineJsx(),
                  // {
                  //   'title': 'Global annual incidence',
                  //   'value_fmt': Util.formatIncidence,
                  //   'value_label': 'cases per 1M population',
                  //   'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'year')},
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
                          // Show chart if applicable
                          (item.chart_jsx !== undefined) && item.chart_jsx()
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
                ...getScatterData()
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
              id={stylesTooltip.globalTooltip}
              type='globalTooltip'
              className='globalTooltip'
              place="right"
              effect="float"
              getContent={ () =>
                tooltipData &&
                  <div className={stylesTooltip.tooltipContainer}>
                    <div className={stylesTooltip.tooltipContent}>
                    {
                      // If name, show
                      (tooltipData.name !== undefined) &&
                      <div className={stylesTooltip.tooltipName}>
                        {tooltipData.name}
                      </div>
                    }
                    {
                      tooltipData.items.map(item =>
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
            <ReactTooltip
              id={'sliderTooltip'}
              type='dark'
              className={classNames(styles.sliderTooltip, {visible: showSliderTooltip})}
              place="top"
              effect="solid"
              event="mousemove"
              offset={{top: -8,}}
              getContent={ () =>
                <div>
                {
                  curSliderValStr
                }
                </div>
              }
              />
          </div>
    );
};

export default Global
