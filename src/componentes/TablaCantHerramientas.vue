<script setup lang="ts">
import { ref } from "vue";
import { useConfirm } from "primevue/useconfirm";
import EditarQuitar from "@/componentes/EditarQuitar.vue";
import * as TablesDbService from "@/servicios/TablesDbService";
import { useGlobalStore } from "@/servicios/globalStore";
import { RegistrarHistorial } from "@/servicios/historialService";
import type { CantidadHerramienta, CantidadesConHerramienta } from "@/servicios/modelos";

const props = defineProps<{
  cantidades: CantidadesConHerramienta[];
}>();

const confirm = useConfirm();
const globalStore = useGlobalStore();
const itemEdicionId = ref<string | null>(null);
const cantidadEdicion = ref<number | null>(null);

function Editar(item: CantidadesConHerramienta) {
  itemEdicionId.value = item.id;
  cantidadEdicion.value = item.cantidad;
}

function CancelarEdicion() {
  itemEdicionId.value = null;
  cantidadEdicion.value = null;
}

async function GuardarCantidad(item: CantidadesConHerramienta) {
  const cantidad = cantidadEdicion.value;
  if (cantidad === null || !Number.isInteger(cantidad) || cantidad < 1) return;

  const cantidadAnterior = item.cantidad;
  if (cantidad === cantidadAnterior) {
    CancelarEdicion();
    return;
  }

  const registro: CantidadHerramienta = {
    id: item.id,
    herramientaId: item.herramientaId,
    cajaId: item.cajaId,
    cantidad,
  };
  await TablesDbService.Actualizar(TablesDbService.Coleccion.CantidadHerramientas, registro);

  const indice = globalStore.CantidadHerramientas.findIndex((actual) => actual.id === item.id);
  if (indice >= 0) globalStore.CantidadHerramientas[indice] = registro;

  await RegistrarHistorial(
    item.herramientaId,
    "[Herramienta] Cantidad en caja modificada",
    `${item.herramienta.nombre} en Caja: ${cantidadAnterior} unidades`,
    `${item.herramienta.nombre} en Caja: ${cantidad} unidades`,
  );
  CancelarEdicion();
}

function Quitar(item: CantidadesConHerramienta) {
  confirm.require({
    header: "Eliminar",
    message: `¿Estás seguro de quitar "${item.herramienta.nombre}" de esta caja?`,
    acceptClass: "p-button-danger p-button-outlined",
    acceptIcon: "pi pi-trash",
    rejectClass: "p-button-secondary p-button-outlined",
    accept: async () => {
      await TablesDbService.Eliminar(TablesDbService.Coleccion.CantidadHerramientas, item);
      globalStore.CantidadHerramientas = globalStore.CantidadHerramientas.filter(
        (cantidad) => cantidad.id !== item.id,
      );
      await RegistrarHistorial(
        item.herramientaId,
        "[Herramienta] Quitada de caja",
        `${item.herramienta.nombre}: ${item.cantidad} unidades`,
        null,
      );
    },
  });
}
</script>

<template>
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
          <th class="px-3 py-2 text-right font-semibold">Cantidad</th>
          <th class="px-3 py-2 font-semibold"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in props.cantidades"
          :key="item.id"
          class="border-b border-surface-200 last:border-0 dark:border-surface-800"
        >
          <td class="px-3 py-2">{{ item.herramienta.nombre }}</td>
          <td class="px-3 py-2">{{ item.herramienta.detalle ?? "—" }}</td>
          <td class="px-3 py-2">{{ item.herramienta.serial ?? "—" }}</td>
          <td class="px-3 py-2">
            {{
              item.herramienta.fabricanteId
                ? (globalStore.ListasMap[item.herramienta.fabricanteId] ?? "—")
                : "—"
            }}
          </td>
          <td class="px-3 py-2">
            {{
              item.herramienta.estadoId
                ? (globalStore.ListasMap[item.herramienta.estadoId]?.substring(3) ?? "—")
                : "—"
            }}
          </td>
          <td class="pr-3 py-2 text-right">
            <InputNumber
              v-if="itemEdicionId === item.id"
              :inputId="`cantidadHerramienta-${item.id}`"
              v-model="cantidadEdicion"
              :min="1"
              :maxFractionDigits="0"
              :useGrouping="false"
              inputClass="w-20 text-right"
              @keyup.enter="GuardarCantidad(item)"
            />
            <div v-else>{{ item.cantidad }}</div>
          </td>
          <td class="px-3 py-2">
            <EditarQuitar
              v-if="itemEdicionId !== item.id"
              tamaño="small"
              :id-elemento="item.herramientaId"
              :nombre-elemento="item.herramienta.nombre"
              :ocultar-historial="true"
              @editar-click="Editar(item)"
              @quitar-click="Quitar(item)"
            />
            <div v-else class="flex items-center gap-1">
              <Button
                icon="pi pi-save"
                severity="primary"
                variant="text"
                size="small"
                aria-label="Guardar cantidad"
                v-tooltip.bottom="'Guardar'"
                :disabled="
                  cantidadEdicion === null ||
                  !Number.isInteger(cantidadEdicion) ||
                  cantidadEdicion < 1
                "
                @click="GuardarCantidad(item)"
              />
              <Button
                icon="pi pi-times"
                severity="secondary"
                variant="text"
                size="small"
                aria-label="Cancelar edición"
                v-tooltip.bottom="'Cancelar'"
                @click="CancelarEdicion"
              />
            </div>
          </td>
        </tr>
        <tr v-if="props.cantidades.length === 0">
          <td colspan="7" class="px-3 py-4 text-center italic text-muted-color">
            No hay herramientas en esta caja.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
