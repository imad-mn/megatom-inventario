<script setup lang="ts">
import { useGlobalStore } from "@/servicios/globalStore";
import type { CantidadesConHerramienta } from "@/servicios/modelos";

const props = defineProps<{
  cantidades: CantidadesConHerramienta[];
}>();

const globalStore = useGlobalStore();
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
          <td class="px-3 py-2 text-right">{{ item.cantidad }}</td>
        </tr>
        <tr v-if="props.cantidades.length === 0">
          <td colspan="6" class="px-3 py-4 text-center italic text-muted-color">
            No hay herramientas en esta caja.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
