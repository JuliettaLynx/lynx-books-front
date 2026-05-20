import { defineStore } from "pinia";
import { ref } from "vue";
import api from "../api";
import { sessionsDB } from "../db/index";

export const useSessionStore = defineStore("session", () => {
  const sessions = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Загрузка сессий с сервера + кэш
  async function loadSessions(params = {}) {
    loading.value = true;
    try {
      const response = await api.get("/sessions", { params });
      const fetched = response.data;
      sessions.value = fetched;
      await sessionsDB.bulkPut(
        fetched.map((s) => ({
          id: s.id,
          bookId: s.bookId,
          bookTitle: s.bookTitle,
          color: s.color,
          date: s.date,
          startDate: s.startDate,
          startPage: s.startPage,
          endPage: s.endPage,
          pagesRead: s.pagesRead,
          finishedBook: s.finishedBook,
          rating: s.rating,
          updatedAt: s.updatedAt,
          userId: s.userId,
        })),
      );
    } catch (err) {
      error.value = err.message;
      console.error("Load sessions error", err);
      const cached = await sessionsDB.toArray();
      if (cached.length) sessions.value = cached;
    } finally {
      loading.value = false;
    }
  }

  // Добавление сессии
  async function addSession(sessionData) {
    try {
      const response = await api.post("/sessions", sessionData);
      const newSession = response.data;
      sessions.value.push(newSession);
      await sessionsDB.put({
        id: newSession.id,
        bookId: newSession.bookId,
        bookTitle: newSession.bookTitle,
        color: newSession.color,
        date: newSession.date,
        startDate: newSession.startDate,
        startPage: newSession.startPage,
        endPage: newSession.endPage,
        pagesRead: newSession.pagesRead,
        finishedBook: newSession.finishedBook,
        rating: newSession.rating,
        updatedAt: newSession.updatedAt,
      });
      return newSession;
    } catch (err) {
      console.error("Add session error", err);
      throw err;
    }
  }

  // Обновление сессии
  async function updateSession(id, sessionData) {
    try {
      await api.put(`/sessions/${id}`, sessionData);
      const index = sessions.value.findIndex((s) => s.id === id);
      if (index !== -1) {
        const updated = {
          ...sessions.value[index],
          ...sessionData,
          updatedAt: new Date().toISOString(),
        };
        sessions.value[index] = updated;
        await sessionsDB.update(id, updated);
      }
    } catch (err) {
      console.error("Update session error", err);
      throw err;
    }
  }

  // Удаление сессии
  async function deleteSession(id) {
    try {
      await api.delete(`/sessions/${id}`);
      sessions.value = sessions.value.filter((s) => s.id !== id);
      await sessionsDB.delete(id);
    } catch (err) {
      console.error("Delete session error", err);
      throw err;
    }
  }

  // Получить сессии по дате (локально)
  function getSessionsByDate(date) {
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const next = new Date(target);
    next.setDate(next.getDate() + 1);
    return sessions.value.filter((s) => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      return d >= target && d < next;
    });
  }

  function getPagesReadByDate(date) {
    return getSessionsByDate(date).reduce(
      (sum, s) => sum + (s.pagesRead || 0),
      0,
    );
  }

  return {
    sessions,
    loading,
    error,
    loadSessions,
    addSession,
    updateSession,
    deleteSession,
    getSessionsByDate,
    getPagesReadByDate,
  };
});
