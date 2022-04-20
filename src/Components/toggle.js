class nbcToggle extends HTMLElement {
    constructor() {
        super();
        this.setAttribute('class', 'toggle')

        this.innerHTML = `
                <div class='active' style='padding-left: 8%;'>SCATTER PLOT</div>
                <div>BAR CHART</div>
                <div>LINE GRAPH</div>
        `;
    }

    connectedCallback() {
        this.querySelectorAll('div').forEach((el, i) => el.addEventListener('click', () => this._handleClick(el, i)))
    }

    _handleClick(el, numb) {
        const elementsToFade = document.querySelectorAll("." + this.getAttribute('fade'))

        this.querySelectorAll('div').forEach((el, i) => {
            if (i === numb) {
                el.classList.add('active')

                if (elementsToFade[i])
                    elementsToFade[i].classList.add('active')
            } else {
                el.classList.remove('active')

                if (elementsToFade[i])
                    elementsToFade[i].classList.remove('active')
            }
        })

        if (numb === 1)
            document.querySelector('nbc-bar-chart').redraw();
        else if (numb === 2)
            document.querySelector('nbc-line-graph').wrangle();

    }

}
window.customElements.define('nbc-toggle', nbcToggle);