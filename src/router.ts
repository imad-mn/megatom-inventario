import { createRouter, createWebHistory } from 'vue-router'

import PaginaConfiguracion from './paginas/PaginaConfiguracion.vue'
import PaginaInventario from './paginas/PaginaInventario.vue'
import PaginaProductos from './paginas/PaginaProductos.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/configuracion', component: PaginaConfiguracion, name: 'Configuracion' },
    { path: '/inventario', component: PaginaInventario, name: 'Inventario' },
    { path: '/productos', component: PaginaProductos, name: 'Productos' },
  ],
})

export default router
