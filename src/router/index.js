import { createRouter, createWebHistory } from "vue-router";
import AuthPage from "../views/Auth.vue";
import LibraryView from "../views/LibraryView.vue";
import TrackerView from "../views/TrackerView.vue";
import WishlistView from "../views/WishlistView.vue";
import NotFoundView from "../views/404.vue";
import { useAuthStore } from "../stores/auth";

const routes = [
  {
    path: "/",
    redirect: "/library",
  },
  {
    path: "/library",
    name: "library",
    component: LibraryView,
    meta: { showBottomNav: true, requiresAuth: true },
  },
  {
    path: "/tracker",
    name: "tracker",
    component: TrackerView,
    meta: { showBottomNav: true, requiresAuth: true },
  },
  {
    path: "/wishlist",
    name: "wishlist",
    component: WishlistView,
    meta: { showBottomNav: true, requiresAuth: true },
  },
  {
    path: "/auth",
    name: "auth",
    component: AuthPage,
    meta: { showBottomNav: false, requiresAuth: false },
  },
  {
    path: "/404",
    name: "404",
    component: NotFoundView,
    meta: { showBottomNav: false },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/404",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Навигационный guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Если ещё нет пользователя, но есть токен – пытаемся загрузить
  if (!authStore.user && localStorage.getItem("access_token")) {
    await authStore.fetchUser();
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const isAuthenticated = authStore.isAuthenticated;

  if (requiresAuth && !isAuthenticated) {
    next("/auth");
  } else if (to.path === "/auth" && isAuthenticated) {
    next("/library");
  } else {
    next();
  }
});

export default router;
