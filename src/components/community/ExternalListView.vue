<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed pb-14 inset-0 bg-black bg-opacity-80 z-40 overflow-auto"
    >
      <div class="relative w-full overflow-auto">
        <!-- Шапка с заголовком и кнопкой закрытия -->
        <div
          class="sticky top-0 z-20 bg-white dark:bg-bg-primary-dark pb-3 mb-4"
        >
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold dark:text-white">
              {{ isLibrary ? "Библиотека" : "Вишлист" }}
              {{ userName || userId }}
            </h2>
            <div class="flex gap-2 text-black dark:text-white">
              <!-- Кнопки сортировки / фильтра / переключения вида -->
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
                        v-for="opt in category.options"
                        :key="opt.value"
                        @click="setSort(opt.value)"
                        class="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-purple-100 dark:hover:bg-border-dark"
                        :class="{
                          'bg-purple-200 dark:bg-accent/30':
                            currentSort === opt.value,
                        }"
                      >
                        {{ opt.label }}
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

              <div class="relative" v-if="isLibrary">
                <span ref="filterButtonRef">
                  <IconButton
                    :icon="filterIcon"
                    variant="primary"
                    @click="toggleFilterMenu"
                    class="text-xl"
                  />
                </span>
                <div
                  v-if="filterMenuOpen"
                  ref="filterMenuRef"
                  class="absolute right-0 mt-2 w-48 bg-white dark:bg-bg-secondary-dark rounded-lg shadow-lg border border-border dark:border-border-dark z-30"
                >
                  <div class="p-2">
                    <button
                      v-for="opt in filterOptions"
                      :key="opt.value"
                      @click="setFilter(opt.value)"
                      class="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-purple-100 dark:hover:bg-border-dark"
                      :class="{
                        'bg-purple-200 dark:bg-accent/30':
                          currentFilter === opt.value,
                      }"
                    >
                      {{ opt.label }}
                    </button>
                  </div>
                </div>
              </div>

              <IconButton
                icon="✕"
                variant="primary"
                @click="close"
                class="text-xl dark:text-white"
              />
            </div>
          </div>
          <SearchInput
            v-model="searchQuery"
            placeholder="Поиск по названию или автору..."
            class="mt-3"
          />
        </div>

        <LoadingSpinner v-if="loading" />
        <div v-else-if="error" class="text-center py-8 text-red-500">
          Ошибка: {{ error }}
        </div>

        <div
          v-else-if="filteredBooks.length === 0"
          class="text-center py-8 text-gray-500"
        >
          Нет книг
        </div>

        <div
          v-else
          :class="{
            'grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5':
              displayMode === 'grid',
            'flex flex-col gap-3': displayMode === 'list',
          }"
        >
          <div
            v-for="book in filteredBooks"
            :key="book.id"
            class="cursor-pointer"
            @click="openBookDetails(book)"
          >
            <ReadonlyBookCard
              :book="book"
              :is-grid="displayMode === 'list'"
              :readonly="true"
              :list-type="listType"
            />
          </div>
        </div>
      </div>
      <ReadonlyBookModal
        :is-open="!!selectedBook"
        :book="selectedBook"
        :list-type="listType"
        @close="closeBookDetails"
      />
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useDebounceFn, onClickOutside } from "@vueuse/core";
import { useCommunityStore } from "../../stores/community";
import { useDisplaySettingsStore } from "../../stores/displaySettings";
import { DEFAULT_COVER } from "../../constants/constants";
import IconButton from "../IconButton.vue";
import SearchInput from "../library/SearchInput.vue";
import LoadingSpinner from "../LoadingSpinner.vue";
import ReadonlyBookModal from "./ReadonlyBookModal.vue";
import ReadonlyBookCard from "./ReadonlyBookCard.vue";

const props = defineProps({
  isOpen: Boolean,
  userId: String,
  listType: String, // 'library' или 'wishlist'
  sharedToken: String,
  userName: String,
});
const emit = defineEmits(["close"]);

const displaySettingsStore = useDisplaySettingsStore();
const displayMode = computed(() => displaySettingsStore.displayMode);

const communityStore = useCommunityStore();

const items = ref([]);
const loading = ref(false);
const error = ref(null);
const searchQuery = ref("");
const debouncedSearch = ref("");
const sortMenuOpen = ref(false);
const filterMenuOpen = ref(false);
const currentSort = ref(null);
const currentFilter = ref("all");
const selectedBook = ref(null);

// Закрытие по клику вне области
const sortMenuRef = ref(null);
const sortButtonRef = ref(null);
const filterMenuRef = ref(null);
const filterButtonRef = ref(null);

const isLibrary = computed(() => props.listType === "library");
const isWishlist = computed(() => props.listType === "wishlist");

// Категории сортировки в зависимости от типа списка
const sortCategories = computed(() => {
  if (props.listType === "library") {
    return [
      {
        key: "title",
        label: "Название",
        options: [
          { value: "title_asc", label: "По возрастанию А–Я" },
          { value: "title_desc", label: "По убыванию Я–А" },
        ],
      },
      {
        key: "author",
        label: "Автор",
        options: [
          { value: "author_asc", label: "По возрастанию А–Я" },
          { value: "author_desc", label: "По убыванию Я–А" },
        ],
      },
    ];
  }

  // Для вишлиста (или любого другого значения, но лучше явно)
  return [
    {
      key: "title",
      label: "Название",
      options: [
        { value: "title_asc", label: "По возрастанию А–Я" },
        { value: "title_desc", label: "По убыванию Я–А" },
      ],
    },
    {
      key: "author",
      label: "Автор",
      options: [
        { value: "author_asc", label: "По возрастанию А–Я" },
        { value: "author_desc", label: "По убыванию Я–А" },
      ],
    },
    {
      key: "priority",
      label: "Приоритет",
      options: [
        { value: "priority_desc", label: "Сначала высокий" },
        { value: "priority_asc", label: "Сначала низкий" },
      ],
    },
  ];
});

// Опции фильтра для библиотеки
const filterOptions = [
  { value: "all", label: "📚 Все" },
  { value: "favorite", label: "❤️ Избранные" },
  { value: "finished", label: "✅ Прочитано" },
  { value: "unfinished", label: "📖 Не прочитано" },
  { value: "abandoned", label: "❌ Брошено" },
];

// Иконка для кнопки фильтра, меняется в зависимости от выбранного фильтра
const filterIcon = computed(() => {
  const map = {
    favorite: "❤️",
    finished: "✅",
    unfinished: "📖",
    abandoned: "❌",
  };
  return map[currentFilter.value] || "📚";
});

// Фильтрация (поиск + фильтр статуса/избранного)
const searched = computed(() => {
  let filtered = [...items.value];
  if (!isLibrary.value) return filtered; // для вишлиста фильтр только по поиску
  switch (currentFilter.value) {
    case "favorite":
      filtered = filtered.filter((b) => b.isFavorite);
      break;
    case "finished":
      filtered = filtered.filter((b) => b.status === "прочитано");
      break;
    case "unfinished":
      filtered = filtered.filter((b) => b.status === "не прочитано");
      break;
    case "abandoned":
      filtered = filtered.filter((b) => b.status === "брошено");
      break;
  }
  if (!debouncedSearch.value) return filtered;
  const q = debouncedSearch.value.toLowerCase();
  return filtered.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      (b.author && b.author.toLowerCase().includes(q)),
  );
});

// Сортировка по выбранному параметру
const filteredBooks = computed(() => {
  const sorted = [...searched.value];
  if (!currentSort.value) return sorted;
  const [field, order] = currentSort.value.split("_");
  sorted.sort((a, b) => {
    let valA = a[field] || "",
      valB = b[field] || "";
    if (field === "rating") ((valA = a.rating || 0), (valB = b.rating || 0));
    if (field === "priority")
      ((valA = a.priority || 0), (valB = b.priority || 0));
    if (order === "asc") return valA > valB ? 1 : -1;
    else return valA < valB ? 1 : -1;
  });
  return sorted;
});

// Открытие/закрытие модального окна с деталями книги
const openBookDetails = (book) => {
  selectedBook.value = book;
};
const closeBookDetails = () => {
  selectedBook.value = null;
};

// Загрузка данных для указанного пользователя
const loadData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const data = isLibrary.value
      ? await communityStore.fetchUserLibrary(props.userId, props.sharedToken)
      : await communityStore.fetchUserWishlist(props.userId, props.sharedToken);
    items.value = data;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// Поиск с debounce
const updateDebouncedSearch = useDebounceFn((val) => {
  debouncedSearch.value = val;
}, 300);

// Методы UI
const toggleSortMenu = () => {
  sortMenuOpen.value = !sortMenuOpen.value;
  filterMenuOpen.value = false;
};
const toggleFilterMenu = () => {
  filterMenuOpen.value = !filterMenuOpen.value;
  sortMenuOpen.value = false;
};
const setSort = (val) => {
  currentSort.value = val;
  sortMenuOpen.value = false;
};
const setFilter = (val) => {
  currentFilter.value = val;
  filterMenuOpen.value = false;
};
const close = () => emit("close");

// Закрытие меню сортировки по клику вне (игнорируем кнопку и само меню)
onClickOutside(
  sortMenuRef,
  () => {
    if (sortMenuOpen.value) sortMenuOpen.value = false;
  },
  { ignore: [sortButtonRef] },
);

// Закрытие меню фильтра по клику вне
onClickOutside(
  filterMenuRef,
  () => {
    if (filterMenuOpen.value) filterMenuOpen.value = false;
  },
  { ignore: [filterButtonRef] },
);

// Закрытие по клавише Escape
const handleEscape = (event) => {
  if (event.key === "Escape") {
    if (sortMenuOpen.value) sortMenuOpen.value = false;
    if (filterMenuOpen.value) filterMenuOpen.value = false;
  }
};

// --- Watchers ---
watch(searchQuery, (val) => updateDebouncedSearch(val));

watch(
  () => props.isOpen,
  (open) => {
    if (open) loadData();
  },
);

watch(
  () => sortMenuOpen.value || filterMenuOpen.value,
  (isAnyOpen) => {
    if (isAnyOpen) {
      window.addEventListener("keydown", handleEscape);
    } else {
      window.removeEventListener("keydown", handleEscape);
    }
  },
);
</script>
