class nbcLineGraph extends HTMLElement {
    constructor() {
        super();
        this.setAttribute('class', 'chart')

        this.draws = 0;
        this.data = this.getAttribute('data');

        this.zoomed = false;
        this.filled = true;
        this.lowDate = null;
        this.highDate = null;

        if (this.data)
            this._setupZoomValues()
    }

    _setupZoomValues() {

        this.maxYear = d3.max(this.data, d => d.date).getFullYear();
        this.minYear = d3.min(this.data, d => d.date).getFullYear();
        this.middleOfData = (new Date((d3.min(this.data, d => d.date).getTime() + d3.max(this.data, d => d.date).getTime()) / 2));
        this.totalYearsInData = Math.round((this.maxYear - this.minYear));

        this.oneYear = 31536000000;
        this.oneMonth = this.oneYear / 12;

        this.zoomWidth = 1; // arbitrary value depending on data
        this.halfZoom = this.oneYear / 24; // this is the number of years above/below the midpoint when vis.zoomed

        // set the dates for zooming into the middle of the data (when clicking zoom in before interacting with the chart)
        this.oldLowDate = new Date((this.middleOfData.getTime() - this.halfZoom));
        this.oldHighDate = new Date((this.middleOfData.getTime() + this.halfZoom));
    }

    connectedCallback() {
        this.innerHTML = `
            <style>
            nbc-line-graph .y-axis .domain {
                display: none;
            }
            </style>
        `
        this.initVis();
    }

    initVis() {
        const vis = this;

        const SAPPH_GRADIENT = 'url(#SAPPH-grad)';
        const SAPPH = 'rgba(0, 95, 158, 1)';
        const SAPPH50 = 'rgba(0, 95, 158, 0.4)';
        const SAPPH0 = 'rgba(0, 95, 158, 0)';

        const colorTwo = 'rgba(0, 0, 0, 1)';
        const colorTwo50 = 'rgba(0, 0, 0, .15)';
        const colorTwo0 = 'rgba(0, 0, 0, 0)';

        // CHART
        vis.chartDiv = vis.parentElement
        vis.svg = d3.select(vis).append("svg").attr('id', 'nbc-line-graph');

        // APPEND G
        vis.g = vis.svg
            .append('g')
            .attr('class', 'line-graph-main-group')

        // APPEND LINE
        vis.lineVis = vis.g
            .append('path')
            .attr('stroke', '#005F9E')
            .attr('stroke-width', 2)
            .attr('fill', 'none')

        // ADD AREA
        vis.blueArea = vis.g.append("path")
            .attr('fill', SAPPH_GRADIENT);

        // APPEND WHITE BOX TO COVER AREA WHEN CHART EXPANDS DURING ZOOM
        vis.whiteBox = vis.g
            .append('rect')
            .attr('class', 'whiteBox')
            .attr('fill', 'white')
            .attr('width', 33)
            .attr('y', 0)

        // APPEND X AXIS 
        vis.xAxis = vis.g
            .append('g')
            .attr('class', 'axis x-axis p-16')

        // APPEND Y AXIS 
        vis.yAxis = vis.g
            .append('g')
            .style('text-anchor', 'start')
            .attr('class', 'axis y-axis p-16')

        // DEFINE LINEAR GRADIENT
        vis.gradient = vis.svg
            .append('linearGradient')
            .attr('id', 'SAPPH-grad')
            .attr('x1', 0)
            .attr('y1', 0.2)
            .attr('x2', 0)
            .attr('y2', 1)
            .attr('gradientUnits', 'objectBoundingBox');
        vis.gradient
            .append('stop')
            .attr('offset', '0')
            .attr('stop-color', SAPPH50);
        vis.gradient
            .append('stop')
            .attr('offset', '1')
            .attr('stop-color', SAPPH0);

        // title
        vis.textLabel = vis.g.append('text')
            .attr('class', 'p-18 bold')
            .text('U.S. COVID deaths over time')

        // FINALLY, APPEND A TOUCH LAYER TO BYPASS ALL OF OUR TEXT AND OTHER DIVS THAT HAVE BEEN APPENDED
        vis.touchLayer = d3.select(vis).append('div').attr('class', 'touch-layer')
            .style('position', 'absolute');

        // zoom buttons
        vis.zoomText = vis.g.append('text')
            .attr('id', 'play-text')
            .attr('class', 'p-18 bold')
            .style('cursor', 'pointer')
            .text('ZOOM IN')
            .style('opacity', 0)

        vis.zoomText1 = vis.g.append('text')
            .attr('id', 'play-text')
            .attr('class', 'p-18 bold')
            .style('cursor', 'pointer')
            .text('ZOOM OUT')
            .style('opacity', 0)
        // this.wrangle();
    }

    // wrangle adjusts the x-axis when zooming and dragging
    wrangle(x1 = new Date(d3.min(this.data, d => d.date).getTime() - this.oneMonth / 15), x2 = d3.max(this.data, d => d.date)) {
        const vis = this;

        // Extract the width and height that was computed by CSS.
        vis.width = vis.chartDiv.clientWidth;
        vis.height = vis.chartDiv.clientHeight;
        vis.MARGIN = { top: vis.height * .03, right: vis.width * .03, bottom: vis.height * .066, left: vis.width * .05 };
        vis.gWIDTH = vis.width - (vis.MARGIN.left + vis.MARGIN.right);
        vis.gHEIGHT = vis.height - (vis.MARGIN.top + vis.MARGIN.bottom);

        // X SCALE
        vis.xScale = d3
            .scaleTime()
            .domain([x1, x2])
            .range([0, vis.gWIDTH])

        vis.lowDate = x1
        vis.highDate = x2;

        // HANDLE CLICKS ///////////////////////////////////////////
        const svgElement = document.getElementById('nbc-line-graph')

        let holding = false;
        let clickOne = null;
        let difference = 0;

        vis.touchLayer.on("mousedown", handleStart);
        vis.touchLayer.on("touchstart", handleStart);

        // attach the mousemove and mouseup to the body in case one wonders off the svg (we use body)
        vis.touchLayer.on("mousemove", handleMove).on("mouseup", handleEnd).on('mouseout', handleEnd)
        vis.touchLayer.on("touchmove", handleMove).on("touchend", handleEnd).on("touchcancel", handleEnd)

        function handleStart() {
            if (vis.zoomed) {
                clickOne = d3.mouse(svgElement)[0];
                holding = true;
            }
        }

        // sometimes it's hard to drag your way all the way to the very end of the chart, but if you move the opposite way it works
        let moveTrigger = 0;
        const overflow = vis.oneMonth * .2;
        function handleMove() {
            if (vis.zoomed && holding) {
                d3.event.preventDefault();

                const clickTwo = d3.mouse(svgElement)[0]
                const date1 = vis.xScale.invert(clickOne)
                const date2 = vis.xScale.invert(clickTwo)

                difference = ((date2 - date1));

                vis.minTimeInOurData = d3.min(vis.data, d => d.date).getTime();
                vis.maxTimeInOurData = d3.max(vis.data, d => d.date).getTime();

                if (vis.lowDate.getTime() - difference > vis.minTimeInOurData - overflow) {
                    if (vis.highDate.getTime() - difference < vis.maxTimeInOurData + overflow) {
                        vis.xScale.domain([vis.lowDate.getTime() - difference, vis.highDate.getTime() - difference])
                        vis.redraw(true)
                    } else {
                        moveTrigger += 1;
                        if (moveTrigger === 30) {
                            moveTrigger = 0;
                            vis.xScale.domain([vis.maxTimeInOurData + overflow - vis.zoomWidth * (vis.oneMonth / 2), vis.maxTimeInOurData + overflow])
                            vis.redraw(true)
                        }
                    }

                } else {
                    moveTrigger += 1;
                    if (moveTrigger === 30) {
                        moveTrigger = 0;
                        vis.xScale.domain([vis.minTimeInOurData - overflow, vis.minTimeInOurData - overflow + vis.zoomWidth * (vis.oneMonth / 2)])
                        vis.redraw(true)
                    }
                }
            }
        }

        function handleEnd() {
            if (vis.zoomed && holding) {
                if (vis.lowDate.getTime() - difference < vis.minTimeInOurData - overflow) {
                    vis.lowDate = new Date(vis.minTimeInOurData - overflow)
                    vis.highDate = new Date(vis.minTimeInOurData - overflow + vis.zoomWidth * (vis.oneMonth / 2))
                } else if (vis.highDate.getTime() - difference > vis.maxTimeInOurData + overflow) {
                    vis.lowDate = new Date(vis.maxTimeInOurData + overflow - vis.zoomWidth * (vis.oneMonth / 2))
                    vis.highDate = new Date(vis.maxTimeInOurData + overflow)
                } else {
                    vis.lowDate = new Date(vis.lowDate.getTime() - difference)
                    vis.highDate = new Date(vis.highDate.getTime() - difference)
                }
            }
            holding = false;
        }

        vis.redraw()
    } // end wrangle


    redraw(pan = false) {
        const vis = this;
        const narrowScreen = window.innerWidth < 1100;

        vis.draws += 1;

        // Use the extracted size to set the size of an SVG element.
        vis.svg
            .attr("width", vis.width)
            .attr("height", vis.height);

        // SET SIZE FOR TOUCH LAYER
        vis.touchLayer
            .style("width", vis.width + 'px')
            .style("height", vis.height + 'px')
            .style("top", '40px')
            .attr("pointer-events", "all")

        // SET G
        vis.g.attr('width', vis.gWIDTH)
            .attr('height', vis.gHEIGHT)
            .attr('transform', 'translate(' + vis.MARGIN.left + ',' + vis.MARGIN.top + ')');

        ///////////////////////////////////////////////////////
        // y scale
        ///////////////////////////////////////////////////////
        let yMax = vis.data[vis.data.length - 1].deaths + 2000;
        let yMin = 0;

        vis.yScale = d3.scaleLinear()
            .range([vis.gHEIGHT, 0])
            .domain([yMin, yMax]);

        ///////////////////////////////////////////////////////
        // line generators
        ///////////////////////////////////////////////////////
        const generateLine = d3.line()
            .x(d => vis.xScale(d.date))
            .y(d => vis.yScale(d.deaths));

        ///////////////////////////////////////////////////////
        // area generators
        ///////////////////////////////////////////////////////
        const flatArea = d3.area()
            .x(d => vis.xScale(d.date))
            .y1(d => vis.yScale(0))
            .y0(d => vis.yScale(0))

        const generateArea = d3.area()
            .x(d => vis.xScale(d.date))
            .y1(d => vis.yScale(0))
            .y0(d => vis.yScale(d.deaths))

        // creates a flat starting path to start the animation
        let startLine = vis.data.map(k => {
            return { date: k.date, deaths: 0 };
        });

        ///////////////////////////////////////////////////////
        // draw line (animate on first call)
        ///////////////////////////////////////////////////////
        if (vis.draws <= 1) {
            vis.lineVis
                .attr('d', generateLine(startLine))
                .transition()
                .duration(1500)
                .delay(333)
                .attr('d', generateLine(vis.data))
        } else {
            vis.lineVis
                .transition()
                .duration(pan ? 0 : 1000)
                .attr('d', generateLine(vis.data))
        }

        ///////////////////////////////////////////////////////
        // draw area (animate on first call)
        ///////////////////////////////////////////////////////
        if (vis.draws <= 1) {
            vis.blueArea
                .attr('opacity', vis.filled ? 1 : 0)
                .attr('d', flatArea(vis.data))
                .transition()
                .duration(1500)
                .delay(333)
                .attr('d', generateArea(vis.data))
        } else {
            vis.blueArea
                .transition()
                .duration(pan ? 0 : 1000)
                .delay(0)
                .attr('d', generateArea(vis.data))
                .attr('opacity', vis.filled ? 1 : 0);
        }

        ///////////////////////////////////////////////////////
        // x axis 
        ///////////////////////////////////////////////////////
        const xAxisCall = d3.axisBottom()
            .tickPadding(vis.height * .02)
            .ticks(7)
            .tickSizeInner([0])
            .tickSizeOuter([0])
            .tickFormat(e => {
                return e.toDateString().slice(4)
            });

        const xLabelPos = vis.yScale(0)
        if (vis.draws === 1) {
            vis.xAxis
                .call(xAxisCall.scale(vis.xScale))
                .attr('transform', `translate(${0}, ${xLabelPos})`)
                .style('opacity', 0)
                .transition()
                .duration(2500)
                .delay(100)
                .attr('transform', `translate(${0}, ${xLabelPos})`)
                .style('opacity', 1)

        } else {
            vis.xAxis
                .transition()
                .delay(0)
                .duration(pan ? 0 : 1000)
                .attr('transform', `translate(${0}, ${xLabelPos})`)
                .call(xAxisCall.scale(vis.xScale))
                .style('opacity', 1)
        }

        ///////////////////////////////////////////////////////
        // y axis 
        ///////////////////////////////////////////////////////
        const yAxisCall = d3.axisLeft()
            .ticks(10)
            .tickFormat(e => {
                return d3.format(',')(e)
            })

        if (vis.draws === 1) {
            vis.yAxis
                .attr('transform', `translate(${-vis.MARGIN.left / 4},0)`)
                .call(yAxisCall.scale(vis.yScale).tickSizeOuter([0]))
                .style('opacity', 0)
                .transition()
                .delay(100)
                .duration(2500)
                .style('opacity', 1)

        } else {
            vis.yAxis
                .transition()
                .delay(0)
                .duration(1000)
                .attr('transform', `translate(${-vis.MARGIN.left / 4},0)`)
                .call(yAxisCall.scale(vis.yScale).tickSizeOuter([0]))
                .style('opacity', 1)
        }

        ///////////////////////////////////////////////////////
        // white box 
        ///////////////////////////////////////////////////////
        vis.whiteBox
            .attr("width", vis.MARGIN.left * 1.22)
            .attr('height', vis.height)
            .attr('x', -vis.MARGIN.left)

        ///////////////////////////////////////////////////////
        // text elements
        ///////////////////////////////////////////////////////
        vis.textLabel
            .attr('y', 6)
            .attr('text-anchor', 'middle')
            .attr('x', vis.gWIDTH / 2)

        vis.zoomText
            .attr('x', vis.gWIDTH * .91)
            .attr('y', vis.MARGIN.top * .2)
            .style('text-anchor', 'end')
            .on('click', this.zoomIn.bind(this))
            .call(fadeUp)

        vis.zoomText1
            .attr('x', vis.gWIDTH)
            .attr('y', vis.MARGIN.top * .2)
            .style('text-anchor', 'end')
            .on('click', this.zoomOut.bind(this))
            .call(fadeUp)

        function fadeUp(el) {
            el.transition()
                .duration(vis.draws === 1 ? 1000 : 0)
                .style('opacity', 1)
        }
        ////////////////////
        ///////////////
        ////////////
    } // end redraw


    zoomIn() {
        const vis = this;
        if (!vis.zoomed) {
            vis.zoomed = true;
            vis.wrangle(vis.oldLowDate, vis.oldHighDate);
            document.querySelector('nbc-line-graph .touch-layer').style.cursor = `ew-resize`;
        }
    }

    zoomOut() {
        const vis = this;

        if (vis.zoomed) {
            vis.zoomed = false;

            vis.oldLowDate = vis.lowDate;
            vis.oldHighDate = vis.highDate;

            vis.wrangle(); // EXTENT OF THE DATA ON THE X-AXIS (with default args)
            document.querySelector('nbc-line-graph .touch-layer').style.cursor = `default`;
        }
    }


    _setData = () => {
        const vis = this;
        vis.raw = JSON.parse(vis.getAttribute('data'))

        vis.data = []

        if (vis.raw) {

            vis.dates = []
            vis.raw.forEach(d => {
                if (vis.dates.includes(d.date))
                    null
                else
                    vis.dates.push(d.date)
            })

            vis.dates.forEach(date => {
                let total = 0

                vis.raw.filter(d => d.date === date).forEach(state => {
                    total += Number(state.deaths)
                })

                vis.data.push({ date: date, deaths: total })
            })

            vis.data.forEach(el => {
                el.date = new Date(el.date)
            });

            console.log(vis.data)

            // vis.wrangle();
            vis._setupZoomValues()
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
window.customElements.define('nbc-line-graph', nbcLineGraph);