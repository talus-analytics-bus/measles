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

    // Get grand total cases
    this.grandMaxSize = d3.max(this.data.vals.size, d => d.value);

    // Default margins
    if (!this.params.margin) {
      this.params.margin = {
        top: 68,
        right: 5,
        bottom: 80,
        left: 120,
      };
    }

    console.log('Doing scatter plot chart.')

    this.init();
    this.onResize(this);
    this.draw();
  }

  draw() {

    const chart = this;
    console.log('chart');
    console.log(chart);

    // Create clipping path
    const defs = chart.svg.append('defs');

    // Create shadow definition
    const filterDef = defs.append('filter')
      .attr('id','f1')
      .attr('x','0')
      .attr('y','0')
      .attr('width','200%')
      .attr('height','200%')
    filterDef.append('feOffset')
      .attr('result','offOut')
      .attr('in','SourceAlpha')
      .attr('dx','2')
      .attr('dy','2')
    filterDef.append('feGaussianBlur')
      .attr('result','blurOut')
      .attr('in','offOut')
      .attr('stdDeviation','2')
    filterDef.append('feBlend')
      .attr('in','SourceGraphic')
      .attr('in2','blurOut')
      .attr('mode','normal')

    if (chart.data.vals.length < 1) {
      // TODO show "no data" message
      return
    }

    // Define red color scale for bubbles
    const yColorScale = d3.scaleLinear()
      .domain([0, 1])
      .range(['#e6c1c6', '#9d3e4c']);

    const yColor = (val) => {
      if (val === null) return '#b3b3b3'; // no data color
      else return yColorScale(val);
    };

    // Define bubble size scale
    const r = d3.scaleLinear()
      .domain([0, 1])
      .range([5, 50])

    // const minR = 5;
    // const r = (val) => {
    //   return rTmp(val);
    // };

    // Define bubble label size scale
    const labelSize = (val) => {
      return r(val);
      // return (r(val) / 2) + 10;
    };

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

    // Add month and year label to center of plot
    const monthYearLabel = chart.newGroup(styles.monthYearLabel)
      .append('text')
        .attr('class', styles.monthYearLabel)
        .attr('x', chart.width/2)
        .attr('y', chart.height/2)
        .text('Aug 2019');

    // Add bubbles group (assume one datum per country). Enter one bubble for
    // each that we have pop data for, in the update function.
    const bubblesG = chart.newGroup(styles.bubbles);

    // Add avg vaccination coverage line
    const avgXLine = chart.newGroup('avgXLine')
      .append('line')
        .attr('class', styles.avgXLine)
        .attr('x1', x(.5))
        .attr('x2', x(.5))
        .attr('y1', y(0))
        .attr('y2', y(1)-31);

    // Add label for avg vaccination coverage line
    const avgXLineLabel = chart['avgXLine'].append('text')
      .attr('class', styles.avgXLineLabel)
      .attr('x', x(.5))
      .attr('y', y(1) - 56);
    const avgXLineLabelShift = -143/2;
    avgXLineLabel.append('tspan')
      .attr('x', x(.5))
      .attr('dx', avgXLineLabelShift)
      .text('Average coverage');
    avgXLineLabel.append('tspan')
      .attr('x', x(.5))
      .attr('dx', avgXLineLabelShift)
      .attr('dy', '1.2em')
      .text('across all countries');

    // Add y-axis label
    const yAxisLabel = chart[styles['y-axis']].append('text')
      .attr('y', -100)
      .attr('class', styles.label);

    yAxisLabel.append('tspan')
    .attr('x', -chart.height / 2)
      .text(Util.getScatterLabelData(chart.params.data.y[0]));

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

        // A: If this bubble is NOT null
        if (a.value_normalized.y !== null) {

          // And the other one is, then send the other to the back
          if (b.value_normalized.y === null) return 1;
        }

        // B: If this bubble is NOT null
        else if (b.value_normalized.y !== null) {

          // And the other one is, then send the other to the back
          if (a.value_normalized.y === null) return -1;
        }

        // If this bubble is has more pop
        else if (a.value_normalized.size > b.value_normalized.size) {
          return -1;
        } else return 1;
      };

      // Get month and year of data to show in scatter plot
      const yyyymmdd = Util.formatDatetimeApi(dt);
      const yyyymmddArr = yyyymmdd.split('-');
      const monthlyStr = `${yyyymmddArr[0]}-${yyyymmddArr[1]}`;
      const yearlyStr = `${yyyymmddArr[0]}`;

      // Get this data to bind
      // y data
      const yData = chart.data.vals.y.filter(d => {
        return d.date_time.startsWith(monthlyStr);
      });
      const yDataMax = d3.max(yData, d => d.value);
      yData.forEach(d => {
        if (d.value === null) d.value_normalized = null;
        else {
          d.value_normalized = d.value / yDataMax
        }
      });

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

      // size data - case count
      const sizeData = chart.data.vals.size.filter(d => {
        return d.date_time.startsWith(monthlyStr); // TODO elegantly
      });
      const sizeDataMax = d3.max(sizeData, d => d.value);
      sizeData.forEach(d => d.value_normalized = d.value / sizeDataMax );
      // sizeData.forEach(d => d.value_normalized = d.value / chart.grandMaxSize );

      // Collate data points
      const data = [];
      xData.forEach(xDatum => {
        const placeId = xDatum.place_id;
        // const xDatum = xData.find(d => d.place_id === placeId);
        const sizeDatum = sizeData.find(d => d.place_id === placeId);
        const yDatum = yData.find(d => d.place_id === placeId);
        if (yDatum && sizeDatum) {
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
      data
        .sort(sortBySize);

      // Update x-scale domain so that far left side corresponds to the
      // lowest normalized x value.
      const xMin = d3.min(data, d => d.value_normalized.x);
      x.domain([xMin, 1]);

      // Ditto for the lower limit of the y-scale
      const yMin = d3.min(data, d => d.value_normalized.y);
      y.domain([yMin, 1]);

      console.log('r - radius scale')
      console.log(r)

      // Enter new bubbles based on place_id if needed (pos and color)
      // Update existing bubbles by moving to new position and colors
      // Move average vaccination level line to new position
      const avgXLineVal = d3.mean(xData, d => d.value_normalized);
      avgXLine
        .transition()
        .duration(500)
          .attr('x1', x(avgXLineVal))
          .attr('x2', x(avgXLineVal));
      avgXLineLabel.selectAll('tspan')
        .transition()
        .duration(500)
          .attr('x', x(avgXLineVal))

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

      const getTextAnchor = (d) => {
        const xPos = getCircleXPos(d);
        const nearRightEdge = chart.width - xPos <= 25;
        const nearLeftEdge = xPos <= 25;
        if (nearRightEdge) return 'end';
        else if (nearLeftEdge) return 'start';
        else return 'middle';
      }

      const getTextDx = (d) => {
        const xPos = getCircleXPos(d);
        const nearRightEdge = chart.width - xPos <= 25;
        const nearLeftEdge = xPos <= 25;
        if (nearRightEdge) return r(d.value_normalized.size);
        else if (nearLeftEdge) return -1*r(d.value_normalized.size);
        else return 0;
      }

      // Enter new bubbles, update old
      console.log('data')
      console.log(data)
      bubblesG.selectAll('g')
        .attr('class', styles.bubbleG)
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
              .classed(styles.active, d => chart.params.activeBubble === d.place_id)
              .attr('data-tip', true)
              .attr('data-for', chart.params.tooltipClassName)
              .on('click', function toggleSelectBubble (d) {
                const thisG = d3.select(this);
                const thisBubble = thisG.select('circle');
                const activateBubble = !thisG.classed(styles.active);
                bubblesG.selectAll('g')
                  .classed(styles.active, false)
                  .selectAll('circle')
                    .attr('filter', 'none');
                if (activateBubble) {
                  chart.params.activeBubbleId = d.place_id;
                  thisG.classed(styles.active, true);
                  thisBubble.attr('filter', 'url(#f1)');
                } else {
                  chart.params.activeBubbleId = -9999;
                }

                bubblesG.selectAll('g')
                .sort(function bubbleSort (a, b) {

                  // If this is the active bubble, bring it to the front.
                  if (activateBubble && a.place_id === d.place_id) return 1;
                  else if (activateBubble && b.place_id === d.place_id) return -1;

                  // A: If this bubble is NOT null
                  else if (a.value_normalized.y !== null) {

                    // And the other one is, then send the other to the back
                    if (b.value_normalized.y === null) return 1;
                  }

                  // B: If this bubble is NOT null
                  else if (b.value_normalized.y !== null) {

                    // And the other one is, then send the other to the back
                    if (a.value_normalized.y === null) return -1;
                  }

                  // If this bubble is has more pop
                  else if (a.value_normalized.size > b.value_normalized.size) {
                    return -1;
                  } else return 1;
                })

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
                chart.params.setTooltipData(
                  {
                    name: d.place_name,
                    items: items,
                  }
                );
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
                .attr('dy', d => (-1 * r(d.value_normalized.size)) - 2)
                .attr('dx', d => getTextDx(d))
                .style('text-anchor', d => getTextAnchor(d))
                .style('font-size', d => labelSize(d.value_normalized.size))

            circleLabels
              .each(function appendTSpans (d) {

                const circleLabelTspans = Util.getWrappedText(d.place_name, 20);

                // Append one tspan per line
                d3.select(this).selectAll('tspan')
                  .data(circleLabelTspans)
                  .enter().append('tspan')
                    .attr('x', 0)
                    .attr('dy', (d, i) => {
                      if (circleLabelTspans.length === 1) {
                        return null;
                      }
                      else if (i === 0) {
                        return -1 * circleLabelTspans.length + 'em';
                      }
                      else {
                        return '1em';
                      }

                    })
                    .text(d => d);
              });


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
              .classed(styles.active, d => chart.params.activeBubbleId === d.place_id)
              .transition()
              .duration(2000)
                .attr('transform',
                  d => `translate(${
                    getCircleXPos(d)
                  }, ${
                    getCircleYPos(d)
                  })`
                );

            const updatedBubbleGs = update
            // .data(data, d => d.place_id)
              .each(function(d) {

              const updatedText = d3.select(this).select('text')
                .transition()
                .duration(2000)
                  .attr('dy', (-1 * r(d.value_normalized.size)) - 2)
                  .attr('dx', getTextDx(d))
                  .style('font-size', labelSize(d.value_normalized.size))
                  .style('text-anchor', getTextAnchor(d));
              });

            update.selectAll('circle')
              .data(data, d => d.place_id)
                .transition()
                .duration(2000)
                  .style('opacity', 1)
                  .attr('fill', d => yColor(d.value_normalized.y))
                  .attr('r', d => r(d.value_normalized.size));

            // update.selectAll('text')
            //   .data(data, d => d.place_id)
            //     .transition()
            //     .duration(2000)
            //       .attr('dy', d => (-1 * r(d.value_normalized.size)) - 2)
            //       .attr('dx', d => getTextDx(d))
            //       .style('font-size', d => labelSize(d.value_normalized.size))
            //       .style('text-anchor', d => getTextAnchor(d));
          },
          exit => {
            exit.remove();
          },
        );

      // Keep bubbles below other chart elements, except month year label.
      bubblesG.lower();
      chart['avgXLine'].lower();
      chart[styles.monthYearLabel].lower();

      // Update axis labels
      const monthYearLabelString = dt.toLocaleString('en-us', {
        month: 'short',
        year: 'numeric',
        timeZone: 'utc',
      });

      monthYearLabel.text(monthYearLabelString);
      yAxisLabel.select('tspan:nth-child(2)')
        .text(`in ${monthYearLabelString} (relative)`);
      xAxisLabel.select('tspan:nth-child(2)')
        .text(`in ${xDataYearlyStr} (relative)`);
    };

    // Call update function, using most recent dt of data as the initial
    // selection.
    const nData = chart.data.vals.y.length;
    const initDt = Util.getUTCDate(
      new Date(
        chart.data.vals.y[nData - 1].date_time.replace(/-/g, '/')
      )
    );

    chart.update(initDt);

    // Reduce width at the end
    chart.svg.node().parentElement.classList.add(styles.drawn);
  }
}

export default Scatter;
