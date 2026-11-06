
/**
 * ========== UTILITY FUNCTIONS ==========
 */

// Handle click events on product selection elements
function updateMainProductUI(element) {
  // Get UI elements for this product
  var $button = element.find('.prod-box');
  var $selectButton = element.find('.btn-select-product');
  var $upsellSelectButton = element.find('.btn-upsell');
  
  if (element.hasClass('active')) {
      // Update button to "Selected" state
      $selectButton.html(`Selected <img alt="" class="img-fluid ms-1 mb-1" src="images/yellow-arrow.svg">`);
      $selectButton.css({
          'background': '#28a745', // Green background
      });

      $button.addClass('select');
      
      $upsellSelectButton.html('Added to My Order').css('background','#ff3b3b').css('color','white');
  } else {
      $button.removeClass('select');
  
      // Update button to "Select" state
      $selectButton.html(`Select <img alt="" class="img-fluid ms-1 mb-1" src="images/yellow-arrow.svg">`);
      $selectButton.css({
          'background': 'linear-gradient(to right, #FF6D01, #EC4701)',
      });

      $upsellSelectButton.html('Add to My Order').css('background','white').css('color','#ff3b3b');
  }
}

// Handle click events on product selection elements
function updateRelatedProductUI(element) {
  var $button = element.find('.crossprod-box');
  var $selectButton = element.find('.btn-select-product');
  if (element.hasClass('active')) {
      $button.addClass('select');
      // Update button to "Selected" state
      $selectButton.html(`Added <img alt="" class="img-fluid ms-1 mb-1" src="images/yellow-arrow.svg">`);
      $selectButton.css({
          'background': '#28a745', // Green background
      });
  } else {
      $button.removeClass('select');
      // Update button to "Select" state
      $selectButton.html(`Add to Order <img alt="" class="img-fluid ms-1 mb-1" src="images/yellow-arrow.svg">`);
      $selectButton.css({
          'background': 'linear-gradient(to right, #FF6D01, #EC4701)',
      });
  }
}

/**
* ========== BILLING ADDRESS TOGGLE ==========
* Toggle visibility of billing address fields
* Used when "Same as shipping" checkbox is changed
* @param {string} action - "yes" to hide billing fields, "no" to show them
*/
function toggleBillingShipping(action) {
  if (action == "yes") {
      // Hide billing block and clear all billing field values
      $("#billing-block").hide();

      let billing_fields = document.querySelectorAll('.billing-field');
      billing_fields.forEach(field => {
          field.value = '';
      });

      $("#payment-block").show();
  }

  if (action == "no") {
      // Show both billing and payment blocks
      $("#billing-block").show();
      $("#payment-block").show();
  }
}

document.addEventListener('DOMContentLoaded', () => {

  const pageType = document
    .querySelector('meta[name="page-type"]')
    ?.getAttribute('content');

  if (pageType){
    
  }

  // Remove active from all nav links
  document.querySelectorAll(".nav-link.active")
    .forEach(link => link.classList.remove("active"));

  // Add active to the matching link
  const activeLink = document.querySelector(
    `.nav-link[data-page="${pageType}"]`
  );

  if (activeLink) {
    activeLink.classList.add("active");

    // Optional: also activate parent <li>
    activeLink.closest(".nav-item")?.classList.add("active");
  }

const megaMenus = document.querySelectorAll('.has-mega-menu');
const MOBILE_BREAKPOINT = 992; // Bootstrap lg breakpoint

const isMobile = () => window.innerWidth < MOBILE_BREAKPOINT;

megaMenus.forEach(menuItem => {
  const trigger = menuItem.querySelector('.nav-link');
  const dropdown = menuItem.querySelector('.mega-dropdown');
  let closeTimer;

  /* ---------- DESKTOP: HOVER ---------- */
  const openHover = () => {
    if (isMobile()) return;
    clearTimeout(closeTimer);
    menuItem.classList.add('open');
    dropdown.setAttribute('aria-hidden', 'false');
  };

  const closeHover = () => {
    if (isMobile()) return;
    closeTimer = setTimeout(() => {
      menuItem.classList.remove('open');
      dropdown.setAttribute('aria-hidden', 'true');
    }, 150);
  };

  menuItem.addEventListener('mouseenter', openHover);
  menuItem.addEventListener('mouseleave', closeHover);

  /* ---------- MOBILE: CLICK ---------- */
  trigger.addEventListener('click', (e) => {
    if (!isMobile()) return;

    e.preventDefault(); // stop navigation
    const isOpen = menuItem.classList.toggle('open');
    dropdown.setAttribute('aria-hidden', !isOpen);
  });
});

/* ---------- CLOSE ON OUTSIDE CLICK (MOBILE) ---------- */
document.addEventListener('click', (e) => {
  if (!isMobile()) return;

  megaMenus.forEach(menuItem => {
    if (!menuItem.contains(e.target)) {
      menuItem.classList.remove('open');
      menuItem.querySelector('.mega-dropdown')
        ?.setAttribute('aria-hidden', 'true');
    }
  });
});

/* ---------- CLOSE ON RESIZE ---------- */
window.addEventListener('resize', () => {
  megaMenus.forEach(menuItem => {
    menuItem.classList.remove('open');
    menuItem.querySelector('.mega-dropdown')
      ?.setAttribute('aria-hidden', 'true');
  });
});
});

