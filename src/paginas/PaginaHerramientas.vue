<script setup lang="ts">
import { computed, ref } from "vue";
import { useConfirm } from "primevue/useconfirm";
import DialogoEdicion from "@/componentes/DialogoEdicion.vue";
import EditarQuitar from "@/componentes/EditarQuitar.vue";
import * as TablesDbService from "@/servicios/TablesDbService";
import { useAuthStore } from "@/servicios/authStore";
import { useGlobalStore } from "@/servicios/globalStore";
import { RegistrarHistorial } from "@/servicios/historialService";
import type { CantidadHerramienta, Herramienta } from "@/servicios/modelos";

const confirm = useConfirm();
const globalStore = useGlobalStore();
const usuario = useAuthStore().Usuario;

const filtroTexto = ref("");
const dialogVisible = ref(false);
const itemEdicion = ref<Herramienta>();
const esNuevo = ref(false);
const ubicacionVisibleId = ref<string | null>(null);
const ubicaciones = ref<Record<string, string[]>>({});

const herramientasFiltradas = computed(() => {
  const filtro = filtroTexto.value.trim().toLocaleLowerCase();
  return globalStore.Herramientas.filter((herramienta) => {
    const fabricante = herramienta.fabricanteId
      ? (globalStore.ListasMap[herramienta.fabricanteId] ?? "")
      : "";
    const estado = herramienta.estadoId ? (globalStore.ListasMap[herramienta.estadoId] ?? "") : "";

    return [herramienta.nombre, herramienta.detalle, herramienta.serial, fabricante, estado].some(
      (valor) => valor?.toLocaleLowerCase().includes(filtro),
    );
  }).sort((a, b) => a.nombre.localeCompare(b.nombre));
});

const fabricantes = computed(() => globalStore.ObtenerLista("fabricantes herramientas"));
const estados = computed(() =>
  globalStore.ObtenerLista("estados").map((estado) => ({
    ...estado,
    nombre: estado.nombre.substring(3),
  })),
);

function Agregar() {
  esNuevo.value = true;
  itemEdicion.value = {
    id: "",
    nombre: "",
    detalle: null,
    serial: null,
    fabricanteId: null,
    estadoId: null,
  };
  dialogVisible.value = true;
}

function Editar(item: Herramienta) {
  esNuevo.value = false;
  itemEdicion.value = { ...item };
  dialogVisible.value = true;
}

function Describir(item: Herramienta): string {
  const fabricante = item.fabricanteId ? (globalStore.ListasMap[item.fabricanteId] ?? "") : "";
  const estado = item.estadoId ? (globalStore.ListasMap[item.estadoId] ?? "") : "";
  return `Nombre: ${item.nombre} | Detalle: ${item.detalle ?? ""} | Serial: ${item.serial ?? ""} | Fabricante: ${fabricante} | Estado: ${estado}`;
}

async function Guardar() {
  if (!itemEdicion.value) return;

  const herramienta = itemEdicion.value;
  herramienta.nombre = herramienta.nombre.trim();

  if (esNuevo.value) {
    await TablesDbService.Crear(TablesDbService.Coleccion.Herramientas, herramienta);
    await RegistrarHistorial(herramienta.id, "[Herramienta] Creada", null, Describir(herramienta));
    globalStore.Herramientas.push({ ...herramienta });
  } else {
    const anterior = globalStore.Herramientas.find((item) => item.id === herramienta.id);
    if (!anterior) return;

    await TablesDbService.Actualizar(TablesDbService.Coleccion.Herramientas, herramienta);
    await RegistrarHistorial(
      herramienta.id,
      "[Herramienta] Modificada",
      Describir(anterior),
      Describir(herramienta),
    );
    const indice = globalStore.Herramientas.findIndex((item) => item.id === herramienta.id);
    globalStore.Herramientas[indice] = { ...herramienta };
  }

  dialogVisible.value = false;
}

function Quitar(item: Herramienta) {
  confirm.require({
    header: "Eliminar",
    message: `¿Estás seguro de eliminar: "${item.nombre}"?`,
    acceptClass: "p-button-danger p-button-outlined",
    acceptIcon: "pi pi-trash",
    rejectClass: "p-button-secondary p-button-outlined",
    accept: async () => {
      const cantidades = globalStore.ObtenerCantidadesPorHerramienta(item.id);
      await TablesDbService.EliminarConFiltro(
        TablesDbService.Coleccion.CantidadHerramientas,
        "herramientaId",
        item.id,
      );
      await TablesDbService.Eliminar(TablesDbService.Coleccion.Herramientas, item);
      await RegistrarHistorial(
        item.id,
        "[Herramienta] Eliminada",
        `${Describir(item)} | Cantidades asociadas: ${cantidades.length}`,
        null,
      );

      globalStore.CantidadHerramientas = globalStore.CantidadHerramientas.filter(
        (cantidad) => cantidad.herramientaId !== item.id,
      );
      globalStore.Herramientas = globalStore.Herramientas.filter(
        (herramienta) => herramienta.id !== item.id,
      );
      if (ubicacionVisibleId.value === item.id) ubicacionVisibleId.value = null;
    },
  });
}

function VerUbicacion(item: Herramienta) {
  if (ubicacionVisibleId.value === item.id) {
    ubicacionVisibleId.value = null;
    return;
  }

  const cantidades: CantidadHerramienta[] = globalStore.ObtenerCantidadesPorHerramienta(item.id);
  ubicaciones.value[item.id] = globalStore.ObtenerUbicacionesHerramienta(cantidades);
  ubicacionVisibleId.value = item.id;
}
</script>

<template>
  <div class="flex gap-2 items-center mb-3 mx-auto max-w-lg">
    <div class="text-xl mr-3">HERRAMIENTAS</div>
    <Button
      v-if="usuario"
      label="Agregar"
      icon="pi pi-plus"
      severity="info"
      variant="outlined"
      @click="Agregar"
    />
    <IconField class="w-full md:w-auto">
      <InputIcon class="pi pi-search" />
      <InputText v-model="filtroTexto" placeholder="Buscar" class="w-full md:w-auto" />
    </IconField>
  </div>

  <div class="w-full overflow-x-auto">
    <table class="w-full border-collapse text-left">
      <thead>
        <tr
          class="border-b border-surface-300 dark:border-surface-700 bg-surface-100 dark:bg-surface-800"
        >
          <th class="px-3 py-2 font-semibold">Nombre</th>
          <th class="px-3 py-2 font-semibold">Detalle</th>
          <th class="px-3 py-2 font-semibold">Serial</th>
          <th class="px-3 py-2 font-semibold">Fabricante</th>
          <th class="px-3 py-2 font-semibold">Estado</th>
          <th class="px-3 py-2 font-semibold"></th>
        </tr>
      </thead>
      <tbody>
        <template v-for="item in herramientasFiltradas" :key="item.id">
          <tr class="border-b border-surface-200 dark:border-surface-800">
            <td class="px-3 py-2">{{ item.nombre }}</td>
            <td class="px-3 py-2">{{ item.detalle || "—" }}</td>
            <td class="px-3 py-2">{{ item.serial || "—" }}</td>
            <td class="px-3 py-2">
              {{ item.fabricanteId ? (globalStore.ListasMap[item.fabricanteId] ?? "—") : "—" }}
            </td>
            <td class="px-3 py-2">
              {{
                item.estadoId ? (globalStore.ListasMap[item.estadoId]?.substring(3) ?? "—") : "—"
              }}
            </td>
            <td class="px-3 py-2">
              <div class="flex items-center justify-center">
                <Button
                  icon="pi pi-map-marker"
                  severity="secondary"
                  variant="text"
                  v-tooltip.bottom="'Ver ubicación'"
                  :aria-label="`Ver ubicación de ${item.nombre}`"
                  @click="VerUbicacion(item)"
                />
                <EditarQuitar
                  @editar-click="Editar(item)"
                  @quitar-click="Quitar(item)"
                  :id-elemento="item.id"
                  :nombre-elemento="item.nombre"
                />
              </div>
            </td>
          </tr>
          <tr
            v-if="ubicacionVisibleId === item.id"
            class="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900"
          >
            <td colspan="6" class="px-3 py-2">
              <div v-for="(ubicacion, indice) in ubicaciones[item.id]" :key="indice">
                {{ ubicacion }}
              </div>
            </td>
          </tr>
        </template>
        <tr v-if="herramientasFiltradas.length === 0">
          <td colspan="6" class="px-3 py-4 text-center italic text-muted-color">
            No hay herramientas.
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <DialogoEdicion
    v-model:mostrar="dialogVisible"
    :esAgregar="esNuevo"
    :clickAceptar="Guardar"
    nombre-objeto="Herramienta"
    :desabilitarAceptar="!itemEdicion?.nombre?.trim()"
  >
    <div v-if="itemEdicion" class="flex flex-col gap-3 pt-1">
      <FloatLabel variant="on">
        <InputText
          id="nombreHerramienta"
          v-model="itemEdicion.nombre"
          autofocus
          class="w-full"
          :invalid="!itemEdicion.nombre.trim()"
        />
        <label for="nombreHerramienta">Nombre</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <Textarea id="detalleHerramienta" v-model="itemEdicion.detalle" class="w-full" rows="2" />
        <label for="detalleHerramienta">Detalle</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <InputText id="serialHerramienta" v-model="itemEdicion.serial" class="w-full" />
        <label for="serialHerramienta">Serial</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <Select
          id="fabricanteHerramienta"
          v-model="itemEdicion.fabricanteId"
          :options="fabricantes"
          optionValue="id"
          optionLabel="nombre"
          showClear
          class="w-full"
        />
        <label for="fabricanteHerramienta">Fabricante</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <Select
          id="estadoHerramienta"
          v-model="itemEdicion.estadoId"
          :options="estados"
          optionValue="id"
          optionLabel="nombre"
          showClear
          class="w-full"
        />
        <label for="estadoHerramienta">Estado</label>
      </FloatLabel>
    </div>
  </DialogoEdicion>
</template>
