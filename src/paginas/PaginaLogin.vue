<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/servicios/authStore';

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const mensaje = ref('')
const severidad = ref<'info' | 'warn' | 'error' | 'success'>('info')

const iniciarSesion = async () => {
  isLoading.value = true
  try {
    await authStore.logOut();
    await authStore.logIn(email.value, password.value);
    mensaje.value = 'Sesión iniciada con éxito.'
    severidad.value = 'success'
    router.push('/')
  } catch (error) {
    mensaje.value = error instanceof Error ? error.message : 'Error al iniciar sesión.'
    severidad.value = 'warn'
    console.error(error);
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-center">
    <Card class="shadow-lg w-xs">
      <template #title>
        <div class="text-lg text-center">Iniciar Sesión como Administrador</div>
      </template>
      <template #content>
        <form @submit.prevent="iniciarSesion" class="mt-6">
          <div class="mb-3">
            <label for="email">Email</label>
            <InputText
              id="email"
              v-model="email"
              type="email"
              placeholder="Ingrese su email"
              fluid
              required
            />
          </div>

          <div class="mb-4">
            <label for="password">Contraseña</label>
            <Password
              id="password"
              v-model="password"
              placeholder="Ingrese su contraseña"
              fluid
              required
              toggleMask
              :feedback="false"
            />
          </div>
          <Message v-if="mensaje != ''" :severity="severidad" :closable="false">{{ mensaje }}</Message>
          <Button type="submit" label="Iniciar Sesión" class="w-full mt-3" :loading="isLoading" />
        </form>
      </template>
    </Card>
  </div>
</template>
