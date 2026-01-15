import { createRouter, createWebHistory } from 'vue-router'

import PaginaListas from './paginas/PaginaListas.vue'
import PaginaInventario from './paginas/PaginaGalpones.vue'
import PaginaProductos from './paginas/PaginaProductos.vue'
import PaginaGalpon from './paginas/PaginaGalpon.vue'
import PaginaEstante from './paginas/PaginaEstante.vue'
import PaginaMovimientos from './paginas/PaginaMovimientos.vue'
import PaginaLogin from './paginas/PaginaLogin.vue'
import PaginaHome from './paginas/PaginaHome.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/listas', component: PaginaListas, name: 'Listas' },
    { path: '/galpones', component: PaginaInventario, name: 'Galpones' },
    { path: '/productos', component: PaginaProductos, name: 'Productos' },
    { path: '/galpon/:id', component: PaginaGalpon, name: 'Galpón', sensitive: true },
    { path: '/estante/:estante', component: PaginaEstante, name: 'Estante', sensitive: true },
    { path: '/movimientos', component: PaginaMovimientos, name: 'Movimientos' },
    { path: '/login', component: PaginaLogin, name: 'Login' },
    { path: '/', component: PaginaHome, name: 'Home' }
  ],
  strict: true,
})

export default router
