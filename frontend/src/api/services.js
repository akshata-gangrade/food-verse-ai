import api from './client';

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const userService = {
  getPreferences: () => api.get('/users/preferences'),
  updatePreferences: (data) => api.put('/users/preferences', data),
};

export const foodService = {
  analyzeFood: (formData) =>
    api.post('/food/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const freshnessService = {
  analyzeFreshness: (formData) =>
    api.post('/freshness/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const hygieneService = {
  analyzeHygiene: (formData) =>
    api.post('/hygiene/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const chatService = {
  createSession: (title) => api.post('/chat/sessions', { title }),
  listSessions: () => api.get('/chat/sessions'),
  getSession: (id) => api.get(`/chat/sessions/${id}`),
  sendMessage: (sessionId, formData) =>
    api.post(`/chat/sessions/${sessionId}/messages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteSession: (id) => api.delete(`/chat/sessions/${id}`),
};

export const recipeService = {
  listRecipes: () => api.get('/recipes'),
  saveRecipe: (recipe) => api.post('/recipes', recipe),
  getRecipe: (id) => api.get(`/recipes/${id}`),
  deleteRecipe: (id) => api.delete(`/recipes/${id}`),
};

export const mealPlanService = {
  generateMealPlan: (data) => api.post('/mealplans/generate', data),
  listMealPlans: () => api.get('/mealplans'),
  getMealPlan: (id) => api.get(`/mealplans/${id}`),
  replaceMeal: (id, data) => api.post(`/mealplans/${id}/replace-meal`, data),
  deleteMealPlan: (id) => api.delete(`/mealplans/${id}`),
};

export const historyService = {
  listHistory: (feature, limit = 50) =>
    api.get('/history', { params: { feature, limit } }),
  getHistoryItem: (id) => api.get(`/history/${id}`),
  deleteHistoryItem: (id) => api.delete(`/history/${id}`),
};

export const dashboardService = {
  getSummary: () => api.get('/dashboard/summary'),
};

export const systemService = {
  getStatus: () => api.get('/system/status'),
};
