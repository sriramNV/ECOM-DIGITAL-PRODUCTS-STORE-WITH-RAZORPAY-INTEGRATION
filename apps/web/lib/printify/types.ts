export type PrintifyShop = {
  id: number;
  title: string;
  sales_channel: string;
};

export type PrintifyBlueprint = {
  id: number;
  title: string;
  description: string;
  brand: string;
  model: string;
  images: Array<{ src: string }>;
};

export type PrintifyPrintProvider = {
  id: number;
  title: string;
  location: { country: string };
  shipping: Array<{ type: string; min: number; max: number }>;
};

export type PrintifyVariant = {
  id: number;
  title: string;
  price: number;
  is_enabled: boolean;
};

export type PrintifyProduct = {
  id: string;
  title: string;
  description: string;
  variants: Array<{ id: number; price: number; is_enabled: boolean }>;
  images: Array<{ src: string }>;
};

export type PrintifyOrderInput = {
  external_id: string;
  line_items: Array<{
    product_id: string;
    variant_id: number;
    quantity: number;
  }>;
  shipping_method: number;
  address_to: {
    first_name: string;
    last_name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
  };
};

export type PrintifyOrder = {
  id: string;
  external_id: string;
  status: string;
  shipping: { carrier: string; tracking_number: string; tracking_url: string };
  created_at: string;
};
