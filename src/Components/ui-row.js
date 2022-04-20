class nbcUIrow extends HTMLElement {
    constructor() {
        super();
        this.setAttribute('id', 'ui-row')
        this.style.transition = '.3s opacity ease-in-out'
        this.style.opacity = 0

        this.innerHTML = `
            <div class='df'>
                <div class='df'>
                    <div>U.S. population:</div>
                    <div id='usa-pop' class='bold ml'>${this.getAttribute("usa-pop")}</div>
                </div>
            
                <div class='df'>
                    <div>Total cases:</div>
                    <div id='total-cases' class='bold ml'>${this.getAttribute("total-cases")}</div>
                </div>
            
                <div class='df'>
                    <div>Cases per 100K:</div>
                    <div id='nice-cases' class='bold ml'>${this.getAttribute("nice-cases")}</div>
                </div>
            </div>
        
            <nbc-toggle fade='chart'></nbc-toggle>
        `;
    }

    // connectedCallback() {

    // }

    _setAttr = (name) => {
        this.querySelector(`#${name}`).innerHTML = this.getAttribute(name)

        if (this.getAttribute(name))
            this.style.opacity = 1
    }

    attributeChangedCallback(name, oldVal, newVal) {
        this._setAttr(name)
    }
    static get observedAttributes() {
        return ['usa-pop', 'total-cases', 'nice-cases']
    }
}
window.customElements.define('nbc-ui-row', nbcUIrow);