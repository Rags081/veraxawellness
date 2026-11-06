(function () {
  function hideLoader() {
    var loader = document.querySelector('.page-loader');
    if (!loader) return;

    loader.classList.add('is-hidden');
    window.setTimeout(function () { loader.remove(); }, 350);
  }

  if (document.readyState === 'complete') {
    hideLoader();
  } else {
    window.addEventListener('load', hideLoader, { once: true });
  }
})();
