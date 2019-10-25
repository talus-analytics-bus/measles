import * as d3 from 'd3/dist/d3.min';
import Chart from "../../../chart/Chart.js";
import Util from "../../../misc/Util.js";
import styles from './pagingbar.module.scss';

class PagingBar extends Chart {

  constructor(
    selector,
    params = {}
  ) {

    super(selector, params);

    this.params = params;

    this.setData = (view) => {
      this.data = {vals: {}};
      this.params.view = view;
      this.xMetricParams = Util.getMetricChartParams(view);

      const setXData = () => {
        // If current view is "total cases reported", show y, otherwise show y2
        // which is vaccination coverage.
        if (view === 'cumcaseload_totalpop') {
          this.data.vals.x = params.data.y || [];
        }
        else if (view === 'coverage_mcv1_infant') { // most recent vaccinatin cov. val.
          console.log('Doing vacc')
          this.data.vals.x = params.data.y2 || [];
        }
        else {
          console.log('[Error] Unrecognized view: ' + view + '. Using y series.')
          this.data.vals.x = params.data.y || [];
        }

        this.data.vals.x.filter(v => v.value !== null)
      };

      const setYData = () => {
        // y data are place names, ids, and isos for all countries in data.
        this.data.vals.y = this.data.vals.x
          .map(v => {
            return {
              place_id: v.place_id,
              place_name: v.place_name,
              place_iso: v.place_iso,
            };
          });
      };

      const setBarData = () => {
        // Define chart bar data
        this.data.bars = [];
        this.data.vals.x.forEach(xDatum => {
          const yDatum = this.data.vals.y.find(y => y.place_id === xDatum.place_id);
          if (yDatum) {
            this.data.bars.push(
              {
                ...yDatum,
                value: xDatum.value,
                join_id: yDatum.place_name + '-' + view,
              }
            );
          }
        });

      // TODO remove data not for the time period we need
      // Sort data by descending value and assign page numbers
      this.params.pageLength = 15;
      const sortFunc = Util.sortByField('value');
      this.data.bars
        .sort(sortFunc);

      // Flip order if sort is reverse
      if (this.xMetricParams.sort === 'asc') this.data.bars.reverse();

      this.data.bars
        .forEach((v, i) => {
          v.page = Math.floor(i / this.params.pageLength); // 0-indexed count
        });

        // Set page count so that page buttons are rendered.
        const pageCount = Math.floor(this.data.bars.length / this.params.pageLength) + 1;
        this.params.setPageCount(pageCount);
      };

      // Define x, y, and bar data series.
      setXData();
      setYData();
      setBarData();
    };
    this.setData('cumcaseload_totalpop'); // PLACEHOLDER

    // Get longest bar value label with and set margin to this value, in case
    // it is hanging off the right size of the chart.
    const barValueLabels = this.data.bars.map(d => Util.comma(d.value));
    const longestBarValueWidth =
      this.getLongestLabelWidth(
        barValueLabels, // list of labels
        '1em', // font-size
        true // bold
      );

    // Default margins
    if (!this.params.margin) {
      this.params.margin = {
        top: 47,
        right: longestBarValueWidth + 5,
        bottom: 20,
        left: 200,
      };
    }


    this.init();
    // set left margin based on the longest country name included.
    const yLabels = this.data.bars.map(d => d.place_name);
    this.params.margin.left = this.fitLeftMargin(yLabels, true) + 20;
    this.onResize(this);
    this.draw();
  }

  draw() {

    const chart = this;
    const yLabelShift = 20;
    console.log('chart - redrawing everything - mvm');
    console.log(chart);

    // Draw bars
    const barGs = chart.newGroup(styles.barGs);

    // x scale = cases or incidence
    // Calculate x domain max.
    const maxX = d3.max(chart.data.bars, d => d.value);

    // Set domain in update function
    const x = d3.scaleLinear()
      .range([0, chart.width])
      .domain([0, maxX])
      .nice();

    // Define red color scale for bubbles
    let xColor = Util.getColorScaleForMetric(chart.params.view, [0, maxX]);

    const xAxis = d3.axisTop()
      .scale(x)
      .ticks(5)
      .tickFormat(chart.xMetricParams.tickFormat);

    const xAxisG = chart.plotAxisReact(
      styles,
      xAxis,
      'x',
    );

    // y scale = country
    // Set domain in update function
    const y = d3.scaleBand()
      .range([0, chart.height])
      .padding(0.3);

    const yAxis = d3.axisLeft()
      .tickPadding(40)
      .tickSizeInner(0)
      .tickFormat(function (val) {
        if (val[0] === '_') return '';
        else {
          this.dataset.name = val;
          return val;
        }
      })
      .scale(y);

    const yAxisG = chart.plotAxisReact(
      styles,
      yAxis,
      'y',
    );

    // Add x-axis label
    const xAxisLabel = chart[styles['x-axis']].append('text')
      .attr('x', chart.width / 2)
      .attr('y', '-2em')
      .attr('class', styles.label);

    xAxisLabel.append('tspan')
      .attr('x', chart.width / 2);

    // Add y-axis label
    const yAxisLabel = chart[styles['y-axis']].append('text')
      .attr('x', -chart.height / 2)
      .attr('y', chart.labelShift - yAxis.tickPadding() + yLabelShift)
      .attr('class', styles.label);

    yAxisLabel.append('tspan')
      .attr('x', -chart.height / 2)
      .text('Country');

    // Callback on click to route to country details page
    const routeToCountryDetails = (id) => {
      chart.params.setRedirectPath('/details/' + id);
    };

    // Update function: Update chart to show countries on the given page num.
    chart.update = (pageNumber, view) => {

      // If view not the same as this view, set data and domains
      if (view !== chart.params.view) {
        chart.setData(view);

        // update x scale
        const maxX = d3.max(chart.data.bars, d => d.value);

        // Set domain, update axis
        x.domain([0, maxX])
          .nice();
        xAxis
          .tickFormat(chart.xMetricParams.tickFormat)
        chart[styles['x-axis']].call(xAxis);

        // Set color scale
        xColor = Util.getColorScaleForMetric(view, [0, maxX]);
      }

      // X-axis label and section title
      const xAxisLabelText = `${chart.xMetricParams.label} by country (${chart.xMetricParams.dateFmt(chart.data.vals.x)})`;
      xAxisLabel.text(`${chart.xMetricParams.label} (${chart.xMetricParams.dateFmt(chart.data.vals.x)})`);
      chart.params.setSectionTitle(`${chart.xMetricParams.label} by country (${chart.xMetricParams.dateFmt(chart.data.vals.x)})`);

      // Get data for this page
      const data = chart.data.bars.filter(d => d.page === pageNumber-1);
      console.log('data')
      console.log(data)

      // Append dummy bars if needed
      let i = 0;
      while (data.length < chart.params.pageLength) {
        data.push(
          {
            placeholder: true,
            place_id: '_' + i++,
            place_name: '_' + i++,
            place_iso: '',
            value: 0,
          }
        );
      }

      // Set y domain based on countries in this page
      const yTickLabels = data.map(d => d.place_name);
      y.domain(yTickLabels);
      chart[styles['y-axis']].call(yAxis);

      // Get position of y-label given widest y-axis tick label.
      const xAxisLabelPos = chart.getYLabelPos(
        y,
        true,
        yTickLabels,
        '1em',
      );
      yAxisLabel.attr('y', chart.labelShift - yAxis.tickPadding() + yLabelShift)

      // Update bar values (should only need to happen once since underlying
      // data are not updated).
      barGs.selectAll('g')
        .data(data, d => d.join_id)
        .join(
          enter => {
            const newBarGs = enter.append('g')
              .attr('data-tip', true)
              .attr('data-for', 'pagingBarTooltip')
              .attr('data-id', d => d.join_id)
              .attr('class', styles.barG)
              .classed(styles.placeholder, d => d.placeholder === true)
              .on('click', (d) => routeToCountryDetails(d.place_id));

            newBarGs.append('rect')
              .attr('x', 0)
              .attr('y', d => y(d.place_name))
              .attr('fill', d => xColor(d.value))
              .attr('width', d => x(d.value))
              .attr('height', y.bandwidth())

            newBarGs.append('image')
              .attr('x', -32)
              .attr('y', d => y(d.place_name))
              .attr('height', y.bandwidth())
              .attr('href', d => `/flags/${d.place_iso}.png`);


            // Set tick mark behavior
            chart[styles['y-axis']].selectAll('g.tick')
              .attr('data-tip', true)
              .attr('data-for', 'pagingBarTooltip')
              .on('click', (placeName) => {
                const placeDatum = chart.data.bars.find(d => d.place_name === placeName);
                if (placeDatum) {
                  routeToCountryDetails(placeDatum.place_id);
                }
              });

            // Add bar value labels
            newBarGs.append('text')
              .attr('class', styles.valueLabel)
              .text(d => chart.xMetricParams.tickFormat(d.value))
              .attr('x', d => x(d.value) + 5)
              .attr('y', d => y(d.place_name) + y.bandwidth()/2)
              .attr('dy', '.375em');

          },
          update => {
            // NA
          },
          exit => {
            exit.remove();
          },
        );
    };

    chart.update(1, 'cumcaseload_totalpop');

    // Reduce width at the end
    chart.svg.node().parentElement.classList.add(styles.drawn);
  }
}

export default PagingBar;
