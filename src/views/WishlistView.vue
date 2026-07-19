<template>
  <div
    class="min-h-screen bg-white dark:bg-bg-primary-dark transition-colors duration-200"
  >
    <!-- Шапка (без изменений) -->
    <div
      class="sticky top-0 z-20 border-b border-border dark:border-border-dark bg-white dark:bg-bg-secondary-dark text-black dark:text-white shadow-[0_6px_16px_6px_rgba(71,0,102,0.1)] dark:shadow-[0_6px_16px_6px_rgba(0,0,0,0.4)]"
    >
      <div class="p-3">
        <div class="flex justify-between items-center">
          <h1 class="text-xl tracking-wider font-bold">Вишлист</h1>
          <div class="flex gap-1">
            <!-- Сортировка -->
            <div class="relative">
              <span ref="sortButtonRef">
                <IconButton
                  icon="🔽"
                  variant="primary"
                  @click="toggleSortMenu"
                  class="text-xl"
                />
              </span>
              <div
                v-if="sortMenuOpen"
                ref="sortMenuRef"
                class="absolute right-0 mt-2 w-56 bg-white dark:bg-bg-secondary-dark rounded-lg shadow-lg border border-border dark:border-border-dark z-30"
              >
                <div class="p-2">
                  <div
                    v-for="category in sortCategories"
                    :key="category.key"
                    class="mb-2"
                  >
                    <div
                      class="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1"
                    >
                      {{ category.label }}
                    </div>
                    <button
                      v-for="option in category.options"
                      :key="option.value"
                      @click="setSort(option.value)"
                      class="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-purple-100 dark:hover:bg-border-dark"
                      :class="{
                        'bg-purple-200 dark:bg-accent/30':
                          currentSort === option.value,
                      }"
                    >
                      {{ option.label }}
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

            <UserProfile />
          </div>
        </div>
        <SearchInput
          v-model="searchQuery"
          placeholder="Поиск по названию или автору..."
          class="mt-3"
        />
      </div>
    </div>

    <div class="p-4">
      <LoadingSpinner v-if="wishlistStore.loading" />

      <div v-if="error" class="p-4 text-center">
        <p class="text-red-500">Ошибка: {{ error }}</p>
        <button
          @click="loadData"
          class="mt-2 rounded-lg bg-accent px-4 py-2 text-white"
        >
          Повторить
        </button>
      </div>

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
          <WishlistCard
            v-for="book in filteredBooks"
            :key="book.id"
            :book="book"
            :is-grid="displayMode === 'list'"
            @edit="openEditModal"
            @delete="openDeleteModal"
            @updatePriority="handleUpdatePriority"
          />
        </div>
      </div>
    </div>

    <IconButton
      icon="+"
      variant="primary"
      class="fixed bottom-20 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-accent hover:bg-accent/60 text-2xl text-white dark:text-black shadow-lg transition-colors duration-200"
      @click="openAddModal"
    />

    <WishlistModal
      :is-open="isModalOpen"
      :book-to-edit="editingBook"
      @close="closeModal"
      @save="saveBook"
    />
    <DeleteWishlistModal
      :is-open="isDeleteModalOpen"
      :book-id="deletingBookId"
      @close="closeDeleteModal"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useDebounceFn, onClickOutside } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { useWishlistStore } from "../stores/wishlist";
import { useDisplaySettingsStore } from "../stores/displaySettings";
import IconButton from "../components/IconButton.vue";
import SearchInput from "../components/library/SearchInput.vue";
import UserProfile from "../components/UserProfile.vue";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import WishlistCard from "../components/wishlist/WishlistCard.vue";
import WishlistModal from "../components/wishlist/WishlistModal.vue";
import DeleteWishlistModal from "../components/wishlist/DeleteWishlistModal.vue";

const wishlistStore = useWishlistStore();

const displaySettings = useDisplaySettingsStore();
const displayMode = computed(() => displaySettings.displayMode);

// Используем storeToRefs для реактивных свойств
const { books, loading, error } = storeToRefs(wishlistStore);
const { loadWishlist, addBook, updateBook, deleteBook, updatePriority } =
  wishlistStore;

// UI состояния
const searchQuery = ref("");
const debouncedSearch = ref("");
const sortMenuOpen = ref(false);
const filterMenuOpen = ref(false);
const currentSort = ref(null); // null, title_asc, title_desc, author_asc, author_desc, priority_asc, priority_desc
const priorityFilter = ref(null); // null или 1..5
const isModalOpen = ref(false);
const editingBook = ref(null);
const isDeleteModalOpen = ref(false);
const deletingBookId = ref(null);

const sortMenuRef = ref(null);
const sortButtonRef = ref(null);

// Категории сортировки
const sortCategories = [
  {
    key: "title",
    label: "Название",
    options: [
      { value: "title_asc", label: "По возрастанию (А–Я)" },
      { value: "title_desc", label: "По убыванию (Я–А)" },
    ],
  },
  {
    key: "author",
    label: "Автор",
    options: [
      { value: "author_asc", label: "По возрастанию (А–Я)" },
      { value: "author_desc", label: "По убыванию (Я–А)" },
    ],
  },
  {
    key: "priority",
    label: "Приоритет",
    options: [
      { value: "priority_asc", label: "По возрастанию (1→5)" },
      { value: "priority_desc", label: "По убыванию (5→1)" },
    ],
  },
];

// Закрытие меню сортировки по клику вне (игнорируем кнопку и само меню)
onClickOutside(
  sortMenuRef,
  () => {
    if (sortMenuOpen.value) sortMenuOpen.value = false;
  },
  { ignore: [sortButtonRef] },
);

// Поиск с debounce
const updateDebouncedSearch = useDebounceFn((value) => {
  debouncedSearch.value = value;
}, 300);
watch(searchQuery, (value) => updateDebouncedSearch(value));

// Фильтрация по поиску (с учётом books.value)
const searchedBooks = computed(() => {
  if (!debouncedSearch.value) return books.value;
  const q = debouncedSearch.value.toLowerCase();
  return books.value.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      (b.author && b.author.toLowerCase().includes(q)),
  );
});

// Фильтр по приоритету
const filteredBooks = computed(() => {
  if (!priorityFilter.value) return searchedBooks.value;
  return searchedBooks.value.filter((b) => b.priority === priorityFilter.value);
});

// Загрузка данных
const loadData = async () => {
  await loadWishlist(currentSort.value, priorityFilter.value);
};

// При изменении сортировки или фильтра перезагружаем
watch([currentSort, priorityFilter], () => {
  loadData();
});

onMounted(() => {
  loadData();
});

// Методы UI
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
const setPriorityFilter = (value) => {
  priorityFilter.value = value;
  filterMenuOpen.value = false;
};

const openAddModal = () => {
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
const saveBook = async (bookData) => {
  if (bookData.id) {
    await updateBook(bookData.id, bookData);
  } else {
    await addBook(bookData);
  }
  await loadData();
};

const openDeleteModal = (book) => {
  deletingBookId.value = book.id;
  isDeleteModalOpen.value = true;
};
const closeDeleteModal = () => {
  isDeleteModalOpen.value = false;
  deletingBookId.value = null;
};
const confirmDelete = async ({ id, reason }) => {
  await deleteBook(id, reason);
  await loadData();
};

const handleUpdatePriority = async (id, priority) => {
  await updatePriority(id, priority);
};
</script>
