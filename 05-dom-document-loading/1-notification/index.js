export default class NotificationMessage {
  INITIAL_DURATION = 1000
  timerId;

  static activeNotification;

  constructor(message = '', {type = 'success', duration = this.INITIAL_DURATION} = {}) {
    this.message = message;
    this.type = type;
    this.duration = duration;

    this.render();
  }

  render() {
    const wrapper = document.createElement('div');

    wrapper.innerHTML = `
      <div class="notification">
        <div class="timer"></div>
        <div class="inner-wrapper">
          <div class="notification-header">${this.type}</div>
          <div class="notification-body">
            ${this.message}
          </div>
        </div>
      </div>
    `;

    wrapper.firstElementChild.classList.add(this.type);
    wrapper.firstElementChild.style.setProperty('--value', `${this.duration / 1000}s`);

    this.element = wrapper.firstElementChild;
  }

  show(element) {
    if (NotificationMessage.activeNotification) {
      NotificationMessage.activeNotification.remove();
    }

    if (element) {
      this.element = element;
    }

    document.body.prepend(this.element);
    this.timerId = setTimeout(() => this.remove(), this.duration);
    NotificationMessage.activeNotification = this;
  }

  remove() {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }
    this.element.remove();
  }

  destroy() {
    this.message = '';
    this.type = 'success';
    this.duration = this.INITIAL_DURATION;
    this.timerId = null;
    NotificationMessage.activeNotification = null;

    this.remove();
  }
}
