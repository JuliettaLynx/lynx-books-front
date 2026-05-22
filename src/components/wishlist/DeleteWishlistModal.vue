<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
      @click.self="close"
    >
      <div
        class="bg-white dark:bg-bg-secondary-dark w-full max-w-sm rounded-2xl p-6"
      >
        <h3 class="text-lg font-semibold mb-4 dark:text-white">
          Удалить книгу?
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Книга будет удалена из виш-листа. Укажите причину:
        </p>
        <div class="flex gap-3">
          <button
            @click="confirm('not_relevant')"
            class="flex-[1] py-2 px-4 dark:bg-border-dark/40 border border-border dark:border-border-dark rounded-lg hover:bg-purple-700/10 dark:hover:bg-border-dark dark:text-white transition-colors"
          >
            Не актуально
          </button>
          <button
            @click="confirm('purchased')"
            class="flex-1 py-2 px-3 bg-accent/80 text-white rounded-lg hover:bg-accent"
          >
            Куплено
          </button>
        </div>
      </div>

      <button
        class="relative bottom-24 right-3 w-6 h-6 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 transition-colors"
        @click="close"
      >
        ✕
      </button>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  isOpen: Boolean,
  bookId: String,
});

const emit = defineEmits(["confirm", "close"]);

const close = () => {
  emit("close");
};

const confirm = (reason) => {
  emit("confirm", { id: props.bookId, reason });
  close();
};
</script>
