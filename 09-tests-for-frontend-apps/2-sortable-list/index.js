export default class SortableList {
  constructor({items = []} = {}) {
    this.items = items;

    this.render();
  }


  render() {
    const wrapper = document.createElement('ul');
    wrapper.classList.add('sortable-list');

    wrapper.append(...this.items);
    this.element = wrapper;
    this.subElements = this.getSubElements(this.element);

    this.initEventListeners();

    return wrapper;
  }

  getSubElements(container) {
    const elements = container.querySelectorAll('[data-element]');

    return [...elements].reduce((acc, el) => {
      acc[el.dataset.element] = el;
      return acc;
    }, {});
  }

  getPlaceholderElement () {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `<div class="sortable-list__placeholder"></div>`;

    return wrapper.firstElementChild;
  }

  toggleElementDragging(element, isDragging) {
    if (isDragging) {
      element.style.width = element.parentElement.offsetWidth + 'px';
      element.classList.add('sortable-list__item_dragging');
    } else {
      element.style.width = 'auto';
      element.style.left = '0';
      element.style.top = '0';
      element.classList.remove('sortable-list__item_dragging');
    }
  }

  handleDelete(element) {
    const deleteEl = element.closest('li');

    if (deleteEl) {
      deleteEl.remove();
      this.element.dispatchEvent(new CustomEvent('onDelete', {detail: deleteEl, bubbles: true}));
    }
  }

  pointerDown = (evt) => {
    const target = evt.target;

    if (target.closest('[data-delete-handle]')) {
      return this.handleDelete(target);
    }

    if (!target.closest('[data-grab-handle]')) {
      return;
    }

    evt.preventDefault();

    if (!this.placeholderEl) {
      this.placeholderEl = this.getPlaceholderElement();
    }

    const draggableEl = target.closest('li');
    const listOfDraggable = this.element;

    const {scrollX, scrollY} = window;
    const {left, top} = draggableEl.getBoundingClientRect();
    const {pageX, pageY} = evt;

    let shiftX = pageX - (scrollX + left);
    let shiftY = pageY - (scrollY + top);

    this.placeholderEl.style.height = draggableEl.offsetHeight + 'px';

    draggableEl.after(this.placeholderEl);
    listOfDraggable.insertAdjacentElement('beforeend', draggableEl);

    draggableEl.style.left = left + 'px';
    draggableEl.style.top = top + 'px';

    this.toggleElementDragging(draggableEl, true);

    const moveElement = (evt) => {
      const {clientY, clientX} = evt;

      draggableEl.style.display = 'none';
      const areaEl = document.elementFromPoint(listOfDraggable.getBoundingClientRect().x, clientY);
      draggableEl.style.display = 'flex';

      draggableEl.style.left = clientX - shiftX + 'px';
      draggableEl.style.top = clientY - shiftY + 'px';

      const listItem = areaEl?.closest('li');
      if (!listItem) {
        return;
      }

      if (clientY >= listItem.getBoundingClientRect().y + listItem.getBoundingClientRect().height / 2) {
        listItem.after(this.placeholderEl);
      } else {
        listItem.before(this.placeholderEl);
      }
    };

    document.addEventListener('pointermove', moveElement);

    draggableEl.ondragstart = () => false;

    document.onpointerup = () => {
      document.removeEventListener('pointermove', moveElement);
      this.toggleElementDragging(draggableEl, false);
      this.placeholderEl.replaceWith(draggableEl);
    };
  }

  initEventListeners() {
    document.addEventListener('pointerdown', this.pointerDown);
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    document.removeEventListener('pointerdown', this.pointerDown);
    this.remove();
  }
}
