class nbcBarchart extends HTMLElement {
    constructor() {
        super();
        this.setAttribute('class', 'chart')

        this.draws = 0;
        this.data = this.getAttribute('data');

    }

    connectedCallback() {
        this.innerHTML = `
            <style>
            nbc-bar-chart  .y-axis .domain,
                nbc-bar-chart .domain {
                    display: none;
                }
            </style>
        `
        this.initVis();
    }

    initVis() {
        const vis = this;

        // CHART 
        vis.chartDiv = vis.parentElement
        vis.svg = d3.select(vis).append("svg").attr('id', 'nbc-bar-chart');

        // APPEND G
        vis.g = vis.svg
            .append('g')
            .attr('class', 'bar-chart-main-group')

        vis.bars = vis.g.append('g');

        // APPEND X AXIS 
        vis.xAxis = vis.g
            .append('g')
            .attr('class', 'demi p-14')

        // APPEND y AXIS 
        vis.yAxis = vis.g
            .append('g')
            .attr('class', 'demi p-16')

        // title
        vis.textLabel = vis.g.append('text')
            .attr('class', 'p-18 bold')
            .text('COVID cases by state')
    }

    redraw() {

        const vis = this;
        vis.draws += 1;

        // Extract the width and height that was computed by CSS.
        const width = vis.chartDiv.clientWidth;
        const height = vis.chartDiv.clientHeight;
        const MARGIN = { top: height * .05, right: 0, bottom: height * .05, left: 0 };
        const gWIDTH = width - (MARGIN.left + MARGIN.right);
        const gHEIGHT = height - (MARGIN.top + MARGIN.bottom);

        // Use the extracted size to set the size of an SVG element.
        vis.svg
            .attr("width", width)
            .attr("height", height)
            .style('overflow', 'visible');

        // SET G
        vis.g.attr('width', gWIDTH)
            .attr('height', gHEIGHT)
            .attr('transform', 'translate(' + MARGIN.left + ',' + MARGIN.top + ')');

        // X SCALE
        vis.xScale = d3
            .scaleLinear()
            .range([gWIDTH * .12, gWIDTH])
            .domain([0, d3.max(vis.data, d => Number(d.cases)) * 1.15])

        // Y SCALE
        vis.yScale = d3
            .scaleBand()
            .domain(vis.data.map(d => d.state))
            .range([0, gHEIGHT])
            .paddingInner(0.02)
            .paddingOuter(0)

        ///////////////////////////////////////////////////////
        // draw bars
        ///////////////////////////////////////////////////////
        const barWidth = vis.yScale.bandwidth();

        // JOIN
        const bar = vis.bars
            .selectAll('rect')
            .data(vis.data)

        // EXIT
        bar.exit().remove()

        // UPDATE
        bar
            .transition()
            .duration(500)
            .attr('height', barWidth)
            .attr('y', (d, i) => vis.yScale(d.state))
            .attr('x', d => vis.xScale(0) - 1)
            .attr('width', d => Math.abs(vis.xScale(Number(d.cases)) - vis.xScale(0)))

        // ENTER
        bar
            .enter()
            .append('rect')
            .attr('fill', (d, i) => i % 2 === 0 ? "red" : 'blue')
            .attr('y', (d, i) => vis.yScale(d.state))
            .attr('x', d => vis.xScale(0))
            .attr('height', barWidth)
            .attr('width', 0)
            .transition()
            .duration(1000)
            .delay((d, i) => 33 * i + 100)
            .attr('x', d => vis.xScale(0) - 1)
            .attr('width', d => Math.abs(vis.xScale(Number(d.cases)) - vis.xScale(0)))

        ///////////////////////////////////////////////////////
        // NUMERICAL LABELS
        ///////////////////////////////////////////////////////
        // JOIN
        const numericalTextLabel = vis.g
            .selectAll('.num-labels')
            .data(vis.data)

        // EXIT
        numericalTextLabel.exit().remove();

        // UPDATE
        numericalTextLabel
            .transition()
            .duration(500)
            .style('opacity', 1)
            .attr('y', (d, i) => vis.yScale(d.state) + vis.yScale.bandwidth() - 2)
            .attr('x', d => vis.xScale(Number(d.cases)) + vis.yScale.bandwidth() * .5)

        // ENTER
        numericalTextLabel
            .enter()
            .append('text')
            .attr('class', 'num-labels p-12')
            .attr('fill', 'black')
            .attr('text-anchor', 'start')
            .attr('y', (d, i) => vis.yScale(d.state) + vis.yScale.bandwidth() - 2)
            .attr('x', d => vis.xScale(Number(d.cases)) + vis.yScale.bandwidth() * .5)
            .text(d => d3.format(',')(Number(d.cases)))
            .style('opacity', 0)
            .transition()
            .duration(1000)
            .delay((d, i) => 33 * i + 100)
            .style('opacity', 1);

        ///////////////////////////////////////////////////////
        // X AXIS
        ///////////////////////////////////////////////////////
        const xAxisCall = d3
            .axisBottom()
            .tickPadding(-2)

        if (vis.draws === 1) {
            vis.xAxis
                .attr('class', 'p-12')
                .attr('transform', `translate(${0}, ${gHEIGHT + 7})`)
                .attr('width', 0)
                .transition()
                .delay(250)
                .duration(500)
                .attr('opacity', 1)
                .attr('width', gWIDTH)
                .call(xAxisCall.scale(vis.xScale).tickSizeOuter([0]));
        } else {
            vis.xAxis
                .transition()
                .duration(500)
                .attr('transform', `translate(${0}, ${gHEIGHT + 7})`)
                .attr('opacity', 1)
                .call(xAxisCall.scale(vis.xScale).tickSizeOuter([0]));
        }

        ///////////////////////////////////////////////////////
        // Y AXIS
        ///////////////////////////////////////////////////////
        const yAxisCall = d3
            .axisLeft()
            .ticks(5)
            .tickPadding(gWIDTH * -.11)
            .tickFormat(e => e)

        if (vis.draws === 1) {
            vis.yAxis
                .attr('class', 'text-labels p-12 demi axis y-axis')
                .style('text-anchor', 'end')
                .attr('transform', `translate(${-MARGIN.left + 8}, ${0})`)
                .attr('width', 0)
                .transition()
                .delay(250)
                .duration(500)
                .attr('opacity', 1)
                .attr('width', gWIDTH)
                .call(yAxisCall.scale(vis.yScale).tickSizeOuter([0]));
        } else {
            vis.yAxis
                .transition()
                .duration(500)
                .attr('transform', `translate(${-MARGIN.left + 8}, ${0})`)
                .attr('opacity', 1)
                .call(yAxisCall.scale(vis.yScale).tickSizeOuter([0]));
        }

        ///////////////////////////////////////////////////////
        // text label
        ///////////////////////////////////////////////////////
        vis.textLabel
            .attr('y', 0)
            .attr('text-anchor', 'middle')
            .attr('x', width / 2)
    }

    _setData = () => {
        const vis = this;
        vis.raw = JSON.parse(vis.getAttribute('data'))

        if (vis.raw) {

            vis.dates = []
            vis.raw.forEach(d => {
                if (vis.dates.includes(d.date))
                    null
                else
                    vis.dates.push(d.date)
            })

            const lastDate = vis.dates[vis.dates.length - 1]

            vis.data = vis.raw.filter(d => d.date === lastDate)

            // vis.redraw();
        }
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (name === 'data')
            this._setData()
    }
    static get observedAttributes() {
        return ['data']
    }
}
window.customElements.define('nbc-bar-chart', nbcBarchart);