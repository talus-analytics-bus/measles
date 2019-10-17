import * as d3 from 'd3/dist/d3.min';
import Chart from "../../../chart/Chart.js";

class SlidingLine extends Chart {
  constructor(
    selector,
    params = {}
  ) {

    super(selector, params);

    this.params = params;
    this.data = params.data;

    // Get min and max time from data.
    const minTime = new Date(
      this.data[0]['date_time'].replace(/-/g, '/')
    );
    const maxTime = new Date(
      this.data[this.data.length - 1]['date_time'].replace(/-/g, '/')
    );

    this.xDomainDefault = [minTime, maxTime];
    // this.margin = {}; // TODO

    this.init();
  }

  draw() {

    if (this.data.length < 1) {
      // TODO show "no data" message
      return
    }

    // x scale: Time
    // global min/max to start
    console.log('this')
    console.log(this)
    const x = d3.scaleTime()
      .domain(this.xDomainDefault) // min and max time vary w. window size
      .range([0, 500]); // always fixed

    console.log('x')
    console.log(x)

  //   this.radii = {
  //     chart: chartRadius,
  //     spoke: chartRadius *.12,
  //     innerMax: chartRadius * .78,
  //     outerMax: chartRadius * 1,
  //   };
  //
  //   // Add chart container
  //   this.origin = this.newGroup('origin')
  //     .attr('transform', `translate(${this.width / 2}, ${this.height / 2})`);
  //
  //   // Add chart base circle
  //
  //   // Define scales mapping resilience domains to angles.
  //   const pi = Math.PI;
  //   const baseStartAngle = (360 / domainsLowerCase.length) * (pi / 180);
  //
  //   const angleScale = d3.scaleOrdinal()
  //   .domain(domainsLowerCase)
  //   .range(
  //     domainsLowerCase.map(
  //       (d, i) => {
  //         return (baseStartAngle * i);
  //       }
  //     )
  //   );
  //
  //   // Add fake arcs shape
  //   const getArcShape = (datum, type) => {
  //     const startAngle = angleScale(datum.name);
  //     const endAngle = angleScale(datum.name) + (baseStartAngle);
  //     datum.labelAngle = ((startAngle + endAngle) / 2) * (180 / pi);
  //     switch (type) {
  //       case 'section':
  //         return d3.arc()
  //           .innerRadius(0)
  //           .outerRadius(this.radii.outerMax)
  //           .startAngle(startAngle)
  //           .endAngle(endAngle);
  //       case 'domain-label':
  //         return d3.arc()
  //           .innerRadius(this.radii.innerMax)
  //           .outerRadius(this.radii.outerMax)
  //           .startAngle(startAngle)
  //           .endAngle(endAngle);
  //       case 'section-background':
  //         return d3.arc()
  //           .innerRadius(0)
  //           .outerRadius(this.radii.innerMax)
  //           .startAngle(startAngle)
  //           .endAngle(endAngle);
  //       case 'slice':
  //         return d3.arc()
  //           .innerRadius(0)
  //           // .outerRadius(datum.frac * this.radii.innerMax)
  //           .startAngle(startAngle)
  //           .endAngle(endAngle);
  //       default:
  //         return null;
  //     }
  //   };
  //
  //   // Create text circle.
  //   const circleGen = () => {
  //     const radius = this.radii.outerMax;
  //
  //     //set defaults
  //     var r = function(d) { return d.radius; },
  //         x = function(d) { return d.x; },
  //         y = function(d) { return d.y; };
  //
  //     //returned function to generate circle path
  //     function circle(d) {
  //       var cx = 0,
  //           cy = 0,
  //           myr = radius;
  //
  //       return "M" + cx + " " + cy + " " +
  //              "m" + " 0 " + myr +
  //              "a" + myr + " " + myr + " 0 0 1 " + " 0 "  + -myr*2 +
  //              "a" + myr + " " + myr + " 0 0 1 " + " 0 " + myr*2 + "Z";
  //     }
  //
  //     //getter-setter methods
  //     circle.r = function(value) {
  //       if (!arguments.length) return r; r = value; return circle;
  //     };
  //     circle.x = function(value) {
  //       if (!arguments.length) return x; x = value; return circle;
  //     };
  //     circle.y = function(value) {
  //       if (!arguments.length) return y; y = value; return circle;
  //     };
  //
  //     return circle;
  //   }
  //   const textCircle = circleGen()
  //    .x(function(d) { return 0; })
  //    .y(function(d) { return 0; })
  //    .r(function(d) { return this.radii.outerMax; });
  //
  //  // Create arcs group.
  //  const arcs = this.newGroup('arcs', this.origin);
  //
  //   arcs.append('path')
  //     .attr('class','textCircle')
  //     .attr('id','textCircle')
  //     .attr('d', textCircle);
  //
  //   // Add each pie slice background.
  //   arcs.selectAll('path.section-background')
  //     .data(this.data).enter()
  //     .append("path")
  //       .each((d) => {
  //         d.arcShape = getArcShape(d, 'section-background');
  //       })
  //       .attr("d", (d) => d.arcShape())
  //       .attr('class', 'section-background')
  //       .attr('fill', '#f2f2f2')
  //       .attr('stroke-width', '0')
  //       .attr('stroke', 'none');
  //
  //   // Add each pie slice and domain label.
  //   const setDomainData = this.params.setDomain;
  //   const sections = arcs.selectAll('g.sections')
  //     .data(this.data).enter()
  //     .append('g')
  //       .attr('class', 'sections')
  //       .attr('data-tip', true)
  //       .attr('data-for', 'radar-chart-tooltip')
  //       .on('mouseover', function (d) {
  //         setDomainData(d);
  //       });
  //
  //   // Add each arc.
  //   sections
  //     .append("path")
  //     .each((d) => {
  //       d.arcShape = getArcShape(d, 'slice');
  //     })
  //     .attr('class', (d) => d.name.toLowerCase() + ' slice')
  //     .attr('stroke-width', '0')
  //     .attr('stroke', 'none')
  //     .attr("d", (d) => d.arcShape({outerRadius: 0.01 * this.radii.innerMax}))
  //     .transition(0)
  //     .delay(0)
  //     .duration(1000)
  //     .attr("d", (d) => d.arcShape({outerRadius: d.frac * this.radii.innerMax}))
  //
  //   // Add domain sections (biggest triangles).
  //   sections
  //     .append("path")
  //     .each((d) => {
  //         d.arcShape = getArcShape(d, 'section');
  //         d.labelArcShape = getArcShape(d, 'domain-label');
  //       })
  //       .attr("d", (d) => d.arcShape())
  //       .attr('class', 'section')
  //       .attr('stroke', '#cccccc')
  //       .attr('fill', 'transparent')
  //       .attr('stroke-width', '2px');
  //
  //
  //   // Add domain labels.
  //   const usingFirefox = navigator.userAgent.search('Firefox') > -1;
  //   sections.append('text')
  //     .attr('textLength', d => usingFirefox ? d.name.length * 1.25 *12.5 : undefined)
  //     .attr('transform', 'rotate(180)')
  //     .attr('dy','40')
  //     .append('textPath')
  //       .attr('href', '#textCircle')
  //       .attr('startOffset', d => `${(100 * (d.labelAngle / 360))}%`)
  //       .text(d => d.name.toUpperCase());
  //
  //   // Add spoke
  //   const spoke = this.newGroup('spoke', this.origin);
  //   spoke.append('circle')
  //     .attr('cx', 0)
  //     .attr('cy', 0)
  //     .attr('r', this.radii.spoke)
  //     .attr('fill', 'white')
  //     .attr('stroke', 'none');
  }
}

export default SlidingLine;
