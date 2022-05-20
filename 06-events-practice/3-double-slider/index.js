export default class DoubleSlider {
  #currentDragging;

  constructor({min = 0, max = 100, formatValue = (val) => val, selected} = {}) {
    this.min = min;
    this.max = max;
    this.formatValue = formatValue;
    this.selected = selected ?? {from: min, to: max};

    this.render();
  }

  onMovePointer = (evt) => {
    evt.preventDefault();

    const {progress, inner, rightThumb, leftThumb, from, to} = this.subElements;
    const {left: leftCorner, right: rightCorner, width} = inner.getBoundingClientRect();

    if (this.#currentDragging === leftThumb) {
      let newShift = ((evt.clientX - leftCorner) * 100) / width;
      if (newShift < 0) {
        newShift = 0;
      }

      const rightThumbShift = 100 - parseFloat(rightThumb.style.right);
      if (newShift > rightThumbShift) {
        newShift = rightThumbShift;
      }

      this.#currentDragging.style.left = progress.style.left = newShift + '%';
      from.textContent = this.formatValue(this.getCurrentRange().from);
    }

    if (this.#currentDragging === rightThumb) {
      let newShift = -(((evt.clientX - rightCorner) * 100) / width);
      const leftThumbShift = 100 - parseFloat(leftThumb.style.left);

      if (newShift < 0) {
        newShift = 0;
      }

      if (newShift > leftThumbShift) {
        newShift = leftThumbShift;
      }

      this.#currentDragging.style.right = progress.style.right = newShift + '%';
      to.textContent = this.formatValue(this.getCurrentRange().to);
    }
  }

  onStartDragging = (evt) => {
    this.element.classList.add('range-slider_dragging');
    this.#currentDragging = evt.target;
    this.#currentDragging.style.zIndex = '1000';

    document.addEventListener('pointerup', this.onStopDragging);
    document.addEventListener('pointermove', this.onMovePointer);
  }

  onStopDragging = () => {
    this.element.classList.remove('range-slider_dragging');
    this.#currentDragging = null;
    this.element.dispatchEvent(new CustomEvent('range-select', {
      detail: this.getCurrentRange(),
      bubbles: true
    }));

    document.removeEventListener('pointerup', this.onStopDragging);
    document.removeEventListener('pointermove', this.onMovePointer);
  }


  initEventListeners() {
    this.subElements.leftThumb.addEventListener('pointerdown', this.onStartDragging);
    this.subElements.rightThumb.addEventListener('pointerdown', this.onStartDragging);
  }

  getCurrentRange() {
    const range = this.max - this.min;
    const leftThumbPercent = parseFloat(this.subElements.leftThumb.style.left);
    const rightThumbPercent = parseFloat(this.subElements.rightThumb.style.right);

    return {
      to: this.max - Math.round(range * rightThumbPercent / 100),
      from: Math.round(range * leftThumbPercent / 100) + this.min
    };
  }

  getSubElements(container) {
    const elements = container.querySelectorAll('[data-element]');

    return Array.from(elements).reduce((acc, el) => {
      el.ondragstart = () => false;
      acc[el.dataset.element] = el;
      return acc;
    }, {});
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div class="range-slider">
          <span data-element="from">${this.formatValue(this.selected.from)}</span>
          <div class="range-slider__inner" data-element="inner">
            <span class="range-slider__progress" style="left: 0%; right: 0%" data-element="progress"></span>
            <span class="range-slider__thumb-left" style="left: 0%" data-element="leftThumb"></span>
            <span class="range-slider__thumb-right" style="right: 0%" data-element="rightThumb"></span>
          </div>
          <span data-element="to">${this.formatValue(this.selected.to)}</span>
        </div>
    `;

    this.element = wrapper.firstElementChild;
    this.element.ondragstart = () => false;

    this.subElements = this.getSubElements(this.element);
    this.initEventListeners();
    this.update();
  }

  update() {
    const {progress, leftThumb, rightThumb} = this.subElements;
    const range = this.max - this.min;
    const percentPerPoint = 100 / range;

    progress.style.left = leftThumb.style.left = percentPerPoint * (this.selected.from - this.min) + '%';
    progress.style.right = rightThumb.style.right = percentPerPoint * (this.max - this.selected.to) + '%';
  }

  remove () {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy () {
    this.#currentDragging = null;
    this.subElements.leftThumb.removeEventListener('pointerdown', this.onStartDragging);
    this.subElements.rightThumb.removeEventListener('pointerdown', this.onStartDragging);

    this.remove();
  }
}
