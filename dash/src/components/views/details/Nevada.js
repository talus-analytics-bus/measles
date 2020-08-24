import React, { useState, useEffect } from 'react'
import Popup from 'reactjs-popup'
import axios from 'axios'
import { Link } from 'react-router-dom'
import Chart from '../../chart/Chart.js'

// Custom components
import NevadaSlidingLine from './content/NevadaSlidingLine.js'
import SparkLine from './content/SparkLine.js'
import ReactTooltip from 'react-tooltip'
import { Source, renderSourceForItem } from '../../../components/misc/Source.js'
import InfoTooltip from '../../../components/misc/InfoTooltip.js'
import YearlyReport from '../../../components/misc/YearlyReport.js'
import infoTooltipStyles from '../../../components/misc/infotooltip.module.scss'

import MiniMap from '../../../components/map/MiniMap.js'

// Utilities (date formatting, etc.)
import Util, { defined } from '../../../components/misc/Util.js'
import * as d3 from 'd3/dist/d3.min'

import classNames from 'classnames'
import styles from './details.module.scss'
import stylesTooltip from './tooltip.module.scss'

// FC for Details.
const Nevada = ({ ...props }) => {
  // STATE
  // Track whether the sliding line chart has been drawn
  const [slidingLine, setSlidingLine] = useState(null)

  // Track whether to show reset view button on sliding line chart
  const [showReset, setShowReset] = useState(false)

  // Track whether the sliding line chart has been drawn
  const [slidingLineMetric, setSlidingLineMetric] = useState(
    'caseload_totalpop'
  )

  // Track event listener removal functions to fire when component unmounts
  const [unmountFuncs, setUnmountFuncs] = useState([])

  // Data
  const [data, setData] = useState(null)

  // CONSTANTS
  // population by county, Nevada
  const populations = {
    'Carson City': 56546,
    Churchill: 25876,
    Clark: 2318174,
    Douglas: 49695,
    Elko: 54985,
    Esmeralda: 974,
    Eureka: 1966,
    Humboldt: 17062,
    Lander: 5996,
    Lincoln: 5200,
    Lyon: 57987,
    Mineral: 4561,
    Nye: 48864,
    Pershing: 6962,
    Storey: 4465,
    Washoe: 478155,
    'White Pine': 10586
  }
  populations.Nevada = d3.sum(Object.values(populations))

  // Legend entry data
  const legendEntries1 = [
    {
      label: 'Statewide new COVID-19 cases (7-day moving avg.)',
      class: styles.valueLine,
      shape: 'line'
    },
    // {
    //   label: 'Counties',
    //   class: styles.valueLineSec,
    //   shape: 'line'
    // },
    {
      label: 'Statewide daily new cases',
      class: styles.grayRect,
      shape: 'rect'
    }
  ]
  const legendEntries2 = [
    {
      label: 'Statewide 7-d. avg.',
      class: styles.valueLine,
      shape: 'line'
    },
    {
      label: 'Counties 7-d. avg.',
      class: styles.valueLineSec,
      shape: 'line'
    },
    {
      label: 'Statewide daily new cases',
      class: styles.grayRect,
      shape: 'rect'
    }
  ]
  // Legend JSX
  const legend1 = (
    <div className={styles.slidingLineLegend}>
      {legendEntries1.map(
        entry =>
          entry.skip !== true && (
            <div className={styles.entry}>
              <svg width={entry.shape === 'line' ? 36 : 10} height='18'>
                {entry.shape === 'line' ? (
                  <line
                    className={classNames(styles.symbol, entry.class)}
                    x1='0'
                    x2='36'
                    y1='9'
                    y2='9'
                  />
                ) : (
                  <rect
                    className={classNames(styles.symbol, entry.class)}
                    x='0'
                    y='0'
                    height='18'
                    width='18'
                  />
                )}
              </svg>
              <div className={styles.label}>{entry.label}</div>
            </div>
          )
      )}
    </div>
  )
  const legend2 = (
    <div className={styles.slidingLineLegend}>
      {legendEntries2.map(
        entry =>
          entry.skip !== true && (
            <div className={styles.entry}>
              <svg width={entry.shape === 'line' ? 36 : 10} height='18'>
                {entry.shape === 'line' ? (
                  <line
                    className={classNames(styles.symbol, entry.class)}
                    x1='0'
                    x2='36'
                    y1='9'
                    y2='9'
                  />
                ) : (
                  <rect
                    className={classNames(styles.symbol, entry.class)}
                    x='0'
                    y='0'
                    height='18'
                    width='18'
                  />
                )}
              </svg>
              <div className={styles.label}>{entry.label}</div>
            </div>
          )
      )}
    </div>
  )

  // UTILITY FUNCS
  const getData = async () => {
    const newData = await d3.csv('./data/cases.csv')
    return newData
  }

  // EFFECT HOOKS
  useEffect(() => {
    // load data
    getData().then(newData => {
      // TODO format data
      const cumulativeDataLines = {}
      const newCasesDataLines = {}
      const newCasesDataAvgLines = {}
      const newCasesData = []
      const newCasesAvgData = []
      newData.forEach((d, i) => {
        const date_time = d.Date

        //
        for (const [place_name, v] of Object.entries(d)) {
          if (place_name === 'Date') continue
          else {
            // cumulative cases by state, county
            defined({
              datum: cumulativeDataLines,
              keys: [place_name],
              finalVal: []
            })

            cumulativeDataLines[place_name].push({
              date_time,
              value: +v,
              place_name
            })

            // daily new cases by state, county
            defined({
              datum: newCasesDataLines,
              keys: [place_name],
              finalVal: []
            })
            if (i > 0) {
              newCasesDataLines[place_name].push({
                date_time: d.Date,
                value: +d[place_name] - newData[i - 1][place_name],
                place_name
              })
            }

            // 7-day average daily new cases by state, county
            if (i > 5) {
              defined({
                datum: newCasesDataAvgLines,
                keys: [place_name],
                finalVal: []
              })
              newCasesDataAvgLines[place_name].push({
                date_time: d.Date,
                value: d3.mean(
                  newCasesDataLines[place_name].slice(i - 6, i + 1),
                  d => d.value
                ),
                place_name
              })
            }
          }
        }
      })

      // collate data into primary and secondary lines
      const ySec = []
      for (const [k, v] of Object.entries(newCasesDataAvgLines)) {
        if (['Nevada', 'Date'].includes(k)) continue
        else {
          ySec.push(v)
        }
      }
      const data = {
        y: newCasesDataAvgLines.Nevada,
        ySec,
        bar: newCasesDataLines.Nevada
      }
      setData(data)
    })
  }, [])

  useEffect(() => {
    if (data !== null) {
      // Setup sliding line chart params
      const chartParams = {
        data,
        vaccData: [],
        noResizeEvent: false,
        setTooltipData: () => {
          return null
        },
        tooltipClassName: '',
        setShowReset: setShowReset,
        metric: slidingLineMetric,
        setSlidingLine: setSlidingLine,
        setCountSummary: () => {
          return null
        },
        setCountSummaryDateRange: () => {
          return null
        },
        yMax: 1450,
        xDomain: [new Date('06/02/2020'), new Date('08/18/2020')],

        margin: {
          top: 20,
          right: 25,
          bottom: 30,
          // bottom: 70, // make room for slider
          left: 140
        }
      }
      console.log(chartParams.data)

      // Sliding line chart defined in NevadaSlidingLine.js

      const slidingLineChart = new NevadaSlidingLine(
        // Selector of DOM element in Resilience.js component where the chart
        // should be drawn.
        '.' + styles.slidingLine,

        // Chart parameters consumed by Chart.js and ResilienceRadarChart.js,
        // defined above.
        chartParams
      )

      // PER 100k chart
      const chartParams100k = {
        ...chartParams,
        yMax: 50,
        yLabel: [
          'Per 100k new COVID-19 cases',
          'reported (7-day moving average)'
        ]
      }
      chartParams100k.data.y.forEach(d => {
        d.value = d.value / (populations.Nevada / 100000.0)
      })
      chartParams100k.data.bar.forEach(d => {
        d.value = d.value / (populations.Nevada / 100000.0)
      })
      chartParams100k.data.ySec.forEach(d => {
        d.forEach(dd => {
          dd.value = dd.value / (populations[dd.place_name] / 100000.0)
        })
      })

      const slidingLineChartPerCapita = new NevadaSlidingLine(
        // Selector of DOM element in Resilience.js component where the chart
        // should be drawn.
        '.' + styles.slidingLinePerCapita,

        // Chart parameters consumed by Chart.js and ResilienceRadarChart.js,
        // defined above.
        chartParams100k
      )
      // setSlidingLine(slidingLineChart)
      if (unmountFuncs) {
        const newUnmountFuncs = [
          ...unmountFuncs,
          slidingLineChart.removeResizeListener
        ]
        setUnmountFuncs(newUnmountFuncs)
      }

      // Rebuild tooltips after the chart is drawn
      ReactTooltip.rebuild()
    }
  }, [data])

  // JSX
  return (
    <div>
      <div className={styles.slidingLineContainer}>
        <div className={styles.slidingLineChartWrapper}>
          <div className={styles.slidingLineLegend}>{legend1}</div>
          <div className={styles.slidingLine} />
        </div>
        <div className={styles.slidingLineChartWrapper}>
          <div className={styles.slidingLineLegend}>{legend2}</div>
          <div className={styles.slidingLinePerCapita} />
        </div>
      </div>
    </div>
  )
}

export default Nevada
