import { createRouter, createWebHistory } from "vue-router";
import { useGlobalStore } from "./servicios/globalStore";

import PaginaListas from "./paginas/PaginaListas.vue";
import PaginaGalpones from "./paginas/PaginaGalpones.vue";
import PaginaProductos from "./paginas/PaginaProductos.vue";
import PaginaHerramientas from "./paginas/PaginaHerramientas.vue";
import PaginaGalpon from "./paginas/PaginaGalpon.vue";
import PaginaEstante from "./paginas/PaginaEstante.vue";
import PaginaDeposito from "./paginas/PaginaDeposito.vue";
import PaginaMovimientos from "./paginas/PaginaMovimientos.vue";
import PaginaHistorial from "./paginas/PaginaHistorial.vue";
import PaginaLogin from "./paginas/PaginaLogin.vue";
import PaginaHome from "./paginas/PaginaHome.vue";
import PaginaImprimir from "./paginas/PaginaImprimir.vue";
import PaginaSolicitudActual from "./paginas/PaginaSolicitudActual.vue";
import PaginaSolicitudes from "./paginas/PaginaSolicitudes.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/listas", component: PaginaListas, name: "Listas" },
    { path: "/galpones", component: PaginaGalpones, name: "Galpones" },
    { path: "/productos", component: PaginaProductos, name: "Productos" },
    { path: "/herramientas", component: PaginaHerramientas, name: "Herramientas" },
    { path: "/galpon", component: PaginaGalpon, name: "Area" },
    { path: "/estante", component: PaginaEstante, name: "Estante" },
    { path: "/deposito", component: PaginaDeposito, name: "Deposito" },
    { path: "/movimientos", component: PaginaMovimientos, name: "Movimientos" },
    { path: "/historial", component: PaginaHistorial, name: "Historial" },
    { path: "/login", component: PaginaLogin, name: "Login" },
    { path: "/imprimir/:tipo", component: PaginaImprimir, name: "Imprimir" },
    { path: "/solicitud", component: PaginaSolicitudActual, name: "Solicitud" },
    { path: "/solicitudes", component: PaginaSolicitudes, name: "Solicitudes" },
    { path: "/", component: PaginaHome, name: "Home" },
    { path: "/tomas", component: PaginaHome, name: "tomascapasso" },
    { path: "/tomas/galpon", component: PaginaGalpon, name: "tomascapasso-anexo" },
    { path: "/tomas/estante", component: PaginaEstante, name: "tomascapasso-estante" },
    { path: "/tomas/deposito", component: PaginaDeposito, name: "tomascapasso-deposito" },
    { path: "/tomas/productos", component: PaginaProductos, name: "tomascapasso-productos" },
  ],
  strict: true,
});

router.beforeEach((to) => {
  const globalStore = useGlobalStore();
  globalStore.esTomasCapasso = to.path.startsWith("/tomas");
});

export default router;
