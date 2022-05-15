export default class NotificationMessage {
  INITIAL_DURATION = 1000

  constructor(message = '', {type = 'success', duration = this.INITIAL_DURATION} = {}) {
    this.message = message;
    this.type = type;
    this.duration = duration;

    this.render();
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.classList.add('notification');
    wrapper.classList.add(this.type);
    wrapper.style.setProperty('--value', `${this.duration / 1000}s`);


    wrapper.innerHTML = `
      <div class="timer"></div>
      <div class="inner-wrapper">
        <div class="notification-header">${this.type}</div>
        <div class="notification-body">
          ${this.message}
        </div>
      </div>
    `;

    this.element = wrapper;
  }

  show(element) {
    const notificationElement = document.body.querySelector('.notification');

    if (notificationElement) {
      notificationElement.remove();
    }

    if (element) {
      this.element = element;
    }

    document.body.prepend(this.element);
    setTimeout(() => this.remove(), this.duration);
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.message = '';
    this.type = 'success';
    this.duration = this.INITIAL_DURATION;
    this.remove();
  }
}
