export type Customer = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  phone: string | null;
  createdAt: string;
  _count: { orders: number };
  orders: { id: string; totalAmount: number; createdAt: string; status: string }[];
};

export type CustomerOrder = {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: { id: string; title: string; variant: string; quantity: number; unitPrice: number }[];
};
