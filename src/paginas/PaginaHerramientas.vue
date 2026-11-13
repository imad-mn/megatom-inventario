<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useConfirm } from "primevue/useconfirm";
import DialogoEdicion from "@/componentes/DialogoEdicion.vue";
import EditarQuitar from "@/componentes/EditarQuitar.vue";
import * as TablesDbService from "@/servicios/TablesDbService";
import { useAuthStore } from "@/servicios/authStore";
import { useGlobalStore } from "@/servicios/globalStore";
import { RegistrarHistorial } from "@/servicios/historialService";
import type {
  Caja,
  CantidadHerramienta,
  CantidadesConHerramienta,
  Deposito,
  Estante,
  Galpon,
  Herramienta,
  Nivel,
  Seccion,
} from "@/servicios/modelos";

const confirm = useConfirm();
const globalStore = useGlobalStore();
const usuario = useAuthStore().Usuario;

const filtroTexto = ref("");
const dialogVisible = ref(false);
const itemEdicion = ref<Herramienta>();
const esNuevo = ref(false);
const herramientaUbicacion = ref<Herramienta | null>(null);
const dialogoUbicacionVisible = ref(false);
const cantidadUbicacionEdicionId = ref<string | null>(null);
const cantidadUbicacionEdicion = ref<number | null>(null);
const galponSeleccionado = ref<Galpon | null>(null);
const depositoSeleccionado = ref<Deposito | null>(null);
const estanteSeleccionado = ref<Estante | null>(null);
const nivelSeleccionado = ref<Nivel | null>(null);
const seccionSeleccionada = ref<Seccion | null>(null);
const cajaSeleccionada = ref<Caja | null>(null);
const tipoUbicacion = ref<"estantes" | "depositos">("estantes");
const cantidadInicial = ref(1);

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

const cantidadesUbicacion = computed(() => {
  const herramientaId = herramientaUbicacion.value?.id;
  if (!herramientaId) return [];

  return globalStore
    .ObtenerCantidadesConHerramientas()
    .filter((cantidad) => cantidad.herramientaId === herramientaId)
    .map((cantidad) => ({
      ...cantidad,
      ubicacion: ObtenerUbicacionCaja(cantidad.cajaId),
    }))
    .sort((a, b) => a.ubicacion.localeCompare(b.ubicacion));
});

const fabricantes = computed(() => globalStore.ObtenerLista("fabricantes herramientas"));
const estados = computed(() =>
  globalStore.ObtenerLista("estados").map((estado) => ({
    ...estado,
    nombre: estado.nombre.substring(3),
  })),
);
watch(galponSeleccionado, () => {
  depositoSeleccionado.value = null;
  estanteSeleccionado.value = null;
  nivelSeleccionado.value = null;
  seccionSeleccionada.value = null;
  cajaSeleccionada.value = null;
});

watch(estanteSeleccionado, () => {
  nivelSeleccionado.value = null;
  seccionSeleccionada.value = null;
  cajaSeleccionada.value = null;
});

watch(nivelSeleccionado, () => {
  seccionSeleccionada.value = null;
  cajaSeleccionada.value = null;
});

watch(seccionSeleccionada, () => {
  cajaSeleccionada.value = null;
});

watch(depositoSeleccionado, () => {
  cajaSeleccionada.value = null;
});

watch(tipoUbicacion, () => {
  depositoSeleccionado.value = null;
  estanteSeleccionado.value = null;
  nivelSeleccionado.value = null;
  seccionSeleccionada.value = null;
  cajaSeleccionada.value = null;
});

function Agregar() {
  esNuevo.value = true;
  tipoUbicacion.value = "estantes";
  galponSeleccionado.value = null;
  depositoSeleccionado.value = null;
  estanteSeleccionado.value = null;
  nivelSeleccionado.value = null;
  seccionSeleccionada.value = null;
  cajaSeleccionada.value = null;
  cantidadInicial.value = 1;
  itemEdicion.value = {
    id: "",
    nombre: "",
    detalle: null,
    serial: null,
    fabricanteId: "",
    estadoId: "",
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

function ObtenerUbicacionCaja(cajaId: string): string {
  for (const galpon of globalStore.Galpones) {
    for (const estante of galpon.estantes) {
      for (const nivel of estante.niveles) {
        for (const seccion of nivel.secciones) {
          const caja = seccion.cajas.find((item) => item.id === cajaId);
          if (caja) {
            return `${galpon.nombre} / Estante ${estante.nombre} / Nivel ${nivel.nombre} / Sección ${seccion.nombre} / Caja ${caja.nombre}`;
          }
        }
      }
    }

    for (const deposito of galpon.depositos ?? []) {
      const caja = deposito.cajas.find((item) => item.id === cajaId);
      if (caja) return `${galpon.nombre} / Depósito ${deposito.nombre} / Caja ${caja.nombre}`;
    }
  }

  return "Ubicación no encontrada.";
}

async function Guardar() {
  if (!itemEdicion.value) return;

  const herramienta = itemEdicion.value;
  herramienta.nombre = herramienta.nombre.trim();

  if (esNuevo.value) {
    await TablesDbService.Crear(TablesDbService.Coleccion.Herramientas, herramienta);
    await RegistrarHistorial(herramienta.id, "[Herramienta] Creada", null, Describir(herramienta));
    globalStore.Herramientas.push({ ...herramienta });

    if (cajaSeleccionada.value && cantidadInicial.value > 0) {
      const cantidad: CantidadHerramienta = {
        id: "",
        herramientaId: herramienta.id,
        cajaId: cajaSeleccionada.value.id,
        cantidad: cantidadInicial.value,
      };
      await TablesDbService.Crear(TablesDbService.Coleccion.CantidadHerramientas, cantidad);
      await RegistrarHistorial(
        herramienta.id,
        "[Herramienta] Agregada a caja",
        null,
        `'${herramienta.nombre}' agregada a Caja ${cajaSeleccionada.value.nombre} (${cantidadInicial.value} unidades)`,
      );
      globalStore.CantidadHerramientas.push(cantidad);
    }
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
    message: `¿Estás seguro de eliminar esta herramienta: "${item.nombre}"?`,
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
      if (herramientaUbicacion.value?.id === item.id) {
        herramientaUbicacion.value = null;
        dialogoUbicacionVisible.value = false;
      }
    },
  });
}

function VerUbicacion(item: Herramienta) {
  CancelarEdicionCantidadUbicacion();
  herramientaUbicacion.value = item;
  dialogoUbicacionVisible.value = true;
}

function EditarCantidadUbicacion(item: CantidadesConHerramienta) {
  cantidadUbicacionEdicionId.value = item.id;
  cantidadUbicacionEdicion.value = item.cantidad;
}

function CancelarEdicionCantidadUbicacion() {
  cantidadUbicacionEdicionId.value = null;
  cantidadUbicacionEdicion.value = null;
}

async function GuardarCantidadUbicacion(item: CantidadesConHerramienta & { ubicacion: string }) {
  const cantidad = cantidadUbicacionEdicion.value;
  if (cantidad === null || !Number.isInteger(cantidad) || cantidad < 1) return;

  if (cantidad === item.cantidad) {
    CancelarEdicionCantidadUbicacion();
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
    `${item.herramienta.nombre} en ${item.ubicacion}: ${item.cantidad} unidades`,
    `${item.herramienta.nombre} en ${item.ubicacion}: ${cantidad} unidades`,
  );
  CancelarEdicionCantidadUbicacion();
}

function QuitarCantidadUbicacion(item: CantidadesConHerramienta & { ubicacion: string }) {
  confirm.require({
    header: "Eliminar",
    message: `¿Estás seguro de quitar "${item.herramienta.nombre}" de ${item.ubicacion}?`,
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
        `${item.herramienta.nombre} en ${item.ubicacion}: ${item.cantidad} unidades`,
        null,
      );
      if (cantidadUbicacionEdicionId.value === item.id) CancelarEdicionCantidadUbicacion();
    },
  });
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
          <th class="px-3 py-2 font-semibold">Ubicación</th>
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
              <Button
                icon="pi pi-map-marker"
                severity="secondary"
                variant="text"
                label="Ver Ubicación"
                v-tooltip.bottom="'Ver ubicación'"
                :aria-label="`Ver ubicación de ${item.nombre}`"
                @click="VerUbicacion(item)"
              />
            </td>
            <td class="px-3 py-2">
              <div class="flex items-center justify-center">
                <EditarQuitar
                  @editar-click="Editar(item)"
                  @quitar-click="Quitar(item)"
                  :id-elemento="item.id"
                  :nombre-elemento="item.nombre"
                />
              </div>
            </td>
          </tr>
        </template>
        <tr v-if="herramientasFiltradas.length === 0">
          <td colspan="7" class="px-3 py-4 text-center italic text-muted-color">
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
    :desabilitarAceptar="!itemEdicion?.nombre?.trim() || (esNuevo && !itemEdicion.fabricanteId)"
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
      <div v-if="esNuevo" class="flex flex-col gap-3">
        <b>Ubicación</b>
        <FloatLabel variant="on">
          <Select
            v-model="galponSeleccionado"
            :options="globalStore.Galpones"
            optionLabel="nombre"
            showClear
            class="w-full"
          />
          <label>Área</label>
        </FloatLabel>
        <div class="flex flex-wrap gap-4">
          <label class="flex items-center gap-2">
            <input v-model="tipoUbicacion" type="radio" name="tipoUbicacion" value="estantes" />
            Estantes
          </label>
          <label class="flex items-center gap-2">
            <input v-model="tipoUbicacion" type="radio" name="tipoUbicacion" value="depositos" />
            Depósitos
          </label>
        </div>
        <template v-if="tipoUbicacion === 'estantes'">
          <FloatLabel variant="on">
            <Select
              v-model="estanteSeleccionado"
              :options="galponSeleccionado?.estantes"
              optionLabel="nombre"
              showClear
              class="w-full"
              :disabled="!galponSeleccionado"
            />
            <label>Estante</label>
          </FloatLabel>
          <FloatLabel variant="on">
            <Select
              v-model="nivelSeleccionado"
              :options="estanteSeleccionado?.niveles"
              optionLabel="nombre"
              showClear
              class="w-full"
              :disabled="!estanteSeleccionado"
            />
            <label>Nivel</label>
          </FloatLabel>
          <FloatLabel variant="on">
            <Select
              v-model="seccionSeleccionada"
              :options="nivelSeleccionado?.secciones"
              optionLabel="nombre"
              showClear
              class="w-full"
              :disabled="!nivelSeleccionado"
            />
            <label>Sección</label>
          </FloatLabel>
          <FloatLabel variant="on">
            <Select
              v-model="cajaSeleccionada"
              :options="seccionSeleccionada?.cajas"
              optionLabel="nombre"
              showClear
              class="w-full"
              :disabled="!seccionSeleccionada"
            />
            <label>Caja</label>
          </FloatLabel>
        </template>
        <template v-else>
          <FloatLabel variant="on">
            <Select
              v-model="depositoSeleccionado"
              :options="galponSeleccionado?.depositos"
              optionLabel="nombre"
              showClear
              class="w-full"
              :disabled="!galponSeleccionado"
            />
            <label>Depósito</label>
          </FloatLabel>
          <FloatLabel variant="on">
            <Select
              v-model="cajaSeleccionada"
              :options="depositoSeleccionado?.cajas"
              optionLabel="nombre"
              showClear
              class="w-full"
              :disabled="!depositoSeleccionado"
            />
            <label>Caja</label>
          </FloatLabel>
        </template>
        <FloatLabel variant="on">
          <InputNumber
            v-model="cantidadInicial"
            :minFractionDigits="0"
            :maxFractionDigits="0"
            :min="1"
            class="w-full"
            :disabled="!cajaSeleccionada"
          />
          <label>Cantidad</label>
        </FloatLabel>
      </div>
    </div>
  </DialogoEdicion>

  <Dialog
    v-model:visible="dialogoUbicacionVisible"
    :header="`Ubicaciones de ${herramientaUbicacion?.nombre ?? ''}`"
    :modal="true"
    class="md:w-3xl"
    @hide="CancelarEdicionCantidadUbicacion"
  >
    <div class="w-full overflow-x-auto">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr
            class="border-b border-surface-300 dark:border-surface-700 bg-surface-100 dark:bg-surface-800"
          >
            <th class="px-3 py-2 font-semibold">Ubicación</th>
            <th class="px-3 py-2 text-right font-semibold">Cantidad</th>
            <th class="px-3 py-2 font-semibold"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in cantidadesUbicacion"
            :key="item.id"
            class="border-b border-surface-200 last:border-0 dark:border-surface-800"
          >
            <td class="px-3 py-2">{{ item.ubicacion }}</td>
            <td class="px-3 py-2 text-right">
              <InputNumber
                v-if="cantidadUbicacionEdicionId === item.id"
                :inputId="`cantidadUbicacion-${item.id}`"
                v-model="cantidadUbicacionEdicion"
                :min="1"
                :maxFractionDigits="0"
                :useGrouping="false"
                inputClass="w-20 text-right"
                @keyup.enter="GuardarCantidadUbicacion(item)"
              />
              <div v-else>{{ item.cantidad }}</div>
            </td>
            <td class="px-3 py-2">
              <EditarQuitar
                v-if="cantidadUbicacionEdicionId !== item.id"
                tamaño="small"
                :id-elemento="item.herramientaId"
                :nombre-elemento="item.herramienta.nombre"
                @editar-click="EditarCantidadUbicacion(item)"
                @quitar-click="QuitarCantidadUbicacion(item)"
                :ocultar-historial="true"
              />
              <div v-else class="flex items-center justify-center">
                <Button
                  icon="pi pi-save"
                  severity="primary"
                  variant="text"
                  size="small"
                  aria-label="Guardar cantidad"
                  v-tooltip.bottom="'Guardar'"
                  :disabled="
                    cantidadUbicacionEdicion === null ||
                    !Number.isInteger(cantidadUbicacionEdicion) ||
                    cantidadUbicacionEdicion < 1
                  "
                  @click="GuardarCantidadUbicacion(item)"
                />
                <Button
                  icon="pi pi-times"
                  severity="secondary"
                  variant="text"
                  size="small"
                  aria-label="Cancelar edición"
                  v-tooltip.bottom="'Cancelar'"
                  @click="CancelarEdicionCantidadUbicacion"
                />
              </div>
            </td>
          </tr>
          <tr v-if="cantidadesUbicacion.length === 0">
            <td colspan="3" class="px-3 py-4 text-center italic text-muted-color">
              No hay ubicaciones registradas.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </Dialog>
</template>
