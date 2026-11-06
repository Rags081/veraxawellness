class CartEvents {

  static emit(eventName, detail = {}) {
    document.dispatchEvent(
      new CustomEvent(eventName, {
        detail,
        bubbles: true,
        cancelable: true
      })
    );
  }

  // Add Single/Multiple
  static addProduct(products) {
    this.emit('cart:add-products', {
      products: Array.isArray(products)
        ? products
        : [products]
    });
  }

  // Remove Single/Multiple
  static removeProduct(productIds) {
    this.emit('cart:remove-products', {
      productIds: Array.isArray(productIds)
        ? productIds
        : [productIds]
    });
  }

  static updateProducts(updates) {

    this.emit('cart:update-products', {
      updates: Array.isArray(updates)
        ? updates
        : [updates]
    });

  }


  static renderProducts(element, products = []) {
    this.emit('cart:render-products', {
      element,
      products
    });
  }

  static clear() {
    this.emit('cart:clear');
  }

  static refresh() {
    this.emit('cart:refresh');
  }

  static getProducts(callback) {
    this.emit('cart:get-products', {
      callback
    });
  }

  static getProductsAsync() {
    return new Promise(resolve => {
      this.emit('cart:get-products', {
        callback: resolve
      });
    });
  }

  static addProducts(products = []) {

    document.dispatchEvent(
      new CustomEvent(
        'cart:add-products',
        {
          detail: {
            products
          }
        }
      )
    );

  }
}

window.CartEvents = CartEvents;



class CartManager {
  constructor(config = {}) {
    this.config = {
      storageKey: 'cart',
      cartCountSelector: '.cart-product-count',
      cartBodySelector: '#cart-products',
      cartPageItemsSelector: '#pageItems',
      cartPageEmptySelector: '#pageEmpty',
      cartItemsContainerSelector: '.cart-items-container',
      subtotalSelector: '[data-attr-app="subtotal"]',
      subtotalSelectorHidden: '[data-attr-app="subtotalhidden"]',
      totalSelector: '[data-attr-app="total"]',
      imagePath: 'app_assets/images/',
      defaultImage: 'product-placeholder.png',
      addedButtonTimeout: 1000,
      ...config
    };

    this.cart = [];
    this.cartConfig = null;
    this.cartItemTemplate = null;
    this.pageItemTemplate = null;
    this._hashPromise = null;
    this._renderScheduled = false;

    this._init();
  }

  async _init() {
    await this._loadCart();
    this._saveTemplates();
    this._bindEvents();
    this._updateNavLinks();
    this._refreshUI();
    this._loadCartConfig();
  }

  // to check whether there is any product named "expedited shipping"
  isExpeditedItem(item) {
    return (item.productName || '')
      .toLowerCase()
      .includes('expedited');
  }


  // to check whether there is any product named "shipment"
  isShipmentProtectionItem(item) {
    return (item.productName || '')
      .toLowerCase()
      .includes('shipment');
  }

  _saveTemplates() {
    const $slideContainer = $(this.config.cartItemsContainerSelector);
    if ($slideContainer.length) {
      const $t = $slideContainer.find('.cart-item').first();
      if ($t.length) this.cartItemTemplate = $t.clone();
    }

    const $pageContainer = $(this.config.cartPageItemsSelector);
    if ($pageContainer.length) {
      const $t = $pageContainer.find('.cart-item').first();
      if ($t.length) this.pageItemTemplate = $t.clone();
    }
  }

  _getHashPromise() {
    if (!this._hashPromise) this._hashPromise = getFunnelHash();
    return this._hashPromise;
  }

  async _resolveStorageKey() {
    const cached = sessionStorage.getItem('funnelHash');
    if (cached) {
      this.config.storageKey = 'cart-' + cached;
      return;
    }
    const hash = await this._getHashPromise();
    sessionStorage.setItem('funnelHash', hash);
    this.config.storageKey = 'cart-' + hash;
  }

  async _loadCart() {
    try {
      await this._resolveStorageKey();
      this.cart = JSON.parse(localStorage.getItem(this.config.storageKey)) || [];
    } catch (err) {
      console.error('Error loading cart:', err);
      this.cart = [];
    }
  }

  _saveCart() {
    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(this.cart));
    } catch (err) {
      console.error('Error saving cart:', err);
    }
  }

  clearCart() {
    this.cart = [];
    localStorage.removeItem(this.config.storageKey);
    this._refreshUI();
  }

  _bindEvents() {
    $(document)
      .on('click', '.add-to-cart-btn', e => this._handleAddToCart(e))
      .on('click', '.product-remove', e => this._handleRemoveProduct(e))
      .on('click', '.cart-item-remove', e => this._handleRemoveCartItem(e))
      .on('click', '.remove-all-button', e => this._handleRemoveAll(e))
      .on('click', '.quantity-btn', e => this._handleQuantityBtn(e))
      .on('change', '#expeditedShipping', e => this._onRefreshCartCount(e))
      .on('change', '.shipmentProtection', e => this._onRefreshCartCount(e));

    document.addEventListener('beforeAddToCart', e => this._onBeforeAddToCart(e));
    document.addEventListener('afterAddToCart', e => this._onAfterAddToCart(e));
    document.addEventListener('refreshCartCountEvent', e => this._onRefreshCartCount(e));

    document.addEventListener(
      'cart:add-products',
      e => {

        e.detail.products.forEach(
          product => {
            this.addToCart(product);
          }
        );

        this._refreshUI();

      }
    );

    document.addEventListener(
      'cart:remove-products',
      e => {

        const ids =
          new Set(
            e.detail.productIds.map(String)
          );

        this.cart =
          this.cart.filter(
            item =>
              !ids.has(
                String(item.productId)
              )
          );

        this._saveCart();
        this._refreshUI();

      }
    );

    document.addEventListener(
      'cart:update-products',
      e => {

        e.detail.updates.forEach(update => {

          const item = this.findItem(
            update.productId
          );

          if (!item) {
            return;
          }

          Object.keys(update).forEach(key => {

            if (key === 'productId') {
              return;
            }

            item[key] = update[key];

          });

        });

        this._saveCart();
        this._refreshUI();

      }
    );

    document.addEventListener(
      'cart:clear',
      () => this.clearCart()
    );

    document.addEventListener(
      'cart:refresh',
      () => this._refreshUI()
    );

    document.addEventListener(
      'cart:get-products',
      e => {

        const callback =
          e.detail?.callback;

        if (
          typeof callback ===
          'function'
        ) {

          callback(
            JSON.parse(
              JSON.stringify(
                this.cart
              )
            )
          );

        }

      }
    );

  }

  _updateNavLinks() {
    $('.nav_string').each(function () {
      $(this).attr('href', $(this).attr('href') + location.search);
    });
  }

  _handleQuantityBtn(e) {
    e.stopPropagation();
    const $btn = $(e.currentTarget);
    const $cartItem = $btn.closest('.cart-item');
    const productId = $cartItem.data('productid');
    if (!productId) return;
    if ($btn.hasClass('increment')) this.incrementQuantity(productId, $cartItem);
    else if ($btn.hasClass('decrement')) this.decrementQuantity(productId, $cartItem);
  }

  _handleAddToCart(e) {
    const $button = $(e.currentTarget);
    const $parent = $button.closest('.sel-prod');
    const data = $parent.data();
    
    const type = $parent.find('select option:selected').attr('attr-name');
    var purchaseType = $('[data-active-purchase-type]').data('active-purchase-type');
    var purchaseType = purchaseType ? purchaseType.charAt(0).toUpperCase() + purchaseType.slice(1) : type;
    
    const item = {
      productId: data.productid,
      productName: `${data.productname}${purchaseType? ` - ${purchaseType}` : ''}`,
      price: parseFloat(data.price) || 0,
      billingModelId: data.billingmodelid,
      offerId: data.offerid,
      quantity: Number(data.quantity) || 1,
      image: data.image,
      type: type || "One Time"
    };


    const before = this._dispatchCustomEvent('beforeAddToCart', {
      cartData: this.cart, productData: data, element: $button
    });
    if (before.defaultPrevented) return;

    this.addToCart(item);

    this._dispatchCustomEvent('afterAddToCart', {
      cartData: this.cart, productData: data, element: $button
    });

    window.location.href="cart";
  }

  addToCart(item) {
    const existing = this.findItem(item.productId);
    if (existing) existing.quantity += item.quantity;
    else this.cart.push(item);
    this._saveCart();
    return existing || item;
  }

  _handleRemoveProduct(e) {
    const $row = $(e.currentTarget).closest('.cart-item');
    const index = $row.data('index');
    if (index !== undefined && index >= 0 && index < this.cart.length) {
      this.cart.splice(index, 1);
      this._saveCart();
      this._refreshUI();
    }
  }

  _handleRemoveCartItem(e) {
    const productId = $(e.currentTarget).closest('.cart-item').data('productid');
    this.removeItem(productId);
  }

  _handleRemoveAll() { this.clearCart(); }

  removeItem(productId) {
    const index = this.cart.findIndex(i => i.productId == productId);
    if (index !== -1) {
      this.cart.splice(index, 1);
      this._saveCart();
      this._refreshUI();
    }
  }

  incrementQuantity(productId, $cartItem) {
    const item = this.findItem(productId);
    if (!item) return;
    item.quantity += 1;
    this._updateQuantityDisplay($cartItem, item.quantity);
    this._saveCart();
    this._scheduleRender();
  }

  decrementQuantity(productId, $cartItem) {
    const item = this.findItem(productId);
    if (!item || item.quantity <= 1) return;
    item.quantity -= 1;
    this._updateQuantityDisplay($cartItem, item.quantity);
    this._saveCart();
    this._scheduleRender();
  }

  updateQuantity(productId, quantity) {
    const item = this.findItem(productId);
    if (!item) return;
    item.quantity = Math.max(1, quantity);
    this._saveCart();
    this._refreshUI();
  }

  // updated code for expedited shipping quantity disable
  _updateQuantityDisplay($cartItem, quantity) {
    const $qty = $cartItem.find('.quantity-input');
  
    if ($qty.is('input')) {
      $qty.val(quantity);
    } else {
      $qty.text(quantity);
    }
  
    $cartItem.find('[data-attr-app="quantity"]').text(quantity);
  
    const price = parseFloat($cartItem.data('price') || 0);
    const total = (price * quantity).toFixed(2);
  
    $cartItem.find('.line-total').text(total);
    $cartItem.find('[data-attr-app="quantity-subtotal"]').text(total);
  }

  _bindQuantityControls($cartItem) {
    $cartItem.off('click.qty').on('click.qty', '.quantity-btn', e => {
      e.stopPropagation();
      const $btn = $(e.currentTarget);
      if ($btn.hasClass('increment')) this.incrementQuantity($cartItem.data('productid'), $cartItem);
      else if ($btn.hasClass('decrement')) this.decrementQuantity($cartItem.data('productid'), $cartItem);
    });
  }

  _scheduleRender() {
    if (this._renderScheduled) return;
    this._renderScheduled = true;
    requestAnimationFrame(() => {
      this._renderScheduled = false;
      this._refreshUI();
    });
  }

  _refreshUI() {
    const totalCount = this.cart.reduce((s, i) => s + i.quantity, 0);
    const totalPrice = (this.cart.reduce((s, i) => s + i.price * i.quantity, 0)).toFixed(2);

    $(this.config.cartCountSelector).text(totalCount >= 0 ? totalCount : '');
    $(this.config.subtotalSelector).text(totalPrice);
    $(this.config.subtotalSelectorHidden).val(totalPrice)
    $(this.config.totalSelector).text(totalPrice);

    if ($(this.config.cartPageItemsSelector).length) this._renderPageItems();
    if ($(this.config.cartItemsContainerSelector).length) this._renderCartItems();
    this._renderProductSummary();

    this._dispatchCustomEvent('refreshCartCountEvent', {
      cartData: this.cart, totalCount, totalPrice
    });
  }

  // ─── Product Summary (#product-summary) ───────────────────────────────────

  _renderProductSummary() {
    const $summary = $('#product-summary');
    if (!$summary.length) return;

    if (this.cart.length === 0) {
      $summary.text('the selected product(s)');
      return;
    }

    const text = this.cart
      .map(item => `${item.productName} (qty ${item.quantity}, $${item.price.toFixed(2)} each)`)
      .join(', ');

    $summary.text(text);
  }

  // ─── Cart Page Renderer (#pageItems) ─────────────────────────────────────

  _renderPageItems() {
    const $container = $(this.config.cartPageItemsSelector);
    const $empty = $(this.config.cartPageEmptySelector);

    if (!$container.length || !this.pageItemTemplate) return;

    if (this.cart.length === 0) {
      $container.empty();
      $empty.removeClass('d-none');
      return;
    }

    $empty.addClass('d-none');

    const fragment = document.createDocumentFragment();
    this.cart.forEach((item, index) => fragment.appendChild(this._createPageItem(item, index)));

    $container[0].innerHTML = '';
    $container[0].appendChild(fragment);
  }

  // updated code for the expedited shipping quantity disable
  _createPageItem(item, index) {
    const $el = this.pageItemTemplate.clone();
    const el = $el[0];
  
    $el
      .attr('data-productid', item.productId)
      .attr('data-index', index)
      .data('price', item.price)
      .data('productid', item.productId);
  
    const img = el.querySelector('[data-attr-app="image"]');
    if (img) {
      img.alt = item.productName;
      this._attachImageFallback(img, this._buildImageFallbackChain(item.image));
    }
  
    el.querySelectorAll('[data-attr-app="name"]').forEach(n => n.textContent = item.productName);
    el.querySelectorAll('[data-attr-app="price"]').forEach(n => n.textContent = item.price.toFixed(2));
    el.querySelectorAll('[data-attr-app="quantity"]').forEach(n => n.textContent = item.quantity);
    el.querySelectorAll('[data-attr-app="quantity-subtotal"]').forEach(n => n.textContent = (item.price * item.quantity).toFixed(2));
  
    const isExpedited = this.isExpeditedItem(item);
  
    if (isExpedited) {
      $el.find('.cart-item-quantity').hide();
    } else {
      this._updateQuantityDisplay($el, item.quantity);
      this._bindQuantityControls($el);
    }


    const isShipmentProtection = this.isShipmentProtectionItem(item);
  
    if (isShipmentProtection) {
      $el.find('.cart-item-quantity').hide();
    } else {
      this._updateQuantityDisplay($el, item.quantity);
      this._bindQuantityControls($el);
    }
  
    return el;
  }

  // ─── Slide-out Cart Renderer (.cart-items-container) ─────────────────────

  _renderCartItems() {
    const $container = $(this.config.cartItemsContainerSelector);
    if (!$container.length || !this.cartItemTemplate) return;

    if (this.cart.length === 0) {
      $container.html('<div class="text-center py-4"><p style="color:#000">Your cart is empty</p></div>');
      return;
    }

    $container.empty().append(this.cart.map(item => this._createCartItemElement(item)));
  }

  // updated code for the expedited shipping quantity disable
  _createCartItemElement(item) {
    if (!this.cartItemTemplate) return $('<div></div>');
  
    const $el = this.cartItemTemplate.clone();
  
    $el
      .attr('data-productid', item.productId)
      .data('price', item.price)
      .data('productid', item.productId);
  
    const $img = $el.find('[data-attr-app="image"]');
    if ($img.length) {
      $img.attr({ alt: item.productName });
      this._attachImageFallback($img[0], this._buildImageFallbackChain(item.image));
    }
  
    const $name = $el.find('[data-attr-app="name"]');
    if ($name.length) {
      $name.text(item.productName);
    }
  
    const lineTotal = (item.price * item.quantity).toFixed(2);
  
    $el.find('[data-attr-app="price"]').text(lineTotal);
    $el.find('.line-total').text(lineTotal);
  
    const isExpedited = this.isExpeditedItem(item);
  
    if (isExpedited) {
      $el.find('.cart-item-quantity').hide();
    } else {
      this._updateQuantityDisplay($el, item.quantity);
      this._bindQuantityControls($el);
    }

    const isShipmentProtection = this.isShipmentProtectionItem(item);
  
    if (isShipmentProtection) {
      $el.find('.cart-item-quantity').hide();
    } else {
      this._updateQuantityDisplay($el, item.quantity);
      this._bindQuantityControls($el);
    }
  
    return $el;
  }

  _getImageBasePath() {
    const pageType = document.querySelector('meta[name="device-type"]')?.getAttribute('content');
    return pageType === 'mobile' ? '../app_assets/images/' : 'app_assets/images/';
  }

  // ─── Image fallback handling ──────────────────────────────────────────────
  // Builds an ordered list of image URLs to try, in order, for a given
  // product image filename. Replaces the old buildOnerror() string-builder,
  // which double-prefixed paths and was vulnerable to breaking on quotes
  // in filenames since it injected raw values into an inline JS string.

  _buildImageFallbackChain(imageFile) {
    const basePath = this._getImageBasePath();
    const file = imageFile || '';
    const placeholder = this.config.defaultImage;

    return [
      basePath + file,
      '../' + basePath + file,
      basePath + placeholder,
      '../' + basePath + placeholder
    ];
  }

  _attachImageFallback(imgEl, fallbackChain) {
    let attempt = 0;
    imgEl.src = fallbackChain[attempt];

    imgEl.onerror = () => {
      attempt++;
      if (attempt < fallbackChain.length) {
        imgEl.src = fallbackChain[attempt];
      } else {
        imgEl.onerror = null; // stop the loop once all fallbacks are exhausted
      }
    };
  }

  _dispatchCustomEvent(name, detail) {
    const event = new CustomEvent(name, { detail, bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    return event;
  }

  _loadCartConfig() {
    $.ajax({
      url: 'cart-config' + window.location.search,
      method: 'GET',
      success: res => {
        try {
          this.cartConfig = typeof res === 'string' ? JSON.parse(res) : res;
          window.cart_config = this.cartConfig;
          this._refreshCategories();
        } catch (err) {
          console.error('Error parsing cart config:', err);
        }
      },
      error: err => console.error('Error loading cart config:', err)
    });
  }

  _refreshCategories() {
    const allowed = this._getAllowedCategories(window.cart_config);
    if (allowed.type !== 'LIMITED') return;

    const allowedSet = new Set(allowed.values.map(String));
    document.querySelectorAll('productcategory').forEach(cat => {
      const id = cat.getAttribute('attr-id') ?? '';
      cat.classList.toggle('d-none', !allowedSet.has(id));
    });
  }

  _getAllowedCategories(config) {
    const raw = config?.display_categories;
    if (!raw) return { type: 'ALL' };
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0 || parsed.includes('*')) return { type: 'ALL' };
      return { type: 'LIMITED', values: parsed.map(Number) };
    } catch {
      console.warn('Invalid display_categories format', raw);
      return { type: 'ALL' };
    }
  }


  removeParam(url, param, ignoreFlag = false) {
    if (ignoreFlag) return url;

    const regex = new RegExp('([?&])' + param + '=[^&]*');

    return url
      .replace(regex, '')
      .replace(/[?&]$/, '');
  }

  navigateToCart(ignoreflag = '') {
    const cartType = this.cartConfig?.cart_type || 'full_page';
    if (cartType === 'slide_out') {
      const cartOverlay = document.getElementById('cart-drawer-overlay');
      if (cartOverlay) {
        cartOverlay.classList.add('drawer-open-active');
        document.body.classList.add('cart-drawer-active');
      }

      // const modalEl = document.getElementById('cartPanel');
      // if (modalEl) {
      //   new bootstrap.Offcanvas(modalEl, { backdrop: true, scroll: false }).show();
      //   this._renderCartItems();
      //   return;
      // }
    }
    else {
      window.location.href = this.removeParam('cart' + window.location.search, ignoreflag)
    }
  }

  _onBeforeAddToCart(e) { /* hook */ }
  _onRefreshCartCount(e) { /* hook */ }
  _onAfterAddToCart(e) {
    e.detail.element.html('Added');
    this._refreshUI();
  }

  getCart() { return [...this.cart]; }
  getTotal() { return this.cart.reduce((s, i) => s + i.price * i.quantity, 0); }
  getItemCount() { return this.cart.reduce((s, i) => s + i.quantity, 0); }
  findItem(id) { return this.cart.find(i => i.productId == id); }

  refreshCartCount() { this._refreshUI(); }
  renderCartProducts() { this._renderPageItems(); }
  renderCartItems() { this._renderCartItems(); }
  refreshCategories() { this._refreshCategories(); }
  loadCartConfig() { this._loadCartConfig(); }
}

$(document).ready(() => { window.cartManager = new CartManager(); });

function getCartAction(ignoreflag = '') { window.cartManager?.navigateToCart(ignoreflag); }

async function getFunnelHash() {
  const url = new URL(window.location.href);
  const result = url.origin + url.pathname.substring(0, url.pathname.lastIndexOf('/'));
  const data = new TextEncoder().encode(result);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash))).slice(0, 12);
}