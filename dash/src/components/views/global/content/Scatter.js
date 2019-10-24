import * as d3 from 'd3/dist/d3.min';
import Chart from "../../../chart/Chart.js";
import Util from "../../../misc/Util.js";
import styles from './scatter.module.scss';

class Scatter extends Chart {

  constructor(
    selector,
    params = {}
  ) {

    super(selector, params);

    this.params = params;

    this.data = {vals: {}};
    this.data.vals.x = params.data.x || [];
    this.data.vals.y = params.data.y || [];
    this.data.vals.size = params.data.size || [];

    // Default margins
    if (!this.params.margin) {
      this.params.margin = {
        top: 40,
        right: 0,
        bottom: 80,
        left: 120, // +40
      };
    }

    this.init();
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

    // Define red color scale for bubbles
    const yColor = d3.scaleLinear()
      .domain([0, 1])
      .range(['#d89da5', '#9d3e4c']);

    // Define bubble size scale
    const r = d3.scaleLinear()
      .domain([0, 1])
      .range([5, 50]) // heuristic for max bubble size

    // Define x scale - vaccination coverage
    const x = d3.scaleLinear()
      .domain([0, 1])
      .range([0, chart.width]);

    // Define x axis - vaccination coverage
    const xAxis = d3.axisBottom()
      .tickSize(0)
      .tickPadding(10)
      .tickValues([0, 1])
      .tickFormat(function (val) {
        if (val === 0) {
            return '';
        }
        if (val === 1) return '';
        else this.remove();
      })
      .scale(x);
    const xAxisG = chart.newGroup(styles['x-axis'])
      .call(xAxis)
      .attr('transform', `translate(0, ${chart.height})`);

    // Define y scale - incidence
    const y = d3.scaleLinear()
      .domain([0, 1])
      .range([chart.height, 0]); // TODO check

    // Define y axis - incidence
    const yAxis = d3.axisLeft()
      .tickSize(0)
      .tickPadding(10)
      .tickValues([0, 1])
      .tickFormat(function (val) {
        if (val === 0) return '';
        if (val === 1) return '';
        else this.remove();
      })
      .scale(y);
    const yAxisG = chart.newGroup(styles['y-axis'])
      .call(yAxis);

      // Update xaxis tick labels
      chart[styles['x-axis']]
        .selectAll('g.tick')
        .each(function addXTickText (d, i) {
          const tickLabel = d3.select(this).select('text');
          if (i === 0) {
            tickLabel
              .attr('text-anchor', 'start');
            tickLabel
              .append('tspan')
                .attr('x', 0)
                .text('Lowest');
            tickLabel
              .append('tspan')
                .attr('dy', '1.1em')
                .attr('x', 0)
                .text('coverage');
          }
          else if (i === 1) {
            tickLabel
              .attr('text-anchor', 'end');
            tickLabel
              .append('tspan')
                .attr('x', 0)
                .text('Highest');
            tickLabel
              .append('tspan')
                .attr('dy', '1.1em')
                .attr('x', 0)
                .text('coverage');
          }
        });
      chart[styles['y-axis']]
        .selectAll('g.tick')
        .each(function addYTickText (d, i) {
          const tickLabel = d3.select(this).select('text');
          if (i === 0) {
            tickLabel
              .attr('text-anchor', 'end')
              .attr('y', '-2.3em')
              .attr('dy', 0)
            tickLabel
              .append('tspan')
                .attr('x', -10)
                .attr('dy', '1.1em')
                .text('Lowest');
            tickLabel
              .append('tspan')
                .attr('dy', '1.1em')
                .attr('x', -10)
                .text('incidence');
          }
          else if (i === 1) {
            tickLabel
              .attr('text-anchor', 'end')
              .attr('y', '-.35em')
              .attr('dy', 0)
            tickLabel
              .append('tspan')
                .attr('x', -10)
                .attr('dy', '1.1em')
                .text('Highest');
            tickLabel
              .append('tspan')
                .attr('dy', '1.1em')
                .attr('x', -10)
                .text('incidence');
          }
        });

    // Add x axis label
    // Add y axis label

    // Add bubbles group (assume one datum per country). Enter one bubble for
    // each that we have pop data for, in the update function.
    const bubblesG = chart.newGroup('bubbles');

    // Add avg vaccination coverage line
    const avgXLine = chart.newGroup('avgXLine')
      .append('line')
        .attr('class', styles.avgXLine)
        .attr('x1', x(.5))
        .attr('x2', x(.5))
        .attr('y1', y(0))
        .attr('y2', y(1));

    // Add y-axis label
    const yAxisLabel = chart[styles['y-axis']].append('text')
      .attr('y', -100)
      .attr('class', styles.label);

    yAxisLabel.append('tspan')
    .attr('x', -chart.height / 2)
      .text('Monthly incidence of measles');
    yAxisLabel.append('tspan')
    .attr('x', -chart.height / 2)
      .attr('dy', '1.2em')
      .text('(relative)');

    // Add x-axis label
    const xAxisLabel = chart[styles['x-axis']].append('text')
      .attr('x', chart.width / 2)
      .attr('y', chart.margin.bottom - 20)
      .attr('class', styles.label);

    xAxisLabel.append('tspan')
      .attr('x', chart.width / 2)
      .text('Vaccination coverage');

    xAxisLabel.append('tspan')
      .attr('x', chart.width / 2)
      .attr('dy', '1.2em')
      .text('(relative)');

    // TODO - Exclude "global" bubble.
    //

    // TODO build rest of chart

    // Update function: Draw lines, add tooltips, etc.
    // Called: Every time the month/year slider is changed.
    chart.update = (dt) => {
      const sortBySize = (a, b) => {
        if (a.value_normalized.size > b.value_normalized.size) return -1;
        else if (a.value_normalized.size < b.value_normalized.size) return 1;
        else return 0;
      };
      // Get month and year of data to show in scatter plot
      const yyyymmdd = Util.formatDatetimeApi(dt);
      const yyyymmddArr = yyyymmdd.split('-');
      const monthlyStr = `${yyyymmddArr[0]}-${yyyymmddArr[1]}`;
      const yearlyStr = `${yyyymmddArr[0]}`;

      console.log('Updating data')
      // Get this data to bind
      // y data
      const yData = chart.data.vals.y.filter(d => {
        return d.date_time.startsWith(monthlyStr);
      });
      const yDataMax = d3.max(yData, d => d.value);
      yData.forEach(d => d.value_normalized = d.value / yDataMax );

      // x data - use most recent available
      let xDataYearlyStr = yearlyStr;
      let foundXData = false;
      let xData;
      while (!foundXData) {
        xData = chart.data.vals.x.filter(d => {
          return d.date_time.startsWith(xDataYearlyStr);
        });
        if (xData.length > 0) foundXData = true;
        else xDataYearlyStr = ((+xDataYearlyStr)-1).toString();
      }

      const xDataMax = d3.max(xData, d => d.value);
      xData.forEach(d => d.value_normalized = d.value / xDataMax );

      // size data
      const sizeData = chart.data.vals.size.filter(d => {
        return d.date_time.startsWith(yearlyStr);
      });
      const sizeDataMax = d3.max(sizeData, d => d.value);
      sizeData.forEach(d => d.value_normalized = d.value / sizeDataMax );

      // Collate data points
      const data = [];
      sizeData.forEach(sizeDatum => {
        const placeId = sizeDatum.place_id;
        const xDatum = xData.find(d => d.place_id === placeId);
        const yDatum = yData.find(d => d.place_id === placeId);
        if (yDatum && xDatum) {
          data.push(
            {
              value_normalized: {
                x: xDatum.value_normalized,
                y: yDatum.value_normalized,
                size: sizeDatum.value_normalized,
              },
              place_id: placeId,
              place_name: xDatum.place_name,
              date_time: yDatum.date_time,
              xDatum: xDatum,
              yDatum: yDatum,
              sizeDatum: sizeDatum,
            }
          );
        }
      });

      // Sort data by size so that largest circles are in the back.
      data.sort(sortBySize);

      // Update x-scale domain so that far left side corresponds to the
      // lowest normalized x value.
      const xMin = d3.min(data, d => d.value_normalized.x);
      x.domain([xMin, 1]);

      // Ditto for the lower limit of the y-scale
      const yMin = d3.min(data, d => d.value_normalized.y);
      y.domain([yMin, 1]);

      // Enter new bubbles based on place_id if needed (pos and color)
      // Update existing bubbles by moving to new position and colors
      // Move average vaccination level line to new position
      const avgXLineVal = d3.mean(xData, d => d.value_normalized);
      avgXLine
        .transition()
        .duration(500)
          .attr('x1', x(avgXLineVal))
          .attr('x2', x(avgXLineVal));

      // Move circle off edge of chart, x-axis
      const getCircleXPos = (d) => {
        // If x-pos is with r units of chart width, then shift it to a value
        // equal to chart width minus r
        const xPosDesired = x(d.value_normalized.x);
        const curR = r(d.value_normalized.size);
        let xPosFinal = xPosDesired;
        if (chart.width - xPosDesired <= curR) {
          xPosFinal = chart.width - curR;
        }

        // Similarly, don't let x pos hang circle off left side of plot
        else if (xPosDesired - curR < 0) {
          xPosFinal = curR;
        }
        return xPosFinal;
      };

      const getCircleYPos = (d) => {
        const yPosDesired = y(d.value_normalized.y);
        const curR = r(d.value_normalized.size);
        let yPosFinal = yPosDesired;
        if (yPosDesired + curR > chart.height) {
          yPosFinal = chart.height - curR;
        }

        // Similarly, don't let y pos hang circle off left side of plot
        else if (yPosDesired - curR < 0) {
          yPosFinal = curR;
        }
        return yPosFinal;
      };

      // Enter new bubbles, update old
      bubblesG.selectAll('g')
        .data(data, d => d.place_id)
        .join(
          enter => {
            const newCircleGs = enter.append('g')
              .attr('transform',
                d => `translate(${
                  getCircleXPos(d)
                }, ${
                  chart.height - r(d.value_normalized.size)
                })`
              )
              newCircleGs
              .append('circle')
                .attr('class', styles.scatterCircle)
                .attr('data-tip', true)
                .attr('data-for', chart.params.tooltipClassName)
                .style('opacity', 0)
                .attr('fill', yColor(0))
                .attr('r', d => r(0))
                .on('click', function toggleSelectBubble (d) {
                  const thisBubble = d3.select(this);
                  const activateBubble = !thisBubble.classed(styles.active);
                  bubblesG.selectAll('circle')
                    .classed(styles.active, false);
                  if (activateBubble) {
                    thisBubble.classed(styles.active, true);
                  }

                  // Make name label visible
                })
                .on('mouseenter', function showBubbleTooltip (d) {
                  const items = [];
                  [
                    'yDatum',
                    'xDatum',
                    'sizeDatum',
                  ].forEach(itemName => {
                    items.push(
                      Util.getTooltipItem(d[itemName])
                    );
                  });
                  console.log('items')
                  console.log(items)
                  chart.params.setTooltipData(
                    {
                      name: d.place_name,
                      items: items,
                    }
                  );
                })
                // .append('text')
                //   .text(d => d.place_name);

            newCircleGs
              .transition()
              .duration(2000)
                .attr('transform',
                  d => `translate(${
                    getCircleXPos(d)
                  }, ${
                    getCircleYPos(d)
                  })`
                );

            newCircleGs.selectAll('circle')
              .transition()
              .duration(2000)
                .style('opacity', 1)
                .attr('fill', d => yColor(d.value_normalized.y))
                .attr('r', d => r(d.value_normalized.size));
          },
          update => {
            update
              .transition()
              .duration(2000)
                .attr('transform',
                  d => `translate(${
                    getCircleXPos(d)
                  }, ${
                    getCircleYPos(d)
                  })`
                );

            update.selectAll('circle')
              .data(data, d => d.place_id)
                .style('opacity', 1)
                .attr('fill', d => yColor(d.value_normalized.y))
                .attr('r', d => r(d.value_normalized.size));
          },
          exit => {
            exit.remove();
          },
        );

      // Keep bubbles below other chart elements.
      bubblesG.lower();

      // Update axis labels
      const monthYearLabelString = dt.toLocaleString('en-us', {
        month: 'short',
        year: 'numeric',
        timeZone: 'utc',
      });
      // const yearLabelString = dt.toLocaleString('en-us', {
      //   year: 'numeric',
      //   timeZone: 'utc',
      // });

      yAxisLabel.select('tspan:nth-child(2)')
        .text(`in ${monthYearLabelString} (relative)`);
      xAxisLabel.select('tspan:nth-child(2)')
        .text(`in ${xDataYearlyStr} (relative)`);
    };

    // Call update function, using most recent dt of data as the initial
    // selection.
    const nData = chart.data.vals.y.length;
    const initDt = new Date(
      chart.data.vals.y[nData - 1].date_time.replace(/-/g, '/')
    );
    chart.update(initDt);

    // TEST: Every second, go back in time by one month
    const chartDebugTest = () => {
      let prevDt = initDt;
      for (let i = 0; i < 36; i++) {
        const curDt = new Date(
          prevDt
        );
        curDt.setUTCMonth(curDt.getUTCMonth() - 1);
        setTimeout(() => {
          chart.update(curDt);
        }, 3000*i);
        prevDt = curDt;
      }
    };
    // setTimeout(chartDebugTest, 3000);
    //
    // chart.play = (nSteps) => {
    //   let prevDt = initDt;
    //   for (let i = 0; i < nSteps; i++) {
    //     const curDt = new Date(
    //       prevDt
    //     );
    //     curDt.setUTCMonth(curDt.getUTCMonth() + 1);
    //     setTimeout(() => {
    //       chart.update(curDt);
    //     }, 3000*i);
    //     prevDt = curDt;
    //   }
    // };
  }
}

export default Scatter;
