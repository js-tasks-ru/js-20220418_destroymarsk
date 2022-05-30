import fetchJson from "./utils/fetch-json.js";
import escapeHtml from "./utils/escape-html.js";
const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_URL = 'https://course-js.javascript.ru';
const IMGUR_URL = 'https://api.imgur.com';

export default class ProductForm {
  cats = [];
  images = [];
  formFields = ['title', 'description', 'quantity', 'status', 'price', 'discount']

  constructor(productId) {
    this.productId = productId;
    this.subElements = {};
  }

  fetchCategories() {
    const url = new URL("api/rest/categories", BACKEND_URL);
    url.searchParams.set('_sort', 'weight');
    url.searchParams.set('_refs', 'subcategory');

    return fetchJson(url);
  }

  async fetchProduct() {
    const url = new URL("api/rest/products", BACKEND_URL);
    url.searchParams.set('id', this.productId);

    return fetchJson(url)
      .then((data) => data[0], (err) => alert(`Error: ${err.message}`));
  }

  getCategoriesValue(categories = []) {
    return categories.map(({title: catTitle, subcategories}) => {
      return subcategories.map(({id, title: subCatTitle}) => `
        <option value="${id}">${catTitle} &gt; ${subCatTitle}</option>
      `);
    }).join('');
  }

  getCategorySelectTemplate() {
    return `
        <div class="form-group form-group__half_left">
            <label class="form-label">Категория</label>
            <select class="form-control" name="subcategory" id="subcategory">
                ${this.getCategoriesValue(this.cats)}
            </select>
        </div>
    `;
  }

  getPhotoRowTemplate(url, source) {
    return `
      <li class="products-edit__imagelist-item sortable-list__item" style="">
          <input type="hidden" name="url" value="${escapeHtml(url)}">
          <input type="hidden" name="source" value="${escapeHtml(source)}">
          <span>
            <img src="icon-grab.svg" data-grab-handle="" alt="grab">
            <img class="sortable-table__cell-img" alt="Image" src="${escapeHtml(url)}">
            <span>${escapeHtml(source)}</span>
          </span>
          <button type="button">
            <img src="icon-trash.svg" data-delete-handle="" alt="delete">
          </button>
        </li>
    `;
  }

  getPhotoValue(images = []) {
    return images.map(({url, source}) => this.getPhotoRowTemplate(url, source)).join('');
  }

  getPhotoTemplate() {
    return `
        <div class="form-group form-group__wide" data-element="sortable-list-container">
            <label class="form-label">Фото</label>
            <div data-element="imageListContainer">
                <ul class="sortable-list">${this.getPhotoValue(this.images)}</ul>
            </div>
            <button type="button" data-upload-handle="" name="uploadImage" class="button-primary-outline fit-content">
              <span>Загрузить</span>
            </button>
        </div>
    `;
  }

  get template() {
    return `
        <div class="product-form">
            <form data-element="productForm" class="form-grid">
                <div class="form-group form-group__half_left">
                  <fieldset>
                    <label class="form-label">Название товара</label>
                    <input required="" type="text" name="title" class="form-control" placeholder="Название товара">
                  </fieldset>
                </div>
                <div class="form-group form-group__wide">
                  <label class="form-label">Описание</label>
                  <textarea required="" class="form-control" name="description" data-element="productDescription" placeholder="Описание товара"></textarea>
                </div>
                ${this.getPhotoTemplate()}
                ${this.getCategorySelectTemplate()}
                <div class="form-group form-group__half_left form-group__two-col">
                  <fieldset>
                    <label class="form-label">Цена ($)</label>
                    <input required="" type="number" name="price" class="form-control" placeholder="100">
                  </fieldset>
                  <fieldset>
                    <label class="form-label">Скидка ($)</label>
                    <input required="" type="number" name="discount" class="form-control" placeholder="0">
                  </fieldset>
                </div>
                <div class="form-group form-group__part-half">
                  <label class="form-label">Количество</label>
                  <input required="" type="number" class="form-control" name="quantity" placeholder="1">
                </div>
                <div class="form-group form-group__part-half">
                  <label class="form-label">Статус</label>
                  <select class="form-control" name="status">
                    <option value="1">Активен</option>
                    <option value="0">Неактивен</option>
                  </select>
                </div>
                <div class="form-buttons">
                  <button type="submit" name="save" class="button-primary-outline">
                    Сохранить товар
                  </button>
                </div>
            </form>
        </div>
    `;
  }

  async render() {
    const [cats, productData] = await Promise.all([
      this.fetchCategories(),
      this.productId ? this.fetchProduct() : null
    ]);

    this.images = productData?.images ?? [];
    this.cats = cats;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.template;
    this.element = wrapper.firstElementChild;
    this.subElements = this.getSubElements(this.element);

    if (productData) {
      this.setForm(productData);
    }

    this.initEventListeners();
    return this.element;
  }

  setForm(productData) {
    const {productForm} = this.subElements;
    const imageFields = ['url', 'source'];
    const productFields = Object.entries(productData).filter(([name]) => this.formFields.includes(name));

    productFields.forEach(([name, value]) => {
      if (!imageFields.includes(name)) {
        productForm.querySelector(`[name="${name}"]`).value = value;
      }
    });
  }

  uploadImage(file) {
    const url = new URL('3/image', IMGUR_URL);
    const headers = new Headers();
    const data = new FormData();

    data.set('image', file);
    headers.set('Authorization', `Client-ID ${IMGUR_CLIENT_ID}`);

    return fetchJson(url, {method: "POST", body: data, headers})
      .then(({data: {link}}) => link);
  }

  setButtonLoading(el, isLoading) {
    const classList = ['is-loading'];

    if (isLoading) {
      el.classList.add(...classList);
      el.setAttribute('disabled', '');
    } else {
      el.classList.remove(...classList);
      el.removeAttribute('disabled');
    }
  }

  selectImage(el) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      this.setButtonLoading(el, true);
      const file = input.files[0];
      const link = await this.uploadImage(file);

      this.subElements.imageListContainer.insertAdjacentHTML('beforeend', this.getPhotoRowTemplate(link, file.name));
      this.setButtonLoading(el, false);
    };
    input.click();
  }

  deleteImage(el) {
    const liElement = el.closest('li');
    liElement.remove();
  }

  dispatchEvent(id) {
    const evtName = this.productId ? 'product-updated' : 'product-saved';

    this.element.dispatchEvent(new CustomEvent(evtName, {detail: id}));
  }

  createProduct(data) {
    const url = new URL("api/rest/products", BACKEND_URL);
    const headers = new Headers({"Content-Type": "application/json"});

    return fetchJson(url, {
      method: this.productId ? "PATCH" : "PUT",
      body: JSON.stringify(data),
      headers
    })
      .then((data) => data, (err) => alert(`Error: ${err.message}`));
  }

  handleButtonClick = (evt) => {
    const el = evt.target;

    const dataUploadHandle = el.closest('[data-upload-handle]');
    if (dataUploadHandle) {
      this.selectImage(dataUploadHandle);
    }

    const dataDeleteHandle = el.closest('[data-delete-handle]');
    if (el.closest('[data-delete-handle]')) {
      this.deleteImage(dataDeleteHandle);
    }
  }

  convertFormToObject(form) {
    const formData = new FormData(form);
    const imageFields = ['url', 'source'];
    const numberFields = ['price', 'discount', 'quantity', 'status'];

    const filteredData = [...formData]
      .filter(([name]) => !imageFields.includes(name))
      .map(([name, value]) => numberFields.includes(name) ? [name, parseInt(value)] : [name, value]);
    return Object.fromEntries(filteredData);
  }

  async onProductCreate(element) {
    const {imageListContainer} = this.subElements;
    const formObject = this.convertFormToObject(element);
    formObject.images = [];
    formObject.id = this.productId;

    const imageRows = imageListContainer.querySelectorAll('.sortable-table__cell-img');
    imageRows.forEach((image) => formObject.images.push({
      url: image.src,
      source: image.alt,
    }));

    const id = await this.createProduct(formObject);
    this.dispatchEvent(id);
  }

  handleSubmit = async (evt) => {
    evt.preventDefault();

    await this.onProductCreate(evt.target);
  }

  initEventListeners() {
    document.addEventListener('pointerdown', this.handleButtonClick);
    document.addEventListener('submit', this.handleSubmit);
  }

  getSubElements(container) {
    const elements = container.querySelectorAll('[data-element]');

    return [...elements].reduce((acc, el) => {
      acc[el.dataset.element] = el;
      return acc;
    }, {});
  }


  async save() {
    const {productForm} = this.subElements;
    await this.onProductCreate(productForm);
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    document.removeEventListener('pointerdown', this.handleButtonClick);
    document.removeEventListener('submit', this.handleSubmit);

    this.remove();
  }
}
