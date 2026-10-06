# Dùng dbdiagram.io để xem

```sql
Table Language {
  id            int    [pk, increment]
  code          varchar(10) [not null, unique]  // Mã ngôn ngữ (vd: 'en', 'vi', 'fr')
  name          varchar(50)  [not null]         // Tên ngôn ngữ (vd: 'English', 'Tiếng Việt')
}

Table Product {
  id            int    [pk, increment]
  price         decimal(10,2) [not null]        // Giá sản phẩm
}

Table ProductTranslation {
  id            int    [pk, increment]
  product_id    int    [not null, ref: > Product.id]   // Liên kết đến bảng Product
  language_id   int    [not null, ref: > Language.id] // Liên kết đến bảng Language
  name          varchar(255) [not null]               // Tên sản phẩm theo ngôn ngữ
  description   text                                   // Mô tả sản phẩm theo ngôn ngữ
  Note: "Mỗi sản phẩm chỉ có một bản dịch cho mỗi ngôn ngữ."

  indexes {
    (product_id, language_id) [unique]
  }
}
```
