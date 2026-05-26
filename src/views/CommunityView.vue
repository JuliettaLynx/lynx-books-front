<template>
  <div class="min-h-screen bg-white dark:bg-bg-primary-dark">
    <!-- Шапка -->
    <div
      class="sticky top-0 z-20 border-b border-border dark:border-border-dark bg-white dark:bg-bg-secondary-dark"
    >
      <div class="p-3 flex justify-between items-center">
        <h1 class="text-xl font-bold dark:text-white">Сообщество</h1>
        <div class="flex gap-2">
          <IconButton icon="⚙️" @click="privacyModalOpen = true" />
          <IconButton icon="🔗" @click="shareModalOpen = true" />
          <UserProfile />
        </div>
      </div>
      <div class="p-3 pt-0">
        <SearchInput v-model="searchQuery" placeholder="Поиск подписок..." />
      </div>
    </div>

    <!-- Кнопка добавления пользователя -->
    <IconButton
      icon="+"
      variant="primary"
      @click="addModalOpen = true"
      class="fixed z-20 right-4 bottom-20 w-14 h-14 bg-accent text-white dark:text-black rounded-full shadow-lg hover:bg-accent/60 text-2xl flex items-center justify-center transition-colors duration-200"
    />

    <div v-if="communityStore.loading" class="text-center py-8">
      Загрузка...
    </div>

    <div v-else-if="communityStore.error" class="text-center py-8 text-red-500">
      Ошибка: {{ communityStore.error }}
    </div>

    <div
      v-else-if="filteredSubscriptions.length === 0"
      class="text-center py-8 text-gray-500"
    >
      У вас пока нет подписок. Используйте кнопку "+", чтобы найти друзей.
    </div>

    <div v-else class="p-4 space-y-3">
      <SubscriptionCard
        v-for="sub in subscriptionsWithPreviews"
        :key="sub.userId"
        :subscription="sub"
        :library-books="sub.libraryBooks"
        :wishlist-books="sub.wishlistBooks"
        @unsubscribe="handleUnsubscribe(sub.userId)"
        @open-library="openUserList(sub.userId, 'library')"
        @open-wishlist="openUserList(sub.userId, 'wishlist')"
      />
    </div>

    <!-- Модальные окна -->
    <PrivacyModal v-model="privacyModalOpen" />
    <ShareModal v-model="shareModalOpen" />
    <AddUserModal
      v-model="addModalOpen"
      :initial-token="route.query.share"
      @added="refreshSubscriptions"
    />
    <ExternalListView
      :is-open="externalViewOpen"
      :user-id="externalUserId"
      :list-type="externalListType"
      :user-name="externalUserInfo?.displayName"
      @close="externalViewOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useCommunityStore } from "../stores/community";
import IconButton from "../components/IconButton.vue";
import SearchInput from "../components/library/SearchInput.vue";
import UserProfile from "../components/UserProfile.vue";
import PrivacyModal from "../components/community/PrivacyModal.vue";
import ShareModal from "../components/community/ShareModal.vue";
import AddUserModal from "../components/community/AddUserModal.vue";
import SubscriptionCard from "../components/community/SubscriptionCard.vue";
import ExternalListView from "../components/community/ExternalListView.vue";

const communityStore = useCommunityStore();
const { subscriptions, loading, error } = storeToRefs(communityStore);
const { loadSubscriptions, unsubscribe, subscribe } = communityStore;
const route = useRoute();

const searchQuery = ref("");
const privacyModalOpen = ref(false);
const shareModalOpen = ref(false);
const addModalOpen = ref(false);

const subscriptionPreviews = ref({}); // { userId: { libraryBooks: [], wishlistBooks: [] } }

const externalViewOpen = ref(false);
const externalUserId = ref("");
const externalListType = ref(""); // 'library' или 'wishlist'
const externalItems = ref([]);
const externalUserInfo = ref(null);

// --- Вычисляемые свойства ---
const filteredSubscriptions = computed(() => {
  if (!searchQuery.value) return subscriptions.value;
  const q = searchQuery.value.toLowerCase();
  return subscriptions.value.filter((s) =>
    s.displayName.toLowerCase().includes(q),
  );
});

const subscriptionsWithPreviews = computed(() => {
  return subscriptions.value.map((sub) => ({
    ...sub,
    libraryBooks: subscriptionPreviews.value[sub.userId]?.libraryBooks || [],
    wishlistBooks: subscriptionPreviews.value[sub.userId]?.wishlistBooks || [],
  }));
});

// Загрузка первых 4 книг для списков подписки
const loadPreviews = async () => {
  for (const sub of subscriptions.value) {
    const previews = {};
    if (sub.hasLibraryAccess) {
      try {
        const books = await communityStore.fetchUserLibrary(sub.userId);
        previews.libraryBooks = books.slice(0, 4);
      } catch (err) {
        previews.libraryBooks = [];
      }
    } else {
      previews.libraryBooks = [];
    }
    if (sub.hasWishlistAccess) {
      try {
        const books = await communityStore.fetchUserWishlist(sub.userId);
        previews.wishlistBooks = books.slice(0, 4);
      } catch (err) {
        previews.wishlistBooks = [];
      }
    } else {
      previews.wishlistBooks = [];
    }
    subscriptionPreviews.value[sub.userId] = previews;
  }
};

// Полностью обновляет список подписок и загружает превью книг
const refreshSubscriptions = async () => {
  await loadSubscriptions();
  await loadPreviews();
};

// Открывает модальное окно для просмотра списка (библиотека/вишлист) другого пользователя
const openUserList = (userId, listType) => {
  externalUserId.value = userId;
  externalListType.value = listType;
  const sub = subscriptions.value.find((s) => s.userId === userId);
  externalUserInfo.value = sub ? { displayName: sub.displayName } : null;
  externalViewOpen.value = true;
};

// Проверяет, подписан ли текущий пользователь на данного пользователя
const isSubscribedToUser = (userId) =>
  subscriptions.value.some((s) => s.userId === userId);

// Отписывается от пользователя и обновляет данные
const handleUnsubscribe = async (userId) => {
  await unsubscribe(userId);
  await refreshSubscriptions();
  if (externalViewOpen.value && externalUserId.value === userId)
    externalViewOpen.value = false;
};

// Подписывается на пользователя из внешнего просмотра, обновляет данные и заново открывает его список
const handleSubscribeFromView = async () => {
  await subscribe(externalUserId.value);
  await refreshSubscriptions();
  externalViewOpen.value = false;
  await openUserList(externalUserId.value, externalListType.value);
};

// Отписывается от пользователя из внешнего просмотра и закрывает окно
const handleUnsubscribeFromView = async () => {
  await unsubscribe(externalUserId.value);
  await refreshSubscriptions();
  externalViewOpen.value = false;
};

onMounted(() => {
  if (route.query.share) {
    addModalOpen.value = true;
  }
  communityStore.loadSubscriptions();
});

onMounted(() => {
  refreshSubscriptions();
});
</script>
