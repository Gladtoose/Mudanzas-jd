/**
 * Cookie Consent - Mudanzas JD
 * Banner + panel de preferencias, sin dependencias externas.
 * Guarda la elección en localStorage y expone window.CookieConsent
 * para que futuros scripts (p.ej. Google Analytics) puedan comprobar
 * el consentimiento antes de ejecutarse.
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'mudanzasjd_cookie_consent';
    var CONSENT_VERSION = 1;

    var TEMPLATE = ''
        + '<div id="cookie-consent-banner" class="cookie-banner" role="region" aria-label="Consentimiento de cookies">'
        + '  <div class="cookie-banner__header">'
        + '    <span class="cookie-banner__icon" aria-hidden="true">🍪</span>'
        + '    <h2 class="cookie-banner__title">Tu privacidad es importante</h2>'
        + '  </div>'
        + '  <p class="cookie-banner__text">'
        + '    Utilizamos cookies propias y, en su caso, de terceros para el correcto funcionamiento de la web y, si lo aceptas, con fines analíticos. '
        + '    <a href="politica-cookies.html">Más información</a>.'
        + '  </p>'
        + '  <div class="cookie-banner__actions">'
        + '    <button type="button" class="cookie-btn cookie-btn--primary" id="cookie-btn-accept">Aceptar todas</button>'
        + '    <div class="cookie-banner__secondary-actions">'
        + '      <button type="button" class="cookie-btn cookie-btn--outline" id="cookie-btn-reject">Rechazar</button>'
        + '      <button type="button" class="cookie-btn cookie-btn--ghost" id="cookie-btn-configure">Configurar</button>'
        + '    </div>'
        + '  </div>'
        + '</div>'
        + '<div id="cookie-consent-modal" class="cookie-modal-overlay">'
        + '  <div class="cookie-modal" role="dialog" aria-modal="true" aria-labelledby="cookie-modal-title">'
        + '    <div class="cookie-modal__header">'
        + '      <h2 id="cookie-modal-title">Preferencias de cookies</h2>'
        + '      <button type="button" class="cookie-modal__close" id="cookie-btn-close-modal" aria-label="Cerrar">&times;</button>'
        + '    </div>'
        + '    <div class="cookie-modal__body">'
        + '      <div class="cookie-category">'
        + '        <div class="cookie-category__header">'
        + '          <span>Cookies técnicas (necesarias)</span>'
        + '          <label class="cookie-toggle cookie-toggle--disabled">'
        + '            <input type="checkbox" checked disabled>'
        + '            <span class="cookie-toggle__slider"></span>'
        + '          </label>'
        + '        </div>'
        + '        <p>Imprescindibles para que la web funcione (idioma, tu elección de cookies, seguridad). No se pueden desactivar.</p>'
        + '      </div>'
        + '      <div class="cookie-category">'
        + '        <div class="cookie-category__header">'
        + '          <span>Cookies analíticas</span>'
        + '          <label class="cookie-toggle">'
        + '            <input type="checkbox" id="cookie-toggle-analytics">'
        + '            <span class="cookie-toggle__slider"></span>'
        + '          </label>'
        + '        </div>'
        + '        <p>Nos ayudarían a entender el uso de la web para mejorarla. Hoy no están activas por defecto; solo se cargarían si las aceptas.</p>'
        + '      </div>'
        + '    </div>'
        + '    <div class="cookie-modal__footer">'
        + '      <button type="button" class="cookie-btn cookie-btn--outline" id="cookie-btn-reject-modal">Rechazar no esenciales</button>'
        + '      <button type="button" class="cookie-btn cookie-btn--primary" id="cookie-btn-save">Guardar preferencias</button>'
        + '    </div>'
        + '  </div>'
        + '</div>';

    function readConsent() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            var data = JSON.parse(raw);
            if (!data || data.version !== CONSENT_VERSION) return null;
            return data;
        } catch (e) {
            return null;
        }
    }

    function writeConsent(analiticas) {
        var data = {
            version: CONSENT_VERSION,
            necesarias: true,
            analiticas: !!analiticas,
            timestamp: new Date().toISOString()
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            // Si el almacenamiento no está disponible (modo privado, cuota llena),
            // seguimos igualmente sin bloquear al usuario.
        }
        document.dispatchEvent(new CustomEvent('cookieconsentchange', { detail: data }));
        return data;
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.body.insertAdjacentHTML('beforeend', TEMPLATE);

        var banner = document.getElementById('cookie-consent-banner');
        var modalOverlay = document.getElementById('cookie-consent-modal');
        var analyticsToggle = document.getElementById('cookie-toggle-analytics');

        function showBanner() {
            banner.classList.add('is-visible');
        }

        function hideBanner() {
            banner.classList.remove('is-visible');
        }

        function openModal() {
            var current = readConsent();
            analyticsToggle.checked = !!(current && current.analiticas);
            modalOverlay.classList.add('is-open');
        }

        function closeModal() {
            modalOverlay.classList.remove('is-open');
        }

        // Estado inicial
        var existing = readConsent();
        if (!existing) {
            // Pequeño retraso para que la tarjeta aparezca de forma sutil
            // tras la carga inicial, sin resultar intrusiva.
            window.setTimeout(showBanner, 600);
        } else {
            document.dispatchEvent(new CustomEvent('cookieconsentchange', { detail: existing }));
        }

        document.getElementById('cookie-btn-accept').addEventListener('click', function () {
            writeConsent(true);
            hideBanner();
            closeModal();
        });

        document.getElementById('cookie-btn-reject').addEventListener('click', function () {
            writeConsent(false);
            hideBanner();
            closeModal();
        });

        document.getElementById('cookie-btn-reject-modal').addEventListener('click', function () {
            writeConsent(false);
            hideBanner();
            closeModal();
        });

        document.getElementById('cookie-btn-save').addEventListener('click', function () {
            writeConsent(analyticsToggle.checked);
            hideBanner();
            closeModal();
        });

        document.getElementById('cookie-btn-configure').addEventListener('click', function () {
            hideBanner();
            openModal();
        });

        document.getElementById('cookie-btn-close-modal').addEventListener('click', function () {
            closeModal();
            // La decisión no se ha tomado todavía: el banner vuelve a aparecer.
            if (!readConsent()) {
                showBanner();
            }
        });

        // API pública para el resto del sitio (p.ej. cargar Google Analytics
        // solo si hay consentimiento, o reabrir el panel desde el footer).
        window.CookieConsent = {
            get: readConsent,
            hasConsent: function (category) {
                var consent = readConsent();
                if (!consent) return false;
                if (category === 'necesarias') return true;
                return !!consent[category];
            },
            openPreferences: function () {
                hideBanner();
                openModal();
            }
        };

        // Ejemplo de uso futuro para cargar Google Analytics solo con consentimiento:
        // document.addEventListener('cookieconsentchange', function (e) {
        //     if (e.detail.analiticas && !window.__gaLoaded) {
        //         window.__gaLoaded = true;
        //         var s = document.createElement('script');
        //         s.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX';
        //         s.async = true;
        //         document.head.appendChild(s);
        //     }
        // });
    });
})();
