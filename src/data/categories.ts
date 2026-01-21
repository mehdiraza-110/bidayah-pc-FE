export interface Category {
  id: string;
  category_name: string;
  image?: string; // Category image URL
  created_at?: string;
  updated_at?: string;
}

export const categories: Category[] = [
  {
    id: '1',
    category_name: 'Gaming PC',
  },
  {
    id: '2',
    category_name: 'Peripherals',
  },
  {
    id: '3',
    category_name: 'Monitors',
  },
  {
    id: '4',
    category_name: 'Audio',
  },
  {
    id: '5',
    category_name: 'Furniture',
  },
];
