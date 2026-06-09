<template>
  <div
    class="min-h-screen bg-white dark:bg-bg-primary-dark flex items-center justify-center p-4 transition-colors duration-200"
  >
    <div class="w-full max-w-md">
      <!-- Шапка -->
      <div
        class="bg-white dark:bg-bg-secondary-dark text-black dark:text-white rounded-t-2xl p-4 border-b border-border dark:border-border-dark"
      >
        <div class="flex justify-between items-center">
          <h1 class="text-2xl tracking-wider font-bold dark:text-white">
            {{ isLoginMode ? "Вход" : "Регистрация" }}
          </h1>
          <ThemeToggle />
        </div>
      </div>

      <!-- Форма -->
      <div
        class="bg-white dark:bg-bg-secondary-dark rounded-b-2xl p-6 shadow-lg"
      >
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div v-if="!isLoginMode" class="space-y-1">
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Имя</label
            >
            <input
              v-model="displayName"
              type="text"
              placeholder="Как к вам обращаться?"
              class="w-full px-4 py-2 bg-white dark:bg-border-dark/40 border border-border dark:border-border-dark rounded-lg dark:text-white transition-colors duration-200"
            />
          </div>

          <div class="space-y-1">
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Email</label
            >
            <input
              v-model="email"
              name="email"
              type="email"
              required
              placeholder="your@email.com"
              autocomplete="email webauthn"
              class="w-full px-4 py-2 bg-white dark:bg-border-dark/40 border border-border dark:border-border-dark rounded-lg dark:text-white transition-colors duration-200"
            />
          </div>

          <div class="space-y-1">
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Пароль</label
            >
            <div class="relative">
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                required
                autocomplete="new-password"
                :placeholder="
                  isLoginMode ? 'Введите пароль' : 'Минимум 6 символов'
                "
                class="w-full px-4 py-2 bg-white dark:bg-border-dark/40 border border-border dark:border-border-dark rounded-lg dark:text-white pr-10"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 z-50"
              >
                {{ showPassword ? "👁️" : "👁️‍🗨️" }}
              </button>
            </div>
          </div>

          <div
            v-if="error"
            class="p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm"
          >
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 bg-accent/80 hover:bg-accent/60 font-medium text-white dark:text-bg-secondary-dark rounded-lg transition-colors disabled:opacity-50"
          >
            <span v-if="!loading">{{
              isLoginMode ? "Войти" : "Зарегистрироваться"
            }}</span>
            <span v-else class="flex items-center justify-center">
              <span class="animate-spin mr-2">⌛</span> Загрузка...
            </span>
          </button>

          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div
                class="w-full border-t border-border dark:border-border-dark"
              ></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span
                class="px-2 bg-white dark:bg-bg-secondary-dark rounded-lg text-gray-500 dark:text-gray-400"
              >
                или
              </span>
            </div>
          </div>

          <!-- Контейнер для Google кнопки с кастомными обводками -->
          <div class="custom-google-btn-wrapper">
            <div id="googleSignInButton" class="w-full"></div>
          </div>

          <!-- Переключение режима -->
          <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
            {{ isLoginMode ? "Нет аккаунта?" : "Уже есть аккаунт?" }}
            <button
              type="button"
              @click="toggleMode"
              class="text-accent hover:underline font-medium ml-1"
            >
              {{ isLoginMode ? "Создать" : "Войти" }}
            </button>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import { useAuthStore } from "../stores/auth";
import ThemeToggle from "../components/ThemeToggle.vue";

const authStore = useAuthStore();
const email = ref("");
const password = ref("");
const displayName = ref("");
const error = ref("");
const isLoginMode = ref(true);
const showPassword = ref(false);
const loading = ref(false);

const handleSubmit = async () => {
  error.value = "";
  loading.value = true;
  try {
    if (isLoginMode.value) {
      await authStore.login(email.value, password.value);
    } else {
      await authStore.register(email.value, password.value, displayName.value);
    }
  } catch (err) {
    error.value = "Неверный email или пароль";
    alert(error.value);
  } finally {
    loading.value = false;
  }
};

const handleCustomButtonClick = () => {
  // Нажимаем на скрытую кнопку Google
  const googleBtn = document.querySelector(".g_id_signin");
  if (googleBtn) {
    googleBtn.click();
  }
};

const handleGoogleCredential = async (credentialResponse) => {
  loading.value = true;
  error.value = "";
  try {
    await authStore.googleLogin(credentialResponse.credential);
  } catch (err) {
    error.value = err.message || "Ошибка входа через Google";
    alert(error.value);
  } finally {
    loading.value = false;
  }
};

const renderGoogleButton = () => {
  if (!window.google) {
    console.error("❌ Google не загружен");
    return;
  }

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.error("❌ VITE_GOOGLE_CLIENT_ID не настроен");
    error.value = "Client ID не настроен";
    return;
  }

  try {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    const buttonContainer = document.getElementById("googleSignInButton");
    if (buttonContainer) {
      window.google.accounts.id.renderButton(buttonContainer, {
        theme: "outline",
        size: "large",
        width: "100%",
        type: "signin",
        text: "signin_with",
        locale: "ru",
      });
      console.log("✅ Google кнопка отрендерена");
    }
  } catch (err) {
    console.error("❌ Ошибка инициализации:", err);
    error.value = "Ошибка Google Sign-In: " + err.message;
  }
};

const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value;
  error.value = "";
};

onMounted(async () => {
  await nextTick();

  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.defer = true;
  script.onload = () => {
    console.log("✅ Google Identity Services загружен");
    setTimeout(renderGoogleButton, 100);
  };
  script.onerror = () => {
    console.error("❌ Не удалось загрузить Google Identity Services");
  };
  document.head.appendChild(script);
});
</script>
