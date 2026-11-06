$(document).ready(function () { 

    // Initialize cookie popup
    function initCookieConsent() {
        const cookieConsent = getCookie("cookie_consent");

        if (!cookieConsent) {
            const popup = document.getElementById("cookiePopup");
            if (popup) {
                popup.style.display = "flex";
            }
        }
    }

    // Run when page loads
    initCookieConsent();
});

// Get cookie by name
function getCookie(name) {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(nameEQ) === 0) {
            return cookie.substring(nameEQ.length);
        }
    }
    return null;
}

// Set cookie
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));

    document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
}

function cookieAccept() {
    const popup = document.getElementById("cookiePopup");
    if (popup) {
        popup.style.display = "none";
    }

    setCookie("cookie_consent", "yes", 90);
}

// Decline cookie
function cookieDecline() {
    const popup = document.getElementById("cookiePopup");
    if (popup) {
        popup.style.display = "none";
    }

    setCookie("cookie_consent", "no", 90);
}