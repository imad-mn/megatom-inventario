<script setup lang="ts">
import { dialogoHistorial } from '@/servicios/shared';
import type { Menu } from 'primevue';
import type { MenuItem } from 'primevue/menuitem';
import { ref } from 'vue';

interface EditarQuitarProps {
  onAgregarClick?: () => void;
  onMoverClick: () => void;
  onEditarClick: () => void;
  onQuitarClick: () => void;
  idElemento: string;
  nombreElemento: string;
  buttonSeverity: 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast';
  queAgregar?: string;
}
const props = defineProps<EditarQuitarProps>();

function onHistorialClick() {
  dialogoHistorial.value.mostrar = true;
  dialogoHistorial.value.idElemento = props.idElemento;
  dialogoHistorial.value.nombreElemento = props.nombreElemento;
}

const botones = ref<MenuItem[]>([
  {
    icon: 'pi pi-plus',
    label: 'Agregar ' + (props.queAgregar || ''),
    command: () => props.onAgregarClick?.(),
    visible: props.onAgregarClick != undefined,
  },
  {
    icon: 'pi pi-arrows-alt',
    label: 'Mover',
    command: () => props.onMoverClick(),
  },
  {
    icon: 'pi pi-history',
    label: 'Historial',
    command: () => onHistorialClick(),
  },
  {
    icon: 'pi pi-pen-to-square',
    label: 'Editar',
    command: () => props.onEditarClick(),
  },
  {
    icon: 'pi pi-trash',
    label: 'Quitar',
    command: () => props.onQuitarClick(),
  },
]);

const menu = ref<InstanceType<typeof Menu> | null>(null);
const toggle = (event: Event) => {
    menu.value?.toggle(event);
};
</script>

<template>
  <Menu ref="menu" :model="botones" :popup="true" />
  <Button :severity="buttonSeverity" icon="pi pi-ellipsis-v" variant="text" @click="toggle" size="small" />
</template>
