import * as d3 from 'd3/dist/d3.min';
import Chart from "../../../chart/Chart.js";
import Util from "../../../misc/Util.js";
import styles from './slidingline.module.scss';


class SlidingLine extends Chart {
  constructor(
    selector,
    params = {}
  ) {

    super(selector, params);

    this.params = params;

    this.data = {
      vals: null,
      vaccVals: null,
    };
    this.data.vals = params.data
    this.data.vaccVals = params.vaccData || null
      // .filter(d => d.value);

    // Get min and max time from data.
    const minTime = new Date(
      this.data.vals[0]['date_time'].replace(/-/g, '/')
    );
    const maxTime = new Date(
      this.data.vals[this.data.vals.length - 1]['date_time'].replace(/-/g, '/')
    );

    // [ min, max ]
    this.xDomainDefault = [minTime, maxTime];

    // Get max incidence from data.
    // [ max, min ]
    this.yDomainDefault = [d3.max(this.data.vals, d => d.value), 0];

    this.init();
  }

  draw() {

    const chart = this;
    console.log('chart');
    console.log(chart);

    // Create clipping path
    // <defs>
    //   <clipPath id="cut-off-bottom">
    //     <rect x="0" y="0" width="200" height="500" />
    //   </clipPath>
    // </defs>
    //
    chart.svg.append('defs')
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
    const x = d3.scaleTime()
      .domain(this.xDomainDefault) // min and max time vary w. window size
      .range([0, chart.width])
      .clamp(true); // always fixed

    // x axis - main chart
    const xAxis = d3.axisBottom()
      .tickSizeOuter(0)
      .scale(x);
    const xAxisG = chart.newGroup(styles['x-axis'])
      .attr('transform', `translate(0, ${chart.height})`)
      .call(xAxis);

    // y scale: incidence - main chart
    // Never changes
    const y = d3.scaleLinear()
      .domain(chart.yDomainDefault)
      .nice()
      .range([0, chart.height])

    // y scale: vacc cov. - main chart
    // Never changes
    const yRight = d3.scaleLinear()
      .domain([100, 0])
      .range([0, chart.height])

    // y axis - main chart - left
    const yAxis = d3.axisLeft()
      .scale(y)
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
          if (prev) segment.push(prev);
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
        // console.log('segment - ending')
        // console.log(segment)
        valueLineSegments.push(segment);
        segment = [];
        // console.log('If ending segment has values, push them')
      }
      // console.log('valueLineSegments')
      // console.log(valueLineSegments)
      return valueLineSegments;
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
        // If start and datum not-null, push to segment
        if (start && datum.value === null) {
          segment.push(datum);
          // console.log('If start and datum not-null, push to segment')
          prev = datum;
          return;
        }
        // If start and datum null, push to segment, and start new one
        if (start && datum.value !== null) {
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
        const vaccLineData = formatVaccVals();
        chart.newGroup(styles.lineVacc)
          .selectAll('path')
          .data([vaccLineData])
          .enter().append('path')
            .attr('d', d => lineVacc(d));

    // Add line to chart
    const valueLineSegments = getValueLineSegments();
    chart.newGroup(styles.lineValue)
      .selectAll('path')
      .data(valueLineSegments)
      .enter().append('path')
        .attr('d', d => line(d));

    // Add null areas to chart
    const nullLineSegments = getNullLineSegments();
    chart.newGroup(styles.areaNull)
      .selectAll('path')
      .data(nullLineSegments)
      .enter().append('path')
        .attr('d', d => area(d));

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
          .call(yAxisRight);

    // Add axis labels
    // TODO make y-axis label not clash with tick labels
    chart[styles['y-axis']].append('text')
      .attr('class', styles.label)
      .attr('x', -chart.height / 2)
      .attr('y', -chart.margin.left + 15)
      .text('Monthly incidence of measles');

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

    // Reduce width at the end
    chart.svg.node().parentElement.classList.add(styles.drawn);

    // TODO build rest of chart

    // Update function: Draw lines, add tooltips, etc.
    // Assumption: Data themselves do not change.
    chart.update = () => {
      console.log('chart.update()');

      // Draw incidence line (solid blue, no label)


      // Draw vaccination coverage line (dashed black, labeled, perhaps with
      // year every time it "steps" if we are zoomed in enough?)
      // TODO
    };
  }
}

export default SlidingLine;
