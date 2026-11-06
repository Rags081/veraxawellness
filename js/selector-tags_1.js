// ========== IMAGE HELPER FUNCTIONS ==========
/**
 * Check if an image exists before setting it
 * Falls back to placeholder if image doesn't load
 */
function formatPrice(value) {
    const num = parseFloat(value);
    return isNaN(num) ? value : num.toFixed(2);
}

function checkImageExists(url, callback) {
    const img = new Image();
    img.onload = () => callback(true, url);
    img.onerror = () => callback(false, url);
    img.src = url;
}

/**
 * Build onerror fallback chain for image elements:
 * 1st try  → app_assets/images/<image>          (set via checkImageExists)
 * 2nd try  → ../app_assets/images/<image>
 * 3rd try  → app_assets/images/product-placeholder.png
 * 4th try  → ../app_assets/images/product-placeholder.png
 */
function buildOnerror(imageValue) {
    return "if(!this.dataset.retried){this.dataset.retried='1';this.src='../app_assets/images/" + imageValue + "';}else if(!this.dataset.retried2){this.dataset.retried2='1';this.src='app_assets/images/product-placeholder.png';}else if(!this.dataset.retried3){this.dataset.retried3='1';this.src='../app_assets/images/product-placeholder.png';}else{this.onerror=null;}";
}


// Custom script added by Team.
function formatPrice(value) {
    const num = parseFloat(value);
    return isNaN(num) ? value : num.toFixed(2);
}

/**
 * Apply image with fallback chain to a set of image elements
 */
function applyImage(imageElements, imageValue) {

    const imageUrl = "app_assets/images/" + imageValue;
    const onerror = buildOnerror(imageValue);

    checkImageExists(imageUrl, (exists, url) => {
        imageElements.forEach(el => {
            console.log(exists, url);

            el.src = exists ? url : "app_assets/images/product-placeholder.png";
            el.setAttribute('onerror', onerror);
        });
    });
}
/**
 * ========== DOCUMENT READY - INITIALIZATION ==========
 */
$(document).ready(function () {

    // ========== META TAGS CONFIGURATION ==========
    // Check if meta configuration exists in funnel config
    if(typeof funnel_config!=="undefined")
    {
        let meta_config_exists = funnel_config.meta_config?.length || 0;
        if (meta_config_exists > 0) {
            let meta_config = JSON.parse(funnel_config.meta_config);

            // Set page title from config or keep existing
            document.title = meta_config.meta_title || document.title;

            // Set or create meta description tag
            let meta = document.querySelector('meta[name="description"]');
            if (!meta) {
                meta = document.createElement('meta');
                meta.name = "description";
                document.head.appendChild(meta);
            }
            meta.content = meta_config.meta_description || meta.content;
        }
    }


    // ========== PAYPAL BUTTON HANDLER ==========
    /**
     * Handle PayPal payment option
     * - Sets payment type to PayPal
     * - Removes credit card validation requirements
     * - Triggers form submission
     */
    $("#paypal-button").click(function (e) {
        let subbtn = document.querySelector("button[type='submit']");

        // Set credit card type to PayPal
        $("#creditCardType").val('paypal').trigger('change');

        // Remove validation requirements for credit card fields
        $("input[name='creditCardNumber']").removeClass("required");
        $("input[name='expmonth']").removeClass("required");
        $("input[name='expyear']").removeClass("required");
        $("input[name='CVV']").removeClass("required");

        // Submit the form
        subbtn.click();
    });

    // ========== SHIPPING METHOD SETUP ==========
    // Set data attributes for all shipping method elements
    document.querySelectorAll('shippingmethod').forEach(shippingmethod => {
        const idValue = shippingmethod.getAttribute('attr-id') ?? '';
        const nameValue = shippingmethod.getAttribute('attr-name') ?? '';
        const priceValue = shippingmethod.getAttribute('attr-price') ?? '';

        const selShippingDiv = shippingmethod.querySelector('.payment-section');
        if (selShippingDiv) {
            selShippingDiv.setAttribute('data-shippingid', idValue);
            selShippingDiv.setAttribute('data-shippingname', nameValue);
            selShippingDiv.setAttribute('data-shippingprice', priceValue);
        }
    });

    // Display shipping method names and prices in UI
    document.querySelectorAll('shippingmethod').forEach(shippingmethod => {
        const nameValue = shippingmethod.getAttribute('attr-name') ?? '';
        const priceValue = shippingmethod.getAttribute('attr-price') ?? '';
        const idValue = shippingmethod.getAttribute('attr-id') ?? '';

        // Replace price placeholder with formatted price
        const priceElement = shippingmethod.querySelector('[data-attr-app="price"]');
        if(priceElement)
        {
            priceElement.innerHTML =  '$' + formatPrice(priceValue);
        }

        // Set shipping method name
        const nameElement = shippingmethod.querySelector('[data-attr-app="name"]');
        if(nameElement)
        {
            nameElement.innerHTML = nameValue;
        }

        const idElement = shippingmethod.querySelector('[data-attr-app="id"]');

        if (idElement) {
            idElement.value = idValue
            idElement.setAttribute('data-attr-price',priceValue)
        }
    });

    // ========== PAYMENT METHOD HANDLING ==========
    /**
     * Handle payment method selection
     * - Updates creditCardType field
     * - Toggles validation requirements based on payment type
     * - PayPal doesn't require card details, other methods do
     */
    $(".payment-method-content").click(function () {
        // Set the selected card type
        $("#creditCardType").val($(this).data('cardtype')).change();

        // Define payment types that don't require card details
        let excludedCardTypes = ['paypal', 'cod'];

        if (excludedCardTypes.includes($(this).data('cardtype'))) {
            // Remove validation requirements for PayPal
            $("input[name='creditCardNumber']").removeClass("required");
            $("select[name='expmonth']").removeClass("required");
            $("select[name='expyear']").removeClass("required");
            $("input[name='CVV']").removeClass("required");
        } else {
            // Add validation requirements for credit card payments
            $("input[name='creditCardNumber']").addClass("required");
            $("select[name='expmonth']").addClass("required");
            $("select[name='expyear']").addClass("required");
            $("input[name='CVV']").addClass("required");
        }
    });

    // ========== PAYMENT METHOD VISIBILITY ==========
    // Show only configured payment methods
    let paymentmethodselector = document.querySelector('paymentmethod');
    if (paymentmethodselector) {
        let pay_methods = paymentmethodselector.getAttribute('attr-providers');
        let available_pay_methods = JSON.parse(pay_methods);
        available_pay_methods.push('creditcard'); // Always include credit card

        document.querySelectorAll('.payment-method-content').forEach(method => {
            // Show payment method if it's in the available list
            if (available_pay_methods.some(item => item.includes(method.getAttribute('data-payment')))) {
                method.classList.remove('d-none');


                // If only one payment method available, auto-select it
                if (available_pay_methods.length == 1) {
                    showPayFields('card')
                    $("#paycard").prop('checked', true)
                    $(".cc-field").removeClass('has-error'); // Clear any errors
                }
            }
        });
    }

    // ========== PRODUCT CONFIGURATION ==========
    /**
     * Configure each product element with attributes from custom <product> tags
     * - Extracts product data from attributes
     * - Sets UI elements (name, price, image, description)
     * - Configures data attributes for selection handling
     */

    const crossproducts = document.querySelectorAll('crosssellproduct');

    if (crossproducts.length == 0) {
        $(".related_product").hide();
        $(".related_product_wrapper").hide();
    }


    crossproducts.forEach(product => {
        // Extract all product attributes from custom tag
        const idValue = product.getAttribute('attr-id') ?? '';
        const nameValue = product.getAttribute('attr-name') ?? '';
        const salePriceValue = product.getAttribute('attr-sale-price') ?? '';
        const priceValue = product.getAttribute('attr-price') ?? '';
        const billingModelIdValue = product.getAttribute('attr-billing-model-id') ?? '';
        const offerIdValue = product.getAttribute('attr-offer-id') ?? '';
        const shippingIdValue = product.getAttribute('attr-shipping-id') ?? '';
        const quantityValue = product.getAttribute('attr-quantity') ?? '';
        const imageValue = product.getAttribute('attr-image') ?? '';


        // Decode HTML entities in description
        let descriptionValue = product.getAttribute('attr-description') ?? '';
        descriptionValue = descriptionValue.replace(/&lt;/g, "<").replace(/&gt;/g, ">");

        // Set product name in UI
        const nameElement = product.querySelector('[data-attr-app="name"]');
        if (nameElement) {
            nameElement.textContent = nameValue;
        }

        // Set product price (prefer regular price over sale price)
        const priceElement = product.querySelector('[data-attr-app="price"]');
        if (priceElement) {
            priceElement.textContent = formatPrice(priceValue.length > 0 ? priceValue : salePriceValue);
        }
        applyImage(product.querySelectorAll('[data-attr-app="image"]'), imageValue);

        // Set product description (allows HTML content)
        const descriptionElement = product.querySelector('[data-attr-app="description"]');
        if (descriptionElement) {
            descriptionElement.innerHTML = descriptionValue;
        }

        // Set all data attributes on the selectable product container
        const selProdDiv = product.querySelector('.sel-prod');
        if (selProdDiv) {
            selProdDiv.setAttribute('data-productid', idValue);
            selProdDiv.setAttribute('data-productname', nameValue);
            selProdDiv.setAttribute('data-price', priceValue);
            selProdDiv.setAttribute('data-billingmodelid', billingModelIdValue);
            selProdDiv.setAttribute('data-offerid', offerIdValue);

            // Only set shipping ID if it exists
            if (shippingIdValue) {
                selProdDiv.setAttribute('data-shippingid', shippingIdValue);
            }

            selProdDiv.setAttribute('data-quantity', quantityValue);
            selProdDiv.setAttribute('data-image', imageValue);
        }
    });


    // ========== PRODUCT CONFIGURATION ==========
    /**
     * Configure each product element with attributes from custom <product> tags
     * - Extracts product data from attributes
     * - Sets UI elements (name, price, image, description)
     * - Configures data attributes for selection handling
     */
    document.querySelectorAll('product').forEach(product => {
        // Extract all product attributes from custom tag
        const idValue = product.getAttribute('attr-id') ?? '';
        const infoIdValue = product.getAttribute('attr-info-id') ?? '';
        const nameValue = product.getAttribute('attr-name') ?? '';
        const salePriceValue = product.getAttribute('attr-sale-price') ?? '';
        const priceValue = product.getAttribute('attr-price') ?? '';
        const billingModelIdValue = product.getAttribute('attr-billing-model-id') ?? '';
        const offerIdValue = product.getAttribute('attr-offer-id') ?? '';
        const shippingIdValue = product.getAttribute('attr-shipping-id') ?? '';
        const quantityValue = product.getAttribute('attr-quantity') ?? '';
        const imageValue = product.getAttribute('attr-image') ?? '';
        const categoryId = product.getAttribute('attr-categoryid') ?? '';


        // Decode HTML entities in description
        let descriptionValue = product.getAttribute('attr-description') ?? '';
        descriptionValue = descriptionValue.replace(/&lt;/g, "<").replace(/&gt;/g, ">");

        // Set product name in UI. Elements inside (or that ARE) a
        // <product-tag> variant option/button are already filled with that
        // variant's own label by the unify package (marked
        // data-unify-variant, on itself or an ancestor) — skip those so this
        // card-level fill doesn't overwrite them with the group name.
        const nameElements = product.querySelectorAll('[data-attr-app="name"]:not([data-unify-variant]):not([data-unify-variant] *)');
        if (nameElements) {
            nameElements.forEach(el => {
                el.textContent = nameValue;
            });
        }

        // Set product price (prefer regular price over sale price)
        const priceElements = product.querySelectorAll('[data-attr-app="price"]:not([data-unify-variant]):not([data-unify-variant] *)');
        if (priceElements) {
            priceElements.forEach(el => {
                el.textContent = formatPrice(priceValue.length > 0 ? priceValue : salePriceValue);
            });
        }
        applyImage(product.querySelectorAll('[data-attr-app="image"]'), imageValue);

        // Set product description (allows HTML content)
        const descriptionElement = product.querySelector('[data-attr-app="description"]');
        if (descriptionElement) {
            descriptionElement.innerHTML = descriptionValue;
        }

        // Set all data attributes on the selectable product container
        const selProdDiv = product.querySelector('.sel-prod');
        if (selProdDiv) {
            selProdDiv.setAttribute('data-productid', idValue);
            selProdDiv.setAttribute('data-productname', nameValue);
            selProdDiv.setAttribute('data-price', priceValue);
            selProdDiv.setAttribute('data-billingmodelid', billingModelIdValue);
            selProdDiv.setAttribute('data-offerid', offerIdValue);
            selProdDiv.setAttribute('data-categoryid', categoryId);

            // Only set shipping ID if it exists
            if (shippingIdValue) {
                selProdDiv.setAttribute('data-shippingid', shippingIdValue);
            }

            selProdDiv.setAttribute('data-quantity', quantityValue);
            selProdDiv.setAttribute('data-image', imageValue);

            selProdDiv.addEventListener('click', function(ev) {
                if (selProdDiv.classList.contains('upsell-prod')) {
                    return;
                }
                if (ev.target.closest('.add-to-cart-btn')) {
                    return;
                }
                // Read attr-info-id fresh from the <product> element rather
                // than the closed-over infoIdValue: a <product-tag> variant
                // pick (variant-tags.js) rewrites this attribute on selection,
                // and navigation should follow whichever variant is current.
                const currentInfoId = product.getAttribute('attr-info-id') ?? infoIdValue;
                const url = new URL('product-details', window.location.href);
                // Preserve existing search params
                window.location.search.slice(1).split('&').forEach(param => {
                    if (param) {
                        const [key, value] = param.split('=');
                        url.searchParams.set(decodeURIComponent(key), decodeURIComponent(value || ''));
                    }
                });
                // Remove old id if it exists, then set new one
                url.searchParams.delete('id');
                url.searchParams.set('id', currentInfoId);
                // Remove category from product-details URL
                url.searchParams.delete('category');
                window.location.href = url.toString();
            });
        }
    });


    document.querySelectorAll('productcategory').forEach(category => {
      try {
        const nameValue = category.getAttribute('attr-name') ?? '';
        const nameElement = category.querySelector('[data-attr-app="name"]');
        const categoryId = category.getAttribute('attr-id') ?? '';

        if (nameElement) {
            nameElement.textContent = nameValue;
        }
        // Update href
        //   const linkElement = category.querySelector('a');
        //   if (linkElement && categoryId) {
        //     linkElement.href = `category?category=${encodeURIComponent(categoryId)}`;
        //   }

        const linkElement = category.querySelector('a');

        if (linkElement && categoryId) {
            const url = new URL(linkElement.href, window.location.origin);

            // Remove old id if it exists
            url.searchParams.delete('id');

            // Set/update category
            url.searchParams.set('category', categoryId);

            linkElement.href = url.toString();
        }

        // querybtn wasn't null-checked before use — if a design doesn't have
        // a .viewcategorybtn inside <productcategory>, setAttribute on null
        // threw here and silently killed every remaining iteration of this
        // forEach (one category's failure was blanking out all of them).
        const querybtn = category.querySelector('.viewcategorybtn');
        if (querybtn) {
            querybtn.setAttribute('attr-id', categoryId);
        }
      } catch (err) {
        console.error('productcategory fill failed for one category, continuing with the rest:', err);
      }
    });


    // Get all product elements for future reference
    const products = document.querySelectorAll('.sel-prod');

    $('.submit-upsell-btn').click(function(){
        $("[name='is-upsell']").submit();
    });

    // Cross product extended-subscription toggle enable > Related products disabled
    $('[name="extended-subscription"]').change(function (event) {
        // if cross sell product already added, then stop execution
        let crossactive = $(".sel-crossprod.rp-added");
        if(crossactive.length > 0)
        {
            event.preventDefault();
            event.stopImmediatePropagation();
            $(this).prop('checked', !this.checked);
            return false;
        }

        let checked = event.target.checked;
        if (checked) {
            $("#crossproduct_div1").html('');
            $('.sel-crossprod').each(function () {
                $(this).addClass('cross-disabled');
                $(this).removeClass('active');
                updateRelatedProductUI($(this));
            });
        }
        if (!checked) {
            $('.sel-crossprod').each(function () {
                $(this).removeClass('cross-disabled');
                updateRelatedProductUI($(this));

            });
        }

        selectProduct('.sel-prod.active','sel-crossprod');

    });

    /**
     * ========== PRODUCT SELECTION CLICK HANDLER ==========
     * Handles user clicks on product cards
     * - Toggles active state
     * - Updates button text and styling
     * - Processes selection through selectProduct()
     */
    // $(".sel-prod").click(function (e) {
    //     // Don't allow to select related products if extended product checkbox is enabled
    //     if ($(this).hasClass('cross-disabled')) {
    //         return;
    //     }

    //     // Clear previous selections
    //     $("#productId").val('');
    //     $("#product_div1").html('');

    //     // Toggle selection state
    //     if ($(this).hasClass('active')) {
    //         // DESELECT: Remove active state
    //         $(this).removeClass("active");
    //     } else {
    //         // SELECT: Add active state
    //         $(this).addClass("active");
    //     }

    //     // Update related product button UI
    //     if ($(this).hasClass('product_box')) {
    //         updateRelatedProductUI($(this));
    //     } else {
    //         updateMainProductUI($(this));
    //     }
    //     selectProduct('.sel-prod.active','sel-crossprod');
    // });
});

// ========== OPERATINGHOURS SETUP ==========
// Configure each product element with attributes from custom tags
document.querySelectorAll('operatinghours').forEach(operatinghours => {
    // Extract all product attributes
    let dayValue = operatinghours.getAttribute('attr-day') ?? '';
    let timeFromValue = operatinghours.getAttribute('attr-timefrom') ?? '';
    let timeToValue = operatinghours.getAttribute('attr-timeto') ?? '';
    // console.log(dayValue,timeFromValue,timeToValue);

    const dayElement = operatinghours.querySelector('.day');
    if (dayElement) {
        dayElement.textContent = formatDayString(dayValue);
    }

    const timeFromElement = operatinghours.querySelector('.time_from');
    if (timeFromElement) {
        timeFromElement.textContent = timeFromValue;
    }

    const timeToElement = operatinghours.querySelector('.time_to');
    if (timeToElement) {
        timeToElement.textContent = timeToValue;
    }
    // console.log(operatinghours);


});

function formatDayString(dayStr) {
    const daysMap = {
        'mon': 'Monday',
        'tue': 'Tuesday',
        'wed': 'Wednesday',
        'thu': 'Thursday',
        'fri': 'Friday',
        'sat': 'Saturday',
        'sun': 'Sunday'
    };
    return daysMap[dayStr.toLowerCase()] || dayStr;
}
