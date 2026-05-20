<template>
  <div class="flex-shrink-0">
    <div class="relative">
      <!-- Превью или заглушка -->
      <div
        class="w-28 h-28 rounded-full bg-white dark:bg-border-dark/40 flex items-center justify-center text-4xl text-gray-400 dark:text-gray-500 cursor-pointer hover:bg-purple-700/10 dark:hover:bg-border-dark transition-colors border-2 border-dashed border-border dark:border-border-dark overflow-hidden"
        @click="openCropperModal"
      >
        <img
          v-if="avatarPreview"
          :src="avatarPreview"
          class="absolute rounded-full inset-0 w-full h-full object-cover"
          alt="Аватар"
        />
        <span v-else class="text-gray-400 dark:text-gray-500">
          {{ initials }}
        </span>
      </div>

      <!-- Кнопка удаления -->
      <button
        v-if="avatarPreview"
        type="button"
        class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
        @click.stop="handleRemove"
      >
        ✕
      </button>
    </div>

    <!-- Модальное окно для обрезки изображения -->
    <Teleport to="body">
      <div
        v-if="showCropper"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 dark:bg-opacity-70"
        @click.self="closeCropperModal"
      >
        <div
          class="bg-white dark:bg-bg-secondary-dark rounded-2xl w-full max-w-2xl flex flex-col max-h-[90vh]"
        >
          <div
            class="flex items-center justify-between p-4 border-b border-border dark:border-border-dark"
          >
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Редактировать аватар
            </h2>
            <button
              @click="closeCropperModal"
              class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          <!-- Кнопка загрузки нового изображения -->
          <div class="px-4 pt-2 flex items-center gap-2">
            <button @click="uploadNewImage" class="text-sm text-accent">
              Загрузить изображение
            </button>
          </div>

          <!-- Область кроппера -->
          <div class="flex-1 overflow-auto p-4">
            <div
              class="relative bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center min-h-[400px]"
            >
              <cropper
                v-if="originalImageSrc"
                ref="cropperRef"
                class="cropper"
                :src="originalImageSrc"
                :stencil-props="stencilProps"
                :resize-image="resizeImageConfig"
                image-restriction="stencil"
                @ready="handleCropperReady"
                @change="handleCropChange"
              />
            </div>
          </div>

          <!-- Действия -->
          <div
            class="flex justify-end gap-2 p-4 border-t border-border dark:border-border-dark"
          >
            <button
              @click="closeCropperModal"
              class="px-4 py-2 border border-border dark:border-border-dark text-gray-700 dark:text-gray-300 hover:bg-purple-700/10 dark:hover:bg-border-dark rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              @click="applyCrop"
              class="px-4 py-2 border border-border dark:border-border-dark bg-accent/60 text-white rounded-lg transition-colors"
            >
              Применить
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";

const props = defineProps({
  avatarPreview: String,
  avatarFile: [String, File],
  originalImage: String,
  userId: { type: [Number, String], default: null },
  displayName: String,
  email: String,
});

const emit = defineEmits([
  "update:avatarPreview",
  "update:avatarFile",
  "update:originalImage",
  "remove",
]);

// Инициалы для заглушки
const initials = computed(() => {
  if (props.displayName) return props.displayName.charAt(0).toUpperCase();
  if (props.email) return props.email.charAt(0).toUpperCase();
  return "?";
});

// Состояния
const showCropper = ref(false);
const originalImageSrc = ref(
  props.originalImage || props.avatarPreview || null,
);
const cropperRef = ref(null);

// Конфиги для cropper
const stencilProps = {
  aspectRatio: 1,
  movable: true,
  resizable: true,
  aspectRatioLockEnabled: true,
};

const resizeImageConfig = {
  adjustStencil: false,
  scalable: true,
  minScale: 0.3,
  maxScale: 5,
  wheel: true,
};

const MAX_SIZE = 1 * 1024 * 1024;
const TARGET_SIZE = { width: 200, height: 200 };

const validateImage = (file, base64) => {
  if (file?.size > MAX_SIZE) {
    alert("Изображение слишком большое. Максимальный размер 1 МБ");
    return false;
  }
  const sizeInMB = (base64.length * 3) / 4 / (1024 * 1024);
  if (sizeInMB > 1) {
    alert("Изображение слишком большое после конвертации");
    return false;
  }
  return true;
};

// Загрузка нового изображения
const uploadNewImage = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target.result;
      if (!validateImage(file, imageData)) return;
      originalImageSrc.value = imageData;
      showCropper.value = true;
    };

    reader.readAsDataURL(file);
  };

  input.click();
};

// Открытие модального окна
const openCropperModal = () => {
  if (props.originalImage || props.avatarPreview) {
    originalImageSrc.value = props.originalImage || props.avatarPreview;
    showCropper.value = true;
  } else {
    uploadNewImage();
  }
};

// Применить обрезку
const applyCrop = async () => {
  const cropper = cropperRef.value;
  if (!cropper) return;

  const { canvas } = cropper.getResult();
  if (!canvas) return;

  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = TARGET_SIZE.width;
  finalCanvas.height = TARGET_SIZE.height;
  const ctx = finalCanvas.getContext("2d");

  const scale = Math.max(
    TARGET_SIZE.width / canvas.width,
    TARGET_SIZE.height / canvas.height,
  );

  const newWidth = canvas.width * scale;
  const newHeight = canvas.height * scale;

  ctx.drawImage(
    canvas,
    (TARGET_SIZE.width - newWidth) / 2,
    (TARGET_SIZE.height - newHeight) / 2,
    newWidth,
    newHeight,
  );

  const croppedImage = finalCanvas.toDataURL("image/jpeg", 0.9);

  emit("update:originalImage", originalImageSrc.value);
  emit("update:avatarPreview", croppedImage);
  emit("update:avatarFile", croppedImage);

  closeCropperModal();
};

// Обработчики
const handleCropChange = () => {};
const handleCropperReady = () => {};
const closeCropperModal = () => {
  showCropper.value = false;
};

const handleRemove = () => {
  emit("remove");
  emit("update:avatarPreview", null);
  emit("update:avatarFile", null);
  emit("update:originalImage", null);

  originalImageSrc.value = null;
};
</script>

<style scoped>
.cropper {
  width: 100%;
  height: 400px;
  background: transparent;
}

/* Стили для рамки */
:deep(.vue-advanced-cropper__stencil) {
  border: 2px solid #3b82f6;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  border-radius: 50%;
}

/* Ручки изменения размера */
:deep(.vue-advanced-cropper__handler) {
  background-color: white;
  border: 2px solid #3b82f6;
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

/* Темная тема */
:deep(.dark .vue-advanced-cropper__stencil) {
  border-color: #60a5fa;
}

:deep(.dark .vue-advanced-cropper__handler) {
  background-color: #1f2937;
  border-color: #60a5fa;
}
</style>
