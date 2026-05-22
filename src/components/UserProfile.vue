<template>
  <div class="relative" ref="menuContainer">
    <!-- Иконка профиля -->
    <button
      @click.stop="toggleMenu"
      class="w-10 h-10 rounded-full bg-green-300 flex items-center justify-center text-black font-bold text-lg transition-all overflow-hidden"
      :class="{ 'ring-2 ring-accent': isOpen }"
    >
      <img
        v-if="authStore.user?.avatar"
        :src="authStore.user.avatar"
        alt="avatar"
        class="w-full h-full object-cover"
      />
      <span v-else>
        {{
          authStore.user?.displayName?.charAt(0) ||
          authStore.user?.email?.charAt(0) ||
          "?"
        }}
      </span>
    </button>

    <!-- Выпадающее меню -->
    <div
      v-if="isOpen"
      class="absolute z-50 right-0 top-12 w-80 bg-white dark:bg-bg-secondary-dark rounded-2xl shadow-xl border border-border dark:border-border-dark text-black dark:text-white overflow-hidden"
    >
      <!-- Шапка профиля -->
      <div
        class="p-4 bg-purple-100 dark:bg-border-dark border-b border-border dark:border-border-dark"
      >
        <button
          @click.stop="openSection('profile')"
          class="rounded-lg w-full flex transition-colors"
        >
          <div
            class="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold overflow-hidden"
          >
            <img
              v-if="authStore.user?.avatar"
              :src="authStore.user.avatar"
              class="w-full h-full object-cover"
            />
            <span v-else>{{
              authStore.user?.displayName?.charAt(0) ||
              authStore.user?.email?.charAt(0) ||
              "?"
            }}</span>
          </div>

          <div class="flex-1 text-left ml-3">
            <p class="font-bold truncate">
              {{ authStore.user?.displayName || "Пользователь" }}
            </p>
            <p class="text-sm truncate">{{ authStore.user?.email }}</p>
          </div>

          <div class="w-8 text-xl">✎</div>
        </button>
      </div>

      <!-- Дневная цель -->
      <div class="p-4 border-b border-border dark:border-border-dark">
        <div class="flex justify-between items-center">
          <span>Цель на день:</span>
          <button
            @click.stop="openSection('goal')"
            class="font-bold text-accent"
          >
            {{ dailyGoal || 0 }} стр.
          </button>
        </div>
      </div>

      <!-- Настройки темы -->
      <div class="p-4 border-b border-border dark:border-border-dark">
        <p class="mb-3">Оформление:</p>
        <div class="grid grid-cols-3 gap-2">
          <button
            @click="setTheme('light')"
            class="flex flex-col items-center p-2 rounded-lg"
            :class="
              colorMode === 'light'
                ? 'bg-accent/10 ring-2 ring-accent/50'
                : 'hover:bg-border/50 dark:hover:bg-border-dark/40'
            "
          >
            <span class="text-2xl mb-1">☀️</span>
            <span class="text-xs dark:text-gray-300">Светлая</span>
          </button>

          <button
            @click="setTheme('dark')"
            class="flex flex-col items-center p-2 rounded-lg"
            :class="
              colorMode === 'dark'
                ? 'bg-accent/10 ring-2 ring-accent/50'
                : 'hover:bg-border/50 dark:hover:bg-border-dark/40'
            "
          >
            <span class="text-2xl mb-1">🌙</span>
            <span class="text-xs dark:text-gray-300">Тёмная</span>
          </button>

          <button
            @click="setTheme('auto')"
            class="flex flex-col items-center p-2 rounded-lg"
            :class="
              colorMode === 'auto'
                ? 'bg-accent/10 ring-2 ring-accent/50'
                : 'hover:bg-border/50 dark:hover:bg-border-dark/40'
            "
          >
            <span class="text-2xl mb-1">⚙️</span>
            <span class="text-xs dark:text-gray-300">Системная</span>
          </button>
        </div>
      </div>

      <!-- Настройки отображения -->
      <div class="p-4 border-b border-border dark:border-border-dark">
        <p class="mb-3">Вид карточек:</p>
        <div class="flex gap-2">
          <button
            @click="setDisplayMode('grid')"
            class="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg"
            :class="
              displayMode === 'grid'
                ? 'bg-accent/10 ring-2 ring-accent/50'
                : 'hover:bg-border/50 dark:hover:bg-border-dark/40'
            "
          >
            <span>⊞</span>
            <span class="text-sm">Сетка</span>
          </button>
          <button
            @click="setDisplayMode('list')"
            class="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg"
            :class="
              displayMode === 'list'
                ? 'bg-accent/10 ring-2 ring-accent/50'
                : 'hover:bg-border/50 dark:hover:bg-border-dark/40'
            "
          >
            <span>☰</span>
            <span class="text-sm">Список</span>
          </button>
        </div>
      </div>

      <!-- Сменить пароль -->
      <div class="p-2 border-b border-border dark:border-border-dark">
        <button
          @click.stop="openSection('password')"
          class="w-full px-4 py-2 text-left hover:bg-border/50 dark:hover:bg-border-dark/40 rounded-lg flex items-center gap-3"
        >
          <span class="flex-1 text-base">Сменить пароль</span>
        </button>
      </div>

      <!-- Выход и удаление аккаунта -->
      <div class="p-2">
        <button
          @click="openLogoutModal"
          class="w-full px-4 py-2 text-left hover:bg-border/50 dark:hover:bg-border-dark/40 rounded-lg text-red-600 dark:text-red-400"
        >
          Выйти
        </button>
        <button
          @click="openDeleteAccountModal"
          class="w-full px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400"
        >
          Удалить аккаунт
        </button>

        <DeleteModal
          :is-open="isLogoutModalOpen"
          title="Выход из системы"
          message="Вы действительно хотите выйти?"
          confirm-text="Выйти"
          :danger="false"
          @close="closeLogoutModal"
          @confirm="confirmLogout"
        />

        <DeleteModal
          :is-open="isDeleteAccountModalOpen"
          title="Удалить аккаунт?"
          message="Вы уверены? Это действие нельзя отменить. Все ваши данные будут удалены."
          confirm-text="Удалить навсегда"
          danger
          @close="closeDeleteAccountModal"
          @confirm="handleDeleteAccount"
        />
      </div>
    </div>

    <!-- Модальное окно редактирования -->
    <Teleport to="body">
      <div
        v-if="activeSection"
        class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
      >
        <div
          class="bg-white dark:bg-bg-secondary-dark w-full max-w-md rounded-2xl max-h-[90vh] flex flex-col"
        >
          <!-- Заголовок модалки -->
          <div
            class="p-4 border-b border-border dark:border-border-dark flex justify-between items-center"
          >
            <h2 class="text-xl font-bold dark:text-white">{{ modalTitle }}</h2>
            <button
              @click="closeSection"
              class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <span class="text-2xl">✕</span>
            </button>
          </div>

          <!-- Контент модалки -->
          <div class="flex-1 overflow-y-auto p-4">
            <!-- Редактирование профиля -->
            <div v-if="activeSection === 'profile'" class="space-y-4">
              <div class="flex justify-center">
                <AvatarUploader
                  :avatar-preview="avatarPreview"
                  :avatar-file="avatarFile"
                  :original-image="originalAvatar"
                  :user-id="authStore.user?.id"
                  :display-name="editDisplayName"
                  :email="authStore.user?.email"
                  @update:avatar-preview="handleAvatarPreviewUpdate"
                  @update:avatar-file="avatarFile = $event"
                  @update:original-image="originalAvatar = $event"
                  @remove="handleAvatarRemove"
                />
              </div>

              <div class="space-y-2">
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Имя</label
                >
                <input
                  v-model="editDisplayName"
                  type="text"
                  class="w-full px-4 py-2 dark:bg-border-dark/40 border border-border dark:border-border-dark rounded-lg focus:ring-2 focus:ring-accent dark:text-white"
                />
              </div>
            </div>

            <!-- Изменение цели -->
            <div v-if="activeSection === 'goal'" class="space-y-4">
              <div class="space-y-2">
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Дневная цель (страниц)</label
                >

                <input
                  v-model.number="editDailyGoal"
                  type="number"
                  min="1"
                  class="w-full px-4 py-2 dark:bg-border-dark/40 border border-border dark:border-border-dark rounded-lg focus:ring-2 focus:ring-accent dark:text-white"
                />
              </div>
            </div>

            <!-- Смена пароля -->
            <div v-if="activeSection === 'password'" class="space-y-4">
              <div class="space-y-2">
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Текущий пароль</label
                >
                <input
                  v-model="passwordData.current"
                  type="password"
                  autocomplete="off"
                  class="w-full px-4 py-2 dark:bg-border-dark/40 border border-border dark:border-border-dark rounded-lg dark:text-white"
                />
              </div>

              <div class="space-y-2">
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Новый пароль</label
                >
                <input
                  v-model="passwordData.new"
                  type="password"
                  class="w-full px-4 py-2 dark:bg-border-dark/40 border border-border dark:border-border-dark rounded-lg dark:text-white"
                />
              </div>

              <div class="space-y-2">
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Подтверждение</label
                >
                <input
                  v-model="passwordData.confirm"
                  type="password"
                  class="w-full px-4 py-2 dark:bg-border-dark/40 border border-border dark:border-border-dark rounded-lg dark:text-white"
                />
              </div>
            </div>

            <!-- Сообщения -->
            <div
              v-if="sectionError"
              class="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg text-sm"
            >
              {{ sectionError }}
            </div>
            <div
              v-if="sectionSuccess"
              class="mt-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg text-sm"
            >
              {{ sectionSuccess }}
            </div>
          </div>

          <!-- Кнопки действий -->
          <div
            class="p-4 border-t border-border dark:border-border-dark flex gap-2"
          >
            <button
              @click="closeSection"
              class="flex-1 px-4 py-2 dark:bg-border-dark/40 text-black dark:text-white rounded-lg border border-border dark:border-border-dark hover:bg-border-dark/20 dark:hover:bg-border-dark"
            >
              Отмена
            </button>
            <button
              @click="saveSection"
              :disabled="sectionLoading"
              class="flex-1 px-4 py-2 bg-accent/60 hover:bg-accent/80 text-black dark:text-white rounded-lg disabled:opacity-50"
            >
              <span v-if="!sectionLoading">Сохранить</span>
              <span v-else class="flex items-center justify-center"
                ><span class="animate-spin mr-2">⌛</span> Сохранение...</span
              >
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useColorMode } from "@vueuse/core";
import { useAuthStore } from "../stores/auth";
import { useDisplaySettingsStore } from "../stores/displaySettings";
import AvatarUploader from "./AvatarUploader.vue";
import DeleteModal from "./DeleteModal.vue";

const router = useRouter();
const authStore = useAuthStore();
const colorMode = useColorMode({
  emitAuto: true,
  modes: { light: "light", dark: "dark", auto: "auto" },
});

const displaySettingsStore = useDisplaySettingsStore();
const displayMode = computed(() => displaySettingsStore.displayMode);

const setDisplayMode = (mode) => {
  displaySettingsStore.setDisplayMode(mode);
};

// UI состояние
const isOpen = ref(false);
const activeSection = ref(null);
const menuContainer = ref(null);
const sectionLoading = ref(false);
const sectionError = ref("");
const sectionSuccess = ref("");

const isDeleteAccountModalOpen = ref(false);
const isLogoutModalOpen = ref(false);

// Данные форм
const editDisplayName = ref("");
const avatarPreview = ref(null);
const avatarFile = ref(null);
const originalAvatar = ref(null);
const editDailyGoal = ref(50);
const passwordData = ref({ current: "", new: "", confirm: "" });
const hasAvatarChanged = ref(false);

// Вычисляемые
const dailyGoal = computed(() => authStore.user?.dailyGoal || 50);

const modalTitle = computed(() => {
  switch (activeSection.value) {
    case "profile":
      return "Редактировать профиль";
    case "goal":
      return "Изменить цель";
    case "password":
      return "Сменить пароль";
    default:
      return "";
  }
});

// Загрузка данных пользователя в форму
const loadUserData = () => {
  if (authStore.user) {
    editDisplayName.value = authStore.user.displayName || "";
    avatarPreview.value = authStore.user.avatar || null;
    originalAvatar.value = authStore.user.originalAvatar || null;
    editDailyGoal.value = authStore.user.dailyGoal || 50;
  }
};

watch(() => authStore.user, loadUserData, { immediate: true });

// Обработчики AvatarUploader
const handleAvatarPreviewUpdate = (newPreview) => {
  avatarPreview.value = newPreview;
  hasAvatarChanged.value = true;
};

const handleAvatarRemove = () => {
  avatarPreview.value = null;
  avatarFile.value = null;
  originalAvatar.value = null;
  hasAvatarChanged.value = true;
};

// Открытие секции
const openSection = (section) => {
  activeSection.value = section;
  isOpen.value = false;
  hasAvatarChanged.value = false;
  sectionError.value = "";
  sectionSuccess.value = "";
  if (section === "profile") {
    editDisplayName.value = authStore.user?.displayName || "";
    avatarPreview.value = authStore.user?.avatar || null;
    originalAvatar.value = authStore.user?.originalAvatar || null;
  } else if (section === "goal") {
    editDailyGoal.value = authStore.user?.dailyGoal || 50;
  } else if (section === "password") {
    passwordData.value = { current: "", new: "", confirm: "" };
  }
};

const closeSection = () => {
  activeSection.value = null;
  hasAvatarChanged.value = false;
};

// Сохранение
const saveSection = async () => {
  sectionLoading.value = true;
  sectionError.value = "";
  sectionSuccess.value = "";
  try {
    switch (activeSection.value) {
      case "profile": {
        if (editDisplayName.value !== authStore.user?.displayName) {
          await authStore.updateProfile({ displayName: editDisplayName.value });
        }
        if (hasAvatarChanged.value) {
          if (avatarPreview.value) {
            await authStore.updateAvatar(
              avatarPreview.value,
              originalAvatar.value,
            );
          } else {
            await authStore.updateAvatar(null, null);
          }
        }
        sectionSuccess.value = "Профиль обновлён";
        break;
      }
      case "goal": {
        await authStore.setDailyGoal(editDailyGoal.value);
        sectionSuccess.value = "Цель обновлена";
        break;
      }
      case "password": {
        if (passwordData.value.new !== passwordData.value.confirm) {
          throw new Error("Пароли не совпадают");
        }
        if (passwordData.value.new.length < 6) {
          throw new Error("Пароль должен быть минимум 6 символов");
        }
        await authStore.changePassword(
          passwordData.value.current,
          passwordData.value.new,
        );
        sectionSuccess.value = "Пароль изменён";
        passwordData.value = { current: "", new: "", confirm: "" };
        break;
      }
    }
    setTimeout(() => closeSection(), 1000);
  } catch (error) {
    console.error("Save error:", error);
    sectionError.value = error.message || "Ошибка сохранения";
  } finally {
    sectionLoading.value = false;
  }
};

// Выход
const handleLogout = async () => {
  authStore.logout();
};

// Модалка выхода из аккаунта
const openLogoutModal = () => {
  isLogoutModalOpen.value = true;
};

const closeLogoutModal = () => {
  isLogoutModalOpen.value = false;
};

const confirmLogout = () => {
  authStore.logout();
  closeLogoutModal();
};

// Модалка удаления аккаунта
const openDeleteAccountModal = () => {
  isDeleteAccountModalOpen.value = true;
};

const closeDeleteAccountModal = () => {
  isDeleteAccountModalOpen.value = false;
};

const handleDeleteAccount = async () => {
  try {
    await authStore.deleteAccount();
    closeDeleteAccountModal();
  } catch (err) {
    alert("Ошибка при удалении аккаунта");
  }
};

// Тема
const setTheme = (theme) => {
  colorMode.value = theme;
  isOpen.value = false;
};

// Закрытие меню по клику вне
const handleClickOutside = (event) => {
  if (menuContainer.value && !menuContainer.value.contains(event.target)) {
    isOpen.value = false;
  }
};
const toggleMenu = () => {
  isOpen.value = !isOpen.value;
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});
onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>
