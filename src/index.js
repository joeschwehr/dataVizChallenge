// import "./styles.css";
// import * as d3 from "d3";
// import csv from "../data/covid.csv";
// import statesPopulation from "../data/states-population.json";

document.getElementById("app").innerHTML = `
  <nbc-header></nbc-header>

  <nbc-ui-row usa-pop='' total-cases='' nice-cases=''></nbc-ui-row>

  <div id='vis-container'>
    <nbc-scatter-plot default-class='active'></nbc-scatter-plot>
    <nbc-bar-chart class='chart'></nbc-bar-chart>
    <nbc-line-graph class='chart'></nbc-line-graph>
  </div>
`;

/* ROUND 1` - Data Transformations
  1) Use the data in data/covid.csv to create a json object of the covid data
  2) Use the data in data/states-population.json and the data
    you created in step 1 to calculate the cases per 100K
*/
// imports

(async () => {

  const res = await fetch('./data/covid.csv')
  const csv = await res.text();
  const resp = await fetch('./data/states-population.json')
  const statesPopulation = await resp.json();
  roundOne();

  function roundOne() {
    const csvData = formatCsv(csv);
    console.log(csvData)
    document.querySelector("nbc-scatter-plot").setAttribute('data', JSON.stringify(csvData))
    document.querySelector("nbc-scatter-plot").setAttribute('state-pops', JSON.stringify(statesPopulation))

    document.querySelector("nbc-bar-chart").setAttribute('data', JSON.stringify(csvData))

    document.querySelector("nbc-line-graph").setAttribute('data', JSON.stringify(csvData))


    const USpopulation = getCountryPopulation(statesPopulation);
    const totalCases = getTotalCases(csvData);
    const casesPerOnehundredThousand = (totalCases / USpopulation) * 100000;
    const niceCases = d3.format(",")(
      Math.round(casesPerOnehundredThousand * 10) / 10
    );
    document.querySelector("nbc-ui-row").setAttribute('usa-pop', d3.format(",")(USpopulation))
    document.querySelector("nbc-ui-row").setAttribute('total-cases', d3.format(",")(totalCases))
    document.querySelector("nbc-ui-row").setAttribute('nice-cases', niceCases)
  }

  function getTotalCases(data) {
    // returns total number of COVID cases in US
    let total = 0;
    data.forEach((d) => (total += Number(d.cases)));
    return total;
  }

  function getCountryPopulation(statesPopulation) {
    // returns total US population
    const states = Object.keys(statesPopulation);
    let countryPopulation = 0;
    states.forEach((state) => (countryPopulation += statesPopulation[state]));
    return countryPopulation;
  }

  function formatCsv(csv) {
    // takes csv data
    // formats csv into json
    // returns json object

    const output = [];

    const keys = csv.split("\n")[0].split(",");

    // we could get total cases here
    // but I'm going to keep this function pure
    // let totalCases = 0;
    csv
      .split("\n")
      .slice(1)
      .forEach((row) => {
        // totalCases += Number(row.split(",")[3]);

        const item = {};
        keys.forEach((key, i) => {
          item[key] = row.split(",")[i];
        });
        output.push(item);
      });

    // console.log(d3.format(",")(totalCases));

    return output;
  }
})()

/* ROUND 2 - UI Building
 1) Use the COVID-19 states data supplied to render a data visualization of your choosing, ie
 - Bar Graph
 - Line Graph
 - ScatterPlot, etc

2) Ensure data visualization is annotated

3) Create an user generated interaction (click on a bar, show some information)

*/

window.addEventListener("resize", () => redraw());

function redraw() {
  document.querySelector('nbc-scatter-plot').redraw();
  document.querySelector('nbc-bar-chart').redraw();
  document.querySelector('nbc-line-graph').wrangle();
}

