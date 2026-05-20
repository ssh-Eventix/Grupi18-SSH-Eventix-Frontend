export const handleApiError = (error) => {
  if (error.response) {
    const data = error.response.data;

    if (typeof data === "string") {
      return data;
    }

    if (data?.message) {
      return data.message;
    }

    if (data?.title) {
      return data.title;
    }

    if (data?.errors) {
      return Object.values(data.errors).flat().join(" ");
    }

    return `Server error (${error.response.status})`;
  }

  return "Network error";
};
