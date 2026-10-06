# Dùng dbdiagram.io để xem

```sql
Table Product {
  id Int [pk, increment]
  base_price Float
  virtual_price Float
  name String
  description String
}

// Đại diện biến thể cấp 1: Màu sắc, size,
Table Variant {
  id Int [pk, increment]
  name String // Màu sắc, Size
  productId Int [ref: > Product.id]

}

// Các value của biến thể cấp 1 (tức là cấp 2): Đỏ, cam, vàng, S, M, L, XL
Table VariantOption {
  id Int [pk, increment]
  value String // Đỏ, Cam, Vàng, ...
  variantId Int [ref: > Variant.id]
}


// Tổ hợp sinh ra khi kết hợp các biến thể lại với nhau
Table SKU {
  id Int [pk, increment]
  value String // Đỏ - S - Ngắn, Đỏ - M, Đỏ - L, Đỏ - XL, Cam - S...
  price Float
  stock Int
  images String[]
  productId Int [ref: > Product.id]
}


// Many-to-Many Relationships

Table skus_variant_options {
  sku_id Int [ref: > SKU.id]
  variant_option_id Int [ref: > VariantOption.id]
}
```
