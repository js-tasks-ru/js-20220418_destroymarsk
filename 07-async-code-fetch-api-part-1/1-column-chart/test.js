import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class SortableTable {
  INFINITE_OFFSET = 100;

  constructor(headersConfig = [], {
    data = [],
    sorted,
    url,
    isSortLocally = false
  } = {}) {
    this.headerConfig = headersConfig;
    this.data = data;
    this.url = url;
    this.sorted = sorted ?? {id: "title", order: "asc"};
    this.isSortLocally = isSortLocally;
    this.subElements = {};

    this.start = 0;
    this.end = 30;

    this.render();
    this.prefetchData();
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

  prefetchData() {
    const {id, order} = this.sorted;
    this.getDataFromServer()
      .then((data) => {
        this.appendBody(data);
        this.appendSortArrow(id, order);

        window.addEventListener("scroll", this.onScroll);
      });
  }

  onScroll = () => {
    const element = this.element;
    if (this.isFetching) return;

    if (window.innerHeight + window.scrollY >= element.offsetHeight - this.INFINITE_OFFSET) {
      this.start = this.end;
      this.end = this.start + 30;

      this.getDataFromServer().then((data) => {
        this.subElements.body.append(this.getBodyRowsElement(data));
      });
    }
  }

  getDataFromServer(sorted = this.sorted) {
    if (!this.url) {
      return;
    }
    this.isFetching = true;

    this.element.classList.add('sortable-table_loading');

    const {order, id} = sorted;
    const params = new URLSearchParams({
      _start: this.start,
      _end: this.end,
      _order: order,
      _sort: id,
    });

    const url = `${BACKEND_URL}/${this.url}?${params}`;

    return fetchJson(url, {method: 'GET'})
      .then((data) => {
        this.data = data;
        if (data.length === 0) {
          this.element.classList.add('sortable-table_empty');
        }
        return data;
      })
      .finally(() => {
        this.element.classList.remove('sortable-table_loading');
        this.isFetching = false;
      });
  }

  getLoadingPlaceholderTemplate() {
    const placeholder = document.createElement('div');
    placeholder.innerHTML = `<div data-element="loading" class="loading-line sortable-table__loading-line"></div>`;

    return placeholder.firstElementChild;
  }

  getEmptyPlaceholderTemplate() {
    const emptyPlaceholder = document.createElement('div');
    emptyPlaceholder.innerHTML = `
        <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
          <div>
              <p>Не найдено товаров удовлетворяющих выбранному критерию</p>
              <button type="button" class="button-primary-outline">Очистить фильтры</button>
          </div>
        </div>
    `;

    return emptyPlaceholder.firstElementChild;
  }

  getHeaderElement() {
    const header = document.createElement('div');
    header.dataset.element = 'header';
    header.className = 'sortable-table__header sortable-table__row';

    const cols = this.headerConfig.map(({sortable = false, title = '', id = ''}) => `
      <div class="sortable-table__cell" data-id="${id}" data-order="asc" data-sortable="${sortable}">
        <span>${title}</span>
      </div>
    `);

    header.innerHTML = cols.join('');
    header.addEventListener('pointerdown', this.handleSortClick.bind(this));

    return header;
  }

  getBodyRowsElement(data) {
    const wrapper = document.createElement('div');

    const rows = data.map(({id: productId}, index) => `
      <a href="${productId ? '/products/' + productId : '#'}" class="sortable-table__row">
        ${this.headerConfig.map(({id, template}) => template ? template(data[index][id]) : `
          <div class="sortable-table__cell">${data[index][id] ?? ''}</div>
        `).join('')}
      </a>
    `);

    wrapper.innerHTML = rows.join('');
    return wrapper;
  }

  getBodyElement(sortedData = this.data) {
    const body = document.createElement('div');
    const rows = this.getBodyRowsElement(sortedData);

    body.innerHTML = `
      <div data-element="body" class="sortable-table__body">
        ${rows.innerHTML}
      </div>
    `;

    return body.firstElementChild;
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

  getSortArrowTemplate() {
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

  appendSortArrow(id, order) {
    const sortElement = this.subElements.header.querySelector(`[data-id='${id}']`);
    sortElement.dataset.order = order;
    sortElement.append(this.getSortArrowTemplate());
    this.sorted = {id, order};
  }

  appendBody(data) {
    const body = this.getBodyElement(data);
    this.subElements.body.replaceWith(body);
    this.subElements.body = body;
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.className = 'sortable-table';

    wrapper.append(
      this.getHeaderElement(),
      this.getBodyElement(),
      this.getLoadingPlaceholderTemplate(),
      this.getEmptyPlaceholderTemplate()
    );

    this.element = wrapper;
    this.subElements = this.getSubElements(this.element);
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]');

    return Array.from(elements).reduce((acc, el) => {
      acc[el.dataset.element] = el
      return acc;
    }, {});
  }

  remove() {
    this.element.remove();
    this.subElements.header.removeEventListener('pointerdown', this.handleSortClick);
  }

  sort(id, order) {
    if (this.sortArrow) {
      this.sortArrow.removeAttribute('data-order');
    }
    this.appendSortArrow(id, order);

    if (this.isSortLocally) {
      this.sortOnClient(id, order);
    } else {
      this.sortOnServer(id, order);
    }
  }

  sortOnClient(field, order) {
    const sortedData = this.sortData(field, order);
    this.appendBody(sortedData);
  }

  sortOnServer (id, order) {
    this.min = 0;
    this.max = 30;

    this.getDataFromServer({id, order})
      .then((data) => this.appendBody(data));
  }

  destroy() {
    this.headerConfig = [];
    this.data = [];
    document.removeEventListener('scroll', this.onScroll);
    this.remove();
  }
}
