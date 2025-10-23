import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config';
import es from './es.json'
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import ConfirmationService from 'primevue/confirmationservice'

// Estilos
import 'primeicons/primeicons.css'
import './main.css'

// Componentes PrimeVue
import Menubar from 'primevue/menubar';

const app = createApp(App)

const MyPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{sky.50}',
            100: '{sky.100}',
            200: '{sky.200}',
            300: '{sky.300}',
            400: '{sky.400}',
            500: '{sky.500}',
            600: '{sky.600}',
            700: '{sky.700}',
            800: '{sky.800}',
            900: '{sky.900}',
            950: '{sky.950}'
        }
    }
});

app.use(router)
app.use(PrimeVue, {
  locale: es,
  theme: { preset: MyPreset }
})
app.use(ConfirmationService)

app.component('Menubar', Menubar);

app.mount('#app')
