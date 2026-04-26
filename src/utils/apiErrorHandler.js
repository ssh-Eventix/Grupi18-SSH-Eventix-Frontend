export const handleApiError = (error) => {
  if (error.response) {
    return error.response.data?.message || "Server error";
  }
  return "Network error";
};