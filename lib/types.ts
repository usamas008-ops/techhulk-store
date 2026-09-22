export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  images: string[];
  price: number;
  compare_at_price: number | null;
  stock: number;
  // Delivery charge for this product: null means the store default from the
  // settings table, 0 means free delivery. Optional because the column only
  // exists once supabase/add-delivery.sql has been run.
  delivery_fee?: number | null;
  is_active: boolean;
  source_url: string | null;
  created_at: string;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  title: string;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  stock: number;
};

export type CartItem = {
  productId: string;
  variantId: string | null;
  title: string;
  variantTitle?: string;
  price: number;
  image: string | null;
  quantity: number;
  // The delivery charge that applied when this went into the cart, already
  // resolved against the store default. Older saved carts do not have it.
  deliveryFee?: number;
};

export type Order = {
  id: string;
  order_number: number;
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  notes: string | null;
  payment_method: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  subtotal: number;
  total: number;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  title: string;
  variant_title: string | null;
  price: number;
  quantity: number;
};
