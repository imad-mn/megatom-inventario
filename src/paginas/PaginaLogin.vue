<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { account, Usuario } from '@/servicios/appwrite'

const router = useRouter()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const mensaje = ref('')
const severidad = ref<'info' | 'warn' | 'error' | 'success'>('info')

const iniciarSesion = async () => {
  isLoading.value = true
  try {
    await account.deleteSession({ sessionId: 'current' }).catch(() => null); // Delete the current session if exists
    await account.createEmailPasswordSession({ email: email.value, password: password.value })
    Usuario.value = await account.get();
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
        <div class="text-lg">Iniciar Sesión como Administrador</div>
      </template>
      <template #content>
        <form @submit.prevent="iniciarSesion">
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

          <div class="mb-3">
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
          <Message v-if="mensaje != ''" :severity="severidad" :closable="false" class="mb-4">{{ mensaje }}</Message>
          <Button type="submit" label="Iniciar Sesión" class="w-full" :loading="isLoading" />
        </form>
      </template>
    </Card>
  </div>
</template>
