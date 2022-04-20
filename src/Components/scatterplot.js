class nbcScatterPlot extends HTMLElement {
    constructor() {
        super();
        this.setAttribute('class', 'chart')

        this.draws = 0;
        this.data = this.getAttribute('data');
        this.isPlaying = false;
        this.once = true; // stops playback after one loop
    }

    connectedCallback() {

        this.innerHTML = `
            <style>
                .img-holder {
                    position: absolute;
                    display: flex;
                    align-items: center;
                    padding: 2%;
                    cursor: pointer;
                    transition: .3s opacity ease-in-out;
                }
        
                .img-holder img {
                    margin-right: 4px;
                }

                .dot {
                    fill: rgb(222, 222, 222);
                    transition: .3s fill ease-in-out;
                    cursor: pointer;
                }

                .info-box {
                    background-color: #FFFFFF;
                    box-shadow: 1px 15px 20px #00000030;
                    position: absolute;
                    height: fit-content;
                    padding: 1.5% 2%;
                    padding-top: 1%;
                    transition: .3s opacity ease-in-out;
                    opacity: 0;
                    pointer-events: none;
                    z-index: 1;
                    width: fit-content;
                    cursor: pointer;
                }

                .info-box::after {
                    content: '';
                    position: absolute;
                    left: 50%;
                    top: 100%;
                    width: 0;
                    height: 0;
                    border-left: 10px solid transparent;
                    border-right: 10px solid transparent;
                    border-top: 12px solid white;
                    margin-left: -9px;
                    clear: both;
                    pointer-events: none;
                }
        
                .info-box.on {
                    opacity: 1;
                    pointer-events: all;
                }

                nbc-scatter-plot #popup-California {
                    transform: translateY(-20px);
                }
    
            </style>
        `
        this.classList.add(this.getAttribute('default-class'))
        this.initVis();
    }

    initVis() {
        const vis = this;

        // CHART
        vis.chartDiv = vis.parentElement
        vis.svg = d3.select(vis).append("svg").attr('id', 'nbc-scatter-plot');

        // APPEND G
        vis.g = vis.svg
            .append('g')
            .attr('class', 'scatter-plot-main-group')

        // APPEND GROUP FOR DOTS
        vis.dots = vis.g.append('g').attr('class', 'dots')

        // APPEND MAIN TITLE
        vis.mainTitle = vis.g.append('text')
            .attr('class', 'p-16 bold')
            .style('opacity', 0)

        // APPEND SUBTITLE
        vis.subTitle = vis.g.append('text')
            .attr('class', 'p-14')
            .style('opacity', 0)

        // APPEND SUBTITLE
        vis.subTitle1 = vis.g.append('text')
            .attr('class', 'p-14')
            .style('opacity', 0)

        // APPEND PLAY "BUTTON"
        vis.playText = vis.g.append('text')
            .attr('id', 'play-text')
            .attr('class', 'p-18 bold')
            .style('cursor', 'pointer')
            .text('CLICK TO START ANIMATION')
            .style('opacity', 0)

        // APPEND X AXIS 
        vis.xAxis = vis.g
            .append('g')
            .attr('class', 'axis x-axis p-18 demi')

        // APPEND Y AXIS 
        vis.yAxis = vis.g
            .append('g')
            .style('text-anchor', 'end')
            .attr('class', 'axis y-axis p-18 demi')

        // APPEND Y-LABEL
        vis.titleSide = d3.select(vis).append("div")
            .attr('class', 'p-18 demi')
            .style('position', 'absolute')
            .style('transform', 'rotate(270deg)')
            .html("Cases")
            .style('opacity', 0)

        // APPEND X-LABEL
        vis.titleBottom = d3.select(vis).append("div")
            .attr('class', 'p-18 demi')
            .style('position', 'absolute')
            .html("Deaths")
            .style('opacity', 0)

        // APPEND DIV CONTAINER FOR POPUP DIVS
        vis.popups = d3.select(vis).append('div').attr('class', 'popups')

        if (vis.data) {
            vis.redraw();
        }
    }

    redraw(currentDate = '2020-05-08') {
        const vis = this;

        vis.currentDate = currentDate;

        // retry if data unavailable
        if (!vis.data && !vis.statePopulations) {
            setTimeout(() => {
                vis.redraw()
            }, 222);
            return
        }

        const currentData = vis.data.filter(d => d.date === currentDate);

        const narrowScreen = window.innerWidth < 1100;

        // Extract the width and height that was computed by CSS.
        vis.width = vis.chartDiv.clientWidth;
        vis.height = vis.chartDiv.clientHeight;
        vis.bottom = vis.height * .11;
        vis.top = 18;
        vis.MARGIN = { top: vis.top, right: vis.width * .015, bottom: vis.bottom, left: vis.width * .09 };
        vis.gWIDTH = vis.width - (vis.MARGIN.left + vis.MARGIN.right);
        vis.gHEIGHT = vis.height - (vis.MARGIN.top + vis.MARGIN.bottom);

        vis.draws += 1;

        // Use the extracted size to set the size of an SVG element.
        vis.svg
            .attr("width", vis.width)
            .attr("height", vis.height);

        // SET G
        vis.g.attr('width', vis.gWIDTH)
            .attr('height', vis.gHEIGHT)
            .attr('transform', 'translate(' + vis.MARGIN.left + ',' + vis.MARGIN.top + ')');

        ///////////////////////////////////////////////////////
        // Y SCALE
        ///////////////////////////////////////////////////////
        let yMax = d3.max(currentData, d => Number(d.cases));
        if (yMax < 10000)
            yMax = 10000;
        let yMin = 0;

        vis.yScale = d3.scaleLinear()
            .range([vis.gHEIGHT, 0])
            .domain([yMin, yMax * 1.1])
        ///////////////////////////////////////////////////////
        // X SCALE
        ///////////////////////////////////////////////////////
        let xMax = d3.max(currentData, d => Number(d.deaths));
        if (xMax < 5000)
            xMax = 5000;
        vis.xScale = d3
            .scaleLinear()
            .domain([0, xMax * 1.1])
            .range([0, vis.gWIDTH])

        ///////////////////////////////////////////////////////
        //////////////////////////////// X AXIS
        ///////////////////////////////////////////////////////
        const xAxisCall = d3.axisBottom()
            .tickSizeOuter([0])
            .ticks(10)
            .tickPadding(7)
            .tickFormat(e => d3.format(',')(e))

        if (vis.draws === 1) {
            vis.xAxis
                .call(xAxisCall.scale(vis.xScale))
                .attr('transform', `translate(${0}, ${vis.yScale(yMin)})`)
                .attr('opacity', 0)
                .transition()
                .duration(2500)
                .delay(100)
                .attr('opacity', 1)
                .attr('transform', `translate(${0}, ${vis.yScale(yMin)})`)
        } else {
            vis.xAxis
                .attr('opacity', 1)
                .attr('transform', `translate(${0}, ${vis.yScale(yMin)})`)
                .call(xAxisCall.scale(vis.xScale))
        }

        ///////////////////////////////////////////////////////
        //////////////////////////////// Y AXIS
        ///////////////////////////////////////////////////////
        let xOffset = narrowScreen ? 9 : 10;
        const yAxisCall = d3.axisLeft()
            .ticks(10)
            .tickPadding(vis.MARGIN.left * .05)
            .tickFormat(e => d3.format(',')(e))

        if (vis.draws === 1) {
            vis.yAxis
                .attr('transform', `translate(${0},0)`)
                .call(yAxisCall.scale(vis.yScale).tickSizeOuter([0]))
                .attr('opacity', 0)
                .transition()
                .delay(0)
                .duration(1000)
                .attr('opacity', 1)
        } else {
            vis.yAxis
                .attr('transform', `translate(${0},0)`)
                .call(yAxisCall.scale(vis.yScale).tickSizeOuter([0]))
                .attr('opacity', 1)
        }


        ///////////////////////////////////////////////////////
        // DOTS
        ///////////////////////////////////////////////////////
        const dots = vis.dots.selectAll('.dot').data(currentData)

        dots.exit().remove()

        dots
            .attr('id', (d, i) => d.state.replaceAll(' ', '-'))
            .attr('cases', (d, i) => d.cases)
            .attr('deaths', (d, i) => d.deaths)
            .attr('class', 'dot')
            .style('fill', 'rgba(111, 222, 222, .5)')
            .style('stroke', 'rgba(111,111,111,.2)')
            .transition()
            .duration(0)
            .attr('cx', d => vis.xScale(d.deaths))
            .attr('cy', d => vis.yScale(d.cases))
            .attr('r', d => vis.statePopulations[d.state] ? Number(vis.statePopulations[d.state]) * .0000011 : vis.gWIDTH * .01)

        dots
            .enter()
            .append('circle')
            .attr('id', (d, i) => d.state.replaceAll(' ', '-'))
            .attr('cases', (d, i) => d.cases)
            .attr('deaths', (d, i) => d.deaths)
            .attr('class', 'dot')
            .style('fill', 'rgba(111, 222, 222, .5)')
            .style('stroke', 'rgba(111,111,111,.2)')
            .style('stroke-width', '1px')
            .attr('cx', d => vis.xScale(d.deaths))
            .attr('cy', d => vis.yScale(d.cases))
            .on('mouseover', (d, i, n) => hover(n[i]))
            .on('mouseout', (d, i, n) => hoverOut(n[i]))
            .on('click', (d, i, n) => clicked(n[i]))
            .transition()
            .duration(1000)
            .attr('r', 0)
            .delay((d, i) => 111 + i * 11)
            .attr('r', d => vis.statePopulations[d.state] ? Number(vis.statePopulations[d.state]) * .0000011 : vis.gWIDTH * .01)

        ///////////////////////////////////////////////////////
        // DOT FUNCTIONS FOR USER INTERACTIONS
        ///////////////////////////////////////////////////////
        function clicked(el) {
            // var mouse = d3.mouse(this);
            d3.event.stopPropagation();

            if (el.hasAttribute('clicked')) {
                el.removeAttribute('clicked')
            } else {
                el.setAttribute('clicked', 'true');
            }
        }

        function hover(dot) {
            // var mouse = d3.mouse(this);
            const currentPopup = document.querySelector('#popup-' + dot.id)

            // show info box
            currentPopup.classList.add('on')
        }

        function hoverOut(dot) {
            if (dot.hasAttribute('clicked')) return

            // hide box
            const currentPopup = document.querySelector('#popup-' + dot.id)
            currentPopup.classList.remove('on')
        }

        ///////////////////////////////////////////////////////
        // POSITION TITLES
        ///////////////////////////////////////////////////////
        vis.mainTitle
            .attr('x', vis.MARGIN.left * .1)
            .attr('y', vis.MARGIN.top * .2)
            .text('State COVID cases vs COVID deaths (' + currentDate + ')')
            .call(fadeUp)

        vis.subTitle
            .attr('x', vis.MARGIN.left * .1)
            .attr('y', vis.MARGIN.top * .2)
            .attr('dy', vis.gHEIGHT * .0275)
            .text('The dot size is determined by state population')
            .call(fadeUp)

        vis.subTitle1
            .attr('x', vis.MARGIN.left * .1)
            .attr('y', vis.MARGIN.top * .2)
            .attr('dy', vis.gHEIGHT * .054)
            .text('Hover over the dots to see a popup')
            // .style('text-anchor', 'middle')
            .call(fadeUp)

        vis.playText
            .attr('x', vis.gWIDTH)
            .attr('y', vis.MARGIN.top * .2)
            .style('text-anchor', 'end')
            .on('click', this.togglePlay.bind(this))
            .call(fadeUp)

        function fadeUp(el) {
            el.transition()
                .duration(vis.draws === 1 ? 1000 : 0)
                .style('opacity', 1)
        }

        vis.titleSide
            .style('left', -vis.MARGIN.left * .02 + 'px')
            .style('top', '46%')
            .style('margin-top', -vis.titleSide.node().clientHeight + 'px')
            .call(fadeUp)

        vis.titleBottom
            .style('left', vis.gWIDTH / 2 + vis.MARGIN.left + 'px')
            .style('margin-left', -vis.titleBottom.node().clientWidth / 2 + "px")
            .style('top', vis.height * .988 + 'px')
            .style('margin-top', -vis.titleSide.node().clientHeight + 'px')
            .call(fadeUp)

        ///////////////////////////////////////////////////////
        // ATTACH POPUPS
        ///////////////////////////////////////////////////////
        vis.infoBox = vis.popups
            .selectAll('.info-box')
            .data(currentData)

        vis.infoBox.exit().remove()

        vis.infoBox
            .attr('class', 'info-box')
            .attr('id', d => 'popup-' + d.state.replaceAll(' ', '-'))
            .html(d => `
                <div class='p-22 bold''>
                    ${d.state}
                </div>

                <div style='margin-top:2%;' class='p-12 normal'>${vis.statePopulations[d.state] ? "Population: " + d3.format(',')(vis.statePopulations[d.state]) : ''}</div>

                <div class="p-16" style='margin-top: 5%'>
                    Cases: ${d3.format(',')(d.cases)}
                </div>
                <div class='p-16' style='margin-top: 5%;'>
                    Deaths: ${d3.format(',')(d.deaths)}
                </div>
            `)
            .style('left', d => vis.xScale(d.deaths) + vis.MARGIN.left + 'px')
            .style('top', d => vis.yScale(d.cases) + 'px')
            .style('margin-top', d => -document.getElementById('popup-' + d.state.replaceAll(' ', '-')).clientHeight - 2 + 'px')
            .style('margin-left', d => -document.getElementById('popup-' + d.state.replaceAll(' ', '-')).clientWidth / 2 + 'px')

        vis.infoBox
            .enter()
            .append('div')
            .attr('class', 'info-box')
            .attr('id', d => 'popup-' + d.state.replaceAll(' ', '-'))
            .on('click', (d, i, n) => hide(n[i]))
            .html(d => `
                <div class='p-22 bold''>
                    ${d.state} 
                </div>

                <div style='margin-top:2%;' class='p-12 normal'>${vis.statePopulations[d.state] ? "Population: " + d3.format(',')(vis.statePopulations[d.state]) : ''}</div>

                <div class="p-16" style='margin-top: 5%'>
                    Cases: ${d3.format(',')(d.cases)}
                </div>
                <div class='p-16' style='margin-top: 5%;'>
                    Deaths: ${d3.format(',')(d.deaths)}
                </div>
                <div class='p-16' style='margin-top: 5%;'>
                    Deaths: ${d3.format(',')(d.deaths)}
                </div>
            `)
            .style('left', d => vis.xScale(d.deaths) + vis.MARGIN.left + 'px')
            .style('top', d => vis.yScale(d.cases) + 'px')
            .style('margin-top', d => -document.getElementById('popup-' + d.state.replaceAll(' ', '-')).clientHeight - 2 + 'px')
            .style('margin-left', d => -document.getElementById('popup-' + d.state.replaceAll(' ', '-')).clientWidth / 2 + 'px')

        ///////////////////////////////////////////////////////
        // FUNCTION FOR POPUP CLICKED
        ///////////////////////////////////////////////////////
        function hide(box) {
            box.classList.remove('on')
            document.getElementById(box.id.replace('popup-', '')).removeAttribute('clicked')
        }

    } // end redraw

    _setData = () => {
        const vis = this;
        vis.data = JSON.parse(vis.getAttribute('data'))

        if (vis.data) {
            vis.dates = []
            vis.data.forEach(d => {
                if (vis.dates.includes(d.date))
                    null
                else
                    vis.dates.push(d.date)
            })

            if (vis.statePopulations)
                vis.redraw();
        }
    }

    _setPopulationData = () => {
        const vis = this;
        vis.statePopulations = JSON.parse(vis.getAttribute('state-pops'))

        if (vis.data)
            vis.redraw()
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (name === 'data')
            this._setData()
        else if (name === 'state-pops')
            this._setPopulationData()
    }
    static get observedAttributes() {
        return ['data', 'state-pops']
    }

    togglePlay() {
        const vis = this;
        vis.isPlaying = !vis.isPlaying;

        if (vis.isPlaying) {
            document.getElementById('play-text').innerHTML = 'CLICK TO STOP ANIMATION'
            vis.playingInterval = setInterval(() => {
                console.log('interval')

                const currentIndex = vis.dates.indexOf(vis.currentDate)
                if (currentIndex < vis.dates.length - 1) {
                    vis.redraw(vis.dates[currentIndex + 1])

                } else {
                    if (vis.once) {
                        vis.redraw(vis.dates[0])
                        vis.once = false
                    } else {
                        this._stopAnimation()
                        vis.once = true;
                        vis.isPlaying = !vis.isPlaying;
                    }
                }

            }, 100);
        } else {
            this._stopAnimation()
        }
    }

    _stopAnimation() {
        document.getElementById('play-text').innerHTML = 'CLICK TO START ANIMATION'
        clearInterval(this.playingInterval)
    }

}
window.customElements.define('nbc-scatter-plot', nbcScatterPlot);