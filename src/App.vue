<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pb-14">
    <LoadingSpinner v-if="authStore.loading" fullscreen />
    <template v-else>
      <router-view />
      <TabBar v-if="authStore.isAuthenticated && $route.meta.showBottomNav" />
    </template>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useAuthStore } from "./stores/auth";
import TabBar from "./components/TabBar.vue";
import LoadingSpinner from "./components/LoadingSpinner.vue";

const authStore = useAuthStore();

onMounted(() => {
  authStore.fetchUser();
});
</script>
