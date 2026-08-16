export type ProductImage = string;

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  sale_price: number | null;
  stock: number;
  category_id: string | null;
  images: ProductImage[];
  visibility: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  category?: Category | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  customer_name: string;
  phone: string;
  email: string;
  delivery_address: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  payment_method: string;
  payment_id?: string | null;
  payment_reference_id?: string | null;
  payment_status: string;
  order_status: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product_id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  image: string;
  quantity: number;
  stock: number;
}

export const ORDER_STATUSES = ['new', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const PAYMENT_STATUSES = ['pending_verification', 'pending', 'paid', 'failed', 'refunded'] as const;
export type PaymentStatus = typeof PAYMENT_STATUSES[number];
