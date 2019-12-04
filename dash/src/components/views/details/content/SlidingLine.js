import * as d3 from 'd3/dist/d3.min'
import Chart from '../../../chart/Chart.js'
import Util from '../../../misc/Util.js'
import styles from './slidingline.module.scss'
import stylesDetails from '../details.module.scss'
import ReactTooltip from 'react-tooltip'

class SlidingLine extends Chart {
  constructor(selector, params = {}) {
    super(selector, params)

    this.params = params

    this.data = {}
    this.data.vals = params.data || []
    this.data.vaccVals = params.vaccData || []
    this.show = {}
    this.show.y = this.data.vals.length > 0
    this.show.vacc = this.data.vaccVals.length > 0

    this.setData = metric => {
      this.params.yMetricParams = Util.getMetricChartParams(metric)
      if (metric === 'caseload_totalpop') {
        this.data.vals = params.data.y
      } else if (metric === 'incidence_monthly') {
        this.data.vals = params.data.y2
      }
    }
    this.setData(this.params.metric)

    // Get min and max time from data.
    let minMaxData
    if (this.data.vals.length > 0) {
      minMaxData = this.data.vals
    } else if (this.data.vaccVals.length > 0) {
      // Get x domain from vacc data
      minMaxData = this.data.vaccVals
    } else {
      // No line data at all, don't show line chart
    }

    if (minMaxData != undefined) {
      const minTime = new Date(minMaxData[0]['date_time'].replace(/-/g, '/'))
      const maxTime = new Date(
        minMaxData[minMaxData.length - 1]['date_time'].replace(/-/g, '/')
      )
      this.xDomainDefault = [minTime, maxTime]
    }

    // If no default xdomain, hide line chart
    if (this.xDomainDefault === undefined) {
      return
    }

    // Get max incidence from data.
    // [ max, min ]
    const yMaxTmp = d3.max(this.data.vals, d => d.value) || 5
    const yMax = yMaxTmp > 5 ? yMaxTmp : 5
    this.yDomainDefault = [yMax, 0]

    // Adjust margins if not showing incidence or vaccination
    if (!this.show.vacc) {
      this.params.margin.right = 0
    }

    // Set tick format
    if (this.params.yMetricParams && this.params.yMetricParams.tickFormat) {
      this.yTickFormat = this.params.yMetricParams.tickFormat
    }

    // Adjust left margin to fit available space
    this.init()
    this.params.margin.left = this.fitLeftMargin(this.yDomainDefault)
    this.onResize(this)
    this.draw()
  }

  draw() {
    const chart = this

    // Parameterize the slider
    chart.slider = {
      height: chart.height * 0.24
    }

    chart.newGroup(styles.slider).attr('transform', `translate(0, ${45})`)

    // Extend chart to accomodate slider
    const curHeight = chart.svg.attr('height')
    chart.svg.attr('height', +curHeight + chart.slider.height)

    // Create clipping path
    chart.svg
      .append('defs')
      .append('clipPath')
      .attr('id', 'plotArea')
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', chart.width)
      .attr('height', chart.height)

    if (chart.data.vals.length < 1) {
      // TODO show "no data" message
      return
    }

    // x scale: Time - main chart
    // global min/max to start
    const x = d3
      .scaleTime()
      .domain(this.xDomainDefault) // min and max time vary w. window size
      .range([0, chart.width])

    // x scale: Time - slider (via scale band)
    // TODO deal with time zone effects elegantly.
    const x2Domain = d3
      .timeMonths(
        new Date(chart.xDomainDefault[0]).setSeconds(1),
        new Date(chart.xDomainDefault[1]).setUTCMonth(
          chart.xDomainDefault[1].getUTCMonth() + 1
        )
      )
      .map(d => {
        return d.toLocaleString('en-US', {
          month: 'numeric',
          year: 'numeric',
          timeZone: 'UTC'
        })
      })

    const x2 = d3
      .scaleBand()
      .domain(x2Domain) // never changes
      .range([0, chart.width])
      .paddingInner(0)

    // x axis: slider
    function onlyUnique(value, index, self) {
      return self.indexOf(value) === index
    }
    const tickValues = chart.data.vals
      .map(
        d => '1/' + new Date(d.date_time.replace(/-/g, '/')).getUTCFullYear()
      )
      .filter(onlyUnique)
    const xAxis2 = d3
      .axisBottom()
      .tickSize(0)
      .tickValues(tickValues)
      .tickFormat(val => val.replace('1/', ''))
      .tickPadding(10)
      .scale(x2)

    const xAxisG2 = chart
      .newGroup(styles['x-axis-2'], chart[styles.slider])
      .attr('transform', `translate(0, ${chart.height + chart.slider.height})`)
      .call(xAxis2)

    // Time formatting
    var formatMillisecond = d3.timeFormat('.%L'),
      formatSecond = d3.timeFormat(':%S'),
      formatMinute = d3.timeFormat('%I:%M'),
      formatHour = d3.timeFormat('%I %p'),
      formatDay = d3.timeFormat('%a %d'),
      formatWeek = d3.timeFormat('%b %d'),
      formatMonth = d3.timeFormat('%b'),
      formatYear = d3.timeFormat('%Y')

    function multiFormat(date) {
      let format
      this.dataset.year = formatYear(date)
      if (d3.timeMonth(date) < date) {
        this.parentElement.remove()
      } else if (d3.timeYear(date) < date) {
        format = formatMonth(date)
      } else {
        format = formatMonth(date) + ' ' + formatYear(date)
        this.dataset.type = 'year-and-month'
      }
      return format
    }

    // x axis - main chart
    const xAxis = d3
      .axisBottom()
      .tickSizeOuter(0)
      .ticks(7)
      .tickFormat(multiFormat)
      .scale(x)

    const wrapTimeLabels = selection => {
      let doWrap = selection
        .selectAll('text')
        .nodes()
        .some(d => d.dataset.type !== 'year-and-month')

      let noYearsShown = selection
        .selectAll('text')
        .nodes()
        .every(d => d.dataset.type !== 'year-and-month')

      if (!doWrap) {
        // Remove Jan from tick label
        selection.selectAll('text').each(function removeJan() {
          const text = d3.select(this)
          const arr = text.text().split(' ')
          text.text(arr[1])
        })

        return
      }

      selection.selectAll('text').each(function doWrap(d, i) {
        const text = d3.select(this)
        const arr = text.text().split(' ')

        if (noYearsShown && i === 0) arr.push(text.node().dataset.year)

        if (arr.length > 1) {
          text.text('')
          text
            .append('tspan')
            .attr('x', 0)
            .text(arr[0])
          text
            .append('tspan')
            .attr('x', 0)
            .attr('dy', '1.1em')
            .text(arr[1])
        }
      })
    }

    const xAxisG = chart
      .newGroup(styles['x-axis'])
      .attr('transform', `translate(0, ${chart.height})`)
      .call(xAxis)
      .call(wrapTimeLabels)

    // y scale: incidence - main chart
    // Never changes
    const y = chart.y

    // y scale: incidence - slider
    // Never changes
    const y2 = d3
      .scaleLinear()
      .domain(chart.yDomainDefault)
      .nice()
      .range([0, chart.slider.height])

    // y scale: vacc cov. - main chart
    // Never changes
    const yRight = d3
      .scaleLinear()
      .domain([100, 0])
      .range([0, chart.height])

    // y axis - main chart - left
    const yAxis = d3
      .axisLeft()
      .scale(y)
      .tickFormat(chart.yTickFormat)
      .ticks(5)
      .tickSizeOuter(0)

    // Define line function - main chart
    const line = d3
      .line()
      .x(d => x(new Date(d.date_time.replace(/-/g, '/'))))
      .y(d => y(d.value))
    const lineVacc = d3
      .line()
      .x(d => x(new Date(d.date_time.replace(/-/g, '/'))))
      .y(d => yRight(d.value))

    // Define rectangle area function - main chart, nulls
    const area = d3
      .area()
      .x(d => x(new Date(d.date_time.replace(/-/g, '/'))))
      .y0(chart.height)
      .y1(0)

    // Get "value" line segments -- all segments where data are available (not
    // null).
    const getValueLineSegments = () => {
      const valueLineSegments = []
      let start, end, prev
      let segment = []
      chart.data.vals.forEach(datum => {
        // If no start and datum not-null, datum is start
        // If there was a previous datum, also include it
        if (!start && datum.value !== null) {
          start = datum
          // if (prev) segment.push(prev);
          segment.push(datum)
          prev = datum
          return
        }
        // If no start and datum null, continue
        if (!start && datum.value === null) {
          prev = datum
          return
        }
        // If start and datum not-null, push to segment
        if (start && datum.value !== null) {
          segment.push(datum)
          prev = datum
          return
        }
        // If start and datum null, push to segment, and start new one
        if (start && datum.value === null) {
          // segment.push(datum);
          start = undefined
          valueLineSegments.push(segment)
          segment = []
          prev = datum
          return
        }
      })

      if (segment.length > 0) {
        valueLineSegments.push(segment)
        segment = []
      }
      return valueLineSegments
    }

    // Add line to chart
    const valueLineSegments = getValueLineSegments()
    chart
      .newGroup(styles.lineValue)
      .selectAll('path')
      .data(valueLineSegments)
      .enter()
      .append('path')
      .attr('d', d => line(d))

    // Add vaccination line to chart
    const formatVaccVals = () => {
      const output = []
      const vals = chart.data.vaccVals
      chart.data.vaccVals.forEach((v, i) => {
        // For first val do nothing special
        if (i === 0) {
          output.push(v)
          return
        }

        // For all other values, append the value, and also a fake point that
        // has the last point's value and this point's datetime.
        const fakePoint = {
          value: vals[i - 1].value,
          date_time: v.date_time
        }
        output.push(fakePoint)
        output.push(v)
        if (i === vals.length - 1) {
          const pointDt = new Date(v.date_time.replace(/-/g, '/'))
          const year = pointDt.getUTCFullYear()
          pointDt.setUTCFullYear(year + 1)
          const fakeDtStr = Util.formatDatetimeApi(pointDt)
          const fakeFuturePoint = {
            value: v.value,
            date_time: fakeDtStr
          }
          output.push(fakeFuturePoint)
        }
      })

      return output
    }

    // Get "value" line segments -- all segments where data are available (not
    // null).
    const getNullLineSegments = () => {
      const valueLineSegments = []
      let start, end, prev
      let segment = []
      chart.data.vals.forEach(datum => {
        // If no start and datum not-null, datum is start
        // If there was a previous datum, also include it
        if (!start && datum.value === null) {
          start = datum
          if (prev) segment.push(prev)
          segment.push(datum)
          prev = datum
          return
        }
        // If no start and datum null, continue
        if (!start && datum.value !== null) {
          prev = datum
          return
        }
        // If start and datum null, push to segment
        if (start && datum.value === null) {
          segment.push(datum)
          prev = datum
          return
        }
        // If start and datum not-null, push to segment, and start new one
        if (start && datum.value !== null) {
          segment.push(datum)
          start = undefined
          valueLineSegments.push(segment)
          segment = []
          prev = datum
          return
        }
      })

      if (segment.length > 0) {
        valueLineSegments.push(segment)
        segment = []
      }
      return valueLineSegments
    }

    // Add null areas to chart
    const nullLineSegments = getNullLineSegments()
    chart
      .newGroup(styles.areaNull)
      .selectAll('path')
      .data(nullLineSegments)
      .enter()
      .append('path')
      .attr('d', d => area(d))

    // Add vaccination line to chart.
    const vaccLineData = formatVaccVals()
    chart
      .newGroup(styles.lineVacc)
      .selectAll('path')
      .data([vaccLineData])
      .enter()
      .append('path')
      .attr('d', d => lineVacc(d))

    // Add label for vaccination line, only show if missing values on chart are
    // visible.
    const vaccLineLabelDatum = vaccLineData[vaccLineData.length - 1]

    const vaccLineLabel = chart[styles.lineVacc]
      .append('text')
      .attr('class', styles.lineVaccLabel)
      .attr('dy', '1em')
      .attr('y', yRight(vaccLineLabelDatum.value))

    const vaccLineLabelXVal = new Date(vaccLineLabelDatum.date_time)
    const vaccLineLabelX = x(vaccLineLabelXVal)

    const vaccYear = vaccLineLabelXVal.getUTCFullYear() + 1

    vaccLineLabel
      .append('tspan')
      .attr('x', vaccLineLabelX)
      .text(vaccYear + ' data')

    vaccLineLabel
      .append('tspan')
      .attr('x', vaccLineLabelX)
      .attr('dy', '1.1em')
      .text('not yet reported')

    // // Add endpoint circle for vaccination line to chart.
    // chart[styles.lineVacc].selectAll('circle')
    //   .data(
    //     [chart.data.vaccVals[
    //       chart.data.vaccVals.length - 1
    //     ]]
    //   )
    //   .enter().append('circle')
    //     .attr('class','mvmtest')
    //     .attr('r', 3)
    //     .attr('cx', d => {
    //       const tmpDt = new Date(d.date_time.replace(/-/g, '/'));
    //       return x(tmpDt);
    //     })
    //     .attr('cy', d => yRight(d.value));
    //   console.log('vaccl')
    //   console.log(chart.data.vaccVals[
    //     chart.data.vaccVals.length - 1
    //   ])

    // Add rects to slider
    chart[styles.slider]
      .selectAll('rect')
      .data(chart.data.vals)
      // .data(chart.data.vals.filter(d => d.value !== null)
      .enter()
      .append('rect')
      .attr('x', d => {
        return x2(
          new Date(d['date_time'].replace(/-/g, '/')).toLocaleString('en-US', {
            month: 'numeric',
            year: 'numeric',
            timeZone: 'UTC'
          })
        )
      })
      .attr('y', d => {
        const val = d.value !== null ? d.value : y2.domain()[0]
        return (
          chart.height + (chart.slider.height - (chart.slider.height - y2(val)))
        )
        // return chart.height + chart.slider.height;
      }) // TODO check
      .attr('width', x2.bandwidth()) // todo bands
      .attr('height', d => {
        const val = d.value !== null ? d.value : y2.domain()[0]
        return chart.slider.height - y2(val)
      })
      .attr('class', styles.sliderRect)
      .classed(styles.nullBar, d => d.value === null)

    const yAxisG = chart.newGroup(styles['y-axis']).call(yAxis)

    // y axis - main chart - right
    const yAxisRight = d3
      .axisRight()
      .scale(yRight)
      .tickFormat(val => Util.percentize(val))
      .tickValues([0, 25, 50, 75, 100])
      .tickSizeOuter(0)

    const yAxisGRight = chart
      .newGroup(styles['y-axis-right'])
      .attr('transform', `translate(${chart.width}, 0)`)
      .classed(styles['y-axis'], true)
      .call(yAxisRight)
      .classed(styles.invisible, !chart.show.vacc)

    const yAxisLeftYPos = this.labelShift

    const yAxisLabel = chart[styles['y-axis']]
      .append('text')
      .attr('class', styles.label)
      .attr('x', -chart.height / 2)
      .attr('y', yAxisLeftYPos)

    yAxisLabel
      .append('tspan')
      .attr('x', -chart.height / 2)
      .text(
        chart.params.metric === 'incidence_monthly'
          ? 'Monthly incidence of measles'
          : 'Total measles'
      )
    yAxisLabel
      .append('tspan')
      .attr('x', -chart.height / 2)
      .attr('dy', '1.2em')
      .text(
        chart.params.metric === 'incidence_monthly'
          ? '(cases per 1M population)'
          : 'cases reported'
      )

    const yAxisRightLabel = chart[styles['y-axis-right']]
      .append('text')
      .attr('class', styles.label)
      .attr('x', chart.height / 2)
      .attr('y', -85)
    yAxisRightLabel
      .append('tspan')
      .attr('x', chart.height / 2)
      .text('Vaccination coverage')
    yAxisRightLabel
      .append('tspan')
      .attr('x', chart.height / 2)
      .attr('dy', '1.2em')
      .text('(% of infants)')

    // add brush to slider
    let start
    const brush = d3
      .brushX()
      .extent([
        [0, chart.height],
        [chart.width, chart.height + chart.slider.height]
      ])
      .handleSize(12)

    // Set brush starting position to more recent datum and back 11 months,
    // inclusive.
    const getBrushStartPos = () => {
      // Get latest year of data from x2 domain
      const oldestYear = +x2.domain()[x2.domain().length - 1].split('/')[1]
      const oldestMonth = +x2.domain()[x2.domain().length - 1].split('/')[0]

      // Subtract back 11 months, adjusting year as needed;
      let startYear = oldestYear
      let startMonth = oldestMonth - 11

      if (startMonth <= 0) {
        startMonth += 12
        startYear -= 1
      }

      // Get xpos of start year from x2 domain and return it
      const brushStartXPos = x2(startMonth + '/' + startYear)
      // const brushStartXPos = x2(startMonth + '/' + startYear) + x2.step() / 2;
      return brushStartXPos
    }

    // Present day to Jan of 3 years ago
    // const getBrushStartPos = () => {
    //   // Get latest year of data from x2 domain
    //   const newYear = +(x2.domain()[x2.domain().length - 1].split('/')[1])
    //
    //   // Get oldest year of data from x2 domain
    //   const oldYear = +(x2.domain()[0].split('/')[1])
    //
    //   // Start year = latest year minus 3 or the oldest year if that's sooner
    //   const startYear = newYear - oldYear < 3 ? oldYear : newYear - 3;
    //
    //   // Get xpos of start year from x2 domain and return it
    //   const startYearXPos = x2('1/' + startYear);
    //   return startYearXPos;
    // };

    const gBrush = chart[styles.slider]
      .append('g')
      .attr('class', 'brush')
      .call(brush)

    // add brush handles (from https://bl.ocks.org/Fil/2d43867ba1f36a05459c7113c7f6f98a)
    var brushResizePath = function(d) {
      var e = +(d.type == 'e'),
        x = e ? 1 : -1,
        y = chart.slider.height * 0.75
      return (
        'M' +
        0.5 * x +
        ',' +
        y +
        'A6,6 0 0 ' +
        e +
        ' ' +
        6.5 * x +
        ',' +
        (y + 6) +
        'V' +
        (2 * y - 6) +
        'A6,6 0 0 ' +
        e +
        ' ' +
        0.5 * x +
        ',' +
        2 * y +
        'Z' +
        'M' +
        2.5 * x +
        ',' +
        (y + 8) +
        'V' +
        (2 * y - 8) +
        'M' +
        4.5 * x +
        ',' +
        (y + 8) +
        'V' +
        (2 * y - 8)
      )
    }

    var handle = gBrush
      .selectAll('.handle--custom')
      .data([{ type: 'w' }, { type: 'e' }])
      .enter()
      .append('path')
      .attr('class', 'handle--custom')
      .attr('cursor', 'ew-resize')
      .attr('d', brushResizePath)

    const overlayRects = gBrush
      .selectAll(styles.overlayRect)
      .data([1, 2])
      .enter()
      .append('rect')
      .attr('class', d => `${styles.overlayRect} ${styles['overlayRect-' + d]}`)
      .attr('height', chart.slider.height)
      .attr('x', 0)
      .attr('y', chart.height)
      .lower()

    brush
      // .on('start end', () => {
      //   console.log('was a start end')
      // })
      .on('brush start end', () => {
        if (
          d3.event.sourceEvent &&
          (d3.event.sourceEvent.type === 'brush' ||
            d3.event.sourceEvent.type === 'start' ||
            d3.event.sourceEvent.type === 'end')
        )
          return

        // Get current start/end positions of brush ([1, 2])
        const s = d3.event.selection || x2.range()

        // Show reset button if not default positions.
        if (chart.brushStartPos) {
          if (s[0] === chart.brushStartPos && s[1] === chart.width) {
            chart.params.setShowReset(false)
          } else {
            chart.params.setShowReset(true)
          }
        }

        const eachBand = x2.step()
        const indices = []
        let snapBrush = true
        const getDomainInvertVals = (val, i) => {
          // i is 0 if left handle, 1 if right
          // For left handle: ceil, right: floor

          // const roundFunc = Math.floor;
          const roundFunc = i === 0 ? Math.ceil : Math.floor

          // const frac = val / chart.width;
          // const nData = chart.data.vals.length;
          // let index = roundFunc(frac * nData);
          let index = roundFunc(val / eachBand)
          const exact = Math.abs(index - val / eachBand) <= 1e-6
          // const exact = Math.abs(index - (frac * nData)) <= 1e-6;

          if (index > chart.data.vals.length - 1) {
            index = chart.data.vals.length - 1
          } else if (exact && i === 1) {
            index = index - 1
          }
          // ALMOST worked
          // else if (exact && i === 0) index = index - 1;

          // TODO elegantly
          if (isNaN(index) || index < 0 || index >= chart.data.vals.length) {
            snapBrush = false
            return [0, 0]
          }

          // Push index to array for later use
          indices.push(index)
          return new Date(
            chart.data.vals[index]['date_time'].replace(/-/g, '/')
          )
        }

        // Update main chart x axis
        const invertedVals = s.map((d, i) => {
          return getDomainInvertVals(d, i)
        })
        x.domain(invertedVals)
        chart[styles['x-axis']].call(xAxis).call(wrapTimeLabels)

        // Reposition chart elements
        chart[styles.lineValue].selectAll('path').attr('d', d => line(d))
        chart[styles.lineVacc].selectAll('path').attr('d', d => lineVacc(d))

        const newVaccLineLabelX = x(vaccLineLabelXVal)

        const showVaccLineLabel = vaccLineLabelXVal < x.domain()[1]

        vaccLineLabel
          .selectAll('tspan')
          .attr('x', newVaccLineLabelX)
          .style('visibility', showVaccLineLabel ? 'visible' : 'hidden')

        // chart[styles.lineVacc].selectAll('circle'). attr('cx', d => {
        //   const tmpDt = new Date(d.date_time.replace(/-/g, '/'));
        //   return x(tmpDt);
        // });
        chart[styles.areaNull].selectAll('path').attr('d', d => area(d))

        // Store this position
        chart.params.brushPosPercent = [s[0] / chart.width, s[1] / chart.width]

        // Calculate total count to show in summary count metric
        const dataForSummary = chart.data.vals.slice(indices[0], indices[1] + 1)
        chart.params.setCountSummary(d3.sum(dataForSummary, d => d.value))

        chart.params.setCountSummaryDateRange(
          dataForSummary.length > 1
            ? Util.getDateTimeRange({ value: dataForSummary })
            : Util.getDatetimeStamp(dataForSummary[0], 'month')
        )

        // SNAP BRUSH POS
        // ALMOST works...

        const snapS = false
          ? [
              x2(
                `${invertedVals[0].getUTCMonth() +
                  1}/${invertedVals[0].getUTCFullYear()}`
              ),
              x2(
                `${invertedVals[1].getUTCMonth() +
                  1}/${invertedVals[1].getUTCFullYear()}`
              )
              // x2(`${invertedVals[1].getUTCMonth() + 1}/${invertedVals[1].getUTCFullYear()}`) + x2.step() * .99,
            ]
          : s

        if (snapBrush) gBrush.call(brush.move, snapS)

        // Adjust handle positions
        if (s == null) {
          handle.attr('display', 'none')
        } else {
          handle.attr('display', null).attr('transform', function(d, i) {
            return (
              'translate(' +
              [
                snapS[i] + 0.5 * Math.pow(-1, i),
                chart.height - chart.slider.height * 0.625
              ] +
              ')'
            )
          })
        }

        // Reposition overlay rects (to gray out bars outside the window)
        overlayRects
          .attr('width', function(d, i) {
            if (i === 0) return snapS[0]
            else return chart.width - snapS[1]
          })
          .attr('x', function(d, i) {
            if (i === 1) return snapS[1]
            else return 0
          })
      })

    chart.brushStartPos = getBrushStartPos()

    let initSelection
    if (chart.params.brushPosPercent && chart.params.onDefaultWindow !== true) {
      const xVals = [
        chart.params.brushPosPercent[0] * chart.width,
        chart.params.brushPosPercent[1] * chart.width
      ]
      gBrush.call(brush.move, xVals)
      initSelection = xVals
    } else {
      gBrush.call(brush.move, [chart.brushStartPos, chart.width])
      initSelection = [chart.brushStartPos, chart.width]
    }

    // Initialize show reset button
    if (
      chart.brushStartPos === initSelection[0] &&
      chart.width === initSelection[1]
    ) {
      chart.params.setShowReset(false)
    } else {
      chart.params.setShowReset(true)
    }

    // Define function for resetting the brush view to default values, which is
    // called by Detail.js if the reset button is clicked by the user.
    chart.resetView = function resetView() {
      gBrush.call(brush.move, [chart.brushStartPos, chart.width])
    }

    // Add tooltip line
    chart
      .newGroup(styles.tooltipLine)
      .append('line')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', 0)
      .attr('y2', chart.height)

    // create tooltip hover overlay
    chart
      .newGroup('tooltipOverlay')
      .append('rect')
      .attr('class', 'tooltipOverlay')
      .attr('x', 0)
      .attr('y', 0)
      .attr('data-tip', true)
      .attr('data-for', chart.params.tooltipClassName)
      .attr('width', chart.width)
      .attr('height', chart.height)
      .style('fill', 'transparent')
      .on('mouseover', function showTooltipLine() {
        chart[styles.tooltipLine]
          .select('line')
          .transition(500)
          .style('opacity', 1)
      })
      .on('mouseout', function hideTooltipLine() {
        chart[styles.tooltipLine]
          .select('line')
          .transition(500)
          .style('opacity', 0)
      })
      .on('mousemove', function tooltipLineUpdate() {
        // First, snap line to months
        const posXCursor = d3.mouse(this)[0]
        const xValCursor = x.invert(posXCursor)
        const xDateCursor = new Date(xValCursor)
        let xValLine, posXLine

        const nextMonth = Util.getLocalNextMonth(xDateCursor)
        const curMonth = Util.getLocalDate(xDateCursor)

        const isCloserToNextMonth =
          xDateCursor - curMonth > nextMonth - xDateCursor
        const isHoveredMonth = xDateCursor - curMonth === 0

        if (isHoveredMonth) {
          xValLine = new Date(xDateCursor)
        } else if (isCloserToNextMonth) {
          xValLine = nextMonth
        } else {
          xValLine = curMonth
        }
        posXLine = x(xValLine)
        chart[styles.tooltipLine]
          .select('line')
          .attr('x1', posXLine)
          .attr('x2', posXLine)

        // Then, get the vaccination and incidence data for this point.
        const xDateLine = new Date(xValLine)
        const xDateLineStrComponents = {
          year: xDateLine.getUTCFullYear().toString(),
          month:
            xDateLine.getUTCMonth() + 1 <= 9
              ? '0' + (xDateLine.getUTCMonth() + 1).toString()
              : (xDateLine.getUTCMonth() + 1).toString()
        }
        const xDateLineStr = `${xDateLineStrComponents.year}-${
          xDateLineStrComponents.month
        }`

        // Get the datum for each y axis (left and right)
        const yDatum = chart.data.vals.find(d =>
          d.date_time.startsWith(xDateLineStr)
        ) || {
          metric: chart.data.vals[0].metric,
          value: null,
          date_time: xDateLineStr
        }
        const y2Datum = chart.data.vaccVals.find(d =>
          d.date_time.startsWith(xDateLineStrComponents.year)
        ) || {
          metric: chart.data.vaccVals[0].metric,
          value: null,
          date_time: xDateLineStrComponents.year
        }

        const items = []
        ;[yDatum, y2Datum].forEach(itemDatum => {
          items.push(Util.getTooltipItem(itemDatum))
          // if (!itemDatum || itemDatum.value === null) {
          //     // Do placeholde datum
          //
          // }
          // else {
          //   items.push(
          //     Util.getTooltipItem(itemDatum)
          //   );
          // }
        })
        chart.params.setTooltipData({
          items: items
        })

        chart.params.setTooltipData({
          items: items
        })
      })

    // Reduce width at the end
    chart.svg.node().parentElement.classList.add(styles.drawn)

    // TODO build rest of chart

    // Update function: Change metric, basically redraw chart
    chart.update = metric => {
      if (chart.svg.node().parentElement === null) return
      chart.svg.node().parentElement.classList.remove(styles.drawn)
      chart.svg.html('')

      // Create new chart
      const newSlidingLineChart = new SlidingLine(
        // Selector of DOM element in Resilience.js component where the chart
        // should be drawn.
        '.' + stylesDetails.slidingLine,

        // Chart parameters consumed by Chart.js and ResilienceRadarChart.js,
        // defined above.
        chart.params
      )
      chart.params.setSlidingLine(newSlidingLineChart)

      ReactTooltip.rebuild()
    }
    chart.resize = () => {
      chart.update(chart.params.metric)
    }
  }
}

export default SlidingLine
