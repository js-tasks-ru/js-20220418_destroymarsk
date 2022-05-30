export default class RangePicker {
  constructor({from = new Date(), to = new Date()}) {
    this.from = from;
    this.to = to;
    this.selectorDate = new Date(from);

    this.render();
  }

  formatDate(dateObject) {
    const date = dateObject.getDate().toString().padStart(2, '0');
    const month = (dateObject.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObject.getFullYear();

    return `${date}.${month}.${year}`;
  }

  getSelectionSelector(date) {
    const classList = [];

    if (this.from - date === 0) {
      classList.push('rangepicker__selected-from');
    } else if (this.to - date === 0) {
      classList.push('rangepicker__selected-to');
    } else if (date > this.from && date < this.to) {
      classList.push('rangepicker__selected-between');
    }

    return classList;
  }

  getInputTemplate() {
    return `
        <div class="rangepicker__input" data-element="input">
            <span data-element="from">${this.formatDate(this.from)}</span> -
            <span data-element="to">${this.formatDate(this.to)}</span>
        </div>
    `;
  }

  getSelectorTemplate() {
    const toSelectorDate = new Date(this.selectorDate);
    toSelectorDate.setMonth(toSelectorDate.getMonth() + 1);

    return `
      <div class="rangepicker__selector-arrow"></div>
      <div class="rangepicker__selector-control-left" data-element="leftArrow"></div>
      <div class="rangepicker__selector-control-right" data-element="rightArrow"></div>
      ${this.getCalendarTemplate(this.selectorDate)}
      ${this.getCalendarTemplate(toSelectorDate)}
    `;
  }

  getCellTemplate(date, start) {
    const startStyle = start ? `--start-from: ${start}` : '';
    const classList = this.getSelectionSelector(date).join(' ');

    return `
      <button type="button" class="rangepicker__cell ${classList}" data-value="${date.toISOString()}" style="${startStyle}">
            ${date.getDate()}
      </button>
    `;
  }

  getCalendarCells(dateObject) {
    const date = new Date(dateObject.getFullYear(), dateObject.getMonth());
    const cells = [];
    const weekDate = date.getDay() === 0 ? 7 : date.getDay();

    cells.push(this.getCellTemplate(date, weekDate));
    date.setDate(date.getDate() + 1);

    while (dateObject.getMonth() === date.getMonth()) {
      cells.push(this.getCellTemplate(date));
      date.setDate(date.getDate() + 1);
    }

    return cells.join('');
  }

  getCalendarTemplate(dateObject) {
    const monthTitle = dateObject.toLocaleString('ru', {month: 'long'});

    return `
        <div class="rangepicker__calendar">
            <div class="rangepicker__month-indicator">
                <time datetime="${monthTitle}">${monthTitle}</time>
            </div>
            <div class="rangepicker__day-of-week">
                <div>Пн</div>
                <div>Вт</div>
                <div>Ср</div>
                <div>Чт</div>
                <div>Пт</div>
                <div>Сб</div>
                <div>Вс</div>
            </div>
            <div class="rangepicker__date-grid">
                ${this.getCalendarCells(dateObject)}
            </div>
        </div>
    `;
  }

  get template() {
    return `
        <div class="rangepicker">
            ${this.getInputTemplate()}
            <div class="rangepicker__selector" data-element="selector"></div>
        </div>
    `;
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.template;

    this.element = wrapper.firstElementChild;
    this.subElements = this.getSubElements(this.element);

    this.initEventListener();
  }

  updateCalendars() {
    const toSelectorDate = new Date(this.selectorDate);
    toSelectorDate.setMonth(toSelectorDate.getMonth() + 1);

    this.element.querySelectorAll('.rangepicker__calendar').forEach((el) => el.remove());

    this.subElements.selector.insertAdjacentHTML('beforeend', `
      ${this.getCalendarTemplate(this.selectorDate)}
      ${this.getCalendarTemplate(toSelectorDate)}
    `);
  }

  updateSelectionCells() {
    const cells = this.element.querySelectorAll('.rangepicker__cell');

    cells.forEach((el) => {
      el.classList.remove(
        'rangepicker__selected-from',
        'rangepicker__selected-between',
        'rangepicker__selected-to'
      );

      const dateElement = new Date(el.dataset.value);
      el.classList.add(...this.getSelectionSelector(dateElement));
    });
  }

  togglePicker(isOpen) {
    const willPickerOpen = isOpen ?? !this.element.classList.contains('rangepicker_open');

    if (willPickerOpen) {
      this.element.classList.add('rangepicker_open');
      this.subElements.selector.innerHTML = this.getSelectorTemplate();
    } else {
      this.element.classList.remove('rangepicker_open');
    }
  }

  handleInputClick = (evt) => {
    evt.preventDefault();
    const el = evt.target;

    if (el.closest('[data-element="input"]')) {
      return this.togglePicker();
    }

    if (!this.element.contains(evt.target)) {
      this.togglePicker(false);
    }
  }

  handleArrowClick = (shift) => {
    this.selectorDate.setMonth(this.selectorDate.getMonth() + shift);
    this.updateCalendars();
  }

  updateInput() {
    this.subElements.from.textContent = this.formatDate(this.from);
    this.subElements.to.textContent = this.formatDate(this.to);
  }

  dispatchEvent() {
    this.element.dispatchEvent(
      new CustomEvent('date-select', {
        detail: {
          from: this.from,
          to: this.to
        },
        bubbles: true,
      })
    );
  }

  handleSelectorClick = (evt) => {
    const el = evt.target;
    const dataElement = el.dataset.element;
    const dateValue = el.dataset.value;

    if (dataElement === 'leftArrow') {
      return this.handleArrowClick(-1);
    } else if (dataElement === 'rightArrow') {
      return this.handleArrowClick(1);
    }

    if (!dateValue) {
      return;
    }

    if (this.from !== null && this.to !== null) {
      this.from = new Date(dateValue);
      this.to = null;
    } else {
      this.to = new Date(dateValue);
      if (this.to < this.from) {
        this.to = this.from;
        this.from = new Date(dateValue);
      }

      this.updateInput();
      this.dispatchEvent();
    }

    this.updateSelectionCells();
  }

  handleElementClick = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();

    this.togglePicker();
  }

  initEventListener() {
    this.subElements.input.addEventListener('pointerdown', this.handleElementClick);
    this.subElements.selector.addEventListener('pointerdown', this.handleSelectorClick);
    document.addEventListener('pointerdown', this.handleInputClick);
  }

  getSubElements(container) {
    const elements = container.querySelectorAll('[data-element]');

    return [...elements].reduce((acc, el) => {
      acc[el.dataset.element] = el;
      return acc;
    }, {});
  }

  destroy() {
    this.subElements.input.removeEventListener('pointerdown', this.handleElementClick);
    this.subElements.selector.removeEventListener('pointerdown', this.handleSelectorClick);
    document.removeEventListener('pointerdown', this.handleInputClick);
    this.remove();
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }
}
