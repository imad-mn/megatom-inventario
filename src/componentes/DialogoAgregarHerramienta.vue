<script setup lang="ts">
import { computed, ref, watch } from "vue";
import DialogoEdicion from "@/componentes/DialogoEdicion.vue";
import * as TablesDbService from "@/servicios/TablesDbService";
import { useGlobalStore } from "@/servicios/globalStore";
import { RegistrarHistorial } from "@/servicios/historialService";
import type { Caja, CantidadHerramienta, Herramienta } from "@/servicios/modelos";

const props = defineProps<{
  caja: Caja | null;
}>();

const mostrar = defineModel<boolean>("mostrar", { required: true });
const globalStore = useGlobalStore();
const fabricanteId = ref<string | null>(null);
const herramienta = ref<Herramienta | null>(null);
const cantidad = ref<number | null>(1);

const fabricantes = computed(() => globalStore.ObtenerLista("fabricantes herramientas"));
const herramientas = computed(() =>
  fabricanteId.value
    ? globalStore.Herramientas.filter(
        (herramienta) => herramienta.fabricanteId === fabricanteId.value,
      ).sort((a, b) => a.nombre.localeCompare(b.nombre))
    : [],
);
const deshabilitarAceptar = computed(
  () =>
    !props.caja ||
    !fabricanteId.value ||
    !herramienta.value ||
    cantidad.value === null ||
    cantidad.value < 1,
);

watch(fabricanteId, () => {
  herramienta.value = null;
});

watch(mostrar, (visible) => {
  if (visible) {
    fabricanteId.value = null;
    herramienta.value = null;
    cantidad.value = 1;
  }
});

async function Guardar() {
  const caja = props.caja;
  const cantidadIngresada = cantidad.value;
  if (!caja || !herramienta.value || !cantidadIngresada || cantidadIngresada < 1) return;

  const existente = globalStore.CantidadHerramientas.find(
    (item) => item.cajaId === caja.id && item.herramientaId === herramienta.value!.id,
  );
  const cantidadAnterior = existente?.cantidad ?? 0;
  const cantidadActualizada: CantidadHerramienta = existente
    ? { ...existente, cantidad: existente.cantidad + cantidadIngresada }
    : {
        id: "",
        cajaId: caja.id,
        herramientaId: herramienta.value.id,
        cantidad: cantidadIngresada,
      };

  if (existente) {
    await TablesDbService.Actualizar(
      TablesDbService.Coleccion.CantidadHerramientas,
      cantidadActualizada,
    );
    const indice = globalStore.CantidadHerramientas.findIndex((item) => item.id === existente.id);
    if (indice >= 0) globalStore.CantidadHerramientas[indice] = cantidadActualizada;
    else globalStore.CantidadHerramientas.push(cantidadActualizada);
  } else {
    await TablesDbService.Crear(
      TablesDbService.Coleccion.CantidadHerramientas,
      cantidadActualizada,
    );
    globalStore.CantidadHerramientas.push(cantidadActualizada);
  }

  await RegistrarHistorial(
    herramienta.value.id,
    existente ? "[Herramienta] Cantidad en caja modificada" : "[Herramienta] Agregada a caja",
    existente
      ? `${herramienta.value.nombre} en Caja ${caja.nombre}: ${cantidadAnterior} unidades`
      : null,
    `${herramienta.value.nombre} en Caja ${caja.nombre}: ${cantidadActualizada.cantidad} unidades`,
  );
  mostrar.value = false;
}
</script>

<template>
  <DialogoEdicion
    v-model:mostrar="mostrar"
    esAgregar
    :clickAceptar="Guardar"
    nombre-objeto="Herramienta a Caja"
    :desabilitarAceptar="deshabilitarAceptar"
    class="w-md"
  >
    <div class="flex flex-col gap-3 pt-1">
      <FloatLabel variant="on">
        <Select
          id="fabricanteHerramientaCaja"
          v-model="fabricanteId"
          :options="fabricantes"
          optionValue="id"
          optionLabel="nombre"
          class="w-full"
          filter
        />
        <label for="fabricanteHerramientaCaja">Fabricante</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <Select
          id="herramientaCaja"
          v-model="herramienta"
          :options="herramientas"
          :optionLabel="
            (data: Herramienta) =>
              `${data.nombre} - ${data.serial} (${globalStore.ListasMap[data.estadoId]?.substring(3)})`
          "
          class="w-full"
          :disabled="!fabricanteId"
          filter
        />
        <label for="herramientaCaja">Herramienta</label>
      </FloatLabel>
      <div v-if="herramienta"><b>Detalle:</b> {{ herramienta?.detalle }}</div>
      <FloatLabel variant="on">
        <InputNumber
          id="cantidadHerramientaCaja"
          v-model="cantidad"
          class="w-full"
          :min="1"
          :maxFractionDigits="0"
          :useGrouping="false"
        />
        <label for="cantidadHerramientaCaja">Cantidad</label>
      </FloatLabel>
    </div>
  </DialogoEdicion>
</template>
