import { createRouter, createWebHistory } from 'vue-router'

import PaginaListas from './paginas/PaginaListas.vue'
import PaginaGalpones from './paginas/PaginaGalpones.vue'
import PaginaProductos from './paginas/PaginaProductos.vue'
import PaginaGalpon from './paginas/PaginaGalpon.vue'
import PaginaEstante from './paginas/PaginaEstante.vue'
import PaginaMovimientos from './paginas/PaginaMovimientos.vue'
import PaginaHistorial from './paginas/PaginaHistorial.vue'
import PaginaLogin from './paginas/PaginaLogin.vue'
import PaginaHome from './paginas/PaginaHome.vue'
import PaginaImprimir from './paginas/PaginaImprimir.vue'
import PaginaSolicitudActual from './paginas/PaginaSolicitudActual.vue'
import PaginaSolicitudes from './paginas/PaginaSolicitudes.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/listas', component: PaginaListas, name: 'Listas' },
    { path: '/galpones', component: PaginaGalpones, name: 'Galpones' },
    { path: '/productos', component: PaginaProductos, name: 'Productos' },
    { path: '/galpon', component: PaginaGalpon, name: 'Galpón' },
    { path: '/estante', component: PaginaEstante, name: 'Estante' },
    { path: '/movimientos', component: PaginaMovimientos, name: 'Movimientos' },
    { path: '/historial', component: PaginaHistorial, name: 'Historial' },
    { path: '/login', component: PaginaLogin, name: 'Login' },
    { path: '/imprimir/:tipo', component: PaginaImprimir, name: 'Imprimir' },
    { path: '/solicitud', component: PaginaSolicitudActual, name: 'Solicitud' },
    { path: '/solicitudes', component: PaginaSolicitudes, name: 'Solicitudes' },
    { path: '/', component: PaginaHome, name: 'Home' }
  ],
  strict: true,
})

export default router
