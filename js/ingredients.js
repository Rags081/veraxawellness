/* ==========================================================================
   INGREDIENTS & SUPPLEMENT FACTS — Tab Switching
   Single source of truth (no duplicate inline script)
   ========================================================================== */
   document.addEventListener('DOMContentLoaded', function () {
    'use strict';
  
    // Cache DOM elements
    var tabs = document.querySelectorAll('.product-tab');
    var panels = document.querySelectorAll('.product-panel');
    var panelsContainer = document.querySelector('.product-panels');
    var ingredientsSection = document.querySelector('.ingredients-body');
  
    // Store panel headings for focus management
    var panelHeadings = {};
  
    panels.forEach(function (panel) {
      var heading = panel.querySelector('.panel-title, h2, h3');
      if (heading) {
        panelHeadings[panel.id] = heading;
      }
    });
  
    /**
     * Activate a tab and its corresponding panel
     * @param {HTMLElement} tab - The tab button element
     */
    function activateTab(tab) {
      if (!tab) return;
  
      var targetId = tab.getAttribute('data-target');
      if (!targetId) return;
  
      // Update tabs - remove active from all, add to current
      tabs.forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
  
      // Update panels - hide all, show target
      panels.forEach(function (panel) {
        panel.classList.remove('active');
        panel.setAttribute('aria-hidden', 'true');
        
        // Reset any focus management attributes
        var heading = panelHeadings[panel.id];
        if (heading) {
          heading.removeAttribute('tabindex');
        }
      });
  
      var targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
        targetPanel.setAttribute('aria-hidden', 'false');
  
        // Move focus to the panel's heading for keyboard/screen-reader users
        var heading = panelHeadings[targetId];
        if (heading) {
          heading.setAttribute('tabindex', '-1');
          heading.focus({ preventScroll: true });
        }
      }
  
      // Update URL hash for deep-linking (without triggering scroll)
      if (history.pushState) {
        history.pushState(null, null, '#' + targetId);
      }
  
      // On mobile, scroll the panel into view
      if (window.innerWidth <= 768 && panelsContainer) {
        setTimeout(function () {
          var headerOffset = 80;
          var elementPosition = panelsContainer.getBoundingClientRect().top;
          var offsetPosition = elementPosition + window.pageYOffset - headerOffset;
  
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }, 100);
      }
  
      // Dispatch custom event for analytics or other integrations
      var event = new CustomEvent('tabChanged', {
        detail: {
          tabId: targetId,
          tabName: tab.textContent.trim()
        }
      });
      document.dispatchEvent(event);
    }
  
    /**
     * Find and activate tab by target ID
     * @param {string} targetId - The data-target value
     */
    function activateTabById(targetId) {
      if (!targetId) return;
      var matchingTab = document.querySelector('.product-tab[data-target="' + targetId + '"]');
      if (matchingTab) {
        activateTab(matchingTab);
      }
    }
  
    // ===== EVENT LISTENERS =====
  
    // Click events on tabs
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function (e) {
        e.preventDefault();
        activateTab(tab);
      });
  
      // Keyboard support (Enter and Space)
      tab.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activateTab(tab);
        }
      });
  
      // Set initial ARIA attributes
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', tab.classList.contains('active') ? 'true' : 'false');
    });
  
    // Set ARIA attributes on panels
    panels.forEach(function (panel) {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-hidden', panel.classList.contains('active') ? 'false' : 'true');
    });
  
    // ===== DEEP-LINKING SUPPORT =====
  
    // Support deep-linking via URL hash, e.g. ingredients.html#tab-recovery
    var hash = window.location.hash.replace('#', '');
    if (hash) {
      // Wait a moment for everything to render
      setTimeout(function () {
        activateTabById(hash);
      }, 50);
    }
  
    // Listen for hash changes (browser back/forward)
    window.addEventListener('hashchange', function () {
      var newHash = window.location.hash.replace('#', '');
      if (newHash) {
        activateTabById(newHash);
      }
    });
  
    // ===== SWIPE SUPPORT FOR MOBILE =====
  
    if ('ontouchstart' in window) {
      var touchStartX = 0;
      var touchEndX = 0;
      var currentTabIndex = 0;
  
      // Get current tab index
      function getCurrentTabIndex() {
        var activeTab = document.querySelector('.product-tab.active');
        if (activeTab) {
          return Array.from(tabs).indexOf(activeTab);
        }
        return 0;
      }
  
      // Get tab by offset
      function getTabByOffset(offset) {
        var currentIndex = getCurrentTabIndex();
        var newIndex = currentIndex + offset;
        if (newIndex < 0) newIndex = tabs.length - 1;
        if (newIndex >= tabs.length) newIndex = 0;
        return tabs[newIndex];
      }
  
      // Add swipe detection to panels container
      if (panelsContainer) {
        panelsContainer.addEventListener('touchstart', function (e) {
          touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
  
        panelsContainer.addEventListener('touchend', function (e) {
          touchEndX = e.changedTouches[0].screenX;
          var swipeDistance = touchEndX - touchStartX;
          var swipeThreshold = 50;
  
          if (Math.abs(swipeDistance) > swipeThreshold) {
            var direction = swipeDistance < 0 ? 1 : -1; // left swipe = next, right swipe = previous
            var nextTab = getTabByOffset(direction);
            if (nextTab) {
              activateTab(nextTab);
            }
          }
        }, { passive: true });
      }
    }
  
    // ===== KEYBOARD ARROW NAVIGATION =====
  
    tabs.forEach(function (tab, index) {
      tab.addEventListener('keydown', function (e) {
        var newIndex = index;
        var targetTab = null;
  
        // Left/Up arrow = previous tab
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          newIndex = index > 0 ? index - 1 : tabs.length - 1;
          targetTab = tabs[newIndex];
        }
        // Right/Down arrow = next tab
        else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          newIndex = index < tabs.length - 1 ? index + 1 : 0;
          targetTab = tabs[newIndex];
        }
        // Home key = first tab
        else if (e.key === 'Home') {
          e.preventDefault();
          targetTab = tabs[0];
        }
        // End key = last tab
        else if (e.key === 'End') {
          e.preventDefault();
          targetTab = tabs[tabs.length - 1];
        }
  
        if (targetTab) {
          targetTab.focus();
          activateTab(targetTab);
        }
      });
    });
  
    // ===== OBSERVER FOR DYNAMIC CONTENT =====
  
    // If panels are loaded dynamically, observe changes
    if (panelsContainer && window.MutationObserver) {
      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (mutation.type === 'childList') {
            // Re-cache panel headings if content changes
            panels = document.querySelectorAll('.product-panel');
            panels.forEach(function (panel) {
              var heading = panel.querySelector('.panel-title, h2, h3');
              if (heading) {
                panelHeadings[panel.id] = heading;
              }
            });
          }
        });
      });
  
      observer.observe(panelsContainer, {
        childList: true,
        subtree: true
      });
    }
  
    // ===== LOGGING (optional, remove in production) =====
    console.log('✅ Ingredients tabs initialized with ' + tabs.length + ' tabs');
  });