// Mudanzas JD - Traducciones (ES/EN), validación del formulario y envío de solicitudes
(function () {
    'use strict';

    const STORAGE_KEY = 'mjd_lang';
    const API_URL = 'https://mudanzasjd-backend.onrender.com/api/solicitudes';

    const translations = {
        es: {
            'nav.servicios': 'Servicios',
            'nav.beneficios': 'Beneficios',
            'nav.resenas': 'Reseñas',
            'nav.contacto': 'Contacto',
            'nav.cta': 'Presupuesto Gratis',

            'hero.titleLine1': 'Empresa de Mudanzas en',
            'hero.titleHighlight': 'Barcelona',
            'hero.titleLine2': 'y Traslados Nacionales',
            'hero.subtitle': 'Especialistas en mudanzas de pisos, casas y oficinas en Barcelona y área metropolitana. Transporte seguro, embalaje profesional y presupuesto cerrado sin compromiso.',
            'hero.stat1Label': 'Mudanzas exitosas',
            'hero.stat2Label': 'Clientes satisfechos',
            'hero.stat3Label': 'Disponibilidad',
            'hero.guarantee1Title': 'Seguro de Carga',
            'hero.guarantee1Desc': 'Protección total',
            'hero.guarantee2Title': 'Precio Cerrado',
            'hero.guarantee2Desc': 'Sin sorpresas',
            'hero.guarantee3Title': 'Servicio 24/7',
            'hero.guarantee3Desc': 'Adaptados a ti',
            'hero.guarantee4Title': 'Equipo Experto',
            'hero.guarantee4Desc': 'Trato profesional',

            'form.title': 'Solicitud de Presupuesto Gratis',
            'form.subtitle': 'Rellena tus datos y te llamamos hoy mismo',
            'form.nombreLabel': 'Nombre completo',
            'form.nombrePlaceholder': 'Ej: María López',
            'form.telefonoLabel': 'Teléfono de contacto',
            'form.telefonoPlaceholder': '+34 600 000 000',
            'form.emailLabel': 'Correo electrónico',
            'form.emailPlaceholder': 'Ej: maria@email.com',
            'form.origenLabel': 'Origen',
            'form.origenPlaceholder': 'Ej: Madrid',
            'form.destinoLabel': 'Destino',
            'form.destinoPlaceholder': 'Ej: Barcelona',
            'form.tamanoLabel': 'Tamaño de la mudanza',
            'form.tamanoPlaceholder': 'Selecciona una opción',
            'form.tamanoOption1': 'Habitación',
            'form.tamanoOption2': 'Piso Mediano',
            'form.tamanoOption3': 'Casa / Chalet',
            'form.tamanoOption4': 'Oficina / Local',
            'form.mensajeLabel': 'Mensaje (opcional)',
            'form.mensajePlaceholder': 'Cuéntanos algo más sobre tu mudanza...',
            'form.submit': 'Solicitar Presupuesto Gratis',
            'form.submitLoading': 'Enviando...',
            'form.badge1': ' 100% Seguro',
            'form.badge2': ' Respuesta inmediata',

            'errors.required': 'Este campo es obligatorio',
            'errors.phone': 'Introduce un teléfono válido de 9 dígitos',
            'errors.email': 'Introduce un correo electrónico válido',
            'errors.minLength': 'Introduce al menos 3 caracteres',
            'errors.generic': 'No se pudo procesar tu solicitud. Revisa los datos e inténtalo de nuevo.',
            'errors.network': 'No se pudo conectar con el servidor. Inténtalo de nuevo más tarde.',

            'success.title': '¡Solicitud recibida!',
            'success.message': 'Te llamaremos en menos de 2 horas.',
            'success.urgent': '¿Tienes prisa? Llamar ahora mismo',

            'beneficios.titlePre': '¿Por qué elegir',
            'beneficios.subtitle': 'Compromiso con la excelencia en cada mudanza',
            'beneficio1.title': 'Flota moderna',
            'beneficio1.desc': 'Camiones equipados con la última tecnología y sistemas de seguridad para proteger tus pertenencias durante todo el trayecto.',
            'beneficio2.title': 'Seguro total',
            'beneficio2.desc': 'Cobertura completa de seguros para tus bienes. Empaquetado profesional con materiales de primera calidad para máxima protección.',
            'beneficio3.title': 'Puntualidad garantizada',
            'beneficio3.desc': 'Cumplimos con los horarios acordados. Tu tiempo es valioso y nos comprometemos a respetar cada minuto de tu agenda.',

            'servicios.titlePre': 'Nuestros',
            'servicios.titleHighlight': 'Servicios',
            'servicios.subtitle': 'Soluciones completas para todas tus necesidades',
            'servicios.badgePopular': 'Más popular',
            'servicio1.title': 'Mudanzas locales',
            'servicio1.desc': 'Servicio completo de mudanza dentro de la misma ciudad. Rápido y eficiente.',
            'servicio1.feature1': '✓ Embalaje profesional',
            'servicio1.feature2': '✓ Montaje/Desmontaje de muebles',
            'servicio1.feature3': '✓ Transporte seguro',
            'servicio2.title': 'Mudanzas nacionales',
            'servicio2.desc': 'Traslados entre ciudades con máxima protección y cuidado experto en mudanzas.',
            'servicio2.feature1': '✓ Todo incluido',
            'servicio2.feature2': '✓ Seguro premium',
            'servicio2.feature3': '✓ Almacenamiento temporal',
            'servicio3.title': 'Mudanzas de oficina',
            'servicio3.desc': 'Especialistas en traslado empresarial. Mínima interrupción de tu negocio.',
            'servicio3.feature1': '✓ Planificación estratégica',
            'servicio3.feature2': '✓ Horarios flexibles',
            'servicio3.feature3': '✓ Equipamiento especializado',

            'resenas.titlePre': 'Lo que dicen nuestros',
            'resenas.titleHighlight': 'clientes',
            'resenas.subtitle': 'Más de 2500 familias confían en nosotros',

            'footer.description': 'Tu socio de confianza en mudanzas profesionales. Llevamos tu hogar a donde necesites con seguridad y profesionalidad.',
            'footer.quickLinks': 'Enlaces rápidos',
            'footer.quoteLink': 'Presupuesto',
            'footer.packagingLink': 'Embalaje profesional',
            'footer.copyright': '© 2026 Mudanzas JD. Todos los derechos reservados.',
            'footer.privacy': 'Política de privacidad',
            'footer.terms': 'Términos y condiciones'
        },
        en: {
            'nav.servicios': 'Services',
            'nav.beneficios': 'Benefits',
            'nav.resenas': 'Reviews',
            'nav.contacto': 'Contact',
            'nav.cta': 'Free Quote',

            'hero.titleLine1': 'Moving Company in',
            'hero.titleHighlight': 'Barcelona',
            'hero.titleLine2': 'and Nationwide Relocations',
            'hero.subtitle': 'Specialists in apartment, house and office moves across Barcelona and its metropolitan area. Safe transport, professional packing and a fixed quote with no obligation.',
            'hero.stat1Label': 'Successful moves',
            'hero.stat2Label': 'Happy clients',
            'hero.stat3Label': 'Availability',
            'hero.guarantee1Title': 'Cargo Insurance',
            'hero.guarantee1Desc': 'Full protection',
            'hero.guarantee2Title': 'Fixed Price',
            'hero.guarantee2Desc': 'No surprises',
            'hero.guarantee3Title': '24/7 Service',
            'hero.guarantee3Desc': 'Tailored to you',
            'hero.guarantee4Title': 'Expert Team',
            'hero.guarantee4Desc': 'Professional care',

            'form.title': 'Free Quote Request',
            'form.subtitle': "Fill in your details and we'll call you today",
            'form.nombreLabel': 'Full name',
            'form.nombrePlaceholder': 'E.g. John Smith',
            'form.telefonoLabel': 'Contact phone',
            'form.telefonoPlaceholder': '+34 600 000 000',
            'form.emailLabel': 'Email address',
            'form.emailPlaceholder': 'E.g. john@email.com',
            'form.origenLabel': 'Moving from',
            'form.origenPlaceholder': 'E.g. Madrid',
            'form.destinoLabel': 'Moving to',
            'form.destinoPlaceholder': 'E.g. Barcelona',
            'form.tamanoLabel': 'Size of the move',
            'form.tamanoPlaceholder': 'Select an option',
            'form.tamanoOption1': 'Single room',
            'form.tamanoOption2': 'Medium apartment',
            'form.tamanoOption3': 'House / Villa',
            'form.tamanoOption4': 'Office / Retail space',
            'form.mensajeLabel': 'Message (optional)',
            'form.mensajePlaceholder': 'Tell us more about your move...',
            'form.submit': 'Request Free Quote',
            'form.submitLoading': 'Sending...',
            'form.badge1': ' 100% Secure',
            'form.badge2': ' Immediate response',

            'errors.required': 'This field is required',
            'errors.phone': 'Enter a valid 9-digit phone number',
            'errors.email': 'Enter a valid email address',
            'errors.minLength': 'Enter at least 3 characters',
            'errors.generic': "We couldn't process your request. Please check your details and try again.",
            'errors.network': 'Could not connect to the server. Please try again later.',

            'success.title': 'Request received!',
            'success.message': "We'll call you within 2 hours.",
            'success.urgent': 'In a hurry? Call right now',

            'beneficios.titlePre': 'Why choose',
            'beneficios.subtitle': 'Committed to excellence in every move',
            'beneficio1.title': 'Modern fleet',
            'beneficio1.desc': 'Trucks equipped with the latest technology and safety systems to protect your belongings throughout the journey.',
            'beneficio2.title': 'Full insurance',
            'beneficio2.desc': 'Complete insurance coverage for your belongings. Professional packing with top-quality materials for maximum protection.',
            'beneficio3.title': 'Guaranteed punctuality',
            'beneficio3.desc': "We stick to the agreed schedule. Your time is valuable and we're committed to respecting every minute of your day.",

            'servicios.titlePre': 'Our',
            'servicios.titleHighlight': 'Services',
            'servicios.subtitle': 'Complete solutions for all your needs',
            'servicios.badgePopular': 'Most popular',
            'servicio1.title': 'Local moves',
            'servicio1.desc': 'Full moving service within the same city. Fast and efficient.',
            'servicio1.feature1': '✓ Professional packing',
            'servicio1.feature2': '✓ Furniture assembly/disassembly',
            'servicio1.feature3': '✓ Safe transport',
            'servicio2.title': 'National moves',
            'servicio2.desc': 'Moves between cities with maximum protection and expert care.',
            'servicio2.feature1': '✓ All-inclusive',
            'servicio2.feature2': '✓ Premium insurance',
            'servicio2.feature3': '✓ Temporary storage',
            'servicio3.title': 'Office moves',
            'servicio3.desc': 'Business relocation specialists. Minimal disruption to your business.',
            'servicio3.feature1': '✓ Strategic planning',
            'servicio3.feature2': '✓ Flexible schedules',
            'servicio3.feature3': '✓ Specialized equipment',

            'resenas.titlePre': 'What our',
            'resenas.titleHighlight': 'clients say',
            'resenas.subtitle': 'Over 2,500 families trust us',

            'footer.description': 'Your trusted partner in professional moving. We take your home wherever you need it, safely and professionally.',
            'footer.quickLinks': 'Quick links',
            'footer.quoteLink': 'Quote',
            'footer.packagingLink': 'Professional packing',
            'footer.copyright': '© 2026 Mudanzas JD. All rights reserved.',
            'footer.privacy': 'Privacy policy',
            'footer.terms': 'Terms and conditions'
        }
    };

    let currentLang = translations[localStorage.getItem(STORAGE_KEY)] ? localStorage.getItem(STORAGE_KEY) : 'es';

    function t(key) {
        return (translations[currentLang] && translations[currentLang][key]) || translations.es[key] || key;
    }

    function applyLanguage(lang) {
        if (!translations[lang]) lang = 'es';
        currentLang = lang;
        document.documentElement.lang = lang;
        localStorage.setItem(STORAGE_KEY, lang);

        document.querySelectorAll('[data-i18n]').forEach((el) => {
            el.textContent = t(el.getAttribute('data-i18n'));
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
            el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
        });

        document.querySelectorAll('.lang-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
        });

        // Re-traduce los errores de validación que ya estén visibles al cambiar de idioma
        document.querySelectorAll('.form-error[data-error-key]').forEach((el) => {
            el.textContent = t(el.getAttribute('data-error-key'));
        });
    }

    function initLanguageSwitcher() {
        document.querySelectorAll('.lang-btn').forEach((btn) => {
            btn.addEventListener('click', () => applyLanguage(btn.getAttribute('data-lang')));
        });
        applyLanguage(currentLang);
    }

    // ---- Validación y envío del formulario de presupuesto ----

    const PHONE_DIGITS_REGEX = /^\d{9}$/;
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const MIN_LENGTH = 3;
    const MIN_LENGTH_FIELD_IDS = ['origen', 'destino'];
    const REQUIRED_FIELD_IDS = ['nombre', 'telefono', 'email', 'origen', 'destino', 'tamaño'];

    function cleanPhone(value) {
        return value.replace(/[\s.-]/g, '').replace(/^(?:\+34|0034)/, '');
    }

    function setFieldError(input, errorKey) {
        input.closest('.form-group').classList.add('has-error');
        const errorEl = document.getElementById('error-' + input.id);
        if (errorEl) {
            errorEl.setAttribute('data-error-key', errorKey);
            errorEl.textContent = t(errorKey);
        }
    }

    function clearFieldError(input) {
        input.closest('.form-group').classList.remove('has-error');
        const errorEl = document.getElementById('error-' + input.id);
        if (errorEl) {
            errorEl.removeAttribute('data-error-key');
            errorEl.textContent = '';
        }
    }

    function validateField(input) {
        const value = input.value.trim();

        if (input.hasAttribute('required') && !value) {
            setFieldError(input, 'errors.required');
            return false;
        }

        if (input.id === 'telefono' && value && !PHONE_DIGITS_REGEX.test(cleanPhone(value))) {
            setFieldError(input, 'errors.phone');
            return false;
        }

        if (input.id === 'email' && value && !EMAIL_REGEX.test(value)) {
            setFieldError(input, 'errors.email');
            return false;
        }

        if (MIN_LENGTH_FIELD_IDS.includes(input.id) && value && value.length < MIN_LENGTH) {
            setFieldError(input, 'errors.minLength');
            return false;
        }

        clearFieldError(input);
        return true;
    }

    function setFormStatus(message, type) {
        const status = document.getElementById('formStatus');
        if (!status) return;
        status.textContent = message || '';
        status.className = 'form-status' + (type ? ' form-status-' + type : '');
    }

    function setSubmitLoading(button, isLoading) {
        button.disabled = isLoading;
        const label = button.querySelector('.btn-cta-label');
        if (label) {
            const key = isLoading ? 'form.submitLoading' : 'form.submit';
            label.setAttribute('data-i18n', key);
            label.textContent = t(key);
        }
    }

    function buildMensaje(tamanoSelect, mensajeInput) {
        const partes = [];
        if (tamanoSelect && tamanoSelect.value) {
            partes.push('Tamaño de mudanza: ' + tamanoSelect.options[tamanoSelect.selectedIndex].text);
        }
        if (mensajeInput && mensajeInput.value.trim()) {
            partes.push(mensajeInput.value.trim());
        }
        return partes.join('. ');
    }

    function initLeadForm() {
        const form = document.getElementById('leadForm');
        if (!form) return;

        const successCard = document.getElementById('successCard');
        const submitButton = form.querySelector('button[type="submit"]');
        const fields = REQUIRED_FIELD_IDS.map((id) => document.getElementById(id)).filter((el) => el !== null);

        fields.forEach((input) => {
            input.addEventListener('blur', () => validateField(input));
        });

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            setFormStatus('', null);

            const isValid = fields.reduce((valid, input) => validateField(input) && valid, true);

            if (!isValid) {
                const firstInvalid = fields.find((input) => input.closest('.form-group').classList.contains('has-error'));
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            const payload = {
                nombre: document.getElementById('nombre').value.trim(),
                telefono: document.getElementById('telefono').value.trim(),
                email: document.getElementById('email').value.trim(),
                origen: document.getElementById('origen').value.trim(),
                destino: document.getElementById('destino').value.trim(),
                mensaje: buildMensaje(document.getElementById('tamaño'), document.getElementById('mensaje'))
            };

            setSubmitLoading(submitButton, true);

            fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then((response) => {
                    if (response.status === 201 || response.status === 200) {
                        form.reset();
                        fields.forEach(clearFieldError);

                        form.classList.add('is-hidden');
                        form.addEventListener('transitionend', function onFadeOut() {
                            form.removeEventListener('transitionend', onFadeOut);
                            form.style.display = 'none';
                            successCard.classList.add('is-visible');
                            successCard.setAttribute('aria-hidden', 'false');
                            successCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, { once: true });

                        return;
                    }

                    return response.json().catch(() => null).then((body) => {
                        const message = (body && (body.message || body.error)) || t('errors.generic');
                        setFormStatus(message, 'error');
                    });
                })
                .catch(() => {
                    setFormStatus(t('errors.network'), 'error');
                })
                .finally(() => {
                    setSubmitLoading(submitButton, false);
                });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initLanguageSwitcher();
        initLeadForm();
    });
})();
