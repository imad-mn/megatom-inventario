<script setup lang="ts">
import * as TablesDbService from "@/servicios/TablesDbService";
import type { Caja, ConDescripcion } from "@/servicios/modelos";
import { computed, ref } from "vue";
import { useConfirm } from "primevue/useconfirm";
import { useRouter } from "vue-router";
import DialogoEdicion from "@/componentes/DialogoEdicion.vue";
import EditarQuitar from "@/componentes/EditarQuitar.vue";
import TablaCantHerramientas from "@/componentes/TablaCantHerramientas.vue";
import { RegistrarHistorial } from "@/servicios/historialService";
import { useGlobalStore } from "@/servicios/globalStore";
import { useAuthStore } from "@/servicios/authStore";

const confirm = useConfirm();
const router = useRouter();
const globalStore = useGlobalStore();
const Usuario = useAuthStore().Usuario;
const mostrarDialogoCaja = ref(false);
const cajaSeleccionada = ref<Caja | null>(null);

const cajas = computed(() =>
  [...(globalStore.DepositoSeleccionado?.cajas ?? [])].sort((a, b) =>
    a.nombre.localeCompare(b.nombre),
  ),
);

const herramientasEnCaja = computed(() => {
  const cajaId = cajaSeleccionada.value?.id;
  return cajaId
    ? globalStore
        .ObtenerCantidadesConHerramientas()
        .filter((cantidad) => cantidad.cajaId === cajaId)
    : [];
});

const dialogVisible = ref(false);
const itemEdicion = ref<ConDescripcion>({
  id: "",
  nombre: "",
  descripcion: "",
  ordenDescendente: false,
});
const esNuevo = ref(false);
const tipoEdicion = ref<"Depósito" | "Caja">("Caja");

function irAtras() {
  router.push(globalStore.esTomasCapasso ? "/tomas/galpon" : "/galpon");
}

function AgregarCaja() {
  esNuevo.value = true;
  tipoEdicion.value = "Caja";
  itemEdicion.value = {
    id: crypto.randomUUID(),
    nombre: "",
    descripcion: "",
    ordenDescendente: false,
  };
  dialogVisible.value = true;
}

function EditarDeposito() {
  const deposito = globalStore.DepositoSeleccionado;
  if (!deposito) return;

  esNuevo.value = false;
  tipoEdicion.value = "Depósito";
  itemEdicion.value = {
    id: deposito.id,
    nombre: deposito.nombre,
    descripcion: deposito.descripcion,
    ordenDescendente: deposito.ordenDescendente,
  };
  dialogVisible.value = true;
}

function EditarCaja(caja: Caja) {
  esNuevo.value = false;
  tipoEdicion.value = "Caja";
  itemEdicion.value = {
    id: caja.id,
    nombre: caja.nombre,
    descripcion: "",
    ordenDescendente: false,
  };
  dialogVisible.value = true;
}

function VerCaja(caja: Caja) {
  cajaSeleccionada.value = caja;
  mostrarDialogoCaja.value = true;
}

async function Guardar() {
  const galpon = globalStore.GalponSeleccionado!;
  const deposito = globalStore.DepositoSeleccionado!;

  if (esNuevo.value) {
    const nuevaCaja: Caja = { id: itemEdicion.value.id, nombre: itemEdicion.value.nombre };
    deposito.cajas ??= [];
    deposito.cajas.push(nuevaCaja);
    await TablesDbService.Actualizar(TablesDbService.Coleccion.Galpones, galpon);
    await RegistrarHistorial(
      nuevaCaja.id,
      "[Caja] Creada",
      null,
      `Caja ${nuevaCaja.nombre} (Depósito: ${deposito.nombre})`,
    );
  } else if (tipoEdicion.value === "Depósito") {
    const nombreAnterior = deposito.nombre;
    deposito.nombre = itemEdicion.value.nombre;
    deposito.descripcion = itemEdicion.value.descripcion;
    deposito.ordenDescendente = itemEdicion.value.ordenDescendente;
    await TablesDbService.Actualizar(TablesDbService.Coleccion.Galpones, galpon);
    await RegistrarHistorial(deposito.id, "[Depósito] Modificado", nombreAnterior, deposito.nombre);
  } else {
    const caja = deposito.cajas.find((item) => item.id === itemEdicion.value.id);
    if (caja) {
      const nombreAnterior = caja.nombre;
      caja.nombre = itemEdicion.value.nombre;
      await TablesDbService.Actualizar(TablesDbService.Coleccion.Galpones, galpon);
      await RegistrarHistorial(
        caja.id,
        "[Caja] Modificada",
        `Caja ${nombreAnterior} (Depósito: ${deposito.nombre})`,
        `Caja ${caja.nombre} (Depósito: ${deposito.nombre})`,
      );
    }
  }
  dialogVisible.value = false;
}

function QuitarCaja(caja: Caja): void {
  const deposito = globalStore.DepositoSeleccionado;
  if (!deposito) return;

  confirm.require({
    header: "Eliminar",
    message: `¿Estás seguro de eliminar la Caja "${caja.nombre}"?`,
    acceptClass: "p-button-danger p-button-outlined",
    rejectClass: "p-button-secondary p-button-outlined",
    acceptIcon: "pi pi-trash",
    accept: async () => {
      await RegistrarHistorial(
        caja.id,
        "[Caja] Eliminada",
        `Caja ${caja.nombre} (Depósito: ${deposito.nombre})`,
        null,
      );
      deposito.cajas = (deposito.cajas ?? []).filter((item) => item.id !== caja.id);
      await TablesDbService.Actualizar(
        TablesDbService.Coleccion.Galpones,
        globalStore.GalponSeleccionado!,
      );
      await TablesDbService.EliminarConFiltro(
        TablesDbService.Coleccion.CantidadHerramientas,
        "cajaId",
        caja.id,
      );
      globalStore.CantidadHerramientas = globalStore.CantidadHerramientas.filter(
        (item) => item.cajaId !== caja.id,
      );
    },
  });
}
</script>

<template>
  <div id="encabezado" class="flex justify-between md:grid md:grid-cols-3 items-center mb-5">
    <Button class="justify-self-start" severity="secondary" variant="outlined" @click="irAtras">
      <span class="p-button-icon p-button-icon-left pi pi-arrow-left" />
      <span class="p-button-label hidden md:inline">
        {{ globalStore.GalponSeleccionado?.nombre }}
      </span>
    </Button>
    <div class="justify-self-center text-xl">
      DEPÓSITO {{ globalStore.DepositoSeleccionado?.nombre }}
    </div>
    <div class="justify-self-end">
      <template v-if="Usuario && globalStore.DepositoSeleccionado">
        <Button
          severity="success"
          variant="outlined"
          class="mr-2"
          @click="EditarDeposito"
          v-tooltip.bottom="'Editar Depósito'"
        >
          <span class="p-button-icon p-button-icon-left pi pi-pen-to-square" />
          <span class="p-button-label hidden md:inline">Depósito</span>
        </Button>
        <Button
          severity="info"
          variant="outlined"
          @click="AgregarCaja"
          v-tooltip.bottom="'Agregar Caja'"
        >
          <span class="p-button-icon p-button-icon-left pi pi-plus" />
          <span class="p-button-label hidden md:inline">Caja</span>
        </Button>
      </template>
    </div>
  </div>

  <div v-if="!globalStore.DepositoSeleccionado" class="italic text-muted-color">
    No hay un depósito seleccionado.
  </div>
  <div v-else-if="cajas.length === 0" class="italic text-muted-color">
    No hay cajas en este Depósito.
  </div>
  <div v-else class="flex flex-wrap gap-3 justify-center">
    <div
      v-for="caja in cajas"
      :key="caja.id"
      class="flex justify-between items-center border rounded-md border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 px-2 py-1"
    >
      <Button
        variant="text"
        severity="warn"
        @click="VerCaja(caja)"
        v-tooltip.bottom="'Ver Caja'"
        class="flex flex-col justify-start"
      >
        <i class="pi pi-box text-6xl"></i>
        <div class="text-muted-color">Caja {{ caja.nombre }}</div>
      </Button>
      <EditarQuitar
        v-if="Usuario"
        @editar-click="EditarCaja(caja)"
        @quitar-click="QuitarCaja(caja)"
        :id-elemento="caja.id"
        :nombre-elemento="'Caja ' + caja.nombre"
        :vertical="true"
      />
    </div>
  </div>

  <DialogoEdicion
    v-model:mostrar="dialogVisible"
    :esAgregar="esNuevo"
    :clickAceptar="Guardar"
    :nombre-objeto="tipoEdicion"
    :desabilitarAceptar="itemEdicion.nombre.trim() === ''"
  >
    <div class="flex flex-col gap-3 pt-1">
      <FloatLabel variant="on" class="w-full">
        <InputText
          id="nombre"
          v-model="itemEdicion.nombre"
          autofocus
          class="w-full"
          :invalid="!itemEdicion.nombre"
          aria-autocomplete="none"
          @keyup.enter="Guardar"
        />
        <label for="nombre">Nombre</label>
      </FloatLabel>
      <template v-if="tipoEdicion === 'Depósito'">
        <FloatLabel variant="on" class="w-full">
          <InputText
            id="descripcion"
            v-model="itemEdicion.descripcion"
            class="w-full"
            aria-autocomplete="none"
            @keyup.enter="Guardar"
          />
          <label for="descripcion">Descripción</label>
        </FloatLabel>
        <div class="flex gap-2 items-center">
          <ToggleSwitch id="ordenDescendente" v-model="itemEdicion.ordenDescendente" />
          <label for="ordenDescendente">Orden Descendente</label>
        </div>
      </template>
    </div>
  </DialogoEdicion>

  <Dialog v-model:visible="mostrarDialogoCaja" :modal="true" class="md:w-2xl">
    <template #header>
      <div class="w-full">
        <div class="text-xl font-medium text-center">Caja {{ cajaSeleccionada?.nombre }}</div>
      </div>
    </template>
    <TablaCantHerramientas :cantidades="herramientasEnCaja" />
  </Dialog>
</template>
