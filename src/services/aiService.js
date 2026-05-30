import api from "./api";

export const aiService = {
  generateEventDescription: async (data) => {
    const response = await api.post("/ai/generate-event-description", data);
    return response.data;
  },

  generateMarketing: async (data) => {
    const response = await api.post("/ai/generate-marketing", data);
    return response.data;
  },

  getReviewSummary: async (eventId) => {
    const response = await api.get(`/ai/review-summary/${eventId}`);
    return response.data;
  },

  getBuyerRecommendations: async () => {
    const response = await api.get("/ai/buyer/recommendations");
    return response.data;
  },

  buyerChat: async (prompt) => {
    const response = await api.post("/ai/buyer/chat", { prompt });
    return response.data;
  },
};

export default aiService;
