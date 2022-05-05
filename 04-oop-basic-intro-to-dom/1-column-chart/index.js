export default class ColumnChart {
  MAX_COLUMN_SIZE = 50;

  constructor({ label, value, link, data, formatHeading }) {
    this.data = data;
    this.label = label;
    this.value = value;
    this.link = link;
    this.formatHeading = formatHeading;

    this.render();
  }

  getTitleTemplate() {
    let link = '';

    if (this.link) {
      link = `<a href="/${this.link}" class="column-chart__link">View all</a>`;
    }

    return `
        <div class="column-chart__title">
        Total ${this.label}
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
    const cols = this.data.map((value) =>
      `<div style="--value: ${this.MAX_COLUMN_SIZE * value / 100}" data-tooltip="${value}%"></div>`
    );

    return `<div data-element="body" class="column-chart__chart">${cols.join('')}</div>`;
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
    const wrapper = document.createElement('div');
    wrapper.className = "column-chart";
    wrapper.style.cssText = `--chart-height: ${this.MAX_COLUMN_SIZE}`;

    if (this.data.length === 0) {
      wrapper.classList.add('column-chart_loading');
    }
    wrapper.innerHTML = this.getChartTemplate();

    this.element = wrapper;
  }

  update(data) {
    this.data = data;
    this.render();
  }
}
