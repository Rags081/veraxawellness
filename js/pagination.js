/* Collection page pagination for the static product catalogue. */
(function () {
  'use strict';

  const PAGE_SIZE = 9;
  const LOADING_DELAY = 250;

  function initialisePagination() {
    if (window.PAGINATION_MODE && window.PAGINATION_MODE !== 'numbered') return;

    const areas = Array.from(document.querySelectorAll('#categoryArea'));
    const pagination = document.querySelector('#products-pagination');
    const loader = document.querySelector('#pagination-loader');
    if (!areas.length || !pagination || !loader) return;

    const allProducts = Array.from(document.querySelectorAll('.product-category'));
    if (!allProducts.length) return;
    let products = allProducts;

    const productArea = areas[0];
    areas.slice(1).forEach((area) => area.remove());
    productArea.replaceChildren();

    const productRow = document.createElement('div');
    productRow.className = 'row g-3';
    const productSection = document.createElement('section');
    productSection.className = 'mb-5 product_row';
    productSection.append(productRow);
    productArea.append(productSection);

    let currentPage = 1;
    let isLoading = false;
    function totalPages() {
      return Math.max(1, Math.ceil(products.length / PAGE_SIZE));
    }

    function setLoading(loading) {
      isLoading = loading;
      loader.hidden = !loading;
      loader.setAttribute('aria-busy', String(loading));
      if (!loading) return;
      pagination.querySelectorAll('button').forEach((button) => {
        button.disabled = true;
      });
    }

    function renderControls() {
      const start = (currentPage - 1) * PAGE_SIZE + 1;
      const end = Math.min(currentPage * PAGE_SIZE, products.length);
      const pageCount = totalPages();
      const pages = Array.from({ length: pageCount }, (_, index) => {
        const page = index + 1;
        return `<button class="page-btn modal-sp-btn${page === currentPage ? ' active' : ''}" type="button" data-page="${page}"${page === currentPage ? ' aria-current="page"' : ''}>${page}</button>`;
      }).join('');

      pagination.innerHTML = `
        <button class="pagination-btn prev-btn modal-sp-btn" type="button" data-action="previous"${currentPage === 1 ? ' disabled' : ''}>Previous</button>
        <div class="pagination-pages">${pages}</div>
        <button class="pagination-btn next-btn modal-sp-btn" type="button" data-action="next"${currentPage === pageCount ? ' disabled' : ''}>Next</button>
        <div class="pagination-info">Showing <span>${start}</span> to <span>${end}</span> of <span>${products.length}</span> records</div>`;
    }

    function renderProducts() {
      const start = (currentPage - 1) * PAGE_SIZE;
      productRow.replaceChildren(...products.slice(start, start + PAGE_SIZE));
      renderControls();
      setLoading(false);
    }

    function goToPage(page) {
      if (isLoading || page < 1 || page > totalPages() || page === currentPage) return;
      currentPage = page;
      setLoading(true);
      window.setTimeout(renderProducts, LOADING_DELAY);
    }

    pagination.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button || isLoading) return;

      if (button.dataset.page) goToPage(Number(button.dataset.page));
      if (button.dataset.action === 'previous') goToPage(currentPage - 1);
      if (button.dataset.action === 'next') goToPage(currentPage + 1);
    });

    window.filterProductsByCategory = function (categoryId) {
      products = categoryId
        ? allProducts.filter((product) => String(product.dataset.categoryid) === String(categoryId))
        : allProducts;
      currentPage = 1;
      renderProducts();
    };

    renderProducts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialisePagination);
  } else {
    initialisePagination();
  }
}());
