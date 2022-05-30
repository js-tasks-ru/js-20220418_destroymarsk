import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class SortableTable {
  INFINITE_OFFSET = 100;
  data = [];
  isLoading;

  constructor(headerConfig = [], {
    url = '',
    sorted = {
      id: headerConfig.find(item => item.sortable).id,
      order: 'asc',
    },
    step = 10,
    start = 0,
    end = start + step,
    isSortLocally = false
  } = {}) {
    this.sorted = sorted;
    this.step = step;
    this.start = start;
    this.end = end;
    this.isSortLocally = isSortLocally;
    this.url = new URL(url, BACKEND_URL);
    this.headerConfig = headerConfig;

    this.render();
    this.update();
  }

  setTableLoading(isLoading) {
    const elClassList = this.element.classList;
    this.isLoading = isLoading;

    return isLoading ?
      elClassList.add("sortable-table_loading") :
      elClassList.remove("sortable-table_loading");
  }

  setTableEmpty(isEmpty) {
    const elClassList = this.element.classList;

    return isEmpty ?
      elClassList.add("sortable-table_empty") :
      elClassList.remove("sortable-table_empty");
  }

  getHeaderValue() {
    return this.headerConfig.map(({sortable = false, title = '', id = ''}) => `
      <div class="sortable-table__cell" data-id="${id}" data-order="asc" data-sortable="${sortable}">
        <span>${title}</span>
        ${this.getArrowTemplate(id)}
      </div>
    `).join('');
  }

  getHeaderTemplate() {
    return `
      <div class="sortable-table__header sortable-table__row" data-element="header">
        ${this.getHeaderValue()}
      </div>
    `;
  }

  getBodyValue(data = []) {
    return data.map(({id: productId}, index) => `
      <a href="${productId ? '/products/' + productId : '#'}" class="sortable-table__row">
        ${this.headerConfig.map(({id, template}) => template ? template(data[index][id]) : `
          <div class="sortable-table__cell">${data[index][id] ?? ''}</div>
        `).join('')}
      </a>
    `).join('');
  }

  getBodyTemplate() {
    return `
      <div data-element="body" class="sortable-table__body">
        ${this.getBodyValue()}
      </div>
    `;
  }

  getArrowTemplate(id) {
    const isExist = this.sorted.id === id;

    return isExist ? `
        <span data-element="arrow" class="sortable-table__sort-arrow">
            <span class="sort-arrow"></span>
        </span>
    ` : '';
  }

  get tableTemplate() {
    return `
      <div class="sortable-table sortable-table_loading">
        ${this.getHeaderTemplate()}
        ${this.getBodyTemplate()}
        <div data-element="loading" class="loading-line sortable-table__loading-line"></div>
        <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
          <div>
              <p>Не найдено товаров удовлетворяющих выбранному критерию</p>
              <button type="button" class="button-primary-outline">Очистить фильтры</button>
          </div>
        </div>
      </div>
    `;
  }

  getData(sorted = this.sorted) {
    const {order, id} = sorted;

    this.url.searchParams.set('_start', this.start);
    this.url.searchParams.set('_end', this.end);
    this.url.searchParams.set('_order', order);
    this.url.searchParams.set('_sort', id);

    return fetchJson(this.url, {method: "GET"})
      .then((data) => data, (error) => alert(`Error: ${error.message}`));
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.tableTemplate;

    this.element = wrapper.firstElementChild;
    this.subElements = this.getSubElements(this.element);
    this.initEventListeners();
  }

  initEventListeners() {
    window.addEventListener("scroll", this.handleScroll);
    this.subElements.header.addEventListener('pointerdown', this.handleSortClick);
  }

  handleScroll = () => {
    const element = this.element;
    if (this.isLoading) {
      return;
    }

    if (window.innerHeight + window.scrollY >= element.offsetHeight - this.INFINITE_OFFSET) {
      this.start = this.end;
      this.end = this.start + this.step;

      this.setTableLoading(true);
      this.getData().then((data) => {
        this.subElements.body.insertAdjacentHTML('beforeend', this.getBodyValue(data));
        this.setTableLoading(false);
      });
    }
  }

  handleSortClick = (event) => {
    const target = event.target;
    const sortableElement = target.closest('[data-sortable="true"]');

    if (!sortableElement) return;
    const {id, order} = sortableElement.dataset;
    const newOrder = order === 'asc' ? 'desc' : 'asc';

    sortableElement.dataset.order = newOrder;
    sortableElement.append(this.subElements.arrow);

    return this.sort(id, newOrder);
  }

  async update() {
    this.setTableLoading(true);
    this.setTableEmpty(false);

    const newData = await this.getData();
    this.data = newData;
    if (!newData || newData.length === 0) {
      this.setTableEmpty(true);
      return;
    }

    this.subElements.body.innerHTML = this.getBodyValue(newData);
    this.setTableLoading(false);
  }

  sort(id, order) {
    if (this.isSortLocally) {
      this.sortOnClient(id, order);
    } else {
      this.sortOnServer(id, order);
    }
  }

  sortOnClient(id, order) {
    const sortedData = this.sortData(id, order);
    this.subElements.body.innerHTML = this.getBodyValue(sortedData);
  }

  async sortOnServer(id, order) {
    this.setTableLoading(true);
    this.setTableEmpty(false);

    this.min = 0;
    this.max = 30;
    this.sorted = {id, order};

    const sortedData = await this.getData();
    if (!sortedData || sortedData.length === 0) {
      this.setTableEmpty(true);
      return;
    }

    this.subElements.body.innerHTML = this.getBodyValue(sortedData);
    this.setTableLoading(false);
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

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]');

    return Array.from(elements).reduce((acc, el) => {
      acc[el.dataset.element] = el;
      return acc;
    }, {});
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.subElements.header.removeEventListener('pointerdown', this.handleSortClick);
    window.removeEventListener('scroll', this.handleScroll);
    this.remove();
  }
}
