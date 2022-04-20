class NBCheader extends HTMLElement {
    constructor() {
        super();
        this.setAttribute('class', 'df header')
    }

    connectedCallback() {
        this.innerHTML = `
            <img src='https://img3.wikia.nocookie.net/__cb20140723175701/logopedia/images/thumb/d/d2/Nbc_small.png/150px-Nbc_small.png'/>
            <div class='df'>
            <h1>NBC Data Viz Code Challenge <span>by Joe Schwehr</span></h1>
            
            </div>
        `;
    }
}
window.customElements.define('nbc-header', NBCheader);