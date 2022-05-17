class Tooltip {
  static #currentInstance = null;

  constructor() {
    if (Tooltip.#currentInstance) {
      return Tooltip.#currentInstance;
    } else {
      Tooltip.#currentInstance = this;
    }

  }

  initialize () {
    document.addEventListener('pointerover', this.onPointerOver.bind(this));
    document.addEventListener('pointermove', this.onPointerMove.bind(this));
  }

  onPointerOver(event) {
    const elementTooltip = event.target.dataset.tooltip;
    const prevElementTooltip = event.relatedTarget?.dataset?.tooltip;

    if ((!prevElementTooltip && !elementTooltip) || (prevElementTooltip && !elementTooltip)) {
      this.remove();
      return;
    }

    this.render(elementTooltip);
  }

  onPointerMove(event) {
    if (!this.element) return;

    this.element.style.position = 'absolute';
    this.element.style.left = `${event.pageX + 10}px`;
    this.element.style.top = `${event.pageY + 10}px`;
  }

  render (tooltipText) {
    if (this.element) {
      this.element.textContent = tooltipText;
      return;
    }

    const tooltip = document.createElement('div');
    tooltip.innerHTML = `
      <div class="tooltip">${tooltipText}</div>
    `;

    this.element = tooltip.firstElementChild;
    document.body.append(this.element);
  }

  remove() {
    if (!this.element) return;

    this.element.remove();
    this.element = null;
  }

  destroy() {
    document.removeEventListener('pointerover', this.onPointerOver.bind(this));
    document.removeEventListener('pointermove', this.onPointerMove.bind(this));

    this.remove();
  }
}

export default Tooltip;
