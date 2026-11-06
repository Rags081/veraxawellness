// Variant selection: copy the chosen option's/button's attr-* values onto the
// parent <product> wrapper so the existing cart/buy JS orders the selected
// variant. The unify package only stamps attrs on each repeated copy; this
// wiring is deliberately funnel-side so the design owns the interaction.
// This copy is adapted for the lux theme: data-attr-app markers and
// app_assets image paths.
(function () {
    var COPY_ATTRS = [
        'attr-id', 'attr-info-id', 'attr-price', 'attr-sale-price',
        'attr-rebill-price', 'attr-billing-model-id', 'attr-offer-id',
        'attr-shipping-id', 'attr-quantity', 'attr-image', 'attr-description',
        'attr-sku'
    ];
    // attr-name intentionally excluded: the card title stays the group name.

    // The unify package wraps variant-aware output in a <product> element on
    // the non-paginated path. The AJAX pagination path (pagination.js) builds
    // its own cards as <div class="sel-product">, so variant lookups need to
    // find whichever wrapper is present.
    function variantCard(el) {
        return el.closest('product, .sel-product, .sel-prod');
    }

    function marker(card, name) {
        return card.querySelector('[data-attr-app="' + name + '"], [data-attr-app="' + name + '"]');
    }
    function formatPrice(value) {
        var num = parseFloat(value);
        return isNaN(num) ? value : num.toFixed(2);
    }

    // Maps a variant's attr-* names to the data-* names selector-tags.js
    // copies onto .sel-prod at page load — cart.js's Add to Cart handler
    // reads .sel-prod's data-* attributes, not <product>'s attr-*, so a
    // variant pick has to be mirrored there too or the wrong variant adds
    // to cart. attr-name is intentionally excluded (card title stays the
    // group name), matching COPY_ATTRS above.
    var SEL_PROD_ATTRS = {
        'attr-id': 'data-productid',
        'attr-info-id': 'data-infoid',
        'attr-price': 'data-price',
        'attr-billing-model-id': 'data-billingmodelid',
        'attr-offer-id': 'data-offerid',
        'attr-shipping-id': 'data-shippingid',
        'attr-quantity': 'data-quantity',
        'attr-image': 'data-image'
    };

    // cart.js builds the cart line's name as
    //   `${data.productname}${type && type !== 'One Time' ? ' - ' + type : ''}`
    // where `type` comes from `$parent.find('select option:selected')`
    // (cart.js _handleAddToCart). A button/card variant design has no <select>,
    // so `type` would be undefined and every line would collapse to the bare
    // group name — "Magnesium Glycinate Max" for all six rows.
    //
    // Rather than touch cart.js, keep a hidden single-option <select> inside
    // .sel-prod carrying the active variant's label. cart.js then reads it
    // exactly as it always has, and the cart line reads
    // "Magnesium Glycinate Max - 2 Bottles (Onetime)".
    var TYPE_SELECT_CLASS = 'variant-type-proxy';

    function syncTypeProxy(card, source) {
        var selProd = card.classList && card.classList.contains('sel-prod')
            ? card
            : card.querySelector('.sel-prod');
        if (!selProd) return;

        var quantityLabel = labelOf(source).trim();
        if (!quantityLabel) return;

        // The tag label alone is the quantity ("4 Bottles"). When the page
        // splits variants into purchase-type tabs, the label is ambiguous on
        // its own — 1017 and 1018 are BOTH "4 Bottles" — so the cart line must
        // carry the mode too, or a one-time and a subscription line look
        // identical in the cart. Skipped when the tag already names the type
        // (a renamed "One Time - 4 Bottles" tag would otherwise say it twice).
        var scope = source.closest('[data-purchase-scope]');
        var purchaseType = '';
        if (scope && !ONETIME_RE.test(quantityLabel) && !SUBSCRIPTION_RE.test(quantityLabel)) {
            var mode = card.getAttribute('data-active-purchase-type');
            if (!mode) {
                var active = scope.querySelector('[data-purchase-toggle].purchase-active');
                mode = active ? active.getAttribute('data-purchase-toggle') : null;
            }
            if (mode) purchaseType = mode === 'subscription' ? 'Subscription' : 'Onetime';
        }

        // Keep the two facts separately as well as combined: cart.js derives
        // productName/type from this one <select>, but the stored cart line
        // gets them as their own fields (afterAddToCart, below).
        rememberVariantState(card, quantityLabel, purchaseType);

        var label = purchaseType
            ? quantityLabel + ' (' + purchaseType + ')'
            : quantityLabel;

        // A real designer-authored <select> already feeds cart.js — leave it be.
        var existing = selProd.querySelector('select');
        if (existing && !existing.classList.contains(TYPE_SELECT_CLASS)) return;

        var proxy = existing;
        if (!proxy) {
            proxy = document.createElement('select');
            proxy.className = TYPE_SELECT_CLASS;
            proxy.style.display = 'none';
            proxy.setAttribute('aria-hidden', 'true');
            proxy.setAttribute('tabindex', '-1');
            selProd.appendChild(proxy);
        }
        proxy.innerHTML = '';
        var option = document.createElement('option');
        option.setAttribute('attr-name', label);
        option.selected = true;
        option.textContent = label;
        proxy.appendChild(option);
    }

    // The active variant's quantity label and purchase type, tracked per card
    // so the cart line can carry them as separate fields (see the
    // afterAddToCart listener at the bottom of this file).
    var VARIANT_STATE = 'data-variant-state';

    function rememberVariantState(card, quantityLabel, purchaseType) {
        try {
            card.setAttribute(VARIANT_STATE, JSON.stringify({
                variantLabel: quantityLabel || '',
                purchaseType: purchaseType || ''
            }));
        } catch (e) { /* non-fatal: the composite productName still applies */ }
    }

    function applyVariant(card, source) {
        COPY_ATTRS.forEach(function (name) {
            if (source.hasAttribute(name)) card.setAttribute(name, source.getAttribute(name));
        });
        var priceEl = marker(card, 'price');
        if (priceEl && source.hasAttribute('attr-price'))
            priceEl.textContent = formatPrice(source.getAttribute('attr-price'));
        var image = source.getAttribute('attr-image');
        var imageEl = marker(card, 'image');
        if (image && imageEl) {
            // Keep the current src as the fallback: several variant images are
            // absent from app_assets/images on this funnel, and swapping to a
            // missing file would otherwise leave a broken-image icon.
            var previous = imageEl.getAttribute('src');
            imageEl.onerror = function () {
                this.onerror = null;
                if (previous) this.src = previous;
            };
            imageEl.src = 'app_assets/images/' + image;
        }
        var descriptionEl = marker(card, 'description');
        if (descriptionEl && source.hasAttribute('attr-description'))
            descriptionEl.innerHTML = source.getAttribute('attr-description');

        var selProd = card.classList && card.classList.contains('sel-prod')
            ? card
            : card.querySelector('.sel-prod');
        if (selProd) {
            Object.keys(SEL_PROD_ATTRS).forEach(function (attrName) {
                if (source.hasAttribute(attrName))
                    selProd.setAttribute(SEL_PROD_ATTRS[attrName], source.getAttribute(attrName));
            });
        }
        syncTypeProxy(card, source);
    }

    // Single capture-phase listener for both concerns:
    //   1. Variant dropdowns/buttons live inside product cards whose theme
    //      handlers react to card clicks (e.g. navigate to product-details).
    //      Swallow those clicks before they reach the theme handlers.
    //   2. Button/other designs: apply the variant here too, not in a
    //      separate bubble-phase listener — stopPropagation() below would
    //      prevent the event from ever reaching a bubble-phase listener on
    //      the same document, silently breaking selection.
    document.addEventListener('click', function (event) {
        // Add to Cart / Buy sit inside the same card as the variant control,
        // and closest('[attr-info-id]') would otherwise walk up to the card
        // wrapper itself (variant-tags.js stamps attr-info-id there too),
        // misreading a cart click as a variant re-pick. Let it through
        // untouched — it's not a variant control.
        if (event.target.closest && event.target.closest('.add-to-cart-btn, .btn-add, .modal-sp-btn'))
            return;

        var select = event.target.closest ? event.target.closest('select') : null;
        if (select && select.querySelector('option[attr-info-id]')) {
            // Swallow the card-click side effect; the native select still
            // opens because its default action is not prevented. Selecting
            // an option fires a separate 'change' event, handled below.
            event.stopPropagation();
            return;
        }

        var chosen = event.target.closest ? event.target.closest('[attr-info-id]') : null;
        if (!chosen || chosen.tagName === 'OPTION' || chosen.tagName === 'PRODUCT') return;

        event.stopPropagation();

        var card = variantCard(chosen);
        if (!card) return;
        var siblings = card.querySelectorAll('[attr-info-id][attr-selected], [attr-info-id].variant-active');
        for (var i = 0; i < siblings.length; i++) {
            siblings[i].removeAttribute('attr-selected');
            siblings[i].classList.remove('variant-active');
        }
        chosen.setAttribute('attr-selected', 'true');
        chosen.classList.add('variant-active');
        applyVariant(card, chosen);
        // Inline rather than in its own bubble-phase listener: the
        // stopPropagation() above means a later bubble listener never runs.
        syncCtaPrice(card, chosen);
    }, true);

    // ---------------------------------------------------------------------
    // Purchase-type tabs (One-time purchase / Subscribe & Save).
    //
    // <product-tag> renders ONE flat option list, because
    // ProductVariantGrouper keeps only the first tag per product — quantity
    // and purchase type cannot be two independent tag axes. So the six
    // rendered options arrive as three duplicated labels ("2 Bottles" twice,
    // "4 Bottles" twice, "6 Bottles" twice), and this splits them per tab.
    //
    // Preferred signal is the tag label itself: a label starting "One Time" /
    // "Subscription" (as funnels 340/347/368 name theirs) is used directly.
    // Until funnel 387's tags are renamed that way, every label is ambiguous,
    // so we fall back to document order — within each group of options sharing
    // a label, the first belongs to one-time and the second to subscription
    // (crm ids 1015/1017/1019 vs 1016/1018/1020). Renaming the tags in the CMS
    // makes the fallback inert with no change here.
    var ONETIME_RE = /^\s*(one[\s_-]?time|onetime)\b/i;
    var SUBSCRIPTION_RE = /^\s*(subscription|subscribe|recurring)\b/i;

    function labelOf(el) {
        if (el.tagName === 'OPTION') return el.textContent || '';
        var marker = el.querySelector('[data-attr-app="name"], [data-attr-unify="name"]');
        return (marker ? marker.textContent : el.getAttribute('attr-name')) || '';
    }

    // Returns 'onetime' | 'subscription' for each option, in DOM order.
    function classifyOptions(options) {
        var modes = [];
        var explicit = true;
        for (var i = 0; i < options.length; i++) {
            var declared = options[i].getAttribute('data-purchase-type');
            var label = labelOf(options[i]);
            if (declared) modes.push(declared);
            else if (ONETIME_RE.test(label)) modes.push('onetime');
            else if (SUBSCRIPTION_RE.test(label)) modes.push('subscription');
            else { modes.push(null); explicit = false; }
        }
        if (explicit) return modes;

        // Ambiguous labels: alternate within each run of identical labels.
        var seen = {};
        for (var j = 0; j < options.length; j++) {
            if (modes[j]) continue;
            var key = labelOf(options[j]).trim().toLowerCase();
            seen[key] = (seen[key] || 0) + 1;
            modes[j] = seen[key] === 1 ? 'onetime' : 'subscription';
        }
        return modes;
    }

    // <product-tag> fills only data-attr-*="name" and "price" server-side
    // (ProductVariantResolver::fillMarkers), so a per-variant thumbnail inside
    // the repeated design keeps the designer's placeholder src. The variant's
    // filename is stamped on the copy as attr-image, so wire it up here.
    // A missing file falls back to the placeholder rather than a broken icon.
    function fillVariantImages(root) {
        var options = (root || document).querySelectorAll('[attr-info-id][attr-image]');
        for (var i = 0; i < options.length; i++) {
            var option = options[i];
            if (option.tagName === 'PRODUCT') continue;
            var img = option.tagName === 'IMG'
                ? option
                : option.querySelector('img[data-attr-app="image"], img');
            if (!img || img.getAttribute('data-variant-img') === 'true') continue;
            var file = option.getAttribute('attr-image');
            if (!file) continue;
            img.setAttribute('data-variant-img', 'true');
            var fallback = img.getAttribute('src');
            img.onerror = function () {
                this.onerror = null;
                if (fallback) this.src = fallback;
            };
            img.src = 'app_assets/images/' + file;
        }
    }

    function variantOptions(card) {
        var all = card.querySelectorAll('[attr-info-id]');
        var out = [];
        for (var i = 0; i < all.length; i++)
            if (all[i].tagName !== 'PRODUCT') out.push(all[i]);
        return out;
    }

    // Mirror the active variant's price onto the CTA button and the VIP terms.
    // Scoped to the card so a grid of cards each update their own; falls back
    // to the document for a single-product page whose CTA sits outside it.
    function syncCtaPrice(card, source) {
        var price = source && source.getAttribute('attr-price');
        if (!price) return;
        var target = (card && card.querySelector('.pd-cta-price'))
            || document.querySelector('.pd-cta-price');
        if (target) target.textContent = formatPrice(price);

        var rebill = (card && card.querySelector('.pd-purchase__rebill'))
            || document.querySelector('.pd-purchase__rebill');
        if (rebill) {
            var recurring = parseFloat(source.getAttribute('attr-rebill-price'));
            rebill.textContent = recurring > 0 ? formatPrice(recurring) : formatPrice(price);
        }
    }

    function applyMode(card, mode) {
        var options = variantOptions(card);
        if (!options.length) return;
        var modes = classifyOptions(options);
        var visible = [];
        for (var i = 0; i < options.length; i++) {
            var on = modes[i] === mode;
            if (options[i].tagName === 'OPTION') {
                options[i].hidden = !on;
                options[i].disabled = !on;
            } else {
                options[i].style.display = on ? '' : 'none';
            }
            if (on) visible.push(options[i]);
        }
        if (!visible.length) return;

        // The previously selected option may now be hidden — never leave a
        // hidden variant selected, or Add to Cart would order the wrong row.
        var current = null;
        for (var k = 0; k < visible.length; k++)
            if (visible[k].getAttribute('attr-selected') === 'true'
                || visible[k].classList.contains('variant-active')) current = visible[k];

        var chosen = current || visible[0];
        for (var m = 0; m < options.length; m++) {
            options[m].removeAttribute('attr-selected');
            options[m].classList.remove('variant-active');
            if (options[m].tagName === 'OPTION') options[m].selected = false;
        }
        chosen.setAttribute('attr-selected', 'true');
        chosen.classList.add('variant-active');
        if (chosen.tagName === 'OPTION') chosen.selected = true;
        // Set the mode BEFORE applyVariant: syncTypeProxy reads it to label the
        // cart line, and would otherwise pick up the mode we are leaving.
        card.setAttribute('data-active-purchase-type', mode);
        applyVariant(card, chosen);
        syncCtaPrice(card, chosen);
    }

    function setMode(scope, mode) {
        var toggles = scope.querySelectorAll('[data-purchase-toggle]');
        for (var i = 0; i < toggles.length; i++) {
            var on = toggles[i].getAttribute('data-purchase-toggle') === mode;
            toggles[i].classList.toggle('purchase-active', on);
            toggles[i].setAttribute('aria-selected', on ? 'true' : 'false');
        }
        var terms = scope.querySelectorAll('[data-purchase-terms]');
        for (var j = 0; j < terms.length; j++)
            terms[j].style.display =
                terms[j].getAttribute('data-purchase-terms') === mode ? '' : 'none';

        // The variant options live inside [data-purchase-scope], but the card
        // wrapper (<product> / .sel-prod) is an ANCESTOR of that scope, not a
        // descendant — so look upward first and only then fall back to a
        // descendant search (the AJAX/pagination markup nests the other way).
        var card = scope.closest ? scope.closest('product, .sel-prod, .sel-product') : null;
        var cards = card ? [card] : scope.querySelectorAll('product, .sel-prod, .sel-product');
        for (var k = 0; k < cards.length; k++) applyMode(cards[k], mode);
    }

    // Capture phase, matching the variant handler above: the tabs sit inside
    // the card region whose theme handlers react to clicks.
    document.addEventListener('click', function (event) {
        if (!event.target.closest) return;
        var toggle = event.target.closest('[data-purchase-toggle]');
        if (!toggle) return;
        event.preventDefault();
        event.stopPropagation();
        setMode(toggle.closest('[data-purchase-scope]') || document,
                toggle.getAttribute('data-purchase-toggle'));
    }, true);

    // A product with no tags has no variants at all: ProductVariantResolver
    // removes the <product-tag> placeholder (and one empty enclosing wrapper),
    // so the design's repeated block renders zero times. The purchase-type
    // tabs, the "Pick Your Quantity" heading and the VIP terms are plain
    // static markup though, so without this they would still show — a
    // One-time / Subscribe switch above an empty pack area on a product that
    // has neither. Hide the whole scope in that case.
    //
    // A single variant is treated the same way: one option is not a choice,
    // and there is no second purchase type to switch to.
    function hidePurchaseUiWithoutVariants() {
        var scopes = document.querySelectorAll('[data-purchase-scope]');
        var remaining = [];
        for (var i = 0; i < scopes.length; i++) {
            var card = scopes[i].closest('product, .sel-prod, .sel-product');
            var options = card ? variantOptions(card) : [];
            if (options.length > 1) {
                // Explicit 'block', not '': the markup ships with an inline
                // display:none to avoid a flash of the tabs on a no-variant
                // product, and clearing the inline value would only fall back
                // to whatever the stylesheet says.
                scopes[i].style.display = 'block';
                remaining.push(scopes[i]);
                continue;
            }
            scopes[i].style.display = 'none';
            // A lone variant still drives price/image/cart — apply it so the
            // card is not left showing the design's placeholder values.
            if (options.length === 1 && card) {
                applyVariant(card, options[0]);
                syncCtaPrice(card, options[0]);
            }
        }
        return remaining;
    }

    function initPurchaseTabs() {
        fillVariantImages();
        var scopes = hidePurchaseUiWithoutVariants();
        for (var i = 0; i < scopes.length; i++) {
            var active = scopes[i].querySelector('[data-purchase-toggle].purchase-active');
            setMode(scopes[i], active ? active.getAttribute('data-purchase-toggle') : 'onetime');
        }
    }

    // Dropdown designs: <select> whose options were stamped by <product-tag>.
    document.addEventListener('change', function (event) {
        var select = event.target;
        if (!select || select.tagName !== 'SELECT') return;
        var option = select.options[select.selectedIndex];
        if (!option || !option.hasAttribute('attr-info-id')) return;
        var card = variantCard(select);
        if (!card) return;
        applyVariant(card, option);
        syncCtaPrice(card, option);
    });

    // Radio designs: the package marks the default copy with
    // attr-selected="true" on the wrapper, but only ever writes `selected` on
    // an <option> — a radio <input> inside the copy is left unchecked. Without
    // this the page opens with the right option highlighted by CSS yet no
    // radio dot filled, and picking a variant leaves the old dot set.
    function syncRadios(root) {
        var labels = (root || document).querySelectorAll('[attr-info-id]');
        for (var i = 0; i < labels.length; i++) {
            var radio = labels[i].querySelector('input[type="radio"]');
            if (radio) radio.checked = labels[i].getAttribute('attr-selected') === 'true';
        }
    }

    // Clicking the label fires the generic [attr-info-id] handler above, which
    // moves attr-selected; re-sync afterwards so the dot follows it.
    document.addEventListener('click', function (event) {
        if (!event.target.closest) return;
        var chosen = event.target.closest('[attr-info-id]');
        if (chosen && chosen.querySelector('input[type="radio"]')) syncRadios(variantCard(chosen));
    });

    // cart.js builds its cart line with a fixed shape (productId, productName,
    // price, billingModelId, offerId, quantity, image, type) — extra data-*
    // attributes on .sel-prod never reach it, and the beforeAddToCart event
    // exposes only productData, not the item. So enrich the line after the
    // fact: cart.js fires afterAddToCart once the item is in this.cart, and
    // re-saving is what persists the new fields to localStorage.
    //
    //   variantLabel : "4 Bottles"      (quantity only)
    //   purchaseType : "Subscription"   (mode only)
    //
    // productName/type are left exactly as cart.js wrote them, so nothing that
    // already reads them changes.
    document.addEventListener('afterAddToCart', function (event) {
        var detail = event.detail || {};
        var cart = detail.cartData;
        var element = detail.element;
        if (!cart || !cart.length || !element || !element.closest) return;

        var card = variantCard(element.jquery ? element[0] : element);
        if (!card) return;

        var raw = card.getAttribute(VARIANT_STATE);
        if (!raw) return;
        var state;
        try { state = JSON.parse(raw); } catch (e) { return; }
        if (!state || !state.variantLabel) return;

        // Match on the id cart.js keyed the line by, not on array position:
        // an existing line is merged rather than appended (cart.js addToCart).
        var selProd = card.classList && card.classList.contains('sel-prod')
            ? card
            : card.querySelector('.sel-prod');
        var productId = selProd && selProd.getAttribute('data-productid');
        var line = null;
        for (var i = 0; i < cart.length; i++)
            if (String(cart[i].productId) === String(productId)) line = cart[i];
        if (!line) line = cart[cart.length - 1];

        line.variantLabel = state.variantLabel;
        line.purchaseType = state.purchaseType;

        // Persist: cart.js already saved the pre-enrichment line. Re-save
        // through the manager so the funnel-specific storage key is used —
        // it is 'cart-<hash>', not 'cart' (cart.js _initStorageKey), so
        // writing a hardcoded key here would create a second, ignored cart.
        var manager = window.cartManager;
        if (manager && typeof manager._saveCart === 'function') {
            manager._saveCart();
        } else if (manager && manager.config && manager.config.storageKey) {
            try {
                localStorage.setItem(manager.config.storageKey, JSON.stringify(cart));
            } catch (e) { /* storage unavailable — in-memory line still enriched */ }
        }
    });
    function formatVariantListPrices() {
        var markers = document.querySelectorAll('[data-attr-app="price"]');
        for (var i = 0; i < markers.length; i++) {
            if (markers[i].closest('[data-unify-variant]'))
                markers[i].textContent = formatPrice(markers[i].textContent);
        }
    }
    function init() {
        syncRadios();
        // Runs regardless of whether the page has purchase tabs — a plain
        // variant card with a per-option thumbnail needs it just the same.
        fillVariantImages();
        formatVariantListPrices();
        initPurchaseTabs();
    }

    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', init);
    else
        init();
})();
