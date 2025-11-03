import 'primeicons/primeicons.css'
import './main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config';
import es from './es.json'
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

// Componentes PrimeVue
import ConfirmationService from 'primevue/confirmationservice'
import Menubar from 'primevue/menubar';
import Button from 'primevue/button';
import DataView from 'primevue/dataview';
import Panel from 'primevue/panel';
import ConfirmDialog from 'primevue/confirmdialog';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';

const MyPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{blue.50}',
            100: '{blue.100}',
            200: '{blue.200}',
            300: '{blue.300}',
            400: '{blue.400}',
            500: '{blue.500}',
            600: '{blue.600}',
            700: '{blue.700}',
            800: '{blue.800}',
            900: '{blue.900}',
            950: '{blue.950}'
        }
    },
    components: {
      panel: {
        header: {
          padding: '0.5rem 1rem',
          background: '{primary.100}',
        },
        content: {
          padding: '0.5rem',
        }
      }
    }
});

const app = createApp(App)
app.use(router)
app.use(PrimeVue, {
  locale: es,
  theme: { preset: MyPreset },
})
app.use(ConfirmationService)

// Registro de componentes globales
app.component('Menubar', Menubar);
app.component('Button', Button);
app.component('DataView', DataView);
app.component('Panel', Panel);
app.component('ConfirmDialog', ConfirmDialog);
app.component('Dialog', Dialog);
app.component('InputText', InputText);

app.mount('#app')
