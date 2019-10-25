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

  // Track how many pages there are for the bar chart
  const [ pageCount, setPageCount ]  = React.useState(1);

  // Track which page we're on for the bar chart (1-indexed)
  const [ curPage, setCurPage ]  = React.useState(1);

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

        // Set state variables and setters for PagingBar
        else if (chart.params.className === 'PagingBar') {
          chart.params.curPage = curPage;
          chart.params.setCurPage = setCurPage;
          chart.params.setPageCount = setPageCount;
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

  }, [curSliderVal]);

  React.useEffect(() => {
    const PagingBarChart = charts.find(d => d.params.className === 'PagingBar');
    if (PagingBarChart) PagingBarChart.update(curPage);
  }, [curPage])

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

    // Stop playing if needed
    if (playing) handlePause();
  };

  const handlePause = () => {
    setPlaying(false);
    while (playTimeouts.length > 0) {
      clearTimeout(playTimeouts.pop());
    }
    setPlayTimeouts([]);
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
    // Stop playing if playing
    if (playing) handlePause();

    // Update slider
    const newSliderValTmp = Util.getUTCDate(new Date(curSliderVal));
    newSliderValTmp.setUTCMonth(
      newSliderValTmp.getUTCMonth() + change
    );
    const newSliderVal = Util.getUTCDate(newSliderValTmp);
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

    // Scatter plot legend
    const scatterLegend = (
      <div className={styles.scatterLegend}>
        <div className={styles.section}>
          <p className={styles.sectionName}>Population of country</p>
          <div className={styles.legendEntryGroups}>
            <div className={styles.legendEntryGroup}>
              {
                [1,2,3].map((d,i) =>
                  <div className={classNames(styles.legendEntry, styles.circle)}>
                    <div className={classNames(styles.legendIcon, styles.circle)} />
                    {
                      (i === 0) && <div className={styles.legendLabel}>Lower<br/>pop.</div>
                    }
                    {
                      (i === 2) && <div className={styles.legendLabel}>Higher<br/>pop.</div>
                    }
                  </div>
                )
              }
            </div>
          </div>
        </div>
        <div className={styles.section}>
          <p className={styles.sectionName}>Measles cases reported</p>
          <div className={styles.legendEntryGroups}>
            <div className={styles.legendEntryGroup}>
              {
                [1,2,3].map((d,i) =>
                  <div className={classNames(styles.legendEntry, styles.rect, styles.rectGradient)}>
                    <div className={classNames(styles.legendIcon, styles.rect, styles.rectGradient)} />
                    {
                      (i === 0) && <div className={styles.legendLabel}>Fewer<br/>cases</div>
                    }
                    {
                      (i === 2) && <div className={styles.legendLabel}>More<br/>cases</div>
                    }
                  </div>
                )
              }
            </div>
            <div className={styles.legendEntryGroup}>
              {
                [0].map((d,i) =>
                  <div className={classNames(styles.legendEntry, styles.rect, styles.dataNotAvailable)}>
                    <div className={classNames(styles.legendIcon, styles.rect, styles.dataNotAvailable)} />
                    {
                      (i === 0) && <div className={styles.legendLabel}>Data not<br/>reported</div>
                    }
                  </div>
                )
              }
            </div>
          </div>
          </div>
      </div>
    );

    return (
      <div>
        {scatterSlider}
        {scatterArea}
        {scatterLegend}
      </div>
    );
  };

  // Returns jsx for paging bar chart
  const getPagingBarJsx = () => {

    // Main chart area
    const area = <div className={classNames(styles.PagingBar, 'PagingBar-0')} />;

    // Page controls
    const pageControls = (
      <div className={styles.pageControls}>
      {
        Util.getIntArray(1, pageCount).map(i =>
          <div
            className={
              classNames(
                styles.pageControl,
                {
                  [styles.active]: i === curPage,
                }
              )
            }
            onClick={ () => setCurPage(i) }
          >
            {i}
          </div>
        )
      }
      </div>
    );
    return (
      <div>
        {area}
        {pageControls}
      </div>
    );
  };

  /**
   * Return correct data source text for scatter chart (vaccination and
   * incidence).
   * @method getScatterDataSources
   */
  const getScatterDataSources = () => {

    let ySource, xSource;
    const yDatum = props.chartParams.Scatter[0].params.data.y[0];
    if (yDatum === undefined) yDatum = null;
    else {
      const yUpdated = new Date(yDatum.updated_at).toLocaleString('en-us', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });
      const yMetricName = Util.getScatterLabelData(yDatum).toLowerCase();
      ySource = `Source for ${yMetricName}: ${yDatum.data_source} as of ${yUpdated}.`;
    }

    const xDatum = props.chartParams.Scatter[0].params.data.x[0];
    if (xDatum === undefined) xSource = '';
    else {
      const xUpdated = new Date(xDatum.updated_at).toLocaleString('en-us', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });
      xSource = `Source for vaccination coverage: ${xDatum.data_source} as of ${xUpdated}.`;
    }
    const sources = [];
    if (yDatum) sources.push(ySource);
    if (xDatum) sources.push(xSource);
    return sources.join(' ');
  };

  const getScatterData = () => {
    return [
      {
        'title': 'Vaccination coverage and caseload by country',
        'chart_jsx': getScatterJsx,
        'date_time_fmt': () => '',
        'data_source': getScatterDataSources,
      },
    ]
  };

  const getPagingBarData = () => {
    return [
      {
        'title': 'Reported cases by country',
        'chart_jsx': getPagingBarJsx,
        'date_time_fmt': () => '',
        // 'data_source': getPagingBarDataSource,
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
            <div className={styles.top}>
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
            </div>
            <div className={styles.bottom}>
            <div className={classNames(styles.main, styles.mainBottom)}>
            {
              [
                ...getPagingBarData()
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
        </div>
    );
};

export default Global
