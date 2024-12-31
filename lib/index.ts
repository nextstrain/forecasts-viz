
console.log("lib.ts")

import * as tmpData from "../data/clades.mlr.json";
import { parseModelData } from "./parseModelData.js";
import { D3Graph } from "./d3Graph.js";
import { displayTopVariants } from "./tooltipDisplay.js";
import * as d3 from "d3";

class Evofr extends HTMLElement {
  // static observedAttributes = ["fillattr"];
  // svg: SVGElement;
  // circle: SVGElement;
  // colours: string[] = ['#d7191c', '#fdae61', '#ffffbf', '#abdda4', '#2b83ba']
  // colourIdx: number = 0;
  controls: EvofrControls | null;
  modelData = parseModelData("mlr.json", tmpData, undefined, undefined, undefined);

  constructor() {
    super();
    console.log("Evofr::constructor", this)
    this.controls = this.querySelector('evofr-controls') || null;
    console.log(this.controls)
    window.queueMicrotask(() => console.log(this.controls?.controls.logit))

    // console.log(this.querySelector('coloured-button'), this)
    // this.innerHTML = ''
    window.queueMicrotask(() => this.addGraph())
  }




  // new D3Graph(dom, sizes, modelData, params, options);

  addGraph() {
    const container = this.appendChild(document.createElement("div"))
    const graph = new D3Graph(
      container, 
      {'left': 20, right: 20, 'top': 20, 'bottom': 20, 'height': 500, 'width': 500},
      this.modelData,
      { location: 'Australia',
        graphType: "lines", key: 'freq', interval : ['freq_HDI_95_lower', 'freq_HDI_95_upper'], intervalOpacity: 0.2, 
        tooltipXY: displayTopVariants({fmt: d3.format(".1%")}), yDomain: [0, 1], yTickFmt: d3.format(".0%"), forecastLine: true},
      {logit: this.controls?.controls.logit}
    )
    this.controls?.register(graph)
  }

  // attributeChangedCallback(name, oldValue, newValue) {
  //   console.log(`Attribute ${name} has changed from ${oldValue} to ${newValue}`);
  //   this.changeColour(newValue)
  // }

  // changeColour(provided=null) {
  //   const colour = provided || this.getColour()
  //   this.circle.setAttribute('fill', colour);

  //   const event = new CustomEvent('colouredButtonEvent', {
  //     bubbles: true,
  //     cancelable: true,
  //     detail: `Colour is now ${colour}`
  //   });
  //   this.dispatchEvent(event);
  // } 

  // getColour() {
  //   if (++this.colourIdx===this.colours.length) this.colourIdx=0;
  //   return this.colours[this.colourIdx]
  // }
}


customElements.define('evofr-viz', Evofr);


class EvofrControls extends HTMLElement {
  controls = {
    'logit': false
  }
  panels: any[] = []
  constructor() {
    super();
    console.log("Evofr::constructor", this)
    console.log("\t", this.getAttribute("logit"))
    this.button()
  }
  register(d3obj) {
    this.panels.push(d3obj)
  }
  button() {
    const b = this.appendChild(document.createElement('button'))
    b.innerHTML = `logit ${this.controls.logit ? 'ON' : 'OFF'}`
    b.addEventListener('click', () => { // fat-arrow means this is not rebound
      this.controls.logit = !this.controls.logit;
      b.innerHTML = `logit ${this.controls.logit ? 'ON' : 'OFF'}`
      this.panels.forEach((graph) => {
        graph.updateScale({logit: this.controls.logit})
      })
    })
  }
}

customElements.define('evofr-controls', EvofrControls)

