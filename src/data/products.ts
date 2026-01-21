export interface ProductMedia {
  url: string;
  type: 'image' | 'video';
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  media?: ProductMedia[]; // Array of media (images/videos, max 5)
  description?: string; // Rich text description
  specs: string[];
  rating: number;
  reviews: number;
  stock: number; // Stock quantity
  in_stock?: boolean; // Stock availability flag
  vendor_id?: string; // Vendor ID
  status?: 'published' | 'draft'; // Product status
  featured?: boolean;
  new?: boolean;
}

export const products: Product[] = [
  {
    id: '1',
    name: 'VORTEX RTX 4090 EXTREME',
    category: 'Gaming PC',
    price: 4299,
    originalPrice: 4799,
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600',
    specs: ['RTX 4090 24GB', 'Intel i9-14900K', '64GB DDR5', '2TB NVMe SSD'],
    rating: 4.9,
    reviews: 234,
    stock: 15,
    featured: true,
  },
  {
    id: '2',
    name: 'PHANTOM RGB KEYBOARD',
    category: 'Peripherals',
    price: 189,
    image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=600',
    specs: ['Cherry MX Red', 'Per-key RGB', 'Aluminum Frame', 'USB-C'],
    rating: 4.7,
    reviews: 567,
    stock: 15,
    new: true,
  },
  {
    id: '3',
    name: 'NEXUS PRO GAMING MOUSE',
    category: 'Peripherals',
    price: 149,
    image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=600',
    specs: ['25600 DPI', '1000Hz Polling', '70g Ultralight', 'Wireless'],
    rating: 4.8,
    reviews: 892,
    stock: 15,
    featured: true,
  },
  {
    id: '4',
    name: 'AURORA 32" CURVED MONITOR',
    category: 'Monitors',
    price: 699,
    originalPrice: 849,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600',
    specs: ['4K 144Hz', '1ms Response', 'HDR1000', 'G-Sync'],
    rating: 4.6,
    reviews: 345,
    stock: 15,
    featured: true,
  },
  {
    id: '5',
    name: 'STRIKER ELITE HEADSET',
    category: 'Audio',
    price: 299,
    image: 'https://images.unsplash.com/photo-1599669454699-248893623440?w=600',
    specs: ['7.1 Surround', '50mm Drivers', 'RGB Earcups', 'Wireless'],
    rating: 4.5,
    reviews: 678,
    stock: 15,
  },
  {
    id: '6',
    name: 'TITAN RTX 4080 BUILD',
    category: 'Gaming PC',
    price: 2999,
    image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600',
    specs: ['RTX 4080 16GB', 'Intel i7-14700K', '32GB DDR5', '1TB NVMe'],
    rating: 4.8,
    reviews: 156,
    stock: 15,
    new: true,
  },
  {
    id: '7',
    name: 'QUANTUM GAMING CHAIR',
    category: 'Furniture',
    price: 449,
    originalPrice: 549,
    image: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=600',
    specs: ['4D Armrests', 'Lumbar Support', 'Memory Foam', 'RGB Base'],
    rating: 4.4,
    reviews: 423,
    stock: 15,
  },
  {
    id: '8',
    name: 'HYPERX MOUSEPAD XXL',
    category: 'Peripherals',
    price: 59,
    image: 'https://images.unsplash.com/photo-1616509091215-57bbece93654?w=600',
    specs: ['900x400mm', 'RGB Border', 'Micro-texture', 'USB Hub'],
    rating: 4.6,
    reviews: 1234,
    stock: 15,
  },
];

export const categories = [
  'All',
  'Gaming PC',
  'Peripherals',
  'Monitors',
  'Audio',
  'Furniture',
];
