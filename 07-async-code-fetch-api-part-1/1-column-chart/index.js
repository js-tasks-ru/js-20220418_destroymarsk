import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ColumnChart {
  chartHeight = 50;

  constructor({ data = [], value = '', formatHeading = value => value, url, range, label, link } = {}) {
    this.data = data;
    this.label = label || 0;
    this.value = value;
    this.link = link;
    this.url = url;
    this.range = range;
    this.formatHeading = formatHeading;

    this.render();
    this.getDataFromServer();
  }

  getDataFromServer() {
    if (!this.url) {
      return;
    }

    const {from, to} = this.range;
    if (!from || !to) {
      return;
    }

    this.element.classList.add("column-chart_loading");

    const params = new URLSearchParams({from: from.toISOString(), to: to.toISOString()});
    const url = `${BACKEND_URL}/${this.url}?${params}`;

    fetchJson(url, {method: "GET"})
      .then((data) => {
        this._updateElement(Object.values(data));
      })
      .catch((error) => alert(`Error: ${error.message}`));
  }

  getTitleTemplate() {
    let link = '';

    if (this.link) {
      link = `<a href="/${this.link}" class="column-chart__link">View all</a>`;
    }

    return `
        <div class="column-chart__title">
        Total ${this.label && this.label}
        ${link}
        </div>
    `;
  }

  getHeaderTemplate() {
    const intlValue = new Intl.NumberFormat().format(this.value);
    const headerData = this.formatHeading ? this.formatHeading(intlValue) : intlValue;

    return `<div data-element="header" class="column-chart__header">${headerData}</div>`;
  }

  getBodyTemplate() {
    const maxValue = Math.max(...this.data);
    const scaleValue = this.chartHeight / maxValue;

    const cols = this.data.map((value) => {
      const chartValue = Math.floor(scaleValue * value);
      const chartPercent = (value / maxValue * 100).toFixed(0);

      return `<div style="--value: ${chartValue}" data-tooltip="${chartPercent}%"></div>`;
    });

    return `<div data-element="body" class="column-chart__chart">${cols.join('')}</div>`;
  }

  getSubElements(container) {
    const elements = container.querySelectorAll('[data-element]');

    return Array.from(elements).reduce((acc, el) => {
      acc[el.dataset.element] = el;
      return acc;
    }, {});
  }

  getChartTemplate() {
    return `
      ${this.getTitleTemplate()}
      <div class="column-chart__container">
        ${this.getHeaderTemplate()}
        ${this.getBodyTemplate()}
      </div>
    `;
  }

  render() {
    const wrapper = document.createElement("div");
    wrapper.className = "column-chart";
    wrapper.style.cssText = `--chart-height: ${this.chartHeight}`;

    if (!this.data || this.data.length === 0) {
      wrapper.classList.add("column-chart_loading");
    }
    wrapper.innerHTML = this.getChartTemplate();

    this.element = wrapper;
    this.subElements = this.getSubElements(this.element);
  }

  _updateElement(data) {
    this.data = data;
    if (!this.data || this.data.length === 0) {
      return;
    }
    this.value = this.data.reduce((acc, val) => acc + val, 0);

    this.element.innerHTML = this.getChartTemplate();
    this.element.classList.remove("column-chart_loading");
  }

  update(from, to) {
    this.range = {from, to};
    this.getDataFromServer();
  }

  destroy() {
    this.remove();

    this.element = null;
    this.data = null;
    this.label = null;
    this.value = null;
    this.link = null;
    this.formatHeading = null;
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }
}
