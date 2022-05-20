export default class SortableTable {
  constructor(headersConfig = [], {
    data = [],
    sorted
  } = {}) {
    this.headerConfig = headersConfig;
    this.data = data;
    this.subElements = {};
    this.sorted = sorted;

    this.render();
  }

  handleSortClick(event) {
    const target = event.target;
    const sortableElement = target.closest('[data-sortable="true"]');

    if (!sortableElement) return;
    const sortableId = sortableElement.dataset.id;

    switch (sortableElement.dataset.order) {
      case 'asc':
        this.sort(sortableId, 'desc');
        break;
      case 'desc':
        this.sort(sortableId, 'asc');
        break;
      default:
        this.sort(sortableId, 'asc');
    }
  }

  getHeaderElement() {
    const header = document.createElement('div');
    header.dataset.element = 'header';
    header.className = 'sortable-table__header sortable-table__row';

    const cols = this.headerConfig.map(({sortable = false, title = '', id = ''}) => `
      <div class="sortable-table__cell" data-id="${id}" data-sortable="${sortable}">
        <span>${title}</span>
      </div>
    `);

    header.innerHTML = cols.join('');
    header.addEventListener('pointerdown', this.handleSortClick.bind(this));

    return header;
  }

  getBodyElement(sortedData = this.data) {
    const body = document.createElement('div');
    body.dataset.element = 'body';
    body.className = 'sortable-table__body';

    const rows = sortedData.map(({id: productId}, index) => `
      <a href="${productId ? '/products/' + productId : '#'}" class="sortable-table__row">
        ${this.headerConfig.map(({id, template}) => template ? template() : `
          <div class="sortable-table__cell">${sortedData[index][id] ?? ''}</div>
        `).join('')}
      </a>
    `);

    body.innerHTML = rows.join('');

    return body;
  }

  sortData(field, order = 'asc') {
    const fieldType = this.headerConfig.find(({id}) => id === field)?.sortType ?? 'string';
    const collator = new Intl.Collator(['ru', 'en']);
    const directions = {
      asc: 1,
      desc: -1
    };

    const direction = directions[order];
    return [...this.data].sort((arr1, arr2) => {
      let comparedValue;

      if (fieldType === 'string') {
        comparedValue = collator.compare(arr1[field], arr2[field]);
      } else {
        comparedValue = arr1[field] - arr2[field];
      }

      return direction * comparedValue;
    });
  }

  createSortArrow() {
    if (this.sortArrow) {
      this.sortArrow.remove();
    }

    const sortArrow = document.createElement('span');

    sortArrow.innerHTML = `
      <span data-element="arrow" class="sortable-table__sort-arrow">
        <span class="sort-arrow"></span>
      </span>
    `;

    this.sortArrow = sortArrow.firstElementChild;

    return this.sortArrow;
  }

  sort(field, order = 'asc') {
    if (this.sortElement) {
      this.sortElement.removeAttribute('data-order');
    }

    const sortElement = this.subElements.header.querySelector(`[data-id='${field}']`);
    sortElement.dataset.order = order;
    sortElement.append(this.createSortArrow());

    this.sortElement = sortElement;

    const sortedData = this.sortData(field, order);
    const sortedBody = this.getBodyElement(sortedData);

    this.subElements.body.replaceWith(sortedBody);
    this.subElements.body = sortedBody;
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.className = 'sortable-table';

    wrapper.append(this.getHeaderElement());
    wrapper.append(this.getBodyElement());

    this.element = wrapper;
    this.subElements = this.getSubElements(this.element);

    if (this.sorted) {
      this.sort(this.sorted.id, this.sorted.order);
    }
  }

  getSubElements(element) {
    const result = {};
    const elements = element.querySelectorAll('[data-element]');

    for (const subElement of elements) {
      const name = subElement.dataset.element;

      result[name] = subElement;
    }

    return result;
  }

  remove() {
    this.element.remove();
    this.subElements.header.removeEventListener('pointerdown', this.handleSortClick);
  }

  destroy() {
    this.headerConfig = [];
    this.data = [];
    this.remove();
  }
}
