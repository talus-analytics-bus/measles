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

    const setData = () => {
      this.data = {vals: {}};
      const setXData = () => {
        // If current view is "total cases reported", show y, otherwise show y2
        // which is vaccination coverage.
        let view;
        if (this.params.view !== undefined) view = this.params.view;
        else view = 'caseload_totalpop';

        if (view === 'caseload_totalpop') {
          this.data.vals.x = params.data.y || [];
        }
        else if (view === 'coverage_mcv1_infant') { // most recent vaccinatin cov. val.
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
              }
            );
          }
        });

      // TODO remove data not for the time period we need
      // Sort data by descending value and assign page numbers
      const pageLength = 15;
      const sortFunc = Util.sortByField('value');
      this.data.bars
        .sort(sortFunc)
        .forEach((v, i) => {
          v.page = Math.floor(i / pageLength); // 0-indexed count
        });

        // Set page count so that page buttons are rendered.
        const pageCount = Math.floor(this.data.bars.length / pageLength) + 1;
        this.params.setPageCount(pageCount);
      };


      // Define x, y, and bar data series.
      setXData();
      setYData();
      setBarData();
    };
    setData();

    // Default margins
    if (!this.params.margin) {
      this.params.margin = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 200,
      };
    }


    this.init();
    // set left margin based on the longest country name included.
    const yLabels = this.data.bars.map(d => d.place_name);
    this.params.margin.left = this.fitLeftMargin(yLabels, true) + 40;
    this.onResize(this);
    this.draw();
  }

  draw() {

    const chart = this;
    console.log('chart - redrawing everything - mvm');
    console.log(chart);

    // x scale = cases or incidence
    // Calculate x domain max.
    const maxX = d3.max(chart.data.bars, d => d.value);

    // Set domain in update function
    const x = d3.scaleLinear()
      .range([0, chart.width])
      .domain([0, maxX])
      .nice();

    const xAxis = d3.axisTop()
      .scale(x)
      .ticks(5)
      .tickFormat(Util.comma);

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
      .scale(y);

    const yAxisG = chart.plotAxisReact(
      styles,
      yAxis,
      'y',
    );

    // Draw bars
    const barGs = chart.newGroup(styles.barGs);

    // Update function: Update chart to show countries on the given page num.
    chart.update = (pageNumber) => {

      // Get data for this page
      const data = chart.data.bars.filter(d => d.page === pageNumber-1);

      // Set y domain based on countries in this page
      y.domain(data.map(d => d.place_name));
      chart[styles['y-axis']].call(yAxis);

      // Update bar values (should only need to happen once since underlying
      // data are not updated).
      barGs.selectAll('g')
        .data(data, d => d.place_id)
        .join(
          enter => {
            const newBarGs = enter.append('g')
              .attr('class', styles.barG)

            newBarGs.append('rect')
              .attr('x', 0)
              .attr('y', d => y(d.place_name))
              .attr('width', d => x(d.value))
              .attr('height', y.bandwidth())
              .attr('data-id', d => d.place_id);

            newBarGs.append('image')
              .attr('x', -32)
              .attr('y', d => y(d.place_name))
              .attr('height', y.bandwidth())
              .attr('href', d => `/flags/${d.place_iso}.png`);

            // newBarGs.append('rect')
          },
          update => {
            // NA
          },
          exit => {
            exit.remove();
          },
        );
    };

    chart.update(1);

    // Reduce width at the end
    chart.svg.node().parentElement.classList.add(styles.drawn);
  }
}

export default PagingBar;
