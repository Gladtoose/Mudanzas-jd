"use strict";

/* ==========================================================================
   Configuración
   ========================================================================== */
// admin.html vive en la raíz del proyecto, fuera de src/main/resources/static,
// por lo que la URL de la API no puede ser relativa: apunta al origen del backend.
const API_BASE_URL = "https://mudanzasjd-backend.onrender.com/api";
const SOLICITUDES_ENDPOINT = `${API_BASE_URL}/solicitudes`;

const ESTADOS = [
  { value: "NUEVO", label: "Nuevo" },
  { value: "CONTACTADO", label: "Contactado" },
  { value: "PRESUPUESTADO", label: "Presupuestado" },
  { value: "FINALIZADO", label: "Finalizado" },
  { value: "CANCELADO", label: "Cancelado" },
];

const ESTADO_CLASS = {
  NUEVO: "badge--nuevo",
  CONTACTADO: "badge--contactado",
  PRESUPUESTADO: "badge--presupuestado",
  FINALIZADO: "badge--finalizado",
  CANCELADO: "badge--cancelado",
};

const STORAGE_KEYS = {
  authTipo: "mjd_auth_tipo",
  authBearer: "mjd_auth_bearer",
  authUser: "mjd_auth_user",
  authPass: "mjd_auth_pass",
};

const PAGE_SIZE_DEFAULT = 25;
const TOAST_DURATION_MS = 5000;
const SEARCH_DEBOUNCE_MS = 250;
const SVG_NS = "http://www.w3.org/2000/svg";

/* ==========================================================================
   Utilidades (formateo, escape XSS, descargas)
   ========================================================================== */
const Utils = {
  normalizar(valor) {
    return String(valor ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(new RegExp("[\\u0300-\\u036f]", "g"), "");
  },

  debounce(fn, delay) {
    let idTimeout;
    return (...args) => {
      clearTimeout(idTimeout);
      idTimeout = setTimeout(() => fn(...args), delay);
    };
  },

  parseFecha(valor) {
    if (!valor) return null;
    if (Array.isArray(valor)) {
      const [anio, mes, dia, hora = 0, minuto = 0, segundo = 0] = valor;
      return new Date(anio, mes - 1, dia, hora, minuto, segundo);
    }
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  },

  formatFecha(valor) {
    const fecha = Utils.parseFecha(valor);
    if (!fecha) return "—";
    return fecha.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  esMismoDia(fechaA, fechaB) {
    return (
      fechaA.getFullYear() === fechaB.getFullYear() &&
      fechaA.getMonth() === fechaB.getMonth() &&
      fechaA.getDate() === fechaB.getDate()
    );
  },

  crearIcono(idSimbolo, claseExtra) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", claseExtra ? `icon ${claseExtra}` : "icon");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(SVG_NS, "use");
    use.setAttribute("href", `#${idSimbolo}`);
    svg.appendChild(use);
    return svg;
  },

  descargarArchivo(contenido, nombreArchivo, tipoMime) {
    const blob = new Blob([contenido], { type: tipoMime });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  },
};

/* ==========================================================================
   AuthStore — credenciales en sessionStorage (nunca localStorage)
   ========================================================================== */
const AuthStore = {
  get() {
    return {
      tipo: sessionStorage.getItem(STORAGE_KEYS.authTipo) || "none",
      bearer: sessionStorage.getItem(STORAGE_KEYS.authBearer) || "",
      usuario: sessionStorage.getItem(STORAGE_KEYS.authUser) || "",
      clave: sessionStorage.getItem(STORAGE_KEYS.authPass) || "",
    };
  },

  guardar({ tipo, bearer, usuario, clave }) {
    sessionStorage.setItem(STORAGE_KEYS.authTipo, tipo);
    sessionStorage.setItem(STORAGE_KEYS.authBearer, bearer || "");
    sessionStorage.setItem(STORAGE_KEYS.authUser, usuario || "");
    sessionStorage.setItem(STORAGE_KEYS.authPass, clave || "");
  },

  limpiar() {
    Object.values(STORAGE_KEYS).forEach((clave) => sessionStorage.removeItem(clave));
  },

  tieneCredenciales() {
    return AuthStore.get().tipo !== "none";
  },

  cabeceraAutorizacion() {
    const { tipo, bearer, usuario, clave } = AuthStore.get();
    if (tipo === "bearer" && bearer) {
      return `Bearer ${bearer}`;
    }
    if (tipo === "basic" && usuario) {
      return `Basic ${btoa(`${usuario}:${clave}`)}`;
    }
    return null;
  },
};

/* ==========================================================================
   ApiClient — fetch centralizado con manejo robusto de errores HTTP
   ========================================================================== */
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const ApiClient = {
  async request(url, options = {}) {
    const headers = { Accept: "application/json", ...(options.headers || {}) };
    const autorizacion = AuthStore.cabeceraAutorizacion();
    if (autorizacion) {
      headers.Authorization = autorizacion;
    }
    if (options.body) {
      headers["Content-Type"] = "application/json";
    }

    let respuesta;
    try {
      respuesta = await fetch(url, { ...options, headers });
    } catch {
      throw new ApiError(0, "No se pudo conectar con el servidor. Comprueba tu conexión o que el backend esté disponible.");
    }

    if (respuesta.status === 204) {
      return null;
    }

    const contentType = respuesta.headers.get("content-type") || "";
    const cuerpo = contentType.includes("json") ? await respuesta.json().catch(() => null) : null;

    if (!respuesta.ok) {
      throw new ApiError(respuesta.status, ApiClient.mensajeError(respuesta.status, cuerpo));
    }

    return cuerpo;
  },

  mensajeError(status, cuerpo) {
    if (cuerpo && typeof cuerpo === "object") {
      if (typeof cuerpo.detail === "string" && cuerpo.detail.trim()) return cuerpo.detail;
      if (typeof cuerpo.message === "string" && cuerpo.message.trim()) return cuerpo.message;
      const camposTexto = Object.values(cuerpo).filter((valor) => typeof valor === "string" && valor.trim());
      if (camposTexto.length) return camposTexto.join(" · ");
    }
    switch (status) {
      case 400:
        return "La solicitud contiene datos no válidos.";
      case 401:
        return "No autorizado. Revisa las credenciales en “Configurar acceso”.";
      case 403:
        return "No tienes permisos suficientes para realizar esta acción.";
      case 404:
        return "El recurso solicitado no existe.";
      case 500:
        return "Error interno del servidor. Inténtalo de nuevo más tarde.";
      default:
        return `Ha ocurrido un error inesperado (código ${status}).`;
    }
  },

  listarSolicitudes() {
    return ApiClient.request(SOLICITUDES_ENDPOINT, { method: "GET" });
  },

  actualizarEstado(id, estado) {
    return ApiClient.request(`${SOLICITUDES_ENDPOINT}/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    });
  },

  eliminarSolicitud(id) {
    return ApiClient.request(`${SOLICITUDES_ENDPOINT}/${id}`, { method: "DELETE" });
  },
};

/* ==========================================================================
   Estado de la aplicación
   ========================================================================== */
const state = {
  todas: [],
  filtradas: [],
  cargando: true,
  error: null,
  filtros: { busqueda: "", estado: "", desde: "", hasta: "" },
  orden: { clave: "fechaCreacion", direccion: "desc" },
  paginacion: { pagina: 1, tamano: PAGE_SIZE_DEFAULT },
  detalleActualId: null,
};

const dom = {};

function cachearElementos() {
  dom.sidebar = document.getElementById("sidebar");
  dom.sidebarBackdrop = document.getElementById("sidebar-backdrop");
  dom.sidebarLinks = dom.sidebar.querySelectorAll(".sidebar__link");
  dom.vistaPanel = document.querySelector(".kpis");
  dom.vistaSolicitudes = document.getElementById("solicitudes-section");
  dom.btnSidebarToggle = document.getElementById("btn-sidebar-toggle");
  dom.btnConfigAcceso = document.getElementById("btn-config-acceso");
  dom.authStatusDot = document.getElementById("auth-status-dot");
  dom.authStatusLabel = document.getElementById("auth-status-label");
  dom.btnRefresh = document.getElementById("btn-refresh");

  dom.kpiTotal = document.getElementById("kpi-total");
  dom.kpiNuevasHoy = document.getElementById("kpi-nuevas-hoy");
  dom.kpiEnProceso = document.getElementById("kpi-en-proceso");
  dom.kpiCompletadas = document.getElementById("kpi-completadas");

  dom.inputBuscar = document.getElementById("input-buscar");
  dom.selectEstado = document.getElementById("select-estado");
  dom.inputFechaDesde = document.getElementById("input-fecha-desde");
  dom.inputFechaHasta = document.getElementById("input-fecha-hasta");
  dom.btnLimpiarFiltros = document.getElementById("btn-limpiar-filtros");
  dom.btnExportarCsv = document.getElementById("btn-exportar-csv");

  dom.tablaLoadingAnuncio = document.getElementById("tabla-loading-anuncio");
  dom.tabla = document.querySelector(".table-wrapper table");
  dom.tablaBody = document.getElementById("tabla-body");
  dom.tablaSkeleton = document.getElementById("tabla-skeleton");
  dom.tablaEmpty = document.getElementById("tabla-empty");
  dom.tablaError = document.getElementById("tabla-error");
  dom.tablaErrorMensaje = document.getElementById("tabla-error-mensaje");
  dom.btnReintentar = document.getElementById("btn-reintentar");

  dom.selectPageSize = document.getElementById("select-page-size");
  dom.paginationInfo = document.getElementById("pagination-info");
  dom.btnPrevPage = document.getElementById("btn-prev-page");
  dom.btnNextPage = document.getElementById("btn-next-page");

  dom.ths = document.querySelectorAll("th[data-sort-key]");
  dom.thButtons = document.querySelectorAll(".th-sort");

  dom.modalDetalle = document.getElementById("modal-detalle");
  dom.modalDetalleBody = document.getElementById("modal-detalle-body");
  dom.btnCerrarModal = document.getElementById("btn-cerrar-modal");
  dom.selectNuevoEstado = document.getElementById("select-nuevo-estado");
  dom.btnCancelarModal = document.getElementById("btn-cancelar-modal");
  dom.btnGuardarEstado = document.getElementById("btn-guardar-estado");

  dom.modalAcceso = document.getElementById("modal-acceso");
  dom.btnCerrarModalAcceso = document.getElementById("btn-cerrar-modal-acceso");
  dom.selectAuthTipo = document.getElementById("select-auth-tipo");
  dom.campoBearer = document.getElementById("campo-bearer");
  dom.inputBearerToken = document.getElementById("input-bearer-token");
  dom.campoBasicUser = document.getElementById("campo-basic-user");
  dom.inputBasicUser = document.getElementById("input-basic-user");
  dom.campoBasicPass = document.getElementById("campo-basic-pass");
  dom.inputBasicPass = document.getElementById("input-basic-pass");
  dom.btnOlvidarCredenciales = document.getElementById("btn-olvidar-credenciales");
  dom.btnGuardarAcceso = document.getElementById("btn-guardar-acceso");

  dom.toastContainer = document.getElementById("toast-container");
}

/* ==========================================================================
   Filtros, orden y paginación (puro sobre state.todas)
   ========================================================================== */
function obtenerEtiquetaEstado(valor) {
  return ESTADOS.find((estado) => estado.value === valor)?.label || valor || "—";
}

function ordenarSolicitudes(lista, { clave, direccion }) {
  const signo = direccion === "asc" ? 1 : -1;
  return [...lista].sort((a, b) => {
    let valorA = a[clave];
    let valorB = b[clave];

    if (clave === "fechaCreacion") {
      valorA = Utils.parseFecha(valorA)?.getTime() ?? 0;
      valorB = Utils.parseFecha(valorB)?.getTime() ?? 0;
    } else if (clave === "id") {
      valorA = Number(valorA) || 0;
      valorB = Number(valorB) || 0;
    } else {
      valorA = Utils.normalizar(valorA);
      valorB = Utils.normalizar(valorB);
    }

    if (valorA < valorB) return -1 * signo;
    if (valorA > valorB) return 1 * signo;
    return 0;
  });
}

function aplicarFiltrosYOrden() {
  const { busqueda, estado, desde, hasta } = state.filtros;
  const textoBusqueda = Utils.normalizar(busqueda);

  let resultado = state.todas.filter((solicitud) => {
    if (estado && solicitud.estado !== estado) return false;

    if (desde) {
      const fecha = Utils.parseFecha(solicitud.fechaCreacion);
      if (!fecha || fecha < new Date(`${desde}T00:00:00`)) return false;
    }

    if (hasta) {
      const fecha = Utils.parseFecha(solicitud.fechaCreacion);
      if (!fecha || fecha > new Date(`${hasta}T23:59:59`)) return false;
    }

    if (textoBusqueda) {
      const campos = [solicitud.nombre, solicitud.email, solicitud.telefono, solicitud.origen, solicitud.destino];
      const coincide = campos.some((campo) => Utils.normalizar(campo).includes(textoBusqueda));
      if (!coincide) return false;
    }

    return true;
  });

  state.filtradas = ordenarSolicitudes(resultado, state.orden);
}

function totalPaginas() {
  return Math.max(1, Math.ceil(state.filtradas.length / state.paginacion.tamano));
}

function obtenerPaginaActual() {
  const { pagina, tamano } = state.paginacion;
  const inicio = (pagina - 1) * tamano;
  return state.filtradas.slice(inicio, inicio + tamano);
}

function calcularKpis(solicitudes) {
  const hoy = new Date();
  let nuevasHoy = 0;
  let enProceso = 0;
  let completadas = 0;

  solicitudes.forEach((solicitud) => {
    const fecha = Utils.parseFecha(solicitud.fechaCreacion);
    if (fecha && Utils.esMismoDia(fecha, hoy)) {
      nuevasHoy += 1;
    }
    if (solicitud.estado === "CONTACTADO" || solicitud.estado === "PRESUPUESTADO") {
      enProceso += 1;
    }
    if (solicitud.estado === "FINALIZADO") {
      completadas += 1;
    }
  });

  return { total: solicitudes.length, nuevasHoy, enProceso, completadas };
}

/* ==========================================================================
   Render — KPIs
   ========================================================================== */
function renderKpisCargando() {
  [dom.kpiTotal, dom.kpiNuevasHoy, dom.kpiEnProceso, dom.kpiCompletadas].forEach((elemento) => {
    elemento.textContent = "";
    elemento.classList.add("is-loading");
  });
}

function renderKpis() {
  const kpis = calcularKpis(state.todas);
  dom.kpiTotal.textContent = String(kpis.total);
  dom.kpiNuevasHoy.textContent = String(kpis.nuevasHoy);
  dom.kpiEnProceso.textContent = String(kpis.enProceso);
  dom.kpiCompletadas.textContent = String(kpis.completadas);
  [dom.kpiTotal, dom.kpiNuevasHoy, dom.kpiEnProceso, dom.kpiCompletadas].forEach((elemento) =>
    elemento.classList.remove("is-loading")
  );
}

/* ==========================================================================
   Render — Tabla (construida con DOM API, nunca innerHTML con datos externos)
   ========================================================================== */
function crearCeldaTexto(texto, className) {
  const td = document.createElement("td");
  if (className) td.className = className;
  td.textContent = texto;
  return td;
}

function crearBadgeEstado(estado) {
  const span = document.createElement("span");
  span.className = `badge ${ESTADO_CLASS[estado] || "badge--nuevo"}`;

  const punto = document.createElement("span");
  punto.className = "badge__dot";
  punto.setAttribute("aria-hidden", "true");

  const etiqueta = document.createElement("span");
  etiqueta.textContent = obtenerEtiquetaEstado(estado);

  span.append(punto, etiqueta);
  return span;
}

function crearFilaSolicitud(solicitud) {
  const tr = document.createElement("tr");
  tr.className = "is-clickable";
  tr.dataset.id = String(solicitud.id);
  tr.tabIndex = 0;
  tr.setAttribute("role", "button");
  tr.setAttribute("aria-label", `Ver detalle de la solicitud de ${solicitud.nombre || "cliente"}`);

  tr.appendChild(crearCeldaTexto(`#${solicitud.id}`, "col-id"));
  tr.appendChild(crearCeldaTexto(Utils.formatFecha(solicitud.fechaCreacion), "col-fecha"));

  const tdCliente = document.createElement("td");
  tdCliente.className = "col-cliente";
  const nombreEl = document.createElement("span");
  nombreEl.className = "cliente-nombre";
  nombreEl.textContent = solicitud.nombre || "—";
  const emailEl = document.createElement("span");
  emailEl.className = "cliente-email";
  emailEl.textContent = solicitud.email || "";
  tdCliente.append(nombreEl, emailEl);
  tr.appendChild(tdCliente);

  tr.appendChild(crearCeldaTexto(solicitud.telefono || "—"));

  const tdRuta = document.createElement("td");
  tdRuta.className = "col-ruta";
  const rutaLinea = document.createElement("span");
  rutaLinea.className = "ruta-linea";
  rutaLinea.textContent = `${solicitud.origen || "—"} → ${solicitud.destino || "—"}`;
  tdRuta.appendChild(rutaLinea);
  tr.appendChild(tdRuta);

  tr.appendChild(crearCeldaTexto(solicitud.tamano || "N/D"));

  const tdEstado = document.createElement("td");
  tdEstado.appendChild(crearBadgeEstado(solicitud.estado));
  tr.appendChild(tdEstado);

  const tdAcciones = document.createElement("td");
  tdAcciones.className = "col-acciones";

  const accionesGrupo = document.createElement("div");
  accionesGrupo.className = "acciones-grupo";

  const btnDetalle = document.createElement("button");
  btnDetalle.type = "button";
  btnDetalle.className = "row-detalle-btn";
  const textoBtn = document.createElement("span");
  textoBtn.textContent = "Ver";
  btnDetalle.append(textoBtn, Utils.crearIcono("icon-arrow-right"));
  btnDetalle.addEventListener("click", (evento) => {
    evento.stopPropagation();
    abrirModalDetalle(solicitud.id);
  });
  accionesGrupo.appendChild(btnDetalle);

  const btnEliminar = document.createElement("button");
  btnEliminar.type = "button";
  btnEliminar.className = "row-eliminar-btn";
  btnEliminar.setAttribute("aria-label", `Eliminar solicitud de ${solicitud.nombre || "cliente"}`);
  const textoEliminar = document.createElement("span");
  textoEliminar.textContent = "🗑️ Eliminar";
  btnEliminar.appendChild(textoEliminar);
  btnEliminar.addEventListener("click", (evento) => {
    evento.stopPropagation();
    eliminarSolicitud(solicitud.id);
  });
  accionesGrupo.appendChild(btnEliminar);

  tdAcciones.appendChild(accionesGrupo);
  tr.appendChild(tdAcciones);

  tr.addEventListener("click", () => abrirModalDetalle(solicitud.id));
  tr.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      abrirModalDetalle(solicitud.id);
    }
  });

  return tr;
}

function renderPaginacion() {
  const total = state.filtradas.length;
  const totalPag = totalPaginas();
  if (state.paginacion.pagina > totalPag) {
    state.paginacion.pagina = totalPag;
  }
  const inicio = total === 0 ? 0 : (state.paginacion.pagina - 1) * state.paginacion.tamano + 1;
  const fin = Math.min(state.paginacion.pagina * state.paginacion.tamano, total);

  dom.paginationInfo.textContent =
    total === 0 ? "Sin resultados" : `Mostrando ${inicio}–${fin} de ${total} resultado${total === 1 ? "" : "s"}`;

  dom.btnPrevPage.disabled = state.paginacion.pagina <= 1;
  dom.btnNextPage.disabled = state.paginacion.pagina >= totalPag;
}

function actualizarVisibilidadTabla(sinResultados) {
  const hayError = Boolean(state.error);

  // 1. Manejo del skeleton de carga
  dom.tablaSkeleton.classList.toggle("is-visible", state.cargando);

  // 2. Visibilidad del contenedor de la tabla principal
  const ocultarTabla = state.cargando || hayError || sinResultados;
  dom.tabla.style.display = ocultarTabla ? "none" : "";

  // 3. Control estricto de visibilidad para los mensajes de error y vacío
  if (dom.tablaEmpty) {
    dom.tablaEmpty.hidden = state.cargando || hayError || !sinResultados;
    dom.tablaEmpty.style.display = (!state.cargando && !hayError && sinResultados) ? "block" : "none";
  }

  if (dom.tablaError) {
    dom.tablaError.hidden = state.cargando || !hayError;
    dom.tablaError.style.display = (!state.cargando && hayError) ? "block" : "none";
  }

  if (hayError && dom.tablaErrorMensaje) {
    dom.tablaErrorMensaje.textContent = state.error;
  }

  if (dom.tablaLoadingAnuncio) {
    dom.tablaLoadingAnuncio.textContent = state.cargando ? "Cargando solicitudes…" : "";
  }
}

function renderTabla() {
  aplicarFiltrosYOrden();

  const sinResultados = !state.cargando && !state.error && state.filtradas.length === 0;
  actualizarVisibilidadTabla(sinResultados);

  if (state.cargando || state.error) {
    dom.tablaBody.innerHTML = "";
    dom.paginationInfo.textContent = "";
    dom.btnPrevPage.disabled = true;
    dom.btnNextPage.disabled = true;
    return;
  }

  dom.tablaBody.innerHTML = "";
  const fragmento = document.createDocumentFragment();
  obtenerPaginaActual().forEach((solicitud) => fragmento.appendChild(crearFilaSolicitud(solicitud)));
  dom.tablaBody.appendChild(fragmento);

  renderPaginacion();
}

function refrescarVista() {
  renderTabla();
}

function actualizarIndicadoresOrden() {
  dom.ths.forEach((th) => {
    if (th.dataset.sortKey === state.orden.clave) {
      th.setAttribute("aria-sort", state.orden.direccion === "asc" ? "ascending" : "descending");
    } else {
      th.setAttribute("aria-sort", "none");
    }
  });
}

/* ==========================================================================
   Toasts
   ========================================================================== */
const TOAST_ICONS = {
  success: "icon-check-circle",
  error: "icon-alert-triangle",
  warning: "icon-alert-triangle",
  info: "icon-info",
};

function mostrarToast(mensaje, tipo = "info", duracion = TOAST_DURATION_MS) {
  const toast = document.createElement("div");
  toast.className = `toast toast--${tipo}`;
  toast.setAttribute("role", tipo === "error" ? "alert" : "status");

  const texto = document.createElement("p");
  texto.className = "toast__message";
  texto.textContent = mensaje;

  const botonCerrar = document.createElement("button");
  botonCerrar.type = "button";
  botonCerrar.className = "toast__close";
  botonCerrar.setAttribute("aria-label", "Cerrar notificación");
  botonCerrar.appendChild(Utils.crearIcono("icon-x"));

  const eliminar = () => toast.remove();
  botonCerrar.addEventListener("click", eliminar);

  toast.append(Utils.crearIcono(TOAST_ICONS[tipo] || "icon-info", "toast__icon"), texto, botonCerrar);
  dom.toastContainer.appendChild(toast);

  setTimeout(eliminar, duracion);
}

function manejarErrorApi(error, mensajePorDefecto) {
  const mensaje = (error && error.message) || mensajePorDefecto;
  mostrarToast(mensaje, "error");
  if (error instanceof ApiError && error.status === 401) {
    abrirModalAcceso();
  }
}

/* ==========================================================================
   Carga de datos
   ========================================================================== */
async function cargarSolicitudes({ mostrarToastExito = false } = {}) {
  state.cargando = true;
  state.error = null;
  renderKpisCargando();
  refrescarVista();

  dom.btnRefresh.disabled = true;
  dom.btnRefresh.classList.add("is-loading");

  try {
    const datos = await ApiClient.listarSolicitudes();
    state.todas = Array.isArray(datos) ? datos : [];
    state.cargando = false;
    renderKpis();
    refrescarVista();
    if (mostrarToastExito) {
      mostrarToast("Listado actualizado correctamente.", "success");
    }
  } catch (error) {
    state.cargando = false;
    state.error = (error && error.message) || "No se pudieron cargar las solicitudes.";
    renderKpis();
    refrescarVista();
    manejarErrorApi(error, state.error);
  } finally {
    dom.btnRefresh.disabled = false;
    dom.btnRefresh.classList.remove("is-loading");
  }
}

/* ==========================================================================
   Modal de detalle / cambio de estado
   ========================================================================== */
function crearItemDetalle(etiqueta, valor, spanCompleto) {
  const item = document.createElement("div");
  item.className = spanCompleto ? "detalle-item span-2" : "detalle-item";
  const label = document.createElement("span");
  label.className = "detalle-item__label";
  label.textContent = etiqueta;
  const valorEl = document.createElement("span");
  valorEl.className = "detalle-item__value";
  valorEl.textContent = valor;
  item.append(label, valorEl);
  return item;
}

function abrirModalDetalle(id) {
  const solicitud = state.todas.find((item) => item.id === id);
  if (!solicitud) return;

  state.detalleActualId = id;
  dom.modalDetalleBody.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "detalle-grid";
  [
    ["ID", `#${solicitud.id}`],
    ["Fecha de solicitud", Utils.formatFecha(solicitud.fechaCreacion)],
    ["Cliente", solicitud.nombre || "—"],
    ["Teléfono", solicitud.telefono || "—"],
    ["Email", solicitud.email || "—"],
    ["Tamaño de mudanza", solicitud.tamano || "N/D"],
    ["Origen", solicitud.origen || "—"],
    ["Destino", solicitud.destino || "—"],
  ].forEach(([etiqueta, valor]) => grid.appendChild(crearItemDetalle(etiqueta, valor)));
  dom.modalDetalleBody.appendChild(grid);

  const mensajeItem = document.createElement("div");
  mensajeItem.className = "detalle-item span-2";
  const mensajeLabel = document.createElement("span");
  mensajeLabel.className = "detalle-item__label";
  mensajeLabel.textContent = "Mensaje del cliente";
  const mensajeValor = document.createElement("p");
  mensajeValor.className = "detalle-mensaje";
  mensajeValor.textContent = solicitud.mensaje || "El cliente no dejó ningún mensaje adicional.";
  mensajeItem.append(mensajeLabel, mensajeValor);
  dom.modalDetalleBody.appendChild(mensajeItem);

  dom.selectNuevoEstado.value = solicitud.estado || "NUEVO";
  abrirDialog(dom.modalDetalle);
}

function cerrarModalDetalle() {
  cerrarDialog(dom.modalDetalle);
}

async function guardarNuevoEstado() {
  if (state.detalleActualId === null) return;
  const solicitud = state.todas.find((item) => item.id === state.detalleActualId);
  if (!solicitud) return;

  const nuevoEstado = dom.selectNuevoEstado.value;
  if (solicitud.estado === nuevoEstado) {
    mostrarToast("El estado seleccionado es el mismo que el actual.", "info");
    return;
  }

  dom.btnGuardarEstado.disabled = true;
  dom.btnGuardarEstado.classList.add("is-loading");

  try {
    const actualizada = await ApiClient.actualizarEstado(state.detalleActualId, nuevoEstado);
    solicitud.estado = (actualizada && actualizada.estado) || nuevoEstado;
    mostrarToast(`Estado actualizado a "${obtenerEtiquetaEstado(solicitud.estado)}".`, "success");
    renderKpis();
    refrescarVista();
    cerrarModalDetalle();
  } catch (error) {
    manejarErrorApi(error, "No se pudo actualizar el estado de la solicitud.");
  } finally {
    dom.btnGuardarEstado.disabled = false;
    dom.btnGuardarEstado.classList.remove("is-loading");
  }
}

/* ==========================================================================
   Borrado de solicitudes
   ========================================================================== */
async function eliminarSolicitud(id) {
  const confirmado = window.confirm(
    "¿Seguro que deseas eliminar esta solicitud? Esta acción no se puede deshacer."
  );
  if (!confirmado) return;

  try {
    await ApiClient.eliminarSolicitud(id);
    mostrarToast("Solicitud eliminada correctamente.", "success");
    await cargarSolicitudes();
  } catch (error) {
    manejarErrorApi(error, "No se pudo eliminar la solicitud.");
  }
}

/* ==========================================================================
   Modal de configuración de acceso (Bearer / Basic Auth)
   ========================================================================== */
function actualizarCamposAuth(tipo) {
  dom.campoBearer.hidden = tipo !== "bearer";
  dom.campoBasicUser.hidden = tipo !== "basic";
  dom.campoBasicPass.hidden = tipo !== "basic";
}

function actualizarIndicadorAuth() {
  const activo = AuthStore.tieneCredenciales();
  dom.authStatusDot.classList.toggle("is-active", activo);
  dom.authStatusLabel.textContent = activo ? "Acceso configurado" : "Configurar acceso";
}

function abrirModalAcceso() {
  const { tipo, bearer, usuario, clave } = AuthStore.get();
  dom.selectAuthTipo.value = tipo;
  dom.inputBearerToken.value = bearer;
  dom.inputBasicUser.value = usuario;
  dom.inputBasicPass.value = clave;
  actualizarCamposAuth(tipo);
  abrirDialog(dom.modalAcceso);
}

function cerrarModalAcceso() {
  cerrarDialog(dom.modalAcceso);
}

/* ==========================================================================
   Helpers de <dialog>
   ========================================================================== */
function abrirDialog(dialog) {
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

function cerrarDialog(dialog) {
  if (typeof dialog.close === "function") {
    dialog.close();
  } else {
    dialog.removeAttribute("open");
  }
}

/* ==========================================================================
   Exportación a CSV (respeta filtros/orden activos)
   ========================================================================== */
function escaparCeldaCsv(valor) {
  const texto = String(valor ?? "");
  return /["\n,]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function exportarCsv() {
  if (state.filtradas.length === 0) {
    mostrarToast("No hay datos para exportar con los filtros actuales.", "warning");
    return;
  }

  const columnas = ["ID", "Fecha", "Nombre", "Telefono", "Email", "Origen", "Destino", "Tamano", "Estado", "Mensaje"];
  const filas = state.filtradas.map((solicitud) => [
    solicitud.id,
    Utils.formatFecha(solicitud.fechaCreacion),
    solicitud.nombre,
    solicitud.telefono,
    solicitud.email,
    solicitud.origen,
    solicitud.destino,
    solicitud.tamano,
    obtenerEtiquetaEstado(solicitud.estado),
    solicitud.mensaje,
  ]);

  const lineas = [columnas, ...filas].map((fila) => fila.map(escaparCeldaCsv).join(","));
  const contenido = "﻿" + lineas.join("\r\n");
  const marcaTemporal = new Date().toISOString().slice(0, 10);

  Utils.descargarArchivo(contenido, `solicitudes_mudanzasjd_${marcaTemporal}.csv`, "text/csv;charset=utf-8;");
  mostrarToast(`Se exportaron ${state.filtradas.length} solicitudes a CSV.`, "success");
}

/* ==========================================================================
   Sidebar responsive
   ========================================================================== */
function alternarSidebar(mostrar) {
  const abierta = mostrar ?? !dom.sidebar.classList.contains("is-open");
  dom.sidebar.classList.toggle("is-open", abierta);
  dom.sidebarBackdrop.hidden = !abierta;
  dom.btnSidebarToggle.setAttribute("aria-expanded", String(abierta));
}

/* ==========================================================================
   Navegación de secciones del sidebar (Panel / Solicitudes)
   ========================================================================== */
function activarEnlaceSidebar(enlace) {
  dom.sidebarLinks.forEach((link) => {
    const esActivo = link === enlace;
    link.classList.toggle("is-active", esActivo);
    if (esActivo) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  const esSolicitudes = enlace.getAttribute("href") === "#solicitudes-section";
  dom.vistaPanel.classList.toggle("is-hidden-section", esSolicitudes);
  dom.vistaSolicitudes.classList.toggle("is-hidden-section", !esSolicitudes);
}

function inicializarVistaSidebar() {
  const enlaceActivo = Array.from(dom.sidebarLinks).find((link) => link.classList.contains("is-active")) || dom.sidebarLinks[0];
  activarEnlaceSidebar(enlaceActivo);
}

/* ==========================================================================
   Poblado de selects de estado (fuente única: ESTADOS)
   ========================================================================== */
function poblarSelectsEstado() {
  ESTADOS.forEach(({ value, label }) => {
    const opcionFiltro = document.createElement("option");
    opcionFiltro.value = value;
    opcionFiltro.textContent = label;
    dom.selectEstado.appendChild(opcionFiltro);

    const opcionModal = document.createElement("option");
    opcionModal.value = value;
    opcionModal.textContent = label;
    dom.selectNuevoEstado.appendChild(opcionModal);
  });
}

/* ==========================================================================
   Registro de eventos
   ========================================================================== */
function registrarEventos() {
  dom.btnSidebarToggle.addEventListener("click", () => alternarSidebar());
  dom.sidebarBackdrop.addEventListener("click", () => alternarSidebar(false));
  dom.sidebarLinks.forEach((enlace) => {
    enlace.addEventListener("click", (evento) => {
      evento.preventDefault();
      activarEnlaceSidebar(enlace);
      alternarSidebar(false);
    });
  });

  dom.btnRefresh.addEventListener("click", () => cargarSolicitudes({ mostrarToastExito: true }));
  dom.btnReintentar.addEventListener("click", () => cargarSolicitudes());

  const manejarBusqueda = Utils.debounce((valor) => {
    state.filtros.busqueda = valor;
    state.paginacion.pagina = 1;
    refrescarVista();
  }, SEARCH_DEBOUNCE_MS);
  dom.inputBuscar.addEventListener("input", (evento) => manejarBusqueda(evento.target.value));

  dom.selectEstado.addEventListener("change", (evento) => {
    state.filtros.estado = evento.target.value;
    state.paginacion.pagina = 1;
    refrescarVista();
  });

  dom.inputFechaDesde.addEventListener("change", (evento) => {
    state.filtros.desde = evento.target.value;
    state.paginacion.pagina = 1;
    refrescarVista();
  });

  dom.inputFechaHasta.addEventListener("change", (evento) => {
    state.filtros.hasta = evento.target.value;
    state.paginacion.pagina = 1;
    refrescarVista();
  });

  dom.btnLimpiarFiltros.addEventListener("click", () => {
    state.filtros = { busqueda: "", estado: "", desde: "", hasta: "" };
    dom.inputBuscar.value = "";
    dom.selectEstado.value = "";
    dom.inputFechaDesde.value = "";
    dom.inputFechaHasta.value = "";
    state.paginacion.pagina = 1;
    refrescarVista();
  });

  dom.btnExportarCsv.addEventListener("click", exportarCsv);

  dom.thButtons.forEach((boton) => {
    boton.addEventListener("click", () => {
      const clave = boton.dataset.sortKey;
      if (state.orden.clave === clave) {
        state.orden.direccion = state.orden.direccion === "asc" ? "desc" : "asc";
      } else {
        state.orden.clave = clave;
        state.orden.direccion = "asc";
      }
      actualizarIndicadoresOrden();
      state.paginacion.pagina = 1;
      refrescarVista();
    });
  });

  dom.selectPageSize.addEventListener("change", (evento) => {
    state.paginacion.tamano = Number(evento.target.value);
    state.paginacion.pagina = 1;
    refrescarVista();
  });

  dom.btnPrevPage.addEventListener("click", () => {
    if (state.paginacion.pagina > 1) {
      state.paginacion.pagina -= 1;
      refrescarVista();
    }
  });

  dom.btnNextPage.addEventListener("click", () => {
    if (state.paginacion.pagina < totalPaginas()) {
      state.paginacion.pagina += 1;
      refrescarVista();
    }
  });

  dom.btnCerrarModal.addEventListener("click", cerrarModalDetalle);
  dom.btnCancelarModal.addEventListener("click", cerrarModalDetalle);
  dom.btnGuardarEstado.addEventListener("click", guardarNuevoEstado);
  dom.modalDetalle.addEventListener("close", () => {
    state.detalleActualId = null;
  });

  dom.btnConfigAcceso.addEventListener("click", abrirModalAcceso);
  dom.btnCerrarModalAcceso.addEventListener("click", cerrarModalAcceso);
  dom.selectAuthTipo.addEventListener("change", (evento) => actualizarCamposAuth(evento.target.value));

  dom.btnGuardarAcceso.addEventListener("click", () => {
    AuthStore.guardar({
      tipo: dom.selectAuthTipo.value,
      bearer: dom.inputBearerToken.value.trim(),
      usuario: dom.inputBasicUser.value.trim(),
      clave: dom.inputBasicPass.value,
    });
    actualizarIndicadorAuth();
    mostrarToast("Credenciales guardadas para esta sesión.", "success");
    cerrarModalAcceso();
  });

  dom.btnOlvidarCredenciales.addEventListener("click", () => {
    AuthStore.limpiar();
    dom.selectAuthTipo.value = "none";
    dom.inputBearerToken.value = "";
    dom.inputBasicUser.value = "";
    dom.inputBasicPass.value = "";
    actualizarCamposAuth("none");
    actualizarIndicadorAuth();
    mostrarToast("Se olvidaron las credenciales guardadas.", "info");
  });

  [dom.modalDetalle, dom.modalAcceso].forEach((dialog) => {
    dialog.addEventListener("click", (evento) => {
      if (evento.target === dialog) {
        cerrarDialog(dialog);
      }
    });
  });
}

/* ==========================================================================
   Inicialización
   ========================================================================== */
function init() {
  cachearElementos();
  poblarSelectsEstado();
  actualizarIndicadoresOrden();
  actualizarIndicadorAuth();
  inicializarVistaSidebar();
  registrarEventos();
  cargarSolicitudes();
}

document.addEventListener("DOMContentLoaded", init);

/* ==========================================================================
   Registro del Service Worker (PWA)
   ========================================================================== */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((error) => {
      console.error("No se pudo registrar el Service Worker:", error);
    });
  });
}
