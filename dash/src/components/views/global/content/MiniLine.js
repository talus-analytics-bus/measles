import * as d3 from 'd3/dist/d3.min';
import Chart from "../../../chart/Chart.js";
import Util from "../../../misc/Util.js";
import styles from './miniline.module.scss';

class MiniLine extends Chart {

  constructor(
    selector,
    params = {}
  ) {

    super(selector, params);

    this.params = params;

    this.data = {};
    this.data.vals = params.data || []
    this.params.yMetricParams = Util.getMetricChartParams(this.data.vals[0].metric);

    if (this.data.vals.length > 0) {
      let minTime, maxTime;
      if (this.params.domain !== undefined) {
        minTime = new Date(this.params.domain[0]);
        maxTime = new Date(this.params.domain[1]);
      } else {
        minTime = new Date(
          this.data.vals[0]['date_time'].replace(/-/g, '/')
        );
        maxTime = new Date(
          this.data.vals[this.data.vals.length - 1]['date_time'].replace(/-/g, '/')
        );
      }

      // Add padding to x axis
      const usePadding = true;
      const maxTimeComponents = {
        month: maxTime.getUTCMonth(),
        date: maxTime.getUTCDate(),
      };
      if (usePadding) {
        minTime.setUTCFullYear(
           minTime.getUTCFullYear() - 1
        );
        minTime.setUTCMonth(
           12 - maxTimeComponents.month
        );
        minTime.setUTCDate(
           maxTimeComponents.date
        );
      }
      this.xDomainDefault = [
        minTime,
        maxTime,
      ];
    }

    // If no default xdomain, hide line chart
    if (this.xDomainDefault === undefined) {
      return;
    }

    // Get max incidence from data.
    // [ max, min ]
    this.yDomainDefault = [d3.max(this.data.vals, d => d.value) || 5, 0];

    const yTickFormatFunc = this.params.yMetricParams.tickFormat;

    // get incidence y-scale and y-axis
    this.init();
    this.y = d3.scaleLinear()
      .domain(this.yDomainDefault)
      .nice()
      .range([0, this.height]);

    this.yAxis = d3.axisLeft()
      .scale(this.y)
      .tickFormat((val) => {
        if (val === 0) {
          return 0;
        } else return yTickFormatFunc(val);
      })
      .ticks(2)
      .tickSizeOuter(0)
      .tickSizeInner(-this.width);

    if (this.params.yMetricParams.defaultTicks) {
      this.yAxis.tickValues(this.params.yMetricParams.defaultTicks);
    }

    this.params.margin.left = this.fitLeftMargin(this.yDomainDefault, false, true);
    this.onResize(this);
    this.draw();
  }

  draw() {

    const chart = this;
    console.log('chart');
    console.log(chart);

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
      .range([0, chart.width])
      .clamp(true);

    // y scale: incidence - main chart
    // Never changes
    const y = chart.y;

    // Define line function - main chart
    const line = d3.line()
      .x(d => x(new Date(d.date_time.replace(/-/g, '/'))))
      .y(d => y(d.value));


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
            this.parentElement.remove();
          } else {
            format = formatYear(date);
          }
          return formatYear(date);
        }

        // x axis - main chart
        const xAxis = d3.axisBottom()
          .tickSize(0)
          .ticks(4)
          .tickFormat(multiFormat)
          .tickPadding(10)
          .scale(x);

        const xAxisG = chart.newGroup(styles['x-axis'])
          .attr('transform', `translate(0, ${chart.height})`)
          .call(xAxis);

    // y scale: vacc cov. - main chart
    // Never changes
    const yRight = d3.scaleLinear()
      .domain([100, 0])
      .range([0, chart.height])

    const yAxis = chart.yAxis;

    const yAxisG = chart.newGroup(styles['y-axis'])
      .classed('y-axis', true)
      .call(yAxis);

    const yAxisLeftYPos = this.labelShift + 35;
    const yAxisLabel = chart[styles['y-axis']].append('text')
      .attr('class', styles.label)
      .attr('x', -chart.height / 2)
      .attr('y', yAxisLeftYPos)

    const labelData = Util.getWrappedText(
      chart.params.yMetricParams.label,
      22,
    );
    yAxisLabel.selectAll('tspan')
    .data(labelData)
    .enter().append('tspan')
      .attr('x', -chart.height / 2)
      .attr('dy', (d, i) => {
          if (labelData.length === 1) {
            return null;
          }
          else if (i === 0) {
            return -1 * labelData.length + 'em';
          }
          else {
            return '1em';
          }
        })
        .text(d => d);

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
        .attr('class', d => styles[d[0].metric])
        .attr('d', d => line(d));

    // Add points to chart
    if (chart.params.yMetricParams.temporal_resolution === 'yearly') {
      chart.newGroup(styles.pointValue)
      .selectAll('circle')
      .data(chart.data.vals)
      .enter().append('circle')
      .attr('class', d => `${styles.miniLinePoint} ${styles[d.metric]}`)
      .attr('cx', d => x(new Date(d.date_time.replace(/-/g, '/'))))
      .attr('cy', d => y(d.value))
      .attr('r', 5);
    }

    // Add tooltip line
    if (chart.params.setTooltipData !== undefined) {
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

          })
          .on('mouseout', function hideTooltipLine () {
            chart[styles.tooltipLine]
              .select('line')
                .classed(styles.visible, false);
            chart.params.setTooltipData(null);
          })
          .on('mousemove', function tooltipLineUpdate () {

            const snapToYear = chart.params.yMetricParams.temporal_resolution === 'yearly';

            let xValLine;
            if (snapToYear) {
              const posXCursor = d3.mouse(this)[0];
              const xValCursor = x.invert(posXCursor);
              const xDateCursor = new Date(xValCursor);
              const nextYear = d3.timeYear(new Date(xDateCursor).setUTCFullYear(xDateCursor.getUTCFullYear() + 1));
              const isCloserToNextYear = (xDateCursor - d3.timeYear(xDateCursor)) > (nextYear - xDateCursor);
              if (isCloserToNextYear) {
                xValLine = nextYear;
              } else {
                xValLine = d3.timeYear(xDateCursor);
              }
            }
            else {
              // First, snap line to months
              const posXCursor = d3.mouse(this)[0];
              const xValCursor = x.invert(posXCursor);
              const xDateCursor = new Date(xValCursor);

              const nextMonth = Util.getLocalNextMonth(xDateCursor);
              const curMonth = Util.getLocalDate(xDateCursor)

              const isCloserToNextMonth = (xDateCursor - curMonth) > (nextMonth - xDateCursor);
              const isHoveredMonth = (xDateCursor - curMonth) === 0;

              if (isHoveredMonth) {
                xValLine = new Date(xDateCursor);
              }
              else if (isCloserToNextMonth) {
                xValLine = nextMonth;
              }
              else {
                xValLine = curMonth;
              }
            }
            const posXLine = x(xValLine);

            // Then, get the vaccination and incidence data for this point.
            const xDateLine = new Date(xValLine);
            const xDateLineStrComponents = {
              year: (xDateLine.getUTCFullYear()).toString(),
              month: (xDateLine.getUTCMonth() + 1) <= 9 ?  '0' + (xDateLine.getUTCMonth() + 1).toString() : (xDateLine.getUTCMonth() + 1).toString(),
            };

            let xDateLineStr;
            if (snapToYear) {
              xDateLineStr = `${xDateLineStrComponents.year}`;
            }
            else {
              xDateLineStr = `${xDateLineStrComponents.year}-${xDateLineStrComponents.month}`;
            }

            const item = chart.data.vals.find(d => d.date_time.startsWith(xDateLineStr));
            const items = [];
            if (item && item.value !== null)
              items.push(
                Util.getTooltipItem(item)
              );

            // If there were data at this position, move the tooltip line there,
            // otherwise, do not change its position.
            if (items.length > 0) {
              chart[styles.tooltipLine]
                .select('line')
                  .attr('x1', posXLine)
                  .attr('x2', posXLine);

              chart[styles.tooltipLine]
                .select('line')
                  .classed(styles.visible, true);

              chart.params.setTooltipData(
                {
                  items: items
                }
              );
            }
          });
    }

    // Reduce width at the end
    chart.svg.node().parentElement.classList.add(styles.drawn);

    // TODO build rest of chart

    // Update function: Draw lines, add tooltips, etc.
    // Assumption: Data themselves do not change.
    chart.update = () => {

      // Draw incidence line (solid blue, no label)


      // Draw vaccination coverage line (dashed black, labeled, perhaps with
      // year every time it "steps" if we are zoomed in enough?)
      // TODO
    };
  }
}

export default MiniLine;
