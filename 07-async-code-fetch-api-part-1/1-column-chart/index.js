import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ColumnChart {
  chartHeight = 50;

  constructor({
    url = '',
    label = '',
    link = '',
    formatHeading = value => value,
    range = {from: new Date(), to: new Date()}
  } = {}) {
    this.url = new URL(url, BACKEND_URL);
    this.label = label;
    this.link = link;
    this.formatHeading = formatHeading;
    this.range = range;

    this.render();
    this.update(range.from, range.to);
  }

  setChartLoading(isLoading) {
    if (isLoading) {
      this.element.classList.add("column-chart_loading");
    } else {
      this.element.classList.remove("column-chart_loading");
    }
  }

  getData(from, to) {
    this.url.searchParams.set('from', from.toISOString());
    this.url.searchParams.set('to', to.toISOString());

    return fetchJson(this.url, {method: "GET"})
      .then((data) => data, (error) => alert(`Error: ${error.message}`));
  }


  getTitle() {
    return `
        <div class="column-chart__title">
          Total ${this.label && this.label}
          ${this.link ? `<a href="/${this.link}" class="column-chart__link">View all</a>` : ''}
        </div>
    `;
  }

  getHeaderValue(data = []) {
    const sumValue = data.reduce((acc, val) => acc + val, 0);
    const intlValue = new Intl.NumberFormat().format(sumValue);
    return this.formatHeading ? this.formatHeading(intlValue) : intlValue;
  }

  getHeaderTemplate() {
    return `<div data-element="header" class="column-chart__header">${this.getHeaderValue()}</div>`;
  }

  getBodyValue(data = []) {
    const maxValue = Math.max(...data);
    const scaleValue = this.chartHeight / maxValue;

    return data.map((value) => {
      const chartValue = Math.floor(scaleValue * value);
      const chartPercent = (value / maxValue * 100).toFixed(0);

      return `<div style="--value: ${chartValue}" data-tooltip="${chartPercent}%"></div>`;
    }).join('');
  }

  getBodyTemplate() {
    return `<div data-element="body" class="column-chart__chart">${this.getBodyValue()}</div>`;
  }

  getSubElements(container) {
    const elements = container.querySelectorAll('[data-element]');

    return Array.from(elements).reduce((acc, el) => {
      acc[el.dataset.element] = el;
      return acc;
    }, {});
  }

  get chartTemplate() {
    return `
      <div class="column-chart column-chart_loading" style="--chart-height: ${this.chartHeight}">
        ${this.getTitle()}
        <div class="column-chart__container">
          ${this.getHeaderTemplate()}
          ${this.getBodyTemplate()}
        </div>
      </div>
    `;
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.chartTemplate;

    this.element = wrapper.firstElementChild;
    this.subElements = this.getSubElements(this.element);
  }

  async update(from, to) {
    this.setChartLoading(true);

    const newData = await this.getData(from, to);
    const values = Object.values(newData);

    if (!values || values.length === 0) {
      return;
    }

    this.subElements.header.textContent = this.getHeaderValue(values);
    this.subElements.body.innerHTML = this.getBodyValue(values);
    this.setChartLoading(false);

    return newData;
  }

  destroy() {
    this.remove();

    this.element = null;
    this.data = null;
    this.label = null;
    this.value = null;
    this.link = null;
    this.formatHeading = null;
    this.subElements = {};
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }
}
