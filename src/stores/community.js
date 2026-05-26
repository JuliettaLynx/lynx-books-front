import { defineStore } from "pinia";
import { ref } from "vue";
import api from "../api";

export const useCommunityStore = defineStore("community", () => {
  const privacy = ref({ isLibraryPublic: true, isWishlistPublic: true });
  const subscriptions = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function loadPrivacy() {
    try {
      const res = await api.get("/community/privacy");
      privacy.value = res.data;
    } catch (err) {
      console.error("Failed to load privacy", err);
      error.value = err.message;
    }
  }

  async function updatePrivacy(settings) {
    try {
      await api.put("/community/privacy", settings);
      privacy.value = settings;
    } catch (err) {
      console.error("Failed to update privacy", err);
      throw err;
    }
  }

  async function generateShareLink(library, wishlist) {
    try {
      const res = await api.post("/community/share", { library, wishlist });
      return res.data; // { link, token, expiresAt }
    } catch (err) {
      console.error("Failed to generate share link", err);
      throw err;
    }
  }

  async function validateShareToken(token) {
    try {
      const res = await api.get("/community/validate-share", {
        params: { token },
      });
      return res.data; // { isValid, userId, userName, listType }
    } catch (err) {
      console.error("Failed to validate share token", err);
      return { isValid: false };
    }
  }

  async function searchUsers(query) {
    if (!query.trim()) return [];
    try {
      const res = await api.get("/community/search-users", {
        params: { query },
      });
      return res.data;
    } catch (err) {
      console.error("Failed to search users", err);
      return [];
    }
  }

  async function subscribe(targetUserId, listType = null) {
    try {
      const params = listType ? { listType } : {};
      await api.post(`/community/subscribe/${targetUserId}`, null, { params });
      await loadSubscriptions(); // обновляем список после подписки
    } catch (err) {
      console.error("Failed to subscribe", err);
      throw err;
    }
  }

  async function unsubscribe(targetUserId, listType = null) {
    try {
      const params = listType ? { listType } : {};
      await api.delete(`/community/subscribe/${targetUserId}`, { params });
      await loadSubscriptions();
    } catch (err) {
      console.error("Failed to unsubscribe", err);
      throw err;
    }
  }

  async function loadSubscriptions() {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get("/community/subscriptions");
      subscriptions.value = res.data;
    } catch (err) {
      console.error("Failed to load subscriptions", err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchUserLibrary(
    userId,
    sharedToken = null,
    sortBy = null,
    filter = null,
  ) {
    const params = { sharedToken, sortBy, filter };
    const res = await api.get(`/community/users/${userId}/library`, { params });
    return res.data;
  }

  async function fetchUserWishlist(userId, sharedToken = null) {
    const params = sharedToken ? { sharedToken } : {};
    const res = await api.get(`/community/users/${userId}/wishlist`, {
      params,
    });
    return res.data;
  }

  return {
    privacy,
    subscriptions,
    loading,
    error,
    loadPrivacy,
    updatePrivacy,
    generateShareLink,
    validateShareToken,
    searchUsers,
    subscribe,
    unsubscribe,
    loadSubscriptions,
    fetchUserLibrary,
    fetchUserWishlist,
  };
});
