      /* ── Helpers ── */

      function recalcGrand() {
        const subtotal = parseFloat($(".summary-subtotal").text()) || 0;
        const shipping = $("#shipping-summary").hasClass("d-none")
          ? 0
          : parseFloat($(".summary-shipping").text()) || 0;
        $(".summary-grand").text((subtotal + shipping).toFixed(2));
      }

      function recalcSubtotal() {
          let activeCross = $(".sel-crossprod.active");
          if(activeCross.length > 0){
            $("[name='extended-subscription']").prop('checked', true)   
          }
          else{
            $("[name='extended-subscription']").prop('checked', false)               
          }

        let total = 0;
        $("#summary-items .order-item").each(function () {
          const priceText = $(this)
            .find(".order-item-price")
            .text()
            .replace("$", "");
          total += parseFloat(priceText) || 0;
        });
        $(".summary-subtotal").text(total.toFixed(2));
        recalcGrand();
      }

      /* ── Billing toggle ── */
      function toggleBilling(cb) {
        document.getElementById("billingFields").style.display = cb.checked
          ? "none"
          : "block";
      }

      /* ── Coupon ── */
      function applyCoupon() {
        const val = document.getElementById("couponCode").value.trim();
        if (!val) return;
        alert('Coupon "' + val + '" applied!');
      }

      /* ── Payment method toggle ── */
      $(".payment-method-text").click(function (e) {
        $(".payment-method-text").removeClass("payment-active");
        $(this).addClass("payment-active");
        let targetDiv = $(this).data("targetDiv");
        let cardType =
          $(this).closest(".payment-method-content").data("cardtype") || "visa";
        $(".pay-method-fields").addClass("d-none");
        $(".cc-field").removeClass("required");
        $("#creditCardType").val(cardType);
        if (targetDiv && targetDiv.length > 0) {
          $(targetDiv).removeClass("d-none");
          if (targetDiv === "#credit-card-fields") {
            $(".cc-field").addClass("required");
          }
        }
      });

      /* ── Shipping toggle ── */
      $(document).on("click", ".ship-option", function () {
        if ($(this).hasClass("shipping-active")) {
          $(this).removeClass("shipping-active");
          $("#shipping_div1").html("");
          localStorage.removeItem("shippingPrice");
          $("#shipping-summary").addClass("d-none");
          recalcGrand();
        } else {
          $(".ship-option").removeClass("shipping-active");
          $(this).addClass("shipping-active");
          let selectedShipping = $(this).attr("attr-id");
          let selectedShippingPrice = parseFloat($(this).attr("attr-price"));
          localStorage.setItem("shippingPrice", selectedShippingPrice);
          addShippingField(selectedShipping);
          $(".summary-shipping").text(selectedShippingPrice.toFixed(2));
          $("#shipping-summary").removeClass("d-none");
          recalcGrand();
        }
      });

      /* ── Cross-sell toggle ── */
      $(document).on("click", ".rp-card", function (e) {
        e.stopPropagation();

        const card = $(this);
        if(card.hasClass('cross-disabled')) return;
        
        const productId = card.data("productid");
        const name = card.data("productname");
        const price = parseFloat(card.data("price"));
        const qty = parseInt(card.data("quantity")) || 1;
        const image = card.data("image");
        const summaryId = "summary-item-cross-" + productId;

        const isAdded = card.hasClass("rp-added");

        if (isAdded) {
          // Remove from summary
          card.removeClass("rp-added");
          card.find(".rp-add-btn").removeClass("rp-done").html("+");
          $("#" + summaryId).remove();
        } else {
          // Add to summary
          card.addClass("rp-added");
          card.find(".rp-add-btn").addClass("rp-done").html("&#10003;");

          const imagePath = _getImageBasePath() + image;
          const lineTotal = (price * qty).toFixed(2);

          const itemHtml = `
        <div class="order-item" id="${summaryId}">
          <div class="order-item-thumb">
            <img src="${imagePath}" alt="${name}">
            <span class="order-item-badge">${qty}</span>
          </div>
          <p class="order-item-name">${name}</p>
          <span class="order-item-price">$${lineTotal}</span>
        </div>`;

          $("#summary-items").append(itemHtml);
        }

        recalcSubtotal();
      });

      /* ── Prevent btn-only click bubbling (the + button is inside the card) ── */
      $(document).on("click", ".rp-add-btn", function (e) {
        e.stopPropagation();
        const card = $(this);
        if(card.hasClass('cross-disabled')) return;
        
        $(this).closest(".rp-card").trigger("click");
      });

      /* ── DOMContentLoaded: populate from cart ── */
      document.addEventListener("DOMContentLoaded", function (ev) {
        const crosslproducts = document.querySelectorAll('crosssellproduct');

if (crosslproducts.length == 0) {
    $(".unify-extended-subscription-box").hide();
}          
  
        localStorage.removeItem("checkoutData");
        $("#subtotal-div").addClass("force-hide");
        $(".subtotal-line").addClass("force-hide");

        getFunnelHash().then((hash) => {
          let cartProducts = localStorage.getItem("cart-" + hash);

          if (cartProducts != null) {
            cartProducts = JSON.parse(cartProducts);
            let product_html = "";
            let summary_html = "";
            let summaryTotal = 0;
            $("#subtotal-div").removeClass("force-hide");
            $(".subtotal-line").removeClass("force-hide");

            cartProducts.map((product, index) => {
              product_html += `
            <div class="sel-prod active"
              data-billingmodelid="${product.billingModelId}"
              data-offerid="${product.offerId}"
              data-productid="${product.productId}"
              data-quantity="${product.quantity}"
              data-price="${product.price}"
              data-productname="${product.productName}"
              data-image="${product.image}"></div>`;

              const lineTotal = (product.price * product.quantity).toFixed(2);
              summary_html += `
            <div class="order-item" id="summary-item-${product.productId}">
              <div class="order-item-thumb">
                <img src="${_getImageBasePath() + product.image}" alt="${product.productName}">
                <span class="order-item-badge">${product.quantity}</span>
              </div>
              <p class="order-item-name">${product.productName}</p>
              <span class="order-item-price">$${lineTotal}</span>
            </div>`;

              summaryTotal += product.price * product.quantity;
            });

            $("#product_div").html(product_html);
            $("#summary-items").html(summary_html);
            $(".summary-subtotal").text(summaryTotal.toFixed(2));
            $(".summary-grand").text(summaryTotal.toFixed(2));

            if (cartProducts.length >= 1) {
              $("#productId").val(cartProducts[0]["productId"]);
            }
          } else {
            $("#subtotal-div").hide();
          }

          let productDiv = document.getElementById("product_div1");
          let productDivHtml = "";
          productDiv.innerHTML = "";

          if (cartProducts && cartProducts.length > 0) {
            cartProducts.forEach((item, index) => {
              productDivHtml += `
            <input type="hidden" name="products[${index}][billingModelId]" value="${item.billingModelId}"/>
            <input type="hidden" name="products[${index}][offerId]" value="${item.offerId}"/>
            <input type="hidden" name="products[${index}][quantity]" value="${item.quantity}"/>
            <input type="hidden" name="products[${index}][price]" value="${item.price}"/>`;
              if (index != 0) {
                productDivHtml += `<input type="hidden" name="products[${index}][productId]" value="${item.productId}"/>`;
              }
            });
          }
          productDiv.innerHTML = productDivHtml;
        });

        document.addEventListener("refreshCartCountEvent", (e) => {
          let productDiv = document.getElementById("product_div1");
          let productDivHtml = "";
          productDiv.innerHTML = "";
          if (e.detail && e.detail.cartData) {
            let cardData = e.detail.cartData;
            cardData.forEach((item, index) => {
              productDivHtml += `
            <input type="hidden" name="products[${index}][billingModelId]" value="${item.billingModelId}"/>
            <input type="hidden" name="products[${index}][offerId]" value="${item.offerId}"/>
            <input type="hidden" name="products[${index}][quantity]" value="${item.quantity}"/>
            <input type="hidden" name="products[${index}][price]" value="${item.price}"/>`;
              if (index != 0) {
                productDivHtml += `<input type="hidden" name="products[${index}][productId]" value="${item.productId}"/>`;
              }
            });
          }
          productDiv.innerHTML = productDivHtml;
        });
      });

      function _getImageBasePath() {
        const pageType = document
          .querySelector('meta[name="device-type"]')
          ?.getAttribute("content");
        return pageType === "mobile"
          ? "../app_assets/images/"
          : "app_assets/images/";
      }