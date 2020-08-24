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
  // Legend entry data
  const legendEntries = [
    {
      label: 'Nevada (statewide)',
      class: styles.valueLine,
      shape: 'line'
    },
    {
      label: 'Counties',
      class: styles.valueLineSec,
      shape: 'line'
    }
  ]
  // Legend JSX
  const legend = (
    <div className={styles.slidingLineLegend}>
      {legendEntries.map(
        entry =>
          entry.skip !== true && (
            <div className={styles.entry}>
              <svg width='36' height='18'>
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
            } else if (i === 0) {
              newCasesDataLines[place_name].push({
                date_time: d.Date,
                value: 0,
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
        ySec
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
        margin: {
          top: 20,
          right: 25,
          bottom: 30,
          // bottom: 70, // make room for slider
          left: 140
        }
      }

      // Sliding line chart defined in NevadaSlidingLine.js

      const slidingLineChart = new NevadaSlidingLine(
        // Selector of DOM element in Resilience.js component where the chart
        // should be drawn.
        '.' + styles.slidingLine,

        // Chart parameters consumed by Chart.js and ResilienceRadarChart.js,
        // defined above.
        chartParams
      )
      const slidingLineChartPerCapita = new NevadaSlidingLine(
        // Selector of DOM element in Resilience.js component where the chart
        // should be drawn.
        '.' + styles.slidingLinePerCapita,

        // Chart parameters consumed by Chart.js and ResilienceRadarChart.js,
        // defined above.
        {
          ...chartParams,
          yLabel: [
            'Per 100k new COVID-19 cases',
            'reported (7-day moving average)'
          ]
        }
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
          <div className={styles.slidingLineLegend}>{legend}</div>
          <div className={styles.slidingLine} />
        </div>
        <div className={styles.slidingLineChartWrapper}>
          <div className={styles.slidingLineLegend}>{legend}</div>
          <div className={styles.slidingLinePerCapita} />
        </div>
      </div>
    </div>
  )
}

export default Nevada
