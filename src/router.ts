import { createRouter, createWebHistory } from 'vue-router'

import PaginaListas from './paginas/PaginaListas.vue'
import PaginaInventario from './paginas/PaginaGalpones.vue'
import PaginaProductos from './paginas/PaginaProductos.vue'
import PaginaUsuarios from './paginas/PaginaUsuarios.vue'
import PaginaGalpon from './paginas/PaginaGalpon.vue'
import PaginaEstante from './paginas/PaginaEstante.vue'
import PaginaMovimientos from './paginas/PaginaMovimientos.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/listas', component: PaginaListas, name: 'Listas' },
    { path: '/galpones', component: PaginaInventario, name: 'Galpones' },
    { path: '/productos', component: PaginaProductos, name: 'Productos' },
    { path: '/usuarios', component: PaginaUsuarios, name: 'Usuarios' },
    { path: '/galpon/:id', component: PaginaGalpon, name: 'Galpón', sensitive: true },
    { path: '/estante/:galpon/:estante', component: PaginaEstante, name: 'Estante', sensitive: true },
    { path: '/movimientos', component: PaginaMovimientos, name: 'Movimientos' },
  ],
  strict: true,
})

export default router
