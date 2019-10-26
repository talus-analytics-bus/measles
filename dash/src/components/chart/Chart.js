import * as d3 from 'd3/dist/d3.min'

class Chart {
  constructor(selector, params = {}) {
    this.DEV = false;

    this.selector = selector;
    document.querySelector(selector).innerHTML = '';
    this.svg = d3.select(selector).append('svg');
    this.margin = params.margin || {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    };
    this.chart = this.svg
      .append('g')
      .classed('chart', true);
    this.outlines = this.svg
      .append('g')
      .classed('outlines', true);

    // Store as function
    this.onResize = onResize;

    this.params = params;

    this.heighthWidthRatio = params.heighthWidthRatio;

    this.alwaysHighlight = params.alwaysHighlight || false;

    if (this.DEV) {
      document.querySelector(selector).classList.add('dev-chart');

      let logged = false;
      this.svg.on('mouseenter', () => {
        if (!logged) {
          console.log({
            chartType: this.constructor.name,
            ratio: `Height/Width => ${this.containerheight / this.containerwidth}`,
            chart: this,
          });
          logged = true;
        }
      });

    }
  }

  draw() {
  }

  update() {
  }

  setNoData() {
    this.chart.selectAll('g').remove();
    this.newGroup('nodata')
      .attr('transform', `translate(${this.containerwidth * 0.3}, ${this.containerheight * 0.3})`)
      .append('text')
      .style('font-size', '20px')
      .style('text-anchor', 'middle')
      .style('fill', '#ccc')
      .style('stroke', 'none')
      .text('No Data Available')
  }

  /* API METHODS */
  newGroup(name, parent = undefined) {
    if (parent === undefined) {
      this.chart.selectAll(`.${name}`).remove();
      this[name] = this.chart.append('g').classed(name, true);
      return this[name];
    } else {
      parent.selectAll(`.${name}`).remove();
      parent[name] = parent.append('g').classed(name, true);
      return parent[name];
    }
  }

  newUpdatePattern() {
    /*
    ~~Here be dragons~~
                                  ______________
                    ,===:'.,            `-._
                         `:.`---.__         `-._
                           `:.     `--.         `.
                             \.        `.         `.
                     (,,(,    \.         `.   ____,-`.,
                  (,'     `/   \.   ,--.___`.'
              ,  ,'  ,--.  `,   \.;'         `
               `{D, {    \  :    \;
                 V,,'    /  /    //
                 j;;    /  ,' ,-//.    ,---.      ,
                 \;'   /  ,' /  _  \  /  _  \   ,'/
                       \   `'  / \  `'  / \  `.' /
                        `.___,'   `.__,'   `.__,'

     */
    const pattern = {
      _duration: 600,
      _subPatterns: [],
    };
    pattern.name = (name, parent = undefined) => {
      pattern._name = name;
      if (this[name] === undefined) {
        this.newGroup(name);
      }
      return pattern;
    };
    pattern.element = (element) => {
      pattern._element = element;
      pattern.existingStuff = this[pattern._name].selectAll(element);
      return pattern;
    };
    pattern.data = (data, selectionCallback = undefined) => {
      pattern._data = data;
      pattern.existingStuff = pattern.existingStuff.data(pattern._data);
      pattern.newStuff = pattern.existingStuff
        .enter()
        .append(pattern._element);
      pattern.selection = pattern.newStuff;
      pattern.exit();

      if (selectionCallback) {
        selectionCallback(pattern.selection, pattern);
      }

      return pattern;
    };
    pattern.pre = (selectionCallback = undefined) => {
      pattern.selection = this[pattern._name]
        .selectAll(pattern._element);

      if (selectionCallback) {
        selectionCallback(pattern.selection, pattern);
      }

      return pattern;
    };
    pattern.post = (selectionCallback = undefined) => {
      pattern.selection = pattern.selection
        .transition()
        .duration(pattern._duration);

      if (selectionCallback) {
        selectionCallback(pattern.selection, pattern);
      }

      return pattern;
    };
    pattern.exit = () => {
      pattern.existingStuff
        .exit()
        .remove();
    };
    ['style', 'attr', 'html', 'text'].map(command => {
      pattern[command] = (...args) => {
        pattern.selection[command](...args);
        return pattern
      }
    });
    return pattern;
  }

  /**
   * Defines the x and y axis sections.
   * @method plotAxes
   */
  plotAxisReact(styles, axis, type = 'y') {
    const chart = this;
    const axisG = chart.newGroup(styles[type + '-axis'])
      .append('g')
      .attr('class', styles[type + '-axis'])
      .call(axis);
    return axisG;
  }

  // plotAxes(params = {}) {
  //   /* Param Options:
  //    *	* (x|y)Format -> format func for the x or y labels
  //    *	* (x|y)Wrap: -> Maximum width of xlabe/ylabel before wrapping
  //    *	* (x|y)Wrap(X|Y)Offset: -> X or Y offset for tspans
  //    *  * (x|y)Align -> alignment for wrapped text, defaults to 'middle'
  //    */
  //   if (this.axes === undefined) {
  //     this.newGroup('axes');
  //
  //     this.xAxisG = this.axes
  //       .append('g')
  //       .classed('x-axis', true);
  //
  //     this.yAxisG = this.axes
  //       .append('g')
  //       .classed('y-axis', true);
  //
  //     this.yAxisGrid = this.axes
  //       .append('g')
  //       .classed('y-grid', true)
  //       .style('stroke-opacity', 0.25)
  //   }
  //
  //   this.xAxisG.attr('transform', `translate(0, ${this.height})`);
  //
  //   if (params.noX !== true) {
  //
  //     const isTimeAxis = this.day || this.dates;
  //     const ticks = isTimeAxis ? Math.min(8, (this.day || this.dates).length) : undefined;
  //
  //     const xAxis = d3.axisBottom(this.xScale)
  //       .tickSize((params.tickSize === undefined) ? 6 : params.tickSize)
  //       .tickFormat(params.xFormat);
  //     if (ticks) xAxis.ticks(ticks);
  //     // .ticks(Math.min(8, (this.day || this.dates).length));
  //
  //     if (params.tickValuesX !== undefined) {
  //       xAxis.tickValues(params.tickValuesX);
  //     }
  //
  //     this.xAxisG
  //       .call(xAxis);
  //   }
  //
  //   let yAxis = (() => {
  //   });
  //   if (!params.noY) {
  //     const max = this.yScale.domain()[1];
  //     yAxis = d3.axisLeft(this.yScale)
  //       .tickSize((params.tickSize === undefined) ? 6 : params.tickSize)
  //       .tickPadding(6)
  //       .tickFormat(params.yFormat)
  //       // .tickValues([0, 3.5, 5.5, 7.5, 10])
  //       .ticks(params.numTicks || 4);
  //
  //     if (params.tickValuesY !== undefined) {
  //       yAxis.tickValues(params.tickValuesY);
  //     }
  //     this.yAxisG
  //     // .transition()
  //     // .duration(600)
  //       .call(yAxis);
  //   }
  //
  //   if (!params.noYGrid) {
  //     // const yGrid = d3.axisLeft(this.yScale)
  //     // 	.tickSize(-this.width)
  //     // 	.tickPadding(8)
  //     // 	.tickFormat(params.yFormat)
  //     // 	.ticks(params.numTicks || 4);
  //     this.yAxisGrid
  //     // .transition()
  //     // .duration(600)
  //       .call(
  //         yAxis
  //           .tickSize(-this.width)
  //       );
  //   }
  //
  //   this.yAxisGrid.selectAll('text').remove();
  //   this.yAxisGrid.selectAll('.domain').remove();
  //
  //   if (!params.domainY) {
  //     this.yAxisG.selectAll('.domain').remove();
  //   }
  //
  //   // https://bl.ocks.org/mbostock/3371592
  //   // this.yAxisG.select('.domain').remove();
  //
  //   // wrapping
  //   // NOTE - assumes you've specified yFormat or xFormat
  //   // otherwise will use toString()
  //   ['x', 'y']
  //     .filter(k => params[`${k}Wrap`] !== undefined)
  //     .forEach(k => {
  //       this[`${k}AxisG`].selectAll('text')
  //         .style('text-anchor', (params[`${k}Align`] || 'middle'))
  //         .html(d => {
  //           return wordWrap(
  //             (params[`${k}Format`] || ((x) => x.toString()))(d),
  //             params[`${k}Wrap`],
  //             (params[`${k}WrapXOffset`] || 0),
  //             (params[`${k}WrapYOffset`] || 16),
  //           );
  //         });
  //     });
  //
  //   // Remove y-domain line
  //   if (params.removeYDomain === true) {
  //     this.chart.select('path.domain').remove();
  //   }
  //
  //   if (params.tickFontWeight !== undefined) {
  //     this.chart.selectAll('g.y-axis text').style('font-weight', params.tickFontWeight);
  //   }
  // }

  ylabel(text, params = {}) {
    this.newGroup('ylabelgroup');

    const bbox = this.getBBox(this.yAxisG);

    const yPos = -bbox.width - (params.yTitleShift || 15);

    this.ylabelgroup
      .append('text')
      .attr('transform', 'rotate(-90)')
      .style('text-anchor', 'middle')
      .style('font-weight', 600)
      // .style('dominant-baseline', 'hanging')
      .style('font-size', params.yAxisLabelFontSize || '1.3em')
      .html(wordWrap(text, 50 || params.maxWidth, -this.height / 2, yPos));
  }

  xlabel(text, params = {}) {
    this.newGroup('xlabelgroup');

    const bbox = this.getBBox(this.xAxisG);

    const xPos = params.xPos || this.width / 2;
    const yPos = this.height + bbox.height + 18;

    this.xlabelgroup.append('text')
      .style('text-anchor', 'middle')
      .style('font-weight', 600)
      // .style('dominant-baseline', 'middle')
      .style('font-size', params.xAxisLabelFontSize || '1.3em')
      .html(wordWrap(text, 50 || params.maxWidth, xPos, yPos));
  }

  getBBox(element) {
    if (!element) {
      return {
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      }
    }
    if (this.svg.node() === undefined || this.svg.node() === null) {
      console.log('Not part of an svg');
      return {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      }
    }
    const svgBox = this.svg.node().getBoundingClientRect();
    const bbox = element.node().getBoundingClientRect();

    return {
      x: bbox.x - svgBox.x,
      y: bbox.y - svgBox.y,
      width: Math.max(bbox.width, 1),
      height: Math.max(bbox.height, 1),
    }
  }

  outlineElement(selection) {
    // outlines an svg element
    // https://stackoverflow.com/questions/21990857/d3-js-how-to-get-the-computed-width-and-height-for-an-arbitrary-element
    // http://bl.ocks.org/nitaku/8745933
    const elements = [];
    if (typeof selection === "object") {
      selection.each(function () {
        const element = d3.select(this);
        elements.push(element);
      });
    }

    elements.forEach(element => {
      const bbox = this.getBBox(element);

      this.outlines.append('rect')
        .attr('x', bbox.x)
        .attr('y', bbox.y)
        .attr('width', bbox.width)
        .attr('height', bbox.height)
        .attr('fill', 'none')
        .style('stroke', 'red')
        .style('stroke-width', 1);
    });
  }

  initSizing() {
    // initialize sizing
    onResize(this);

    if (this.params.noResizeEvent !== true) {
      // event listener
      // https://css-tricks.com/snippets/jquery/done-resizing-event/
      let timer;
      window.addEventListener('resize', () => {
        clearTimeout(timer);
        timer = window.setTimeout(() => {
          onResize(this);
        }, 100);
      });
    }

  }

  // Add axis labels
  getYLabelPos (y, ordinal = false, labels = [], fontSize = '1em', useDrawnTicks = false) {
    const chart = this;

    // data: all tick labels shown in chart, as formatted.
    let data, fakeAxis;
    if (useDrawnTicks) {
      data = [];
      fakeAxis = chart.svg.append('g')
        .attr('class', 'fakeAxis')
        .call(chart.yAxis);

      fakeAxis
        .selectAll('g.tick text').each(function(d) {
          data.push(this.textContent);
        })
      fakeAxis
        .remove();
    }
    else {
      data = ordinal ? labels : [
        y.tickFormat()(
          y.domain()[0] // largest y-value
        )
      ];
    }

    console.log('data')
    console.log(data)

    // Add fake tick labels
    const fakeText = chart.svg.selectAll('.fake-text').data(data).enter().append("text").text(d => d)
      .attr('class','tick fake-text')
      .style('font-size',fontSize); // TODO same fontsize as chart

    // Calculate position based on fake tick labels and remove them
    const maxLabelWidth = d3.max(fakeText.nodes(), d => d.getBBox().width)
    fakeText.remove();

    // Return ypos as longest tick label length plus a margin.
    // Larger max label width menas more negative label shift and more positive margin
    const marginLabel = 45 + maxLabelWidth; // 45 = width of svg text
    this.labelShift = -marginLabel;

    const marginAxis = 10;
    // const marginShift = maxLabelWidth + marginAxis + marginLabel;
    const marginShift = maxLabelWidth + marginAxis + 45 + 3;
    this.marginShift = marginShift;

    // Adjust left margin of chart based on label shifting
    // chart.svg.style('margin-left', -(chart.margin.left + labelShift) + 'px')

    // THEN zero width again
    return marginShift;
  };

  // Get the width of the longest label in a set of text labels
  getLongestLabelWidth (labels = [], fontSize = '1em', bold = false) {
    const chart = this;

    // Add fake tick labels
    const fakeText = chart.svg.selectAll('.fake-text').data(labels).enter().append("text").text(d => d)
      .attr('class','tick fake-text')
      .style('font-weight', bold ? 'bold' : 'normal')
      .style('font-size',fontSize); // TODO same fontsize as chart

    // Calculate position based on fake tick labels and remove them
    const maxLabelWidth = d3.max(fakeText.nodes(), d => d.getBBox().width)
    fakeText.remove();

    return maxLabelWidth;
  };

  fitLeftMargin (initDomain, ordinal = false, useDrawnTicks = false) {

    const chart = this;
    const axisType = 'y';
    const labels = ordinal ? initDomain : [];

    const yParams = chart.params.yMetricParams;

    if (chart[axisType] === undefined)
      chart[axisType] = d3.scaleLinear()
        .domain(initDomain)
        .nice()
        .range([0, chart.height]);

    const chartScale = chart[axisType];

    const shift = chart.getYLabelPos(
      chart[axisType], // scale
      ordinal,
      labels,
      '1em',
      useDrawnTicks,
    );
    console.log('shift')
    console.log(shift)
    return shift;
  }

  init() {
    this.initSizing();
  } // alias
}

export default Chart

function onResize(chart) {

  const selector = document.querySelector(chart.selector);

  if (!selector) { return; }

  // get the width and height of the container that we're inside
  chart.containerwidth = selector.clientWidth;
  chart.containerheight = selector.clientHeight;

  if (chart.heighthWidthRatio) {
    chart.containerheight = chart.containerwidth * chart.heighthWidthRatio;
  }

  // set the contents to be the dimensions minus the margin
  chart.width = chart.containerwidth - chart.margin.left - chart.margin.right;
  chart.height = chart.containerheight - chart.margin.top - chart.margin.bottom;

  // set the actual svg width and height
  chart.svg
    .attr('width', chart.containerwidth)
    .attr('height', chart.containerheight);

  // set
  chart.chart
    .attr('transform', `translate(${chart.margin.left}, ${chart.margin.top})`);

  // chart.draw();

  if (chart.DEV) {
    chart.newGroup('outlines')
      .lower();
    chart.outlines.append('rect')
      .classed('containerbox', true)
      .attr('transform', `translate(${-chart.margin.left},${-chart.margin.top})`)
      .style('fill', 'red')
      .style('fill-opacity', 0)
      .style('stroke', 'purple')
      .style('stroke-width', 1)
      .style('opacity', 0)
      .attr('height', chart.containerheight)
      .attr('width', chart.containerwidth);

    chart.outlines.append('rect')
      .classed('chartbox', true)
      .style('fill', 'red')
      .style('fill-opacity', 0)
      .style('stroke', 'red')
      .style('stroke-width', 1)
      .style('opacity', 0)
      .attr('height', chart.height)
      .attr('width', chart.width);

    if (chart.alwaysHighlight) {
      chart.chart.selectAll('.chartbox,.containerbox').style('opacity', 1);
    } else {
      chart.chart
        .on('mouseenter', () => {
          chart.chart.selectAll('.chartbox,.containerbox').style('opacity', 1);
        })
        .on('mouseleave', () => {
          chart.chart.selectAll('.chartbox,.containerbox').style('opacity', 0);
        });
    }
  }

  if (chart.data) {
    chart.update(chart.data);
  }
}

// https://stackoverflow.com/questions/14484787/wrap-text-in-javascript
const wordWrap = (str, maxWidth, x = 0, y = 0, yspacing = null) => {
  const dy = yspacing || (i => `${i}em`);

  const newLineStr = (s, yCoord, i) => `<tspan x='${x}' y='${yCoord}' dy=${dy(i)}>${s}</tspan>`;
  if (str.length <= maxWidth) {
    return newLineStr(str, y, 0);
  }

  function testWhite(x) {
    var white = new RegExp(/^[\s]$/);
    return white.test(x.charAt(0));
  }

  var done = false;
  let res = '';
  let lineNum = 0;
  var lines = [];
  let i;
  do {
    let found = false;
    // Inserts new line at first whitespace of the line
    for (i = maxWidth - 1; i >= 0; i--) {
      if (testWhite(str.charAt(i))) {
        res = res + newLineStr(str.slice(0, i), y, lineNum);
        lines.push([str.slice(0, i), lineNum]);
        str = str.slice(i + 1);
        found = true;
        break;
      }
    }
    // Inserts new line at maxWidth position, the word is too long to wrap
    if (!found) {
      res += newLineStr(str.slice(0, maxWidth), lineNum);
      str = str.slice(maxWidth);
      lines.push([str.slice(0, i), lineNum]);
    }

    if (str.length < maxWidth)
      done = true;
    lineNum++;
  } while (!done);

  if (lineNum > 1) {
    let response = '';
    lines.push([str, lineNum]);
    lines.forEach(d => {
      let yCoord = y - lineNum * 7;
      response += newLineStr(d[0], yCoord, d[1]);
    });
    return response;

  } else {
    return res + newLineStr(str, y, lineNum);
  }
}

const percentize = function (num, param = {}) {
  if (num === undefined || num === null) {
    return 'NR';
  }
  const d3Format = d3.format(',.0%');
  const d3FormattedNum = d3Format(num);
  if (d3FormattedNum === "0%" && num !== 0) {
    return "<1%";
  } else {
    return d3FormattedNum;
  }
}; // divides by 100 and adds a percentage symbol
