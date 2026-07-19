import { printifyClient } from "./client";
import type { PrintifyBlueprint, PrintifyPrintProvider, PrintifyVariant } from "./types";

export const printifyCatalog = {
  async listBlueprints() {
    return printifyClient.request<PrintifyBlueprint[]>({
      method: "GET",
      path: "/catalog/blueprints.json",
    });
  },

  async getBlueprint(id: number) {
    return printifyClient.request<PrintifyBlueprint>({
      method: "GET",
      path: `/catalog/blueprints/${id}.json`,
    });
  },

  async listPrintProviders(blueprintId: number) {
    return printifyClient.request<PrintifyPrintProvider[]>({
      method: "GET",
      path: `/catalog/blueprints/${blueprintId}/print_providers.json`,
    });
  },

  async listVariants(blueprintId: number, providerId: number) {
    return printifyClient.request<PrintifyVariant[]>({
      method: "GET",
      path: `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`,
    });
  },

  async getShipping(blueprintId: number, providerId: number) {
    return printifyClient.request({
      method: "GET",
      path: `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/shipping.json`,
    });
  },
};
