import { printifyClient } from "./client";

export const printifyUploads = {
  async uploadImage(url: string, filename: string) {
    return printifyClient.request<{ id: string; url: string }>({
      method: "POST",
      path: "/uploads/images.json",
      body: { url, filename },
    });
  },
};
