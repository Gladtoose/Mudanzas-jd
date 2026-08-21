"use strict";

/* ==========================================================================
   Control de acceso al panel (gate de sesión, no sustituye seguridad de backend)
   ========================================================================== */
const ADMIN_AUTH_PASSWORD = "admin123";
const ADMIN_AUTH_STORAGE_KEY = "admin_logged_in";

const AdminGate = {
  estaAutenticado() {
    return sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === "true";
  },

  intentarAcceso(clave) {
    if (clave === ADMIN_AUTH_PASSWORD) {
      sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, "true");
      return true;
    }
    return false;
  },

  cerrarSesion() {
    sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    window.location.reload();
  },
};

function bloquearPanel() {
  document.body.classList.add("admin-locked");
}

function desbloquearPanel() {
  document.body.classList.remove("admin-locked");
}

function mostrarErrorLogin(mensaje) {
  const errorEl = document.getElementById("login-error");
  if (!errorEl) return;
  errorEl.textContent = mensaje;
  errorEl.hidden = !mensaje;
}

function initAdminGate() {
  const modalLogin = document.getElementById("modal-login");
  const formLogin = document.getElementById("form-login-admin");
  const inputPassword = document.getElementById("input-login-password");
  const btnLogout = document.getElementById("btn-logout");

  if (!modalLogin || !formLogin || !inputPassword) return;

  modalLogin.addEventListener("cancel", (evento) => evento.preventDefault());

  if (AdminGate.estaAutenticado()) {
    desbloquearPanel();
  } else {
    bloquearPanel();
    if (typeof modalLogin.showModal === "function") {
      modalLogin.showModal();
    }
  }

  formLogin.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const clave = inputPassword.value;

    if (AdminGate.intentarAcceso(clave)) {
      mostrarErrorLogin("");
      inputPassword.value = "";
      desbloquearPanel();
      modalLogin.close();
    } else {
      mostrarErrorLogin("Contraseña incorrecta");
      inputPassword.value = "";
      inputPassword.focus();
    }
  });

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      AdminGate.cerrarSesion();
    });
  }
}

document.addEventListener("DOMContentLoaded", initAdminGate);
