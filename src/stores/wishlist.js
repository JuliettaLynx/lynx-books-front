import { defineStore } from "pinia";
import { ref } from "vue";
import api from "../api";
import { wishlistDB } from "../db/index";

export const useWishlistStore = defineStore("wishlist", () => {
  const books = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Загрузка виш-листа с сервера + кэширование
  const loadWishlist = async (sortBy = null, priorityFilter = null) => {
    loading.value = true;
    error.value = null;
    try {
      const params = {};
      if (sortBy) params.sortBy = sortBy;
      if (priorityFilter) params.priority = priorityFilter;

      const response = await api.get("/wishlist", { params });
      const fetched = response.data;
      books.value = fetched;

      // Сохраняем в IndexedDB
      await wishlistDB.bulkPut(
        fetched.map((book) => ({
          id: book.id,
          title: book.title,
          author: book.author,
          publisher: book.publisher,
          cover: book.cover,
          binding: book.binding,
          priority: book.priority,
          note: book.note,
          description: book.description,
          createdAt: book.createdAt,
          updatedAt: book.updatedAt,
          userId: book.userId,
        })),
      );
    } catch (err) {
      error.value = err.message;
      console.error("Load wishlist error", err);
      // fallback to cached
      const cached = await wishlistDB.toArray();
      if (cached.length) {
        books.value = cached;
      }
    } finally {
      loading.value = false;
    }
  };

  // Добавление книги
  const addBook = async (bookData) => {
    try {
      const response = await api.post("/wishlist", bookData);
      const newBook = response.data;
      books.value.push(newBook);
      await wishlistDB.put({
        id: newBook.id,
        title: newBook.title,
        author: newBook.author,
        publisher: newBook.publisher,
        cover: newBook.cover,
        binding: newBook.binding,
        priority: newBook.priority,
        note: newBook.note,
        description: newBook.description,
        createdAt: newBook.createdAt,
        updatedAt: newBook.updatedAt,
      });
      return newBook;
    } catch (err) {
      console.error("Add wishlist book error", err);
      throw err;
    }
  };

  // Обновление книги
  const updateBook = async (id, bookData) => {
    try {
      await api.put(`/wishlist/${id}`, bookData);
      const index = books.value.findIndex((b) => b.id === id);
      if (index !== -1) {
        const updated = {
          ...books.value[index],
          ...bookData,
          updatedAt: new Date().toISOString(),
        };
        books.value[index] = updated;
        await wishlistDB.update(id, updated);
      }
    } catch (err) {
      console.error("Update wishlist book error", err);
      throw err;
    }
  };

  // Удаление с причиной
  const deleteBook = async (id, reason) => {
    try {
      await api.delete(`/wishlist/${id}`, { params: { reason } });
      books.value = books.value.filter((b) => b.id !== id);
      await wishlistDB.delete(id);
      return true;
    } catch (err) {
      console.error("Delete wishlist book error", err);
      throw err;
    }
  };

  // Обновление приоритета (удобный метод)
  const updatePriority = async (id, priority) => {
    await updateBook(id, { priority });
  };

  return {
    books,
    loading,
    error,
    loadWishlist,
    addBook,
    updateBook,
    deleteBook,
    updatePriority,
  };
});
