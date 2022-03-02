import * as d3 from 'd3/dist/d3.min'
import Chart from '../../../chart/Chart.js'
import Util from '../../../misc/Util.js'
import styles from './scatter.module.scss'

class Scatter extends Chart {
  constructor(selector, params = {}) {
    super(selector, params)

    this.params = params

    this.data = { vals: {} }
    this.data.vals.x = params.data.x || []
    this.data.vals.y = params.data.y || []
    this.data.vals.size = params.data.size || []

    // Get grand total cases
    this.grandMaxSize = d3.max(
      this.data.vals.size.filter(d => d.value && d.value !== 0),
      d => d.value
    )
    this.grandMaxX = d3.max(this.data.vals.x, d => d.value)
    this.grandMaxY = d3.max(
      this.data.vals.y.filter(d => d.value && d.value !== 0),
      d => d.value
    )
    this.grandMinSize = d3.min(
      this.data.vals.size.filter(d => d.value && d.value !== 0),
      d => d.value
    )
    this.grandMinX = d3.min(this.data.vals.x, d => d.value)
    this.grandMinY = d3.min(
      this.data.vals.y.filter(d => d.value && d.value !== 0),
      d => d.value
    )

    // Default margins
    if (!this.params.margin) {
      this.params.margin = {
        top: 68,
        right: 5,
        bottom: 80,
        left: 120
      }
    }

    this.init()
    this.onResize(this)
    this.draw()
  }

  draw() {
    const chart = this

    // Create clipping path
    const defs = chart.svg.append('defs')

    // Create shadow definition
    const filterDef = defs
      .append('filter')
      .attr('id', 'f1')
      .attr('x', '0')
      .attr('y', '0')
      .attr('width', '200%')
      .attr('height', '200%')
    filterDef
      .append('feOffset')
      .attr('result', 'offOut')
      .attr('in', 'SourceAlpha')
      .attr('dx', '2')
      .attr('dy', '2')
    filterDef
      .append('feGaussianBlur')
      .attr('result', 'blurOut')
      .attr('in', 'offOut')
      .attr('stdDeviation', '2')
    filterDef
      .append('feBlend')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blurOut')
      .attr('mode', 'normal')

    if (chart.data.vals.length < 1) {
      // TODO show "no data" message
      return
    }

    // Define red color scale for bubbles
    const yColorScale = d3
      .scaleLinear()
      .domain([Math.log10(chart.grandMinY), Math.log10(chart.grandMaxY)])
      .range(['#e6c1c6', '#9d3e4c'])

    const yColor = val => {
      if (val === null) return '#b3b3b3'
      // no data color
      else return yColorScale(val)
    }

    // Define bubble size scale
    const rTmp = d3
      .scaleLinear()
      .domain([Math.log10(chart.grandMinSize), Math.log10(chart.grandMaxSize)])
      .range([5, 40])

    // const minR = 5;
    const r = val => {
      if (val === 0 || val === null) return 5
      else return rTmp(val)
    }

    // // Define bubble label size scale
    // const labelSize = val => {
    //   return r(val)
    //   // return (r(val) / 2) + 10;
    // }

    // Define x scale - vaccination coverage
    const x = d3
      .scaleLinear()
      .domain([0, 1])
      .range([0, chart.width])

    // Define x axis - vaccination coverage
    const xAxis = d3
      .axisBottom()
      .tickSize(0)
      .tickPadding(10)
      .tickFormat(() => '')

    const xAxisG = chart.newGroup(styles['x-axis']) // eslint-disable-line

    // Define y scale - incidence
    const y = d3
      .scaleLinear()
      .domain([0, 1])
      .range([chart.height, 0]) // TODO check

    // Define y axis - incidence
    const yAxis = d3
      .axisLeft()
      .tickSize(5)
      .tickPadding(10)
      .tickFormat(() => '')

    const yAxisG = chart.newGroup(styles['y-axis']) // eslint-disable-line

    const resizeAxes = () => {
      yAxis.scale(y).tickValues(y.domain())
      xAxis.scale(x).tickValues(x.domain())

      chart[styles['y-axis']].html('').call(yAxis)

      chart[styles['x-axis']]
        .html('')
        .call(xAxis)
        .attr('transform', `translate(0, ${chart.height})`)

      // Update xaxis tick labels
      chart[styles['x-axis']]
        .selectAll('g.tick')
        .each(function addXTickText(d, i) {
          const tickLabel = d3.select(this).select('text')
          if (i === 0) {
            tickLabel.attr('text-anchor', 'start')
            tickLabel
              .append('tspan')
              .attr('x', 0)
              .text('Lowest')
            tickLabel
              .append('tspan')
              .attr('dy', '1.1em')
              .attr('x', 0)
              .text('coverage')
            tickLabel
              .append('tspan')
              .attr('dy', '1.1em')
              .attr('x', 0)
              .text('(2016-2019)')
          } else if (i === 1) {
            tickLabel.attr('text-anchor', 'end')
            tickLabel
              .append('tspan')
              .attr('x', 0)
              .text('Highest')
            tickLabel
              .append('tspan')
              .attr('dy', '1.1em')
              .attr('x', 0)
              .text('coverage')
            tickLabel
              .append('tspan')
              .attr('dy', '1.1em')
              .attr('x', 0)
              .text('(2016-2019)')
          }
        })

      chart[styles['y-axis']]
        .selectAll('g.tick')
        .each(function addYTickText(d, i) {
          const tickLabel = d3.select(this).select('text')
          if (i === 0) {
            tickLabel
              .attr('text-anchor', 'end')
              .attr('y', '-3.4em')
              .attr('dy', 0)
            tickLabel
              .append('tspan')
              .attr('x', -10)
              .attr('dy', '1.1em')
              .text('Lowest')
            tickLabel
              .append('tspan')
              .attr('dy', '1.1em')
              .attr('x', -10)
              .text('incidence')
            tickLabel
              .append('tspan')
              .attr('dy', '1.1em')
              .attr('x', -10)
              .text('(2016-2021)')
          } else if (i === 1) {
            tickLabel
              .attr('text-anchor', 'end')
              .attr('y', '-.35em')
              .attr('dy', 0)
            tickLabel
              .append('tspan')
              .attr('x', -10)
              .attr('dy', '1.1em')
              .text('Highest')
            tickLabel
              .append('tspan')
              .attr('dy', '1.1em')
              .attr('x', -10)
              .text('incidence')
            tickLabel
              .append('tspan')
              .attr('dy', '1.1em')
              .attr('x', -10)
              .text('(2016-2022)')
          }
        })

      // Add y-axis label
      const yAxisLabel = chart[styles['y-axis']]
        .append('text')
        .attr('y', -100)
        .attr('class', styles.label)

      yAxisLabel
        .append('tspan')
        .attr('x', -chart.height / 2)
        .text(Util.getScatterLabelData(chart.params.data.y[0]))

      yAxisLabel
        .append('tspan')
        .attr('x', -chart.height / 2)
        .attr('dy', '1.2em')
        .text('(log scale)')

      // Add x-axis label
      const xAxisLabel = chart[styles['x-axis']]
        .append('text')
        .attr('x', chart.width / 2)
        .attr('y', chart.margin.bottom - 20)
        .attr('class', styles.label)

      xAxisLabel
        .append('tspan')
        .attr('x', chart.width / 2)
        .text('Vaccination coverage')

      xAxisLabel
        .append('tspan')
        .attr('x', chart.width / 2)
        .attr('dy', '1.2em')
        .text('(relative)')
    }
    resizeAxes()

    // Add bubbles group (assume one datum per country). Enter one bubble for
    // each that we have pop data for, in the update function.
    const bubblesG = chart.newGroup(styles.bubbles)

    // Add month and year label to center of plot
    const monthYearLabel = chart
      .newGroup(styles.monthYearLabel, chart[styles.bubbles])
      .append('text')
      .attr('class', styles.monthYearLabel)
      .attr('x', chart.width / 2)
      .attr('y', '1em')
      .text('Aug 2019')

    // Add avg vaccination coverage line
    const avgXLine = chart
      .newGroup('avgXLine')
      .append('line')
      .attr('class', styles.avgXLine)
      .attr('x1', x(0.5))
      .attr('x2', x(0.5))
      .attr('y1', y(0))
      .attr('y2', y(1) - 31)

    // Add label for avg vaccination coverage line
    const avgXLineLabel = chart['avgXLine']
      .append('text')
      .attr('class', styles.avgXLineLabel)
      .attr('x', x(0.5))
      .attr('y', y(1) - 56)
    const avgXLineLabelShift = -143 / 2
    avgXLineLabel
      .append('tspan')
      .attr('x', x(0.5))
      .attr('dx', avgXLineLabelShift)
      .text('Average coverage')
    avgXLineLabel
      .append('tspan')
      .attr('x', x(0.5))
      .attr('dx', avgXLineLabelShift)
      .attr('dy', '1.2em')
      .text('across all countries')

    // TODO - Exclude "global" bubble.
    //

    // TODO build rest of chart

    // Update function: Draw lines, add tooltips, etc.
    // Called: Every time the month/year slider is changed.
    chart.update = (dt = chart.params.curSliderVal, resize = false) => {
      if (chart.svg.node().parentElement === null) return

      if (resize) {
        // Update x-scale
        x.range([0, chart.width])
        y.range([chart.height, 0])

        // Resize axes
        resizeAxes()

        // update avg line
        avgXLine.attr('y1', y(y.domain()[0])).attr('y2', y(y.domain()[1]) - 31)
      }

      const sortBySize = (a, b) => {
        // A: If this bubble is NOT null
        if (a.value_normalized.y !== null) {
          // And the other one is, then send the other to the back
          if (b.value_normalized.y === null) return 1
        }

        // B: If this bubble is NOT null
        else if (b.value_normalized.y !== null) {
          // And the other one is, then send the other to the back
          if (a.value_normalized.y === null) return -1
        }

        // If this bubble is has more pop
        else if (a.value_normalized.size > b.value_normalized.size) {
          return -1
        } else return 1
      }

      // Get month and year of data to show in scatter plot
      const yyyymmdd = Util.formatDatetimeApi(dt)
      const yyyymmddArr = yyyymmdd.split('-')
      const monthlyStr = `${yyyymmddArr[0]}-${yyyymmddArr[1]}`
      const yearlyStr = `${yyyymmddArr[0]}`

      const dtPrev = new Date(dt)
      dtPrev.setMonth(dtPrev.getMonth() - 1)
      const yyyymmddPrev = Util.formatDatetimeApi(dtPrev)
      const yyyymmddArrPrev = yyyymmddPrev.split('-')
      const monthlyStrPrev = `${yyyymmddArrPrev[0]}-${yyyymmddArrPrev[1]}`

      // Get this data to bind
      // y data
      const yData = chart.data.vals.y.filter(d => {
        return d.date_time.startsWith(monthlyStr)
      })
      yData.forEach(d => {
        if (d.value === null) d.value_normalized = null
        else if (d.value === 0) {
          d.value_normalized = Math.log10(chart.grandMinY)
        } else {
          d.value_normalized = Math.log10(d.value)
          // d.value_normalized = d.value / chart.grandMaxY
          // d.value_normalized = d.value / yDataMax
        }
      })

      // Get previous time point's y-data for comparison trend
      const yDataPrev = chart.data.vals.y.filter(d => {
        return d.date_time.startsWith(monthlyStrPrev)
      })

      // x data - use most recent available
      let xDataYearlyStr = yearlyStr
      let foundXData = false
      let xData
      const filterFunc = d => {
        return d.date_time.startsWith(xDataYearlyStr)
      }
      while (!foundXData) {
        xData = chart.data.vals.x.filter(filterFunc)
        if (xData.length > 0) foundXData = true
        else xDataYearlyStr = (+xDataYearlyStr - 1).toString()
      }

      xData.forEach(d => (d.value_normalized = d.value))

      // size data - case count
      const sizeData = chart.data.vals.size.filter(d => {
        return d.date_time.startsWith(monthlyStr) // TODO elegantly
      })
      sizeData.forEach(d => {
        if (d.value === null) d.value_normalized = null
        else if (d.value === 0) {
          d.value_normalized = Math.log10(chart.grandMinSize)
        } else {
          d.value_normalized = Math.log10(d.value)
        }
      })

      // Collate data points
      const data = []
      xData.forEach(xDatum => {
        if (Util.yearlyReportIso2.includes(xDatum.place_iso)) return // skip VE for now.
        const placeId = xDatum.place_id
        const sizeDatum = sizeData.find(d => d.place_id === placeId)
        const yDatum = yData.find(d => d.place_id === placeId)
        if (yDatum && sizeDatum) {
          let deltaData

          // Calculate y trend
          const yDatumPrev = yDataPrev.find(d => d.place_id === placeId)
          if (yDatumPrev) {
            deltaData = Util.getDeltaData({
              percent_change: Util.getPercentChange(
                yDatumPrev.value,
                yDatum.value
              )
            })
          }

          // Push data to array
          data.push({
            value_normalized: {
              x: xDatum.value_normalized,
              y: yDatum.value_normalized,
              size: sizeDatum.value_normalized
            },
            place_id: placeId,
            place_iso: xDatum.place_iso,
            place_name: xDatum.place_name,
            date_time: yDatum.date_time,
            xDatum: xDatum,
            yDatum: yDatum,
            sizeDatum: sizeDatum,
            deltaData: deltaData
          })
        }
      })

      // Sort data by size so that largest circles are in the back.
      data.sort(sortBySize)

      // Update x-scale domain so that far left side corresponds to the
      // lowest normalized x value.
      x.domain([chart.grandMinX, chart.grandMaxX])

      // Ditto for the lower limit of the y-scale
      y.domain([Math.log10(chart.grandMinY), Math.log10(chart.grandMaxY)])

      // Enter new bubbles based on place_id if needed (pos and color)
      // Update existing bubbles by moving to new position and colors
      // Move average vaccination level line to new position
      const avgXLineVal = d3.mean(xData, d => d.value_normalized)
      avgXLine
        .transition()
        .duration(500)
        .attr('x1', x(avgXLineVal))
        .attr('x2', x(avgXLineVal))
      avgXLineLabel
        .selectAll('tspan')
        .transition()
        .duration(500)
        .attr('x', x(avgXLineVal))

      // Move circle off edge of chart, x-axis
      const getCircleXPos = d => {
        // If x-pos is with r units of chart width, then shift it to a value
        // equal to chart width minus r
        const xPosDesired = x(d.value_normalized.x)
        const curR = r(d.value_normalized.size)
        let xPosFinal = xPosDesired
        if (chart.width - xPosDesired <= curR) {
          xPosFinal = chart.width - curR
        }

        // Similarly, don't let x pos hang circle off left side of plot
        else if (xPosDesired - curR < 0) {
          xPosFinal = curR
        }
        return xPosFinal
      }

      const getCircleYPos = d => {
        const yPosDesired =
          d.value_normalized.y !== null
            ? y(d.value_normalized.y)
            : y(Math.log10(chart.grandMinY))

        const curR = r(d.value_normalized.size)
        let yPosFinal = yPosDesired
        if (yPosDesired + curR > chart.height) {
          yPosFinal = chart.height - curR
        }

        // Similarly, don't let y pos hang circle off left side of plot
        else if (yPosDesired - curR < 0) {
          yPosFinal = curR
        }
        return yPosFinal
      }

      const getTextAnchor = d => {
        const xPos = getCircleXPos(d)
        const curR = r(d.value_normalized.size)
        const nearRightEdge = chart.width - xPos - curR <= 25
        const nearLeftEdge = xPos - curR <= 25
        if (nearRightEdge) return 'end'
        else if (nearLeftEdge) return 'start'
        else return 'middle'
      }

      const getTextDx = d => {
        const xPos = getCircleXPos(d)
        const curR = r(d.value_normalized.size)
        const nearRightEdge = chart.width - xPos - curR <= 25
        const nearLeftEdge = xPos - curR <= 25
        if (nearRightEdge) return r(d.value_normalized.size)
        else if (nearLeftEdge) return -1 * r(d.value_normalized.size)
        else return 0
      }

      function getTspanDy(d, nTspan) {
        const baseEm = (-1 * r(d.value_normalized.size) - 5) / 16
        const plusEm = nTspan - 1
        return (baseEm - plusEm).toString() + 'em'
      }

      // Enter new bubbles, update old
      bubblesG
        .selectAll(`g:not(.${styles.monthYearLabel})`)
        .attr('class', styles.bubbleG)
        .data(data, d => d.place_id)
        .join(
          enter => {
            const newCircleGs = enter
              .append('g')
              .attr(
                'transform',
                d =>
                  `translate(${getCircleXPos(d)}, ${chart.height -
                    r(d.value_normalized.size)})`
              )
              .classed(
                styles.active,
                d => chart.params.activeBubble === d.place_id
              )
              .attr('data-tip', true)
              .attr('data-for', chart.params.tooltipClassName)
              .on('click', function toggleSelectBubble(d) {
                const thisG = d3.select(this)
                const thisBubble = thisG.select('circle')
                const activateBubble = !thisG.classed(styles.active)
                bubblesG
                  .selectAll('g')
                  .classed(styles.active, false)
                  .selectAll('circle')
                  .attr('filter', 'none')
                if (activateBubble) {
                  chart.params.activeBubbleId = d.place_id
                  thisG.classed(styles.active, true)
                  thisBubble.attr('filter', 'url(#f1)')
                } else {
                  chart.params.activeBubbleId = -9999
                }

                bubblesG.selectAll('g').sort(function bubbleSort(a, b) {
                  // If this is the active bubble, bring it to the front.
                  if (a && activateBubble && a.place_id === d.place_id) return 1
                  else if (b && activateBubble && b.place_id === d.place_id)
                    return -1
                  else if (!a) return 1
                  else if (!b) return -1
                  else if (a.value_normalized.size > b.value_normalized.size) {
                    return -1
                  } else if (
                    a.value_normalized.size < b.value_normalized.size
                  ) {
                    return 1
                  } else return 0
                  // // If this is the active bubble, bring it to the front.
                  // if (activateBubble && a.place_id === d.place_id) return 1;
                  // else if (activateBubble && b.place_id === d.place_id) return -1;
                  //
                  // // A: If this bubble is NOT null
                  // else if (a.value_normalized.y !== null) {
                  //
                  //   // And the other one is, then send the other to the back
                  //   if (b.value_normalized.y === null) return 1;
                  // }
                  //
                  // // B: If this bubble is NOT null
                  // else if (b.value_normalized.y !== null) {
                  //
                  //   // And the other one is, then send the other to the back
                  //   if (a.value_normalized.y === null) return -1;
                  // }
                  //
                  // // If this bubble is has more pop
                  // else if (a.value_normalized.size > b.value_normalized.size) {
                  //   return -1;
                  // } else return 1;
                })

                // Make name label visible
              })
              .on('mouseenter', function showBubbleTooltip(d) {
                const items = []
                ;['sizeDatum', 'yDatum', 'xDatum'].forEach(itemName => {
                  const datum = d[itemName]
                  const item = Util.getTooltipItem(datum)
                  if (itemName === 'sizeDatum' && d.deltaData) {
                    item.deltaData = d.deltaData
                  }
                  items.push(item)
                })
                chart.params.setTooltipData({
                  name: d.place_name,
                  flagPath: `/flags/${d['place_iso']}.png`,
                  items: items
                })
              })
              .on('dblclick', function bubbleDoubleClick(d) {
                chart.params.setRedirectPath('/details/' + d.place_id)
              })

            newCircleGs
              .append('circle')
              .attr('class', styles.scatterCircle)
              .style('opacity', 0)
              .attr('fill', yColor(0))
              .attr('r', d => r(0))

            const circleLabels = newCircleGs
              .append('text')
              .attr('class', styles.scatterCircleLabel)
              .attr('dy', d => -1 * r(d.value_normalized.size) - 2)
              .attr('dx', d => getTextDx(d))
              .style('text-anchor', d => getTextAnchor(d))
              .style('font-size', '1em')

            circleLabels.each(function appendTSpans(d) {
              const circleLabelTspans = Util.getWrappedText(d.place_name, 20)

              // Append one tspan per line
              const nTspan = circleLabelTspans.length
              d3.select(this)
                .selectAll('tspan')
                .data(circleLabelTspans)
                .enter()
                .append('tspan')
                .attr('x', 0)
                .attr('dy', (dd, i) => {
                  if (circleLabelTspans.length === 1) {
                    return null
                  } else if (i === 0) {
                    return getTspanDy(d, nTspan)
                  } else {
                    return '1em'
                  }
                })
                // .attr('dy', (d, i) => {
                //   if (circleLabelTspans.length === 1) {
                //     return null;
                //   }
                //   else if (i === 0) {
                //     return (-1 * circleLabelTspans.length - (0.25*(circleLabelTspans.length-1))) + 'em';
                //   }
                //   else {
                //     return '1em';
                //   }
                //
                // })
                .text(dd => dd)
            })

            newCircleGs
              .transition()
              .duration(1320)
              .attr(
                'transform',
                d => `translate(${getCircleXPos(d)}, ${getCircleYPos(d)})`
              )

            newCircleGs
              .selectAll('circle')
              .transition()
              .duration(1320)
              .style('opacity', 1)
              .attr('fill', d => yColor(d.value_normalized.y))
              .attr('r', d => r(d.value_normalized.size))
          },
          update => {
            update
              .classed(
                styles.active,
                d => chart.params.activeBubbleId === d.place_id
              )
              .transition()
              .duration(1320)
              .attr(
                'transform',
                d => `translate(${getCircleXPos(d)}, ${getCircleYPos(d)})`
              )

            update
              .selectAll('text')
              .data(data, d => d.place_id)
              .select('tspan')
              .transition('textShift2')
              .duration(1320)
              .attr('dy', function(d) {
                const nTspan = d3
                  .select(this.parentElement)
                  .selectAll('tspan')
                  .nodes().length
                return getTspanDy(d, nTspan)
              })

            update
              .selectAll('text')
              .data(data, d => d.place_id)
              .transition('textShift')
              .duration(1320)
              .attr('dy', d => -1 * r(d.value_normalized.size) - 2)
              .attr('dx', d => getTextDx(d))
              .style('text-anchor', d => getTextAnchor(d))

            update
              .selectAll('circle')
              .data(data, d => d.place_id)
              .transition('circleStyle')
              .duration(1320)
              .style('opacity', 1)
              .attr('fill', d => {
                return yColor(d.value_normalized.y)
              })
              // .attr('fill', d => yColor(d.value_normalized.y))
              .attr('r', d => r(d.value_normalized.size))

            // update.selectAll('text')
            //   .data(data, d => d.place_id)
            //     .transition()
            //     .duration(1320)
            //       .attr('dy', d => (-1 * r(d.value_normalized.size)) - 2)
            //       .attr('dx', d => getTextDx(d))
            //       .style('font-size', d => labelSize(d.value_normalized.size))
            //       .style('text-anchor', d => getTextAnchor(d));
          },
          exit => {
            exit.remove()
          }
        )

      // Sort bubbles
      bubblesG.selectAll('g').sort(function bubbleSort(a, b) {
        const aActive = a ? chart.params.activeBubbleId === a.place_id : false
        const bActive = b ? chart.params.activeBubbleId === b.place_id : false

        if (aActive) return 1
        else if (bActive) return -1
        else if (!a) return 1
        else if (!b) return -1
        else if (a.value_normalized.size > b.value_normalized.size) {
          return -1
        } else if (a.value_normalized.size < b.value_normalized.size) {
          return 1
        } else return 0
        // // A: If this bubble is NOT null
        // if (a.value_normalized.y !== null) {
        //
        //   // And the other one is, then send the other to the back
        //   if (b.value_normalized.y === null) return 1;
        // }
        //
        // // B: If this bubble is NOT null
        // else if (b.value_normalized.y !== null) {
        //
        //   // And the other one is, then send the other to the back
        //   if (a.value_normalized.y === null) return -1;
        // }
        //
        // // If this bubble is has more pop
        // else if (a.value_normalized.size > b.value_normalized.size) {
        //   return -1;
        // } else return 1;
      })

      // Keep bubbles below other chart elements, except month year label.
      bubblesG.lower()
      chart['avgXLine'].lower()
      // chart[styles.monthYearLabel].lower();

      // Update axis labels
      const monthYearLabelString = dt.toLocaleString('en-us', {
        month: 'short',
        year: 'numeric',
        timeZone: 'utc'
      })

      monthYearLabel.attr('x', chart.width / 2).text(monthYearLabelString)
      chart[styles['y-axis']]
        .select('text tspan:nth-child(2)')
        .text(`in ${monthYearLabelString} (log scale)`)
      chart[styles['y-axis']]
        .select('text tspan:nth-child(2)')
        .text(`in ${xDataYearlyStr}`)
    }

    chart.resize = () => {
      const resize = true
      chart.update(chart.params.curSliderVal, resize)
    }

    // Call update function, using most recent dt of data as the initial
    // selection.
    const initDt = Util.globalMaxDate()

    chart.update(initDt)
  }
}

export default Scatter
