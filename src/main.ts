import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config';
import es from './es.json'
import Aura from '@primeuix/themes/aura';
import ConfirmationService from 'primevue/confirmationservice'

// Estilos
import 'primeicons/primeicons.css'
import "primeflex/primeflex.css";
import './main.css'

const app = createApp(App)

app.use(router)
app.use(PrimeVue, {
  locale: es,
  theme: { preset: Aura }
})
app.use(ConfirmationService)

app.mount('#app')
