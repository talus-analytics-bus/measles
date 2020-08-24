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
import Util from '../../../components/misc/Util.js'
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
      const cumulativeData = []
      const newCasesData = []
      const newCasesAvgData = []
      newData.forEach((d, i) => {
        cumulativeData.push({
          date_time: d.Date,
          value: +d.Nevada,
          place_name: 'Nevada'
        })
        if (i > 0) {
          newCasesData.push({
            date_time: d.Date,
            value: +d.Nevada - newData[i - 1].Nevada,
            place_name: 'Nevada'
          })
        } else if (i === 0) {
          newCasesData.push({
            date_time: d.Date,
            value: 0,
            place_name: 'Nevada'
          })
        }
        if (i > 5) {
          newCasesAvgData.push({
            date_time: d.Date,
            value: d3.mean(newCasesData.slice(i - 6, i + 1), d => d.value),
            place_name: 'Nevada'
          })
        }
      })

      setData(newCasesAvgData)
      // setData(newCasesData)
      // setData(cumulativeData)
    })
  }, [])

  useEffect(() => {
    if (data !== null) {
      console.log('data')
      console.log(data)
      // Setup sliding line chart params
      const chartParams = {
        data: {
          y: data,
          y2: []
        },
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
          right: 98,
          bottom: 70,
          left: 100
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
      // unmountFuncs2.push(slidingLineChart.removeResizeListener)
      setSlidingLine(slidingLineChart)
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
          <div className={styles.slidingLine} />
        </div>
      </div>
    </div>
  )
}

export default Nevada
