import React from 'react'
import { Redirect } from 'react-router';
import Popup from 'reactjs-popup'
import ReactTooltip from 'react-tooltip';
import Tooltip from 'rc-tooltip';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';
import InfoTooltip from '../../../components/misc/InfoTooltip.js';
import infoTooltipStyles from '../../../components/misc/infotooltip.module.scss';

import MiniMap from '../../../components/map/MiniMap.js'
import Selectpicker from '../../../components/chart/Selectpicker/Selectpicker.js'

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

  // Manage redirect path
  const [redirectPath, setRedirectPath] = React.useState(null)

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

  // Track which data series is being shown in the paging bar chart.
  const [ sectionTitle, setSectionTitle ]  = React.useState('Measles cases reported by country'); // PLACEHOLDER
  const [ sectionDatetime, setSectionDatetime ]  = React.useState(''); // PLACEHOLDER

  // Track which data series is being shown in the paging bar chart.
  const [ pagingBarData, setPagingBarData ]  = React.useState('cumcaseload_totalpop'); // PLACEHOLDER

  // Track displayed region in paging bar chart
  const [ pagingBarRegion, setPagingBarRegion ]  = React.useState('all');

  // Track how many pages there are for the bar chart
  const [ pageCount, setPageCount ]  = React.useState(1);

  // Track which page we're on for the bar chart (1-indexed)
  const [ curPage, setCurPage ]  = React.useState(1);

  // Get data for current country.
  const country = props.id;

  // Effect hook to load API data.
  React.useEffect(() => {

    // Scroll to top of window afer loading.
    window.scrollTo(0,0);

    // Update chart variables
    const chartsToSet = [];
    for (let chartTypeName in props.chartParams) {
      // If multiple charts of this type, add all of them.
      const chartType = props.chartParams[chartTypeName];
      chartType.forEach(function (chart, i) {
        if (!chart.class) return;
        chart.params.noResizeEvent = true;
        // Set tooltip data function
        chart.params.setTooltipData = setTooltipData;
        chart.params.tooltipClassName = stylesTooltip.globalTooltip;
        if (chart.params.className === 'Scatter') {
          chart.params.curSliderVal = curSliderVal;
          chart.params.setRedirectPath = setRedirectPath;
          chart.params.noResizeEvent = false;
        }

        // Set state variables and setters for PagingBar
        else if (chart.params.className === 'PagingBar') {
          chart.params.curPage = curPage;
          chart.params.setCurPage = setCurPage;
          chart.params.setPageCount = setPageCount;
          chart.params.setRedirectPath = setRedirectPath;
          chart.params.setSectionTitle = setSectionTitle;
          chart.params.setSectionDatetime = setSectionDatetime;
          chart.params.pagingBarRegion = pagingBarRegion;
          chart.params.places = props.places;
          // chart.params.noResizeEvent = false;
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
    if (PagingBarChart) {
      if (pagingBarRegion !== PagingBarChart.params.pagingBarRegion) {
        setCurPage(1);
      }
      PagingBarChart.update(curPage, pagingBarData, pagingBarRegion);
    }

    // Rebuild tooltips after the chart is drawn
    ReactTooltip.rebuild();
  }, [curPage, pagingBarData, pagingBarRegion])

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
    scatterChart.params.curSliderVal = curSliderVal;
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
    let utcYear = curSliderVal.getUTCFullYear();
    let utcMonth = curSliderVal.getUTCMonth();
    const newPlayTimeouts = [];
    while (prevDt < sliderMax) {
      utcMonth++;
      if (utcMonth > 11) {
        utcMonth = 0;
        utcYear += 1;
      }
      const curDt = new Date(`${utcYear}/${utcMonth + 1}/1`);

      prevDt = curDt;
      const timeoutPrevDt = prevDt;
      newPlayTimeouts.push(
        setTimeout(() => {
          if (timeoutPrevDt >= sliderMax) {
            setPlaying(false);
          }
          scatterChart.update(curDt);
          setCurSliderVal(curDt);
        }, 1320*i)
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
    const bubbleMetricData = Util.getMetricChartParams(props.chartParams.Scatter[0].params.data.size[0].metric);
    const colorMetricData = Util.getMetricChartParams(props.chartParams.Scatter[0].params.data.y[0].metric);
    const scatterLegend = (
      <div className={styles.scatterLegend}>
        <div className={styles.section}>
          <p className={styles.sectionName}>{bubbleMetricData.label}</p>
          <div className={styles.legendEntryGroups}>
            <div className={styles.legendEntryGroup}>
              {
                [1,2,3].map((d,i) =>
                  <div className={classNames(styles.legendEntry, styles.circle)}>
                    <div className={classNames(styles.legendIcon, styles.circle)} />
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
          </div>
        </div>
        <div className={styles.section}>
          <p className={styles.sectionName}>{colorMetricData.name}</p>
          <div className={styles.legendEntryGroups}>
            <div className={styles.legendEntryGroup}>
              {
                [1,2,3].map((d,i) =>
                  <div className={classNames(styles.legendEntry, styles.rect, styles.rectGradient)}>
                    <div className={classNames(styles.legendIcon, styles.rect, styles.rectGradient)} />
                    {
                      (i === 0) && <div className={styles.legendLabel}>Lower<br/>incidence</div>
                    }
                    {
                      (i === 2) && <div className={styles.legendLabel}>Higher<br/>incidence</div>
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

    // Get data values to format datetime stamps
    const getDataToggleValues = (chartData) => {
      const dataToggleValues = [];
      for (let key in chartData) {
        if (key === 'x') continue;
        else {
          dataToggleValues.push(
            {
              seriesName: key,
              seriesData: chartData[key],
              ...Util.getMetricChartParams(chartData[key][0].metric),
            }
          );
        }
      }
      return dataToggleValues;
    };
    const chartData = props.chartParams.PagingBar[0].params.data;
    const dataToggleValues = getDataToggleValues(chartData);

    // Radio toggle
    const toggle = (
      <div className={styles.dataToggles}>
      {
        dataToggleValues.map((entry, i) =>
          <div className={styles.dataToggle}>
            <label for={entry.value}>
              <input
                type="radio"
                name="pagingBarData"
                id={entry.metric}
                value={entry.metric}
                checked={pagingBarData === entry.metric}
                onClick={() => {
                  setPagingBarData(entry.metric);
                  setCurPage(1);
                }}
              />
              {entry.label}
            </label>
          </div>
        )
      }
      {
        // Selectpicker for region
        <Selectpicker
          setOption={setPagingBarRegion}
          optionList={props.places.map(p => p.name)}
          allOption={"All countries"}
        />
      }
      </div>
    );

    // Main chart area
    const area = <div className={classNames(styles.PagingBar, 'PagingBar-0')} />;

    // Paging left and right buttons
    const pageNav = (
      <div className={styles.pageNavs}>
        <button
          onClick={() => { if (curPage < pageCount) setCurPage(curPage + 1) } }
          className={
            classNames(
              styles.pageNav,
              styles.pageNext,
              'btn-secondary',
              {[styles.disabled]: curPage === pageCount,},
            )
          }>Next</button>
        <button
          onClick={() => { if (curPage > 1) setCurPage(curPage - 1) } }
          className={
            classNames(
              styles.pageNav,
              styles.pagePrev,
              'btn-secondary',
              {[styles.disabled]: curPage === 1,},
            )
          }>Previous</button>
      </div>
    );

    // Page numbers
    const pageNumbers = (
      <div className={styles.pageControls}>
      {
        pageNav
      }
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
        {toggle}
        {area}
        {pageNumbers}
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

  /**
   * Return correct data source text for pagingbar chart (vaccination and
   * 12 month cases).
   * @method getScatterDataSources
   */
  const getPagingBarDataSources = () => {

    let ySource, yDatum;
    if (pagingBarData === 'cumcaseload_totalpop') {
      yDatum = props.chartParams.PagingBar[0].params.data.y[0];
    }
    else {
      yDatum = props.chartParams.PagingBar[0].params.data.y2[0];
    }
    if (yDatum === undefined) yDatum = null;
    else {
      // const metricChartParams = Util.getMetricChartParams(yDatum.metric);
      const yUpdated = new Date(yDatum.updated_at).toLocaleString('en-us', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });
      // const yMetricName = metricChartParams.label.toLowerCase();
      ySource = `Source: ${yDatum.data_source} as of ${yUpdated}.`;
    }

    const sources = [];
    if (yDatum) sources.push(ySource);
    return sources.join(' ');
  };

  const getScatterData = () => {
    return [
      {
        'title': 'Total measles cases, incidence, and vaccination coverage by country',
        'instructions': 'Drag slider to view data for different months. Hover on bubble to view data. Click bubble to pin country name. Double click to go to country page.',
        'chart_jsx': getScatterJsx,
        'date_time_fmt': () => '',
        'data_source': getScatterDataSources,
      },
    ]
  };

  const getPagingBarData = () => {
    return [
      {
        'title': sectionTitle,
        'chart_jsx': getPagingBarJsx,
        'date_time_fmt': () => sectionDatetime,
        'data_source': getPagingBarDataSources,
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
        'title': 'Cases reported globally',
        'chart_jsx': () => <div className={classNames(styles.MiniLine, 'MiniLine-0')} />,
        'value_fmt': Util.comma,
        'value_label': 'current cases',
        'date_time_fmt': (date_time) => {return Util.getDatetimeStamp(date_time, 'month')},
        ...infographicValues[0]
      },
      {
        'title': 'Average vaccination coverage',
        'chart_jsx': () => <div className={classNames(styles.MiniLine, 'MiniLine-1')} />,
        'value_fmt': Util.percentize,
        'value_label': 'of infants',
        'infoTooltipText': 'Simple average of vaccination coverage of infants for all reporting countries (not population-weighted)',
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

  // If redirecting to country details page, do so
  if (redirectPath !== null) {
    return <Redirect push to={
        {
          pathname: redirectPath,
        }
      }
    />
  }
  else return (<div className={styles.details}>
            <div className={styles.top}>
              <div className={styles.sidebar}>
                <div className={styles.title}>
                  Global caseload
                </div>
                {
                  // Global minimap
                  // <div className={styles.map}>
                  //   <MiniMap countryIso2={props.countryIso2}/>
                  // </div>
                }
                <div className={styles.itemContainers}>
                  {
                  [
                    ...getMiniLineJsx(),
                  ].map(item =>
                    <div className={styles.itemContainer}>
                      <div className={styles.item}>
                        <span className={styles.title}>
                          <span>{item.title}
                          {
                            // If info tooltip text, render one
                            (item.infoTooltipText) && <InfoTooltip text={item.infoTooltipText} />
                          }
                          </span>
                          <span className={'dateTimeStamp'}>{item.date_time_fmt(item)}</span>
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
                    </div>
                  )
                }
                </div>
              </div>
              <div className={styles.main}>
              {
                [
                  ...getScatterData()
                ].map(item =>
                  <div className={styles.itemContainer}>
                    <div className={styles.item}>
                      <span className={styles.title}>
                        {item.title}<br/>{item.date_time_fmt(item)}
                      </span>
                      <span className={styles.instructions}>
                        {
                          item.instructions
                        }
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
                      {item.title}<br/><div className={'dateTimeStamp'}>{item.date_time_fmt(item)}</div>
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
                      <div className={stylesTooltip.tooltipHeader}>
                        <div className={
                          classNames (
                            stylesTooltip.tooltipName,
                            {
                              [stylesTooltip.placeName]: tooltipData.flagPath !== undefined,
                            },
                          )
                      }>
                          <img src={tooltipData.flagPath} />
                          {tooltipData.name}
                        </div>
                      </div>
                    }
                    {
                      tooltipData.items.map(item =>
                        <div className={stylesTooltip.item}>
                          <div className={stylesTooltip.name}>
                            <span>
                            {
                              item.name
                            }
                            </span>
                            <span className={'dateTimeStamp'}>
                            {
                              item.value !== null ? `${Util.getDatetimeStamp(item.datum, item.period)}` : ''
                            }
                            </span>
                          </div>
                          <div className={stylesTooltip.content}>
                          {
                            // Show value if reported
                            item.value !== null &&
                            <div>
                              <span className={stylesTooltip.value}>{item.value}</span>
                              <span className={stylesTooltip.unit}>{item.label}</span>
                            </div>
                          }
                          {
                            // If delta exists, add that
                            (item.value !== null && item.deltaData && item.deltaData.delta !== undefined) && !item.notAvail && <div className={classNames(stylesTooltip.delta, stylesTooltip[item.deltaData.direction])}>
                              <i className={classNames('material-icons')}>play_arrow</i>
                              <span className={stylesTooltip['delta-value']}>
                                <span className={stylesTooltip['num']}>{item.deltaData.deltaFmt}</span>
                              </span>
                              <span className={stylesTooltip['delta-text']}>{Util.getDeltaWord(item.deltaData.delta)} from<br/>previous month</span>
                            </div>
                          }
                          {
                            // Write not reported otherwise
                            item.value === null &&
                            <span className={classNames(stylesTooltip.value, stylesTooltip.notAvail)}>Not reported</span>
                          }
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
              offset={{top: -window.pageYOffset,}}
              getContent={ () =>
                <div>
                {
                  curSliderValStr
                }
                </div>
              }
              />
            {
              // Tooltip for paging bar chart
              <ReactTooltip
                id={'pagingBarTooltip'}
                type='light'
                className={infoTooltipStyles.infoTooltipContainer}
                place="top"
                effect="float"
                getContent={ () =>
                  <div>
                    Click to view country details page
                  </div>
                }
                />
            }
          </div>
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
        </div>
    );
};

export default Global
