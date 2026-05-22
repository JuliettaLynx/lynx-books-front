<template>
  <div
    class="min-h-screen bg-white dark:bg-bg-primary-dark transition-colors duration-200"
  >
    <!-- Шапка -->
    <div
      class="sticky top-0 z-20 border-b border-border dark:border-border-dark bg-white dark:bg-bg-secondary-dark text-black dark:text-white shadow-[0_6px_16px_6px_rgba(71,0,102,0.1)] dark:shadow-[0_6px_16px_6px_rgba(0,0,0,0.4)] transition-colors duration-200"
    >
      <div class="p-3">
        <div class="flex justify-between items-center">
          <h1 class="text-xl tracking-wider font-bold dark:text-white">
            Библиотека
          </h1>
          <div class="flex gap-1 text-black dark:text-white">
            <!-- Кнопка сортировки (dropdown) -->
            <div class="relative">
              <IconButton
                icon="🔽"
                variant="primary"
                @click="toggleSortMenu"
                class="text-xl"
              />
              <div
                v-if="sortMenuOpen"
                class="absolute right-0 mt-2 w-56 bg-white dark:bg-bg-secondary-dark rounded-lg shadow-lg border border-border dark:border-border-dark z-30"
              >
                <div class="p-2">
                  <div class="mb-2">
                    <div
                      class="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1"
                    >
                      Название
                    </div>
                    <button
                      @click="setSort('title_asc')"
                      class="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-purple-100 dark:hover:bg-border-dark"
                      :class="{
                        'bg-purple-200 dark:bg-accent/30':
                          currentSort === 'title_asc',
                      }"
                    >
                      По возрастанию (А–Я)
                    </button>
                    <button
                      @click="setSort('title_desc')"
                      class="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-purple-100 dark:hover:bg-border-dark"
                      :class="{
                        'bg-purple-200 dark:bg-accent/30':
                          currentSort === 'title_desc',
                      }"
                    >
                      По убыванию (Я–А)
                    </button>
                  </div>
                  <div class="mb-2">
                    <div
                      class="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1"
                    >
                      Автор
                    </div>
                    <button
                      @click="setSort('author_asc')"
                      class="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-purple-100 dark:hover:bg-border-dark"
                      :class="{
                        'bg-purple-200 dark:bg-accent/30':
                          currentSort === 'author_asc',
                      }"
                    >
                      По возрастанию (А–Я)
                    </button>
                    <button
                      @click="setSort('author_desc')"
                      class="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-purple-100 dark:hover:bg-border-dark"
                      :class="{
                        'bg-purple-200 dark:bg-accent/30':
                          currentSort === 'author_desc',
                      }"
                    >
                      По убыванию (Я–А)
                    </button>
                  </div>
                  <hr class="my-1 border-border dark:border-border-dark" />
                  <button
                    @click="setSort(null)"
                    class="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-purple-100 dark:hover:bg-border-dark"
                  >
                    Без сортировки
                  </button>
                </div>
              </div>
            </div>

            <!-- Кнопка фильтра (dropdown) -->
            <div class="relative">
              <IconButton
                :icon="filterIcon"
                variant="primary"
                @click="toggleFilterMenu"
                class="text-xl"
              />
              <div
                v-if="filterMenuOpen"
                class="absolute right-0 mt-2 w-48 bg-white dark:bg-bg-secondary-dark rounded-lg shadow-lg border border-border dark:border-border-dark z-30"
              >
                <div class="p-2">
                  <button
                    @click="setFilter('all')"
                    class="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-purple-100 dark:hover:bg-border-dark"
                    :class="{
                      'bg-purple-200 dark:bg-accent/30':
                        currentFilter === 'all',
                    }"
                  >
                    📚 Все
                  </button>
                  <button
                    @click="setFilter('favorite')"
                    class="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-purple-100 dark:hover:bg-border-dark"
                    :class="{
                      'bg-purple-200 dark:bg-accent/30':
                        currentFilter === 'favorite',
                    }"
                  >
                    ❤️ Избранные
                  </button>
                  <button
                    @click="setFilter('finished')"
                    class="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-purple-100 dark:hover:bg-border-dark"
                    :class="{
                      'bg-purple-200 dark:bg-accent/30':
                        currentFilter === 'finished',
                    }"
                  >
                    ✅ Прочитано
                  </button>
                  <button
                    @click="setFilter('unfinished')"
                    class="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-purple-100 dark:hover:bg-border-dark"
                    :class="{
                      'bg-purple-200 dark:bg-accent/30':
                        currentFilter === 'unfinished',
                    }"
                  >
                    📖 Не прочитано
                  </button>
                  <button
                    @click="setFilter('abandoned')"
                    class="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-purple-100 dark:hover:bg-border-dark"
                    :class="{
                      'bg-purple-200 dark:bg-accent/30':
                        currentFilter === 'abandoned',
                    }"
                  >
                    ❌ Брошено
                  </button>
                </div>
              </div>
            </div>

            <!-- Иконка профиля -->
            <UserProfile />
          </div>
        </div>

        <!-- Поиск с debounce -->
        <SearchInput
          v-model="searchQuery"
          placeholder="Поиск по названию или автору..."
          class="mt-3"
        />
      </div>
    </div>

    <LoadingSpinner v-if="libraryStore.loading" />

    <div v-if="libraryStore.error" class="p-4 text-center">
      <p class="text-red-500 dark:text-red-400">
        Ошибка: {{ libraryStore.error }}
      </p>
      <button
        @click="libraryStore.loadBooks"
        class="mt-2 rounded-lg bg-accent px-4 py-2 text-white"
      >
        Повторить
      </button>
    </div>

    <!-- Список книг -->
    <div v-else class="p-4">
      <div v-if="filteredBooks.length === 0" class="text-center py-8">
        <p class="text-gray-500 dark:text-gray-400">Книги не найдены</p>
      </div>

      <div
        v-else
        :class="{
          'grid gap-3 grid-cols-2  md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5':
            displayMode === 'grid',
          'grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3':
            displayMode === 'list',
        }"
      >
        <BookCard
          v-for="book in filteredBooks"
          :key="book.id"
          :book="book"
          :is-grid="displayMode === 'list'"
          @edit="openEditModal"
          @favorite="handleToggleFavorite"
          @delete="handleDelete"
        />
      </div>
    </div>

    <!-- Кнопка добавления -->
    <IconButton
      icon="+"
      variant="primary"
      class="fixed bottom-20 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-accent hover:bg-accent/60 text-2xl text-white dark:text-black shadow-lg transition-colors duration-200"
      @click="openModal"
    />

    <!-- Модальное окно -->
    <BookModal
      :is-open="isModalOpen"
      :book-to-edit="editingBook"
      @close="closeModal"
      @save="saveBook"
    />

    <!-- Модалка подтверждения удаления -->
    <DeleteModal
      :is-open="isDeleteModalOpen"
      title="Удалить книгу?"
      :message="`Вы уверены, что хотите удалить книгу «${deletingBook?.title}»?`"
      confirm-text="Удалить"
      danger
      @close="closeDeleteModal"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { useLibraryStore } from "../stores/library";
import { useDisplaySettingsStore } from "../stores/displaySettings";
import SkeletonLoader from "vue3-skeleton-loader";
import IconButton from "../components/IconButton.vue";
import SearchInput from "../components/library/SearchInput.vue";
import BookCard from "../components/library/BookCard.vue";
import BookModal from "../components/library/BookModal.vue";
import DeleteBookModal from "../components/DeleteModal.vue";
import UserProfile from "../components/UserProfile.vue";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import DeleteModal from "../components/DeleteModal.vue";

const libraryStore = useLibraryStore();

const displaySettingsStore = useDisplaySettingsStore();
const displayMode = computed(() => displaySettingsStore.displayMode);

// Состояния для выпадающих меню
const sortMenuOpen = ref(false);
const filterMenuOpen = ref(false);
const currentSort = ref(null); // 'title_asc', 'title_desc', 'author_asc', 'author_desc', null
const currentFilter = ref("all"); // 'all', 'favorite', 'finished', 'unfinished', 'abandoned'

// Поиск
const searchQuery = ref("");
const debouncedSearch = ref("");

// Модалка книги
const isModalOpen = ref(false);
const editingBook = ref(null);

// Модалка удаления
const isDeleteModalOpen = ref(false);
const deletingBook = ref(null);

// Иконка для кнопки фильтра (меняется в зависимости от выбранного фильтра)
const filterIcon = computed(() => {
  switch (currentFilter.value) {
    case "favorite":
      return "❤️";
    case "finished":
      return "✅";
    case "unfinished":
      return "📖";
    case "abandoned":
      return "❌";
    default:
      return "📚";
  }
});

// Загрузка книг при монтировании
onMounted(() => {
  libraryStore.loadBooks();
});

// Методы управления модалкой
const openModal = () => {
  editingBook.value = null;
  isModalOpen.value = true;
};

const openEditModal = (book) => {
  editingBook.value = { ...book };
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  editingBook.value = null;
};

// Методы для модалки удаления
const openDeleteModal = (book) => {
  deletingBook.value = book;
  isDeleteModalOpen.value = true;
};

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false;
  deletingBook.value = null;
};

const confirmDelete = async () => {
  if (deletingBook.value) {
    await libraryStore.deleteBook(deletingBook.value.id);
    closeDeleteModal();
  }
};

// Методы для dropdown
const toggleSortMenu = () => {
  sortMenuOpen.value = !sortMenuOpen.value;
  filterMenuOpen.value = false;
};
const toggleFilterMenu = () => {
  filterMenuOpen.value = !filterMenuOpen.value;
  sortMenuOpen.value = false;
};
const setSort = (value) => {
  currentSort.value = value;
  sortMenuOpen.value = false;
};
const setFilter = (value) => {
  currentFilter.value = value;
  filterMenuOpen.value = false;
};

// Debounce для поиска
const updateDebouncedSearch = useDebounceFn((value) => {
  debouncedSearch.value = value;
}, 300);

watch(searchQuery, (value) => {
  updateDebouncedSearch(value);
});

// Применение фильтра
const filteredByStatus = computed(() => {
  let filtered = [...libraryStore.books];
  switch (currentFilter.value) {
    case "favorite":
      filtered = filtered.filter((book) => book.isFavorite);
      break;
    case "finished":
      filtered = filtered.filter((book) => book.status === "прочитано");
      break;
    case "unfinished":
      filtered = filtered.filter((book) => book.status === "не прочитано");
      break;
    case "abandoned":
      filtered = filtered.filter((book) => book.status === "брошено");
      break;
    default: // 'all'
      break;
  }
  return filtered;
});

// Поиск по названию и автору
const searched = computed(() => {
  if (!debouncedSearch.value) return filteredByStatus.value;
  const query = debouncedSearch.value.toLowerCase();
  return filteredByStatus.value.filter(
    (book) =>
      book.title.toLowerCase().includes(query) ||
      (book.author && book.author.toLowerCase().includes(query)),
  );
});

// Применение сортировки
const filteredBooks = computed(() => {
  const sorted = [...searched.value];
  if (!currentSort.value) return sorted; // без сортировки

  sorted.sort((a, b) => {
    switch (currentSort.value) {
      case "title_asc":
        return (a.title || "").localeCompare(b.title || "");
      case "title_desc":
        return (b.title || "").localeCompare(a.title || "");
      case "author_asc":
        const authorA = a.author || "";
        const authorB = b.author || "";
        return authorA.localeCompare(authorB);
      case "author_desc":
        const authorA2 = a.author || "";
        const authorB2 = b.author || "";
        return authorB2.localeCompare(authorA2);
      default:
        return 0;
    }
  });
  return sorted;
});

// Обработчики действий с книгами
const handleToggleFavorite = async (book) => {
  await libraryStore.toggleFavorite(book);
};

const handleDelete = async (book) => {
  openDeleteModal(book);
};

// Сохранение книги
const saveBook = async (bookData) => {
  if (bookData.id) {
    // Редактирование
    await libraryStore.updateBook(bookData.id, bookData);
  } else {
    // Добавление
    await libraryStore.addBook(bookData);
  }
};
</script>
