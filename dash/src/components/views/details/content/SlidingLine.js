import * as d3 from 'd3/dist/d3.min';
import Chart from "../../../chart/Chart.js";
import Util from "../../../misc/Util.js";
import styles from './slidingline.module.scss';
import stylesDetails from '../details.module.scss';


class SlidingLine extends Chart {

  constructor(
    selector,
    params = {}
  ) {

    super(selector, params);

    this.params = params;

    this.data = {};
    this.data.vals = params.data || []
    this.data.vaccVals = params.vaccData || []
    this.show = {}
    this.show.y = this.data.vals.length > 0;
    this.show.vacc = this.data.vaccVals.length > 0;

    this.setData = (metric) => {
      this.params.yMetricParams = Util.getMetricChartParams(metric);
      if (metric === 'caseload_totalpop') {
        this.data.vals = params.data.y;
      }
      else if (metric === 'incidence_monthly') {
        this.data.vals = params.data.y2;
      }
    };
    this.setData(this.params.metric)

    // Get min and max time from data.
    let minMaxData;
    if (this.data.vals.length > 0) {
      minMaxData = this.data.vals;

    } else if (this.data.vaccVals.length > 0) {
      // Get x domain from vacc data
      minMaxData = this.data.vaccVals;

    } else {
      // No line data at all, don't show line chart
    }

    if (minMaxData != undefined) {
      const minTime = new Date(
        minMaxData[0]['date_time'].replace(/-/g, '/')
      );
      const maxTime = new Date(
        minMaxData[minMaxData.length - 1]['date_time'].replace(/-/g, '/')
      );
      this.xDomainDefault = [minTime, maxTime];
    }

    // If no default xdomain, hide line chart
    if (this.xDomainDefault === undefined) {
      return;
    }

    // Get max incidence from data.
    // [ max, min ]
    this.yDomainDefault = [d3.max(this.data.vals, d => d.value) || 5, 0];

    // Adjust margins if not showing incidence or vaccination
    if (!this.show.vacc) {
      this.params.margin.right = 0;
    }

    // Adjust left margin to fit available space

    this.init();
    this.params.margin.left = this.fitLeftMargin(this.yDomainDefault);
    this.onResize(this);
    this.draw();
  }

  draw() {

    const chart = this;
    console.log('chart');
    console.log(chart);

    // Parameterize the slider
    chart.slider = {
      height: chart.height * .24,
    };

    chart.newGroup(styles.slider)
      .attr('transform', `translate(0, ${35})`);

    // Extend chart to accomodate slider
    const curHeight = chart.svg.attr('height');
    chart.svg.attr('height', (+curHeight) + chart.slider.height);

    // Create clipping path
    chart.svg.append('defs')
      .append('clipPath')
        .attr('id', 'plotArea')
        .append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', chart.width)
          .attr('height', chart.height);

    if (chart.data.vals.length < 1) {
      // TODO show "no data" message
      return
    }

    // x scale: Time - main chart
    // global min/max to start
    const x = d3.scaleTime()
      .domain(this.xDomainDefault) // min and max time vary w. window size
      .range([0, chart.width]);

    // x scale: Time - slider (via scale band)
    // TODO deal with time zone effects elegantly.
    const x2Domain = d3.timeMonths(
      new Date(chart.xDomainDefault[0]).setSeconds(1),
      new Date(chart.xDomainDefault[1]).setMonth(chart.xDomainDefault[1].getMonth() + 1)
    )
    .map(d => {
      return d.toLocaleString("en-US", {
        month: 'numeric',
        year: 'numeric',
        timeZone: "UTC"
      })
    });

    const x2 = d3.scaleBand()
      .domain(x2Domain) // never changes
      .range([0, chart.width])
      .paddingInner(0);

    // x axis: slider
    function onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }
    const tickValues = chart.data.vals
      .map(d => '1/' + new Date(d.date_time).getUTCFullYear()).filter(onlyUnique);
    const xAxis2 = d3.axisBottom()
      .tickSize(0)
      .tickValues(tickValues)
      .tickFormat((val) => val.replace('1/',''))
      .tickPadding(10)
      .scale(x2);

    const xAxisG2 = chart.newGroup(styles['x-axis-2'], chart[styles.slider])
      .attr('transform', `translate(0, ${chart.height + chart.slider.height})`)
      .call(xAxis2);

    // Time formatting
    var formatMillisecond = d3.timeFormat(".%L"),
    formatSecond = d3.timeFormat(":%S"),
    formatMinute = d3.timeFormat("%I:%M"),
    formatHour = d3.timeFormat("%I %p"),
    formatDay = d3.timeFormat("%a %d"),
    formatWeek = d3.timeFormat("%b %d"),
    formatMonth = d3.timeFormat("%b"),
    formatYear = d3.timeFormat("%Y");

    function multiFormat(date) {

      let format;
      if (d3.timeMonth(date) < date) {
        this.parentElement.remove();
      } else if (d3.timeYear(date) < date) {
        format = formatMonth(date);
      } else {
        format = formatYear(date);
      }
      return format;
    }

    // x axis - main chart
    const xAxis = d3.axisBottom()
      .tickSizeOuter(0)
      .ticks(7)
      .tickFormat(multiFormat)
      .scale(x);

    const xAxisG = chart.newGroup(styles['x-axis'])
      .attr('transform', `translate(0, ${chart.height})`)
      .call(xAxis);

    // y scale: incidence - main chart
    // Never changes
    const y = chart.y;

    // y scale: incidence - slider
    // Never changes
    const y2 = d3.scaleLinear()
      .domain(chart.yDomainDefault)
      .nice()
      .range([0, chart.slider.height])

    // y scale: vacc cov. - main chart
    // Never changes
    const yRight = d3.scaleLinear()
      .domain([100, 0])
      .range([0, chart.height])

    // y axis - main chart - left
    const yAxis = d3.axisLeft()
      .scale(y)
      .tickFormat((val) => {
        if (val === 0) {
          return 0;
        } else return y.tickFormat()(val);
      })
      .ticks(5)
      .tickSizeOuter(0)

    // Define line function - main chart
    const line = d3.line()
      .x(d => x(new Date(d.date_time.replace(/-/g, '/'))))
      .y(d => y(d.value));
    const lineVacc = d3.line()
      .x(d => x(new Date(d.date_time.replace(/-/g, '/'))))
      .y(d => yRight(d.value));

    // Define rectangle area function - main chart, nulls
    const area = d3.area()
    .x(d => x(
      new Date(d.date_time.replace(/-/g, '/'))
    ))
    .y0(chart.height)
		.y1(0);

    // Get "value" line segments -- all segments where data are available (not
    // null).
    const getValueLineSegments = () => {
      const valueLineSegments = [];
      let start, end, prev;
      let segment = [];
      chart.data.vals.forEach(datum => {

        // If no start and datum not-null, datum is start
        // If there was a previous datum, also include it
        if (!start && datum.value !== null) {
          start = datum;
          // if (prev) segment.push(prev);
          segment.push(datum);
          // console.log('If no start and datum not-null, datum is start')
          prev = datum;
          return;
        }
        // If no start and datum null, continue
        if (!start && datum.value === null) {
          // console.log('If no start and datum null, continue')
          prev = datum;
          return;
        }
        // If start and datum not-null, push to segment
        if (start && datum.value !== null) {
          segment.push(datum);
          // console.log('If start and datum not-null, push to segment')
          prev = datum;
          return;
        }
        // If start and datum null, push to segment, and start new one
        if (start && datum.value === null) {
          // segment.push(datum);
          start = undefined;
          valueLineSegments.push(segment);
          segment = [];
          // console.log('If start and datum null, push to segment, and start new one')
          prev = datum;
          return;
        }
        // console.log('Error: reached unreachable state');
      });

      if (segment.length > 0) {
        valueLineSegments.push(segment);
        segment = [];
      }
      return valueLineSegments;
    };

    // Add line to chart
    const valueLineSegments = getValueLineSegments();
    chart.newGroup(styles.lineValue)
      .selectAll('path')
      .data(valueLineSegments)
      .enter().append('path')
        .attr('d', d => line(d));

    // Add vaccination line to chart
    const formatVaccVals = () => {
      const output = [];
      const vals = chart.data.vaccVals;
      chart.data.vaccVals.forEach((v, i) => {

        // For first val do nothing special
        if (i === 0) {
          output.push(v);
          return
        }

        // For all other values, append the value, and also a fake point that
        // has the last point's value and this point's datetime.
        const fakePoint = {
          value: vals[i-1].value,
          date_time: v.date_time,
        };
        output.push(fakePoint);
        output.push(v);
        if (i === vals.length - 1) {
          const pointDt = new Date(v.date_time.replace(/-/g, '/'));
          const year = pointDt.getUTCFullYear();
          pointDt.setUTCFullYear(year + 1);
          const fakeDtStr = pointDt.toString();
          const fakeFuturePoint = {
            value: v.value,
            date_time: fakeDtStr,
          };
          output.push(fakeFuturePoint);
        }
      });

      return output;
    };

    // Get "value" line segments -- all segments where data are available (not
    // null).
    const getNullLineSegments = () => {
      const valueLineSegments = [];
      let start, end, prev;
      let segment = [];
      chart.data.vals.forEach(datum => {

        // If no start and datum not-null, datum is start
        // If there was a previous datum, also include it
        if (!start && datum.value === null) {
          start = datum;
          if (prev) segment.push(prev);
          segment.push(datum);
          // console.log('If no start and datum not-null, datum is start')
          prev = datum;
          return;
        }
        // If no start and datum null, continue
        if (!start && datum.value !== null) {
          // console.log('If no start and datum null, continue')
          prev = datum;
          return;
        }
        // If start and datum null, push to segment
        if (start && datum.value === null) {
          segment.push(datum);
          // console.log('If start and datum not-null, push to segment')
          prev = datum;
          return;
        }
        // If start and datum not-null, push to segment, and start new one
        if (start && datum.value !== null) {
          segment.push(datum);
          start = undefined;
          valueLineSegments.push(segment);
          segment = [];
          // console.log('If start and datum null, push to segment, and start new one')
          prev = datum;
          return;
        }
        // console.log('Error: reached unreachable state');
      });

      if (segment.length > 0) {
        // console.log('segment - ending')
        // console.log(segment)
        valueLineSegments.push(segment);
        segment = [];
        // console.log('If ending segment has values, push them')
      }
      // console.log('nullLineSegments')
      // console.log(valueLineSegments)
      return valueLineSegments;
    };

    // Add null areas to chart
    const nullLineSegments = getNullLineSegments();
    chart.newGroup(styles.areaNull)
      .selectAll('path')
      .data(nullLineSegments)
      .enter().append('path')
        .attr('d', d => area(d));

    const vaccLineData = formatVaccVals();
    chart.newGroup(styles.lineVacc)
      .selectAll('path')
      .data([vaccLineData])
      .enter().append('path')
        .attr('d', d => lineVacc(d));

    // Add rects to slider
    chart[styles.slider].selectAll('rect')
      .data(chart.data.vals)
      // .data(chart.data.vals.filter(d => d.value !== null)
      .enter().append('rect')
        .attr('x', d => {
          return x2(new Date(d['date_time'].replace(/-/g, '/')).toLocaleString("en-US", {
            month: 'numeric',
            year: 'numeric',
            timeZone: "UTC"
          }))
        })
        .attr('y', d => {
          const val = d.value !== null ? d.value : y2.domain()[0];
          return chart.height + (chart.slider.height - (chart.slider.height - y2(val)));
          // return chart.height + chart.slider.height;
        }) // TODO check
        .attr('width', x2.bandwidth()) // todo bands
        .attr('height', d => {
          const val = d.value !== null ? d.value : y2.domain()[0];
          return chart.slider.height - y2(val)
        })
        .attr('class', styles.sliderRect)
        .classed(styles.nullBar, d => d.value === null);

    const yAxisG = chart.newGroup(styles['y-axis'])
      .call(yAxis);

    // y axis - main chart - right
    const yAxisRight = d3.axisRight()
      .scale(yRight)
      .tickFormat((val) => Util.percentize(val))
      .tickValues([0, 25, 50, 75, 100])
      .tickSizeOuter(0)

    const yAxisGRight = chart.newGroup(styles['y-axis-right'])
      .attr('transform', `translate(${chart.width}, 0)`)
      .classed(styles['y-axis'], true)
      .call(yAxisRight)
      .classed(styles.invisible, !chart.show.vacc);

    const yAxisLeftYPos = this.labelShift;

    const yAxisLabel = chart[styles['y-axis']].append('text')
      .attr('class', styles.label)
      .attr('x', -chart.height / 2)
      .attr('y', yAxisLeftYPos)

    yAxisLabel.append('tspan')
    .attr('x', -chart.height / 2)
      .text(chart.params.metric === 'incidence_monthly' ? 'Monthly incidence of measles' : 'Total measles');
    yAxisLabel.append('tspan')
    .attr('x', -chart.height / 2)
      .attr('dy', '1.2em')
      .text(chart.params.metric === 'incidence_monthly' ? '(cases per 1M population)' : 'cases reported');

    const yAxisRightLabel = chart[styles['y-axis-right']].append('text')
      .attr('class', styles.label)
      .attr('x', chart.height / 2)
      .attr('y', -85)
    yAxisRightLabel.append('tspan')
    .attr('x', chart.height / 2)
      .text('Vaccination coverage');
    yAxisRightLabel.append('tspan')
    .attr('x', chart.height / 2)
      .attr('dy', '1.2em')
      .text('(% of infants)');

    // add brush to slider
    let start;
		const brush = d3.brushX()
  		.extent([[0, chart.height], [chart.width, chart.height + chart.slider.height]])
      .handleSize(12);

    const getBrushStartPos = () => {
      // Get latest year of data from x2 domain
      const newYear = +(x2.domain()[x2.domain().length - 1].split('/')[1])

      // Get oldest year of data from x2 domain
      const oldYear = +(x2.domain()[0].split('/')[1])

      // Start year = latest year minus 3 or the oldest year if that's sooner
      const startYear = newYear - oldYear < 3 ? oldYear : newYear - 3;

      // Get xpos of start year from x2 domain and return it
      const startYearXPos = x2('1/' + startYear);
      return startYearXPos;
    };


    const gBrush = chart[styles.slider].append('g')
  		.attr('class', 'brush')
  		.call(brush)

    // add brush handles (from https://bl.ocks.org/Fil/2d43867ba1f36a05459c7113c7f6f98a)
    var brushResizePath = function(d) {
        var e = +(d.type == "e"),
            x = e ? 1 : -1,
            y = (chart.slider.height * .75);
        return "M" + (.5 * x) + "," + y + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6) + "V" + (2 * y - 6) +
          "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y) + "Z" + "M" + (2.5 * x) + "," + (y + 8) + "V" + (2 * y - 8) +
          "M" + (4.5 * x) + "," + (y + 8) + "V" + (2 * y - 8);
    }

    var handle = gBrush.selectAll(".handle--custom")
      .data([{type: "w"}, {type: "e"}])
      .enter().append("path")
        .attr("class", "handle--custom")
        .attr("cursor", "ew-resize")
        .attr("d", brushResizePath);

    const overlayRects = gBrush.selectAll(styles.overlayRect)
      .data([1, 2])
      .enter().append('rect')
        .attr('class', d => `${styles.overlayRect} ${styles['overlayRect-' + d]}`)
        .attr('height', chart.slider.height)
        .attr('x', 0)
        .attr('y', chart.height)
        .lower();

    brush
		  .on('brush start end', () => {

      // Get current start/end positions of brush ([1, 2])
      const s = d3.event.selection || x2.range();

      // Show reset button if not default positions.
      if (chart.brushStartPos) {
        if (s[0] === chart.brushStartPos && s[1] === chart.width) {
          chart.params.setShowReset(false);
        } else {
          chart.params.setShowReset(true);
        }
      }

      if (s == null) {
        handle.attr("display", "none");
      } else {
        handle.attr("display", null).attr("transform", function(d, i) { return "translate(" + [ s[i] + .5*( Math.pow(-1,(i))), chart.height - chart.slider.height*.625] + ")"; });
      }

      const eachBand = x2.step();
      const getDomainInvertVals = (val) => {

        let index = Math.ceil((val / eachBand));
        if (index > chart.data.vals.length - 1) index = chart.data.vals.length - 1;
        // TODO elegantly
        if (isNaN(index) || index < 0 || index >= chart.data.vals.length) return [0,0];
        console.log('index = ' + index)
        return new Date (
          chart.data.vals[index]['date_time'].replace(/-/g, '/')
        );
      };


      // Update main chart x axis
      const invertedVals = s.map(d => {
        return getDomainInvertVals(d);
      });
			x.domain(invertedVals);
			chart[styles['x-axis']].call(xAxis);

      console.log('invertedVals')
      console.log(invertedVals)

      // Reposition overlay rects (to gray out bars outside the window)
      overlayRects
        .attr('width', function (d, i) {
          if (i === 0) return s[0];
          else return chart.width - s[1];
        })
        .attr('x', function (d, i) {
          if (i === 1) return s[1];
          else return 0;
        });

      // Reposition chart elements
			chart[styles.lineValue].selectAll('path'). attr('d', d => line(d));
			chart[styles.lineVacc].selectAll('path'). attr('d', d => lineVacc(d));
			chart[styles.areaNull].selectAll('path'). attr('d', d => area(d));

      // Store this position
      console.log('s')
      console.log(s)
      chart.params.brushPosPercent = [s[0]/chart.width, s[1]/chart.width];
		})
    chart.brushStartPos = getBrushStartPos();
    if (chart.params.brushPosPercent) {
      console.log('chart.params.brushPosPercent');
      console.log(chart.params.brushPosPercent);
      const xVals = [
        chart.params.brushPosPercent[0] * chart.width,
        chart.params.brushPosPercent[1] * chart.width,
      ];
      console.log('xVals')
      console.log(xVals)
      gBrush
        .call(brush.move, xVals);
    }
    else {
      gBrush
        .call(brush.move, [chart.brushStartPos, chart.width]);
    }

    // Define function for resetting the brush view to default values, which is
    // called by Detail.js if the reset button is clicked by the user.
    chart.resetView = function resetView () {
      gBrush
        .call(brush.move, [chart.brushStartPos, chart.width]);
    };

    // Add tooltip line
    chart.newGroup(styles.tooltipLine)
      .append('line')
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', 0)
        .attr('y2', chart.height);

    // create tooltip hover overlay
    chart.newGroup('tooltipOverlay')
      .append('rect')
        .attr('class', 'tooltipOverlay')
        .attr('x', 0)
        .attr('y', 0)
        .attr('data-tip', true)
        .attr('data-for', chart.params.tooltipClassName)
        .attr('width', chart.width)
        .attr('height', chart.height)
        .style('fill', 'transparent')
        .on('mouseover', function showTooltipLine () {
          chart[styles.tooltipLine]
            .select('line')
              .transition(500)
              .style('opacity', 1);
        })
        .on('mouseout', function hideTooltipLine () {
          chart[styles.tooltipLine]
            .select('line')
              .transition(500)
              .style('opacity', 0);
        })
        .on('mousemove', function tooltipLineUpdate () {

          // First, snap line to months
          const posXCursor = d3.mouse(this)[0];
          const xValCursor = x.invert(posXCursor);
          // console.log(xValCursor);
          const xDateCursor = new Date(xValCursor);
          let xValLine, posXLine;
          const nextMonth = d3.timeMonth(new Date(xDateCursor).setMonth(xDateCursor.getMonth() + 1));
          const isCloserToNextMonth = (xDateCursor - d3.timeMonth(xDateCursor)) > (nextMonth - xDateCursor);
          if (isCloserToNextMonth) {
            xValLine = nextMonth;
          } else {
            xValLine = d3.timeMonth(xDateCursor);
          }
          posXLine = x(xValLine);
          chart[styles.tooltipLine]
            .select('line')
              .attr('x1', posXLine)
              .attr('x2', posXLine);

          // Then, get the vaccination and incidence data for this point.
          const xDateLine = new Date(xValLine);
          const xDateLineStrComponents = {
            year: (xDateLine.getUTCFullYear()).toString(),
            month: (xDateLine.getUTCMonth() + 1) <= 9 ?  '0' + (xDateLine.getUTCMonth() + 1).toString() : (xDateLine.getUTCMonth() + 1).toString(),
          };
          const xDateLineStr = `${xDateLineStrComponents.year}-${xDateLineStrComponents.month}`;

          // Get the datum for each y axis (left and right)
          const yDatum = chart.data.vals.find(d => d.date_time.startsWith(xDateLineStr));
          const y2Datum = chart.data.vaccVals.find(d => d.date_time.startsWith(xDateLineStrComponents.year));

          const items = [];
          [
            yDatum,
            y2Datum,
          ].forEach(itemDatum => {
            if (!itemDatum || itemDatum.value === null) return;
            else {
              items.push(
                Util.getTooltipItem(itemDatum)
              );
            }
          });
          chart.params.setTooltipData(
            {
              items: items,
            }
          );

          chart.params.setTooltipData(
            {
              items: items
            }
          );
        });

    // Reduce width at the end
    chart.svg.node().parentElement.classList.add(styles.drawn);

    // TODO build rest of chart

    // Update function: Change metric, basically redraw chart
    chart.update = (metric) => {
      // Hide chart components
      chart.svg.node().parentElement.classList.remove(styles.drawn);
      chart.svg.remove();

      // Create new chart
      const newSlidingLineChart = new SlidingLine(

        // Selector of DOM element in Resilience.js component where the chart
        // should be drawn.
        '.' + stylesDetails.slidingLine,

        // Chart parameters consumed by Chart.js and ResilienceRadarChart.js,
        // defined above.
        chart.params,
      );
      console.log('newSlidingLineChart')
      console.log(newSlidingLineChart)
      chart.params.setSlidingLine(
        newSlidingLineChart
      );


    };
  }
}

export default SlidingLine;
