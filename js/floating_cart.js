document.addEventListener('DOMContentLoaded', () => {
    const cartOverlay = document.getElementById('cart-drawer-overlay');
    const closeDrawerBtn = document.getElementById('cart-drawer-close-btn');
    const openCartTriggers = document.querySelectorAll('#id-cart-trigger');

    function openCartDrawer() {
        if (cartOverlay) {
            cartOverlay.classList.add('drawer-open-active');
            document.body.classList.add('cart-drawer-active');
        }
    }

    function closeCartDrawer() {
        if (cartOverlay) {
            cartOverlay.classList.remove('drawer-open-active');
            document.body.classList.remove('cart-drawer-active');
        }
    }

    // Attach click events to open trigger elements
    openCartTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            openCartDrawer();
        });
    });

    // Attach click event to close button
    if (closeDrawerBtn) {
        closeDrawerBtn.addEventListener('click', closeCartDrawer);
    }

    // Close when clicking outside on the background overlay
    if (cartOverlay) {
        cartOverlay.addEventListener('click', (e) => {
            if (e.target === cartOverlay) {
                closeCartDrawer();
            }
        });
    }
});