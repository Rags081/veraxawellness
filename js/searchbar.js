document.addEventListener('DOMContentLoaded', function () {
  const searchInput = document.querySelector(".luxe-search-input");
  const overlay = document.getElementById('luxeSearchOverlay');
  if (!overlay) return;

  if (searchInput) searchInput.value = '';
  const openBtn = document.getElementById('openSearchPanel');
  const panel = overlay.querySelector('.luxe-search-panel');
  const closeBtn = overlay.querySelector('.luxe-search-close'); // ← target by class

  function closeSearch() {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
  }

  function openSearch() {
      if (searchInput) searchInput.value = '';
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
  }

  if (openBtn) {
      openBtn.addEventListener('click', openSearch);
  }

  // Direct listener on close button — no delegation ambiguity
  if (closeBtn) {
      closeBtn.addEventListener('click', closeSearch);
  }

  overlay.addEventListener('click', function (e) {
      // Ignore clicks inside the panel
      if (panel.contains(e.target)) return;

      // Anything outside the panel = backdrop click = close
      closeSearch();
  });

  document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
          closeSearch();
      }
  });

});

function checkAndRedirect() {
const input = document.querySelector(".luxe-search-input");
const searchInput = input ? input.value : '';
if (searchInput) {
  window.location.href = "search?q=" + searchInput;
}
}
