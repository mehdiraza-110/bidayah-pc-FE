export interface Vendor {
  id: string;
  vendor_name: string;
  created_at?: string;
  updated_at?: string;
}

export const vendors: Vendor[] = [
  {
    id: '1',
    vendor_name: 'NVIDIA',
  },
  {
    id: '2',
    vendor_name: 'AMD',
  },
  {
    id: '3',
    vendor_name: 'Intel',
  },
  {
    id: '4',
    vendor_name: 'Corsair',
  },
  {
    id: '5',
    vendor_name: 'Razer',
  },
];
