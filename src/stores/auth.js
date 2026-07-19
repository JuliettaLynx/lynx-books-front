import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "../api";
import router from "../router";
import { usersDB, offlineQueueDB } from "../db/index";

const getErrorMessage = (error) => {
  if (!error.response) return error.message || "Ошибка сети";

  const data = error.response.data;
  if (data) {
    return (
      data.message ||
      data.title ||
      data.detail ||
      data.error ||
      "Ошибка авторизации"
    );
  }
  return "Ошибка сервера";
};

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const loading = ref(true);

  const isAuthenticated = computed(() => !!user.value);

  async function fetchUser() {
    const token = localStorage.getItem("access_token");
    const storedUserId = localStorage.getItem("user_id");
    if (!token) {
      loading.value = false;
      return;
    }
    loading.value = true;
    try {
      const response = await api.get("/auth/me");
      user.value = response.data;
      await usersDB.put({
        userId: user.value.id,
        email: user.value.email,
        displayName: user.value.displayName,
        avatar: user.value.avatar,
        originalAvatar: user.value.originalAvatar,
        dailyGoal: user.value.dailyGoal,
        updatedAt: new Date().toISOString(),
      });

      localStorage.setItem("user_id", user.value.id);
    } catch (error) {
      console.error("Failed to fetch user", error);
      if (storedUserId) {
        const cached = await usersDB.get(storedUserId);
        if (cached) {
          user.value = {
            id: cached.userId,
            email: cached.email,
            displayName: cached.displayName,
            avatar: cached.avatar,
            originalAvatar: cached.originalAvatar,
            dailyGoal: cached.dailyGoal,
          };
          return;
        }
      }
      logout();
    } finally {
      loading.value = false;
    }
  }

  async function login(email, password) {
    loading.value = true;
    try {
      const response = await api.post("/auth/login", { email, password });
      const { accessToken, refreshToken, user: userData } = response.data;
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      localStorage.setItem("user_id", userData.id);
      user.value = userData;

      await usersDB.put({
        userId: String(userData.id),
        email: userData.email,
        displayName: userData.displayName,
        avatar: userData.avatar,
        originalAvatar: userData.originalAvatar,
        dailyGoal: userData.dailyGoal,
        updatedAt: new Date().toISOString(),
      });

      router.push("/library");
    } catch (error) {
      console.error("Login error:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.title ||
        error.message ||
        "Ошибка входа";
      throw new Error(message);
    } finally {
      loading.value = false;
    }
  }

  async function register(email, password, displayName) {
    loading.value = true;
    try {
      const response = await api.post("/auth/register", {
        email,
        password,
        displayName,
      });
      const { accessToken, refreshToken, user: userData } = response.data;
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      localStorage.setItem("user_id", userData.id);
      user.value = userData;

      await usersDB.put({
        userId: String(userData.id),
        email: userData.email,
        displayName: userData.displayName,
        avatar: userData.avatar,
        originalAvatar: userData.originalAvatar,
        dailyGoal: userData.dailyGoal,
        updatedAt: new Date().toISOString(),
      });

      router.push("/library");
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(message);
    } finally {
      loading.value = false;
    }
  }

  async function googleLogin(credential) {
    loading.value = true;
    try {
      const response = await api.post("/auth/google", { credential });
      const { accessToken, refreshToken, user: userData } = response.data;
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      localStorage.setItem("user_id", userData.id);
      user.value = userData;

      await usersDB.put({
        userId: String(userData.id),
        email: userData.email,
        displayName: userData.displayName,
        avatar: userData.avatar,
        originalAvatar: userData.originalAvatar,
        dailyGoal: userData.dailyGoal,
        updatedAt: new Date().toISOString(),
      });

      router.push("/library");
    } catch (error) {
      console.error("Google login error:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.title ||
        error.message ||
        "Ошибка входа через Google";
      throw new Error(message);
    } finally {
      loading.value = false;
    }
  }

  async function updateProfile(updates) {
    try {
      const response = await api.put("/users/profile", updates);
      if (user.value) {
        user.value = { ...user.value, ...updates };
      }
      return response.data;
    } catch (error) {
      let message = "Ошибка обновления профиля";

      if (error.response?.data) {
        // Проверяем поле Message (с большой буквы от C#)
        message =
          error.response.data.Message ||
          error.response.data.message ||
          error.response.data ||
          message;
      } else if (error.message) {
        message = error.message;
      }

      throw new Error(
        typeof message === "string" ? message : JSON.stringify(message),
      );
    }
  }

  async function updateAvatar(avatarBase64, originalBase64 = null) {
    try {
      const response = await api.put("/users/avatar", {
        avatar: avatarBase64,
        originalAvatar: originalBase64,
      });
      if (user.value) {
        user.value.avatar = avatarBase64;
        user.value.originalAvatar = originalBase64;
      }
      return response.data;
    } catch (error) {
      console.error("Update avatar error", error);
      throw error;
    }
  }

  async function setDailyGoal(goal) {
    try {
      await api.put("/users/daily-goal", goal);
      if (user.value) {
        user.value.dailyGoal = goal;
        await usersDB.update(user.value.id, {
          dailyGoal: goal,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Set daily goal error", error);
      throw error;
    }
  }

  async function changePassword(currentPassword, newPassword) {
    try {
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
    } catch (error) {
      const message = error.response?.data?.message || "Ошибка смены пароля";
      throw new Error(message);
    }
  }

  async function deleteAccount() {
    try {
      await api.delete("/auth/account");
      await usersDB.clear();
      await offlineQueueDB.clear();
      localStorage.clear();
      user.value = null;
      router.push("/auth");
    } catch (error) {
      console.error("Delete account error", error);
      throw error;
    }
  }

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_id");
    user.value = null;
    router.push("/auth");
  }

  return {
    user,
    loading,
    isAuthenticated,
    fetchUser,
    login,
    register,
    googleLogin,
    updateProfile,
    updateAvatar,
    setDailyGoal,
    changePassword,
    deleteAccount,
    logout,
  };
});
