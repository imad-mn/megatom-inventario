import { createRouter, createWebHistory } from 'vue-router'

import PaginaListas from './paginas/PaginaListas.vue'
import PaginaInventario from './paginas/PaginaInventario.vue'
import PaginaProductos from './paginas/PaginaProductos.vue'
import PaginaUsuarios from './paginas/PaginaUsuarios.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/listas', component: PaginaListas, name: 'Listas' },
    { path: '/inventario', component: PaginaInventario, name: 'Inventario' },
    { path: '/productos', component: PaginaProductos, name: 'Productos' },
    { path: '/usuarios', component: PaginaUsuarios, name: 'Usuarios' },
  ],
})

export default router
