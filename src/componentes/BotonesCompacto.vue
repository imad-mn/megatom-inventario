<script setup lang="ts">
import type { Menu } from 'primevue';
import type { MenuItem } from 'primevue/menuitem';
import { ref } from 'vue';
import { useGlobalStore } from '@/servicios/globalStore';

interface EditarQuitarProps {
  onAgregarClick?: () => void;
  onMoverClick: () => void;
  onEditarClick: () => void;
  onQuitarClick: () => void;
  onImprimirClick?: () => void;
  idElemento: string;
  nombreElemento: string;
  buttonSeverity: 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast';
  queAgregar?: string;
}
const props = defineProps<EditarQuitarProps>();

const globalStore = useGlobalStore();
const { dialogoHistorial } = globalStore;

function onHistorialClick() {
  dialogoHistorial.mostrar = true;
  dialogoHistorial.idElemento = props.idElemento;
  dialogoHistorial.nombreElemento = props.nombreElemento;
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
  {
    icon: 'pi pi-print',
    label: 'Imprimir',
    command: () => props.onImprimirClick?.(),
    visible: props.onImprimirClick != undefined,
  },
]);

const menu = ref<InstanceType<typeof Menu> | null>(null);
const toggle = (event: Event) => {
    menu.value?.toggle(event);
};
</script>

<template>
  <Menu ref="menu" :model="botones" :popup="true" />
  <Button :severity="buttonSeverity" icon="pi pi-ellipsis-v" variant="text" @click="toggle" :pt="{ root: 'px-2 w-auto' }" />
</template>
