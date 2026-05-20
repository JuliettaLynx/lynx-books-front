import { defineStore } from "pinia";
import { ref } from "vue";
import api from "../api";
import { booksDB } from "../db/index";

export const useLibraryStore = defineStore("library", () => {
  const books = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const loadBooks = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get("/books");
      const fetchedBooks = response.data;
      books.value = fetchedBooks;
      await booksDB.bulkPut(
        fetchedBooks.map((book) => ({
          id: book.id,
          title: book.title,
          author: book.author,
          publisher: book.publisher,
          format: book.format,
          status: book.status,
          rating: book.rating,
          description: book.description,
          isFavorite: book.isFavorite,
          createdAt: book.createdAt,
          updatedAt: book.updatedAt,
          userId: book.userId,
        })),
      );
    } catch (err) {
      error.value = err.message;
      console.error("Load books error", err);
      const cached = await booksDB.toArray();
      if (cached.length) {
        books.value = cached;
      }
    } finally {
      loading.value = false;
    }
  };

  async function addBook(bookData) {
    try {
      const response = await api.post("/books", bookData);
      const newBook = response.data;
      books.value.push(newBook);
      await booksDB.put({
        id: newBook.id,
        title: newBook.title,
        author: newBook.author,
        publisher: newBook.publisher,
        format: newBook.format,
        status: newBook.status,
        rating: newBook.rating,
        description: newBook.description,
        isFavorite: newBook.isFavorite,
        createdAt: newBook.createdAt,
        updatedAt: newBook.updatedAt,
      });
      return newBook;
    } catch (err) {
      console.error("Add book error", err);
      throw err;
    }
  }

  async function updateBook(id, bookData) {
    try {
      await api.put(`/books/${id}`, bookData);
      const index = books.value.findIndex((b) => b.id === id);
      if (index !== -1) {
        const updated = {
          ...books.value[index],
          ...bookData,
          updatedAt: new Date().toISOString(),
        };
        books.value[index] = updated;
        await booksDB.update(id, updated);
      }
    } catch (err) {
      console.error("Update book error", err);
      throw err;
    }
  }

  async function deleteBook(id) {
    try {
      await api.delete(`/books/${id}`);
      books.value = books.value.filter((b) => b.id !== id);
      await booksDB.delete(id);
    } catch (err) {
      console.error("Delete book error", err);
      throw err;
    }
  }

  async function toggleFavorite(book) {
    try {
      await api.patch(`/books/${book.id}/favorite`);
      book.isFavorite = !book.isFavorite;
      const index = books.value.findIndex((b) => b.id === book.id);
      if (index !== -1) {
        books.value[index].isFavorite = book.isFavorite;
        await booksDB.update(book.id, {
          isFavorite: book.isFavorite,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Toggle favorite error", err);
      throw err;
    }
  }

  function getUnreadBooks() {
    return books.value.filter((book) => book.status !== "прочитано");
  }

  return {
    books,
    loading,
    error,
    loadBooks,
    addBook,
    updateBook,
    deleteBook,
    toggleFavorite,
    getUnreadBooks,
  };
});
