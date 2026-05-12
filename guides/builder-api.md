
## Public PC Builder API

### 1. Get Categories and Vendors
**GET** `/api/v1/public/pc-builder/options`

Retrieves the categories and vendors needed to start the PC builder flow in one request.

#### Success Response (200)
```json
{
  "success": true,
  "message": "PC builder options retrieved successfully",
  "data": {
    "categories": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "category_name": "Processors",
        "image": "https://your-bucket.s3.ca-central-1.amazonaws.com/categories/cpu.webp",
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "vendors": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "vendor_name": "AMD",
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    ]
  },
  "counts": {
    "categories": 1,
    "vendors": 1
  }
}
```

---

### 2. Get Rule-Based Products
**GET** `/api/v1/public/pc-builder/products`

Returns published products matched by active PC builder filter rules for a selected category/vendor combination.

#### Query Parameters
- `selected_category_id` or `category_id` (UUID, required) - Selected category
- `selected_vendor_id` or `vendor_id` (UUID, optional) - Selected vendor
- `result_category_id` (UUID, optional) - Limit products to a specific target category
- `in_stock` (boolean/string, optional) - Filter by stock: 'true' or 'false'

**Note**: This endpoint always filters products by `status = 'published'`.

#### Examples
```
GET /api/v1/public/pc-builder/products?category_id=660e8400-e29b-41d4-a716-446655440001
GET /api/v1/public/pc-builder/products?selected_category_id=660e8400-e29b-41d4-a716-446655440001&selected_vendor_id=550e8400-e29b-41d4-a716-446655440000&result_category_id=770e8400-e29b-41d4-a716-446655440002&in_stock=true
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Matching PC builder products retrieved successfully",
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "name": "Compatible Motherboard",
      "category_id": "770e8400-e29b-41d4-a716-446655440002",
      "category_name": "Motherboards",
      "price": "199.99",
      "image": "https://your-bucket.s3.ca-central-1.amazonaws.com/products/motherboard.webp",
      "status": "published",
      "vendors": [],
      "media": [],
      "specs": []
    }
  ],
  "applied_rules": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "rule_name": "AMD CPU to AM5 Motherboards",
      "selected_category_id": "660e8400-e29b-41d4-a716-446655440001",
      "selected_vendor_id": "550e8400-e29b-41d4-a716-446655440000",
      "result_category_id": "770e8400-e29b-41d4-a716-446655440002",
      "result_vendor_id": null,
      "priority": 10
    }
  ],
  "count": 1
}
```

#### Error Responses
- **400 Bad Request**: `selected_category_id` or `category_id` is missing
- **500 Internal Server Error**: Server error
