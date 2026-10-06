# Giải thích Prisma Schema – E-commerce Backend

> Mục tiêu: giúp đọc file Prisma dễ hơn bằng cách hiểu **ý nghĩa nghiệp vụ**, **quan hệ giữa các bảng**, và **ví dụ dữ
> liệu thực tế** thay vì chỉ học thuộc syntax.

---

# 1. Bức tranh tổng thể

Schema này mô tả một hệ thống E-commerce / Marketplace gồm các nhóm chính:

- Authentication: User, Device, RefreshToken, VerificationCode
- Authorization: Role, Permission
- Catalog: Product, SKU, Brand, Category
- Đa ngôn ngữ: Language + các bảng Translation
- Shopping: CartItem
- Order: Order, ProductSKUSnapshot
- Payment: Payment, PaymentTransaction
- Review: Review, ReviewMedia
- Realtime: Message, Websocket

Có thể hình dung:

```text
User
 ├── Role ── Permission
 ├── Device ── RefreshToken
 ├── CartItem ── SKU ── Product
 ├── Order ── ProductSKUSnapshot
 │           └── Payment
 ├── Review
 ├── Message
 └── Websocket

Product
 ├── Brand
 ├── Category
 ├── SKU
 ├── Review
 └── ProductTranslation

Language
 ├── ProductTranslation
 ├── CategoryTranslation
 ├── BrandTranslation
 └── UserTranslation
```

---

# 2. generator client

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "cjs"
}
```

## Ý nghĩa

Phần này không phải bảng database.

Nó bảo Prisma:

> Hãy generate Prisma Client vào folder `../src/generated/prisma`.

Backend NestJS sau đó có thể import client này để query database.

Ví dụ:

```ts
const user = await prisma.user.findUnique({
  where: {
    id: 1
  }
});
```

---

# 3. datasource db

```prisma
datasource db {
  provider = "postgresql"
}
```

Schema này sử dụng PostgreSQL.

---

# 4. Language

```prisma
model Language {
  id   String @id @db.VarChar(10)
  name String @db.VarChar(500)
}
```

## Language dùng để làm gì?

Đây là bảng quản lý các ngôn ngữ mà hệ thống hỗ trợ.

Ví dụ:

| id  | name       |
| --- | ---------- |
| vi  | Vietnamese |
| en  | English    |
| ja  | Japanese   |

## Ví dụ record

```json
{
  "id": "vi",
  "name": "Vietnamese"
}
```

## Quan hệ

Một Language có thể được dùng bởi nhiều:

```text
Language
 ├── UserTranslation
 ├── ProductTranslation
 ├── CategoryTranslation
 └── BrandTranslation
```

Ví dụ:

```text
Language: vi
     │
     ├── ProductTranslation
     │     "Giày Nike Air Force 1"
     │
     ├── CategoryTranslation
     │     "Giày thể thao"
     │
     └── BrandTranslation
           "Nike Việt Nam"
```

---

# 5. User

Đây là một trong những model trung tâm nhất của hệ thống.

```prisma
model User {
  id          Int
  email       String
  name        String
  password    String
  phoneNumber String
  avatar      String?

  status UserStatus
  roleId Int
  role   Role
}
```

## User đại diện cho gì?

Một account trong hệ thống.

Có thể là:

```text
Customer
Admin
Staff
Shop
Seller
```

tuỳ vào Role.

## Ví dụ record

```json
{
  "id": 10,
  "email": "mioriaty@example.com",
  "name": "Mioriaty",
  "password": "$2b$10$...",
  "phoneNumber": "0901234567",
  "avatar": "https://cdn.example.com/avatar.jpg",
  "status": "ACTIVE",
  "roleId": 2
}
```

## Quan hệ

User có rất nhiều quan hệ:

```text
User
 ├── Role
 ├── Device[]
 ├── RefreshToken[]
 ├── CartItem[]
 ├── Order[]
 ├── Review[]
 ├── Message[]
 └── Websocket[]
```

Ví dụ:

```text
User #10
 ├── Role: CUSTOMER
 ├── Device: Chrome MacBook
 ├── Device: iPhone
 ├── Cart: Nike AF1 White / 42
 ├── Order #500
 └── Review: 5 stars
```

---

# 6. Self relation trong User

Schema có:

```prisma
createdById  Int?
createdBy    User?
createdUsers User[]
```

## Ý nghĩa

Một User có thể được tạo bởi một User khác.

Ví dụ Admin tạo Staff:

```text
Admin #1
   │
   └── tạo
        │
        ▼
Staff #20
```

Database:

```text
Staff #20
createdById = 1
```

Sau đó:

```text
Admin #1
createdUsers = [Staff #20]
```

Tương tự có:

```text
updatedBy
deletedBy
```

để audit ai sửa và ai xóa account.

---

# 7. UserTranslation

```prisma
model UserTranslation {
  userId      Int
  languageId  String
  address     String?
  description String?
}
```

## Tại sao User cần Translation?

Một số thông tin profile có thể khác theo ngôn ngữ.

Ví dụ một shop có description:

English:

```text
Premium sneaker store in Hanoi.
```

Vietnamese:

```text
Cửa hàng sneaker cao cấp tại Hà Nội.
```

## Ví dụ

```json
{
  "id": 1,
  "userId": 10,
  "languageId": "vi",
  "address": "Hà Nội, Việt Nam",
  "description": "Cửa hàng chuyên sneaker cao cấp."
}
```

Quan hệ:

```text
User #10
 │
 ├── UserTranslation (vi)
 └── UserTranslation (en)
```

---

# 8. VerificationCode

```prisma
model VerificationCode {
  email     String
  code      String
  type      VerificationCodeType
  expiresAt DateTime
}
```

## Dùng khi nào?

Dùng cho OTP / verification code.

Ví dụ:

```text
Đăng ký account
Quên password
Login OTP
Disable 2FA
```

## Ví dụ record

```json
{
  "email": "mioriaty@example.com",
  "code": "839241",
  "type": "FORGOT_PASSWORD",
  "expiresAt": "2026-10-06T16:10:00Z"
}
```

Flow:

```text
POST /forgot-password
       │
       ▼
Generate OTP
       │
       ▼
Save VerificationCode
       │
       ▼
Send email
       │
       ▼
User submit OTP
       │
       ▼
Check code + expiresAt
```

## `@@unique([email, type])`

Điều này có nghĩa:

Một email chỉ có một verification code cho mỗi type.

Ví dụ hợp lệ:

```text
abc@gmail.com + REGISTER
abc@gmail.com + FORGOT_PASSWORD
```

Nhưng không được có hai:

```text
abc@gmail.com + FORGOT_PASSWORD
abc@gmail.com + FORGOT_PASSWORD
```

---

# 9. Device

```prisma
model Device {
  id         Int
  userId     Int
  userAgent  String
  ip         String
  lastActive DateTime
  isActive   Boolean
}
```

## Device dùng làm gì?

Lưu các thiết bị mà user đăng nhập.

Ví dụ:

```text
MacBook Chrome
iPhone Safari
iPad
Windows PC
```

## Ví dụ record

```json
{
  "id": 100,
  "userId": 10,
  "userAgent": "Chrome 154 / macOS",
  "ip": "113.22.xxx.xxx",
  "isActive": true
}
```

## Quan hệ

```text
User #10
 ├── Device #100 - MacBook
 └── Device #101 - iPhone
```

Backend có thể làm tính năng:

```text
Logged in devices

✓ MacBook
✓ iPhone
```

Và cho user chọn:

```text
Logout iPhone
```

---

# 10. RefreshToken

```prisma
model RefreshToken {
  token     String
  userId    Int
  deviceId  Int
  expiresAt DateTime
}
```

## RefreshToken dùng làm gì?

Access token thường sống ngắn.

Ví dụ:

```text
Access Token: 15 phút
Refresh Token: 30 ngày
```

Khi access token hết hạn:

```text
Frontend
  │
  │ refreshToken
  ▼
POST /auth/refresh
  │
  ▼
Backend
  │
  ▼
New Access Token
```

## Ví dụ record

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "userId": 10,
  "deviceId": 100,
  "expiresAt": "2026-11-06T10:00:00Z"
}
```

## Quan hệ

```text
User
 │
 ▼
Device
 │
 ├── RefreshToken #1
 └── RefreshToken #2
```

Khi user logout Device #100:

```text
delete/revoke refresh tokens của Device #100
```

nhưng Device #101 vẫn login bình thường.

---

# 11. Permission

```prisma
model Permission {
  name        String
  description String
  path        String
  method      HTTPMethod
  module      String
}
```

## Permission là gì?

Permission đại diện cho một quyền cụ thể.

Ví dụ:

```json
{
  "name": "Create Product",
  "path": "/products",
  "method": "POST",
  "module": "PRODUCT"
}
```

Có thể có:

```text
GET    /products
POST   /products
PATCH  /products/:id
DELETE /products/:id
```

Mỗi cái là một permission.

---

# 12. Role

```prisma
model Role {
  name        String
  description String
  isActive    Boolean

  permissions Permission[]
  users       User[]
}
```

## Role là gì?

Role là một nhóm quyền.

Ví dụ:

```text
ADMIN
CUSTOMER
STAFF
SELLER
```

Ví dụ ADMIN:

```text
ADMIN
 ├── Create Product
 ├── Update Product
 ├── Delete Product
 ├── Read User
 └── Block User
```

CUSTOMER:

```text
CUSTOMER
 ├── Read Product
 ├── Create Cart
 ├── Create Order
 └── Create Review
```

Quan hệ:

```text
Role N ───── N Permission
```

Một Role có nhiều Permission.

Một Permission cũng có thể thuộc nhiều Role.

---

# 13. Product

```prisma
model Product {
  name         String
  basePrice    Float
  virtualPrice Float
  brandId      Int
  images       String[]
  variants     Json
}
```

## Product là gì?

Product là sản phẩm ở mức tổng quát.

Ví dụ:

```text
Nike Air Force 1
```

chưa nói size hay màu cụ thể.

## Ví dụ

```json
{
  "id": 1,
  "name": "Nike Air Force 1",
  "basePrice": 2500000,
  "virtualPrice": 3000000,
  "brandId": 1,
  "images": ["af1-1.jpg", "af1-2.jpg"],
  "variants": {
    "Color": ["White", "Black"],
    "Size": ["40", "41", "42"]
  }
}
```

## `basePrice`

Có thể hiểu là giá gốc / giá bán cơ sở.

## `virtualPrice`

Thường có thể dùng làm giá niêm yết để hiển thị discount.

Ví dụ:

```text
virtualPrice = 3,000,000
basePrice    = 2,500,000

UI:
3,000,000₫
2,500,000₫
```

Ý nghĩa chính xác phụ thuộc business logic của project.

---

# 14. ProductTranslation

```prisma
model ProductTranslation {
  productId   Int
  languageId  String
  name        String
  description String
}
```

## Ví dụ

Product:

```text
Nike Air Force 1
```

English:

```json
{
  "productId": 1,
  "languageId": "en",
  "name": "Nike Air Force 1",
  "description": "Classic Nike sneakers."
}
```

Vietnamese:

```json
{
  "productId": 1,
  "languageId": "vi",
  "name": "Giày Nike Air Force 1",
  "description": "Mẫu sneaker cổ điển của Nike."
}
```

Quan hệ:

```text
Product #1
 ├── Translation EN
 ├── Translation VI
 └── Translation JA
```

---

# 15. Category

```prisma
model Category {
  name String

  parentCategoryId   Int?
  parentCategory     Category?
  childrenCategories Category[]
}
```

## Category dùng làm gì?

Phân loại Product.

Ví dụ:

```text
Fashion
 ├── Shoes
 │    ├── Sneakers
 │    └── Running Shoes
 │
 └── Clothes
      ├── T-Shirt
      └── Jacket
```

## Ví dụ record

```json
{
  "id": 10,
  "name": "Sneakers",
  "parentCategoryId": 5
}
```

Trong đó:

```text
Category #5 = Shoes
Category #10 = Sneakers
```

Quan hệ:

```text
Shoes
  │
  └── Sneakers
```

Đây gọi là:

> Self Relation

Vì Category relation với chính Category.

---

# 16. Product và Category

Schema:

```prisma
Product {
  categories Category[]
}

Category {
  products Product[]
}
```

Đây là quan hệ:

```text
Many-to-Many
```

Ví dụ một Product:

```text
Nike Air Force 1
```

có thể thuộc:

```text
Sneakers
Men
Shoes
Lifestyle
```

Trong khi Category `Sneakers` lại có:

```text
Nike Air Force 1
Adidas Samba
New Balance 550
```

---

# 17. CategoryTranslation

```prisma
model CategoryTranslation {
  categoryId Int
  languageId String

  name        String
  description String
}
```

Ví dụ:

```text
Category #10
```

English:

```json
{
  "languageId": "en",
  "name": "Sneakers",
  "description": "Casual sneaker shoes."
}
```

Vietnamese:

```json
{
  "languageId": "vi",
  "name": "Giày Sneaker",
  "description": "Các mẫu sneaker thời trang."
}
```

---

# 18. SKU

Đây là model cực kỳ quan trọng trong E-commerce.

```prisma
model SKU {
  value     String
  price     Float
  stock     Int
  image     String
  productId Int
}
```

## Product khác SKU như thế nào?

Product:

```text
Nike Air Force 1
```

SKU:

```text
Nike Air Force 1
Color = White
Size = 42
```

Một Product có thể có:

```text
Nike Air Force 1
 │
 ├── White / 40
 ├── White / 41
 ├── White / 42
 ├── Black / 40
 ├── Black / 41
 └── Black / 42
```

Mỗi item trên chính là một SKU.

## Ví dụ record

```json
{
  "id": 1001,
  "value": "White-42",
  "price": 2500000,
  "stock": 5,
  "image": "af1-white.jpg",
  "productId": 1
}
```

## Ý nghĩa

User thực tế không mua Product.

User mua SKU.

```text
Sai:
Cart → Product

Đúng:
Cart → SKU → Product
```

Vì backend cần biết:

```text
màu gì?
size nào?
còn bao nhiêu hàng?
giá của variant này là bao nhiêu?
```

---

# 19. Brand

```prisma
model Brand {
  logo String
  name String

  products Product[]
}
```

## Ví dụ

```json
{
  "id": 1,
  "name": "Nike",
  "logo": "nike-logo.svg"
}
```

Quan hệ:

```text
Nike
 │
 ├── Air Force 1
 ├── Air Jordan 1
 └── Dunk Low
```

Đây là:

```text
Brand 1 ───── N Product
```

---

# 20. BrandTranslation

Dùng để lưu thông tin Brand theo từng ngôn ngữ.

Ví dụ:

```json
{
  "brandId": 1,
  "languageId": "vi",
  "name": "Nike Việt Nam",
  "description": "Thương hiệu thời trang thể thao."
}
```

Có thể hữu ích nếu website hỗ trợ nội dung marketing đa ngôn ngữ.

---

# 21. CartItem

```prisma
model CartItem {
  quantity Int
  skuId    Int
  userId   Int
}
```

## CartItem đại diện cho gì?

Một item trong giỏ hàng.

Ví dụ:

User thêm:

```text
Nike AF1
White
Size 42
Quantity 2
```

Database:

```json
{
  "id": 1,
  "userId": 10,
  "skuId": 1001,
  "quantity": 2
}
```

Quan hệ:

```text
User
 │
 ▼
CartItem
 │
 ▼
SKU
 │
 ▼
Product
```

## `@@unique([userId, skuId])`

Điều này rất quan trọng.

Không cho phép:

```text
CartItem
userId = 10
skuId = 1001
quantity = 1

CartItem
userId = 10
skuId = 1001
quantity = 1
```

Thay vào đó phải:

```text
userId = 10
skuId = 1001
quantity = 2
```

Khi user bấm Add to cart lần nữa:

```text
quantity++
```

---

# 22. ProductSKUSnapshot

```prisma
model ProductSKUSnapshot {
  productName String
  skuPrice    Float
  image       String
  skuValue    String
  quantity    Int
}
```

## Đây là bảng rất quan trọng

Giả sử hôm nay khách mua:

```text
Nike AF1
White / 42
2,500,000₫
```

Một tháng sau admin update:

```text
Tên: Nike AF1 Premium
Giá: 3,200,000₫
Ảnh: new-image.jpg
```

Nếu Order đọc trực tiếp dữ liệu hiện tại của Product/SKU thì lịch sử order có thể thành:

```text
Order 1 tháng trước

Nike AF1 Premium
3,200,000₫
```

Sai lịch sử.

Do đó khi checkout backend copy dữ liệu sản phẩm vào snapshot.

Ví dụ:

```json
{
  "productName": "Nike Air Force 1",
  "skuValue": "White-42",
  "skuPrice": 2500000,
  "image": "af1-white.jpg",
  "quantity": 2
}
```

Dù Product thay đổi sau này, Order vẫn giữ đúng:

```text
Tên lúc mua
Giá lúc mua
Variant lúc mua
Ảnh lúc mua
Số lượng lúc mua
```

Đây gọi là:

> Snapshot historical data.

Một concept backend rất quan trọng.

---

# 23. Order

```prisma
model Order {
  userId    Int
  status    OrderStatus
  receiver  Json
  shopId    Int?
  paymentId Int
}
```

## Order đại diện cho gì?

Một đơn hàng.

Ví dụ:

```json
{
  "id": 500,
  "userId": 10,
  "status": "PENDING_DELIVERY",
  "receiver": {
    "name": "Mioriaty",
    "phone": "0901234567",
    "address": "Hanoi"
  },
  "shopId": 20,
  "paymentId": 300
}
```

## `receiver` là snapshot

Receiver có thể chứa:

```json
{
  "name": "Nguyen Van A",
  "phone": "0901234567",
  "address": "123 ABC Street"
}
```

Tại sao không chỉ lấy từ User?

Bởi vì sau khi order:

```text
User đổi địa chỉ
```

thì Order cũ vẫn phải giữ địa chỉ giao hàng lúc đặt.

Tư duy này giống ProductSKUSnapshot.

---

# 24. OrderStatus

```text
PENDING_PAYMENT
PENDING_PICKUP
PENDING_DELIVERY
DELIVERED
RETURNED
CANCELLED
```

Flow thường sẽ là:

```text
PENDING_PAYMENT
       │
       ▼
PENDING_PICKUP
       │
       ▼
PENDING_DELIVERY
       │
       ▼
DELIVERED
```

Hoặc:

```text
PENDING_PAYMENT
       │
       ▼
CANCELLED
```

Hoặc:

```text
DELIVERED
   │
   ▼
RETURNED
```

---

# 25. Payment

```prisma
model Payment {
  status PaymentStatus
  orders Order[]
}
```

## Payment đại diện cho gì?

Trạng thái thanh toán của một lần payment.

Ví dụ:

```json
{
  "id": 300,
  "status": "SUCCESS"
}
```

Các status:

```text
PENDING
SUCCESS
FAILED
```

## Tại sao Payment có nhiều Order?

Schema cho phép:

```text
Payment
   │
   ├── Order Shop A
   ├── Order Shop B
   └── Order Shop C
```

Điều này hợp lý với marketplace.

Ví dụ cart có sản phẩm từ 3 shop.

User thanh toán một lần:

```text
Total = 3,000,000₫
```

Backend tạo:

```text
Payment #300
```

sau đó tách thành:

```text
Order #501 → Shop A
Order #502 → Shop B
Order #503 → Shop C
```

---

# 26. PaymentTransaction

```prisma
model PaymentTransaction {
  gateway            String
  transactionDate    DateTime
  accountNumber      String?
  subAccount         String?
  amountIn           Int
  amountOut          Int
  accumulated        Int
  code               String?
  transactionContent String?
  referenceNumber    String?
  body               String?
}
```

## PaymentTransaction là gì?

Đây giống raw transaction lấy từ ngân hàng hoặc payment gateway.

Ví dụ:

```json
{
  "gateway": "VCB",
  "amountIn": 2500000,
  "amountOut": 0,
  "transactionContent": "PAY ORDER500",
  "referenceNumber": "VCB123ABC"
}
```

Flow có thể là:

```text
User chuyển khoản
      │
      ▼
Bank webhook
      │
      ▼
PaymentTransaction
      │
      ▼
Backend match transaction
      │
      ▼
Payment SUCCESS
```

## Điểm cần lưu ý

Trong schema hiện tại:

```text
PaymentTransaction
```

chưa có relation trực tiếp với:

```text
Payment
Order
```

Nghĩa là logic matching có thể đang được xử lý ở application layer.

---

# 27. Websocket

```prisma
model Websocket {
  id     String
  userId Int
}
```

## Websocket dùng làm gì?

Lưu websocket connection đang hoạt động.

Ví dụ:

```json
{
  "id": "socket-abc-123",
  "userId": 10
}
```

Flow:

```text
User mở website
      │
      ▼
WebSocket connect
      │
      ▼
socketId = abc123
      │
      ▼
save Websocket
```

Khi có message:

```text
Message tới User #10
      │
      ▼
Find Websocket của User #10
      │
      ▼
emit("new-message")
```

---

# 28. Review

```prisma
model Review {
  content     String
  rating      Int
  orderId     Int
  productId   Int
  userId      Int
  updateCount Int
}
```

## Review đại diện cho gì?

Một đánh giá của customer cho Product đã mua.

Ví dụ:

```json
{
  "id": 50,
  "content": "Giày đẹp, giao nhanh.",
  "rating": 5,
  "orderId": 500,
  "productId": 1,
  "userId": 10,
  "updateCount": 0
}
```

Quan hệ:

```text
User
 │
Order
 │
Product
 │
 ▼
Review
```

## `@@unique([orderId, productId])`

Một product trong một order chỉ được review một lần.

Ví dụ:

```text
Order #500
 └── Nike Air Force 1
```

chỉ có một Review.

User không thể spam:

```text
Review 1
Review 2
Review 3
```

cho cùng product trong cùng order.

---

# 29. ReviewMedia

```prisma
model ReviewMedia {
  url      String
  type     MediaType
  reviewId Int
}
```

Dùng để lưu ảnh/video đính kèm review.

Ví dụ:

```json
{
  "url": "https://cdn.example.com/review1.jpg",
  "type": "IMAGE",
  "reviewId": 50
}
```

Một Review:

```text
★★★★★
"Giày đẹp"

 ├── image1.jpg
 ├── image2.jpg
 └── video1.mp4
```

Quan hệ:

```text
Review 1 ───── N ReviewMedia
```

---

# 30. Message

```prisma
model Message {
  fromUserId Int
  toUserId   Int
  content    String

  readAt    DateTime?
  createdAt DateTime
}
```

## Message dùng để làm gì?

Chat giữa hai User.

Ví dụ:

```json
{
  "id": 1000,
  "fromUserId": 10,
  "toUserId": 20,
  "content": "Shop ơi còn size 42 không?",
  "readAt": null
}
```

Flow:

```text
User #10
   │
   │ "Còn size 42 không?"
   ▼
Message
   │
   ▼
User #20
```

Khi chưa đọc:

```text
readAt = null
```

Khi đọc:

```text
readAt = 2026-10-06 16:00
```

---

# 31. Các enum

## PaymentStatus

```text
PENDING
SUCCESS
FAILED
```

Ví dụ:

```text
PENDING
   │
   ├── payment success → SUCCESS
   │
   └── payment error → FAILED
```

---

## OrderStatus

```text
PENDING_PAYMENT
PENDING_PICKUP
PENDING_DELIVERY
DELIVERED
RETURNED
CANCELLED
```

---

## VerificationCodeType

```text
REGISTER
FORGOT_PASSWORD
LOGIN
DISABLE_2FA
```

---

## UserStatus

```text
ACTIVE
BLOCKED
```

Ví dụ:

```text
ACTIVE
```

User login bình thường.

```text
BLOCKED
```

Backend có thể reject:

```http
403 Forbidden
```

---

## HTTPMethod

```text
GET
POST
PUT
DELETE
PATCH
OPTIONS
HEAD
```

Dùng cho Permission.

Ví dụ:

```text
POST /products
```

khác:

```text
DELETE /products/:id
```

---

## MediaType

```text
IMAGE
VIDEO
```

Dùng cho ReviewMedia.

---

# 32. Audit fields

Rất nhiều model có:

```prisma
createdById
updatedById
deletedById

createdAt
updatedAt
deletedAt
```

## Ý nghĩa

### createdBy

Ai tạo record?

Ví dụ:

```text
Admin A tạo Product
```

```text
createdById = Admin A
```

### updatedBy

Ai sửa record?

```text
Admin B sửa Product
```

```text
updatedById = Admin B
```

### deletedBy

Ai xóa?

```text
Admin C xóa Product
```

```text
deletedById = Admin C
```

Từ đó có audit log:

```text
Product #10

Created by: Admin A
Updated by: Admin B
Deleted by: Admin C
```

---

# 33. Soft Delete

Schema dùng rất nhiều:

```prisma
deletedAt DateTime?
```

Thay vì xóa thật:

```sql
DELETE FROM product WHERE id = 10;
```

Backend có thể:

```text
deletedAt = current timestamp
```

Ví dụ:

```json
{
  "id": 10,
  "name": "Nike AF1",
  "deletedAt": "2026-10-06T16:00:00Z"
}
```

Query bình thường:

```text
WHERE deletedAt IS NULL
```

Record vẫn còn trong DB nhưng được xem là đã xóa.

## Lợi ích

- Có thể restore
- Giữ audit history
- Tránh mất dữ liệu
- Hạn chế làm hỏng relation

---

# 34. onDelete: Cascade

Ví dụ:

```prisma
product Product @relation(
  fields: [productId],
  references: [id],
  onDelete: Cascade
)
```

Có nghĩa:

```text
Delete Product
     │
     ▼
Delete records phụ thuộc
```

Ví dụ:

```text
Product
 └── ProductTranslation
```

Delete Product thì ProductTranslation cũng bị delete.

---

# 35. onDelete: SetNull

Ví dụ:

```text
ProductSKUSnapshot
     │
     └── skuId
```

Nếu SKU bị xóa:

```text
skuId = null
```

nhưng Snapshot vẫn tồn tại.

Điều này rất hợp lý vì Order history không được mất.

---

# 36. onDelete: NoAction

Database không tự xử lý.

Ví dụ:

```text
User
 │
 └── Order
```

Nếu cố delete User đang có Order, DB có thể reject nếu foreign key vẫn tồn tại.

Application cần tự xử lý business logic.

---

# 37. Quan hệ database cần nhớ

## One-to-One

Ví dụ lý thuyết:

```text
User 1 ─── 1 Profile
```

Schema hiện tại không có ví dụ điển hình rõ ràng của one-to-one.

---

## One-to-Many

Ví dụ:

```text
Brand 1 ───── N Product
```

Một Brand có nhiều Product.

Một Product chỉ thuộc một Brand.

---

## Many-to-Many

Ví dụ:

```text
Product N ───── N Category
```

Một Product có nhiều Category.

Một Category chứa nhiều Product.

---

## Self Relation

Ví dụ:

```text
Category
   │
   ▼
Category
```

Cụ thể:

```text
Fashion
 └── Shoes
      └── Sneakers
```

Hoặc User:

```text
Admin User
    │
    └── created
         │
         ▼
       Staff User
```

---

# 38. Flow hoàn chỉnh của hệ thống

## Flow 1 – Register

```text
User nhập email
      │
      ▼
VerificationCode
      │
      ▼
verify OTP
      │
      ▼
Create User
      │
      ▼
Assign Role
```

---

## Flow 2 – Login

```text
User login
    │
    ▼
Verify password
    │
    ▼
Create / find Device
    │
    ▼
Generate Access Token
    │
    ▼
Generate RefreshToken
```

---

## Flow 3 – Browse Product

```text
Category
   │
   ▼
Product
 ├── Brand
 ├── Translation
 ├── Images
 ├── Variants
 └── SKU
```

---

## Flow 4 – Add To Cart

```text
User chọn:

Nike Air Force 1
White
Size 42
Quantity = 2
```

Backend:

```text
Product
   │
   ▼
SKU White-42
   │
   ▼
CartItem
```

Record:

```json
{
  "userId": 10,
  "skuId": 1001,
  "quantity": 2
}
```

---

# 39. Checkout Flow

Cart:

```text
CartItem #1
Nike AF1 White-42 x2
```

Checkout:

```text
CartItem
   │
   ▼
Validate stock
   │
   ▼
Create Payment
   │
   ▼
Create Order
   │
   ▼
Create ProductSKUSnapshot
   │
   ▼
Decrease SKU stock
   │
   ▼
Clear Cart
```

Ví dụ:

```text
SKU stock trước = 5

Customer mua = 2

SKU stock sau = 3
```

---

# 40. Payment Flow

```text
Order
  │
  ▼
Payment PENDING
  │
  ▼
Customer payment
  │
  ▼
Payment gateway / Bank
  │
  ▼
PaymentTransaction
  │
  ▼
Verify
  │
  ▼
Payment SUCCESS
  │
  ▼
Order PENDING_PICKUP
```

---

# 41. Delivery Flow

```text
PENDING_PAYMENT
      │
      ▼
PENDING_PICKUP
      │
      ▼
PENDING_DELIVERY
      │
      ▼
DELIVERED
```

---

# 42. Review Flow

Sau khi:

```text
Order = DELIVERED
```

User có thể:

```text
Create Review
```

Flow:

```text
User
 │
 ▼
Order
 │
 ▼
Product
 │
 ▼
Review
 │
 └── ReviewMedia
```

---

# 43. Chat Flow

```text
Customer
   │
   │ send message
   ▼
Message
   │
   ▼
Database
   │
   ▼
WebSocket
   │
   ▼
Shop nhận realtime
```

---

# 44. Cách đọc Prisma Model

Giả sử thấy:

```prisma
model CartItem {
  userId Int
  user   User @relation(
    fields: [userId],
    references: [id]
  )
}
```

Hãy đọc:

> CartItem có một foreign key `userId` trỏ tới `User.id`.

---

Nếu thấy:

```prisma
products Product[]
```

Hãy đọc:

> Model này liên quan tới nhiều Product.

---

Nếu hai bên đều:

```prisma
Product {
  categories Category[]
}

Category {
  products Product[]
}
```

Hãy đọc:

> Product và Category là many-to-many.

---

Nếu thấy:

```prisma
parentCategory Category?
childrenCategories Category[]
```

Hãy đọc:

> Đây là self relation.

---

# 45. Những model quan trọng nhất nên học sâu

Nếu đang học Backend / NestJS, nên ưu tiên:

```text
1. User
2. Role
3. Permission
4. Device
5. RefreshToken
6. Product
7. SKU
8. Category
9. CartItem
10. Order
11. ProductSKUSnapshot
12. Payment
13. Review
```

---

# 46. Những concept Backend học được từ schema này

Schema này không chỉ giúp học Prisma mà còn chứa rất nhiều concept backend quan trọng.

## Authentication

```text
User
Device
RefreshToken
VerificationCode
```

---

## Authorization / RBAC

```text
User
 ↓
Role
 ↓
Permission
```

---

## Product Modeling

```text
Product
 ↓
Variant
 ↓
SKU
```

---

## Hierarchical Data

```text
Category
 ↓
Category
 ↓
Category
```

---

## Shopping Cart

```text
User
 ↓
CartItem
 ↓
SKU
```

---

## Historical Data

```text
Order
 ↓
ProductSKUSnapshot
```

---

## Soft Delete

```text
deletedAt
```

---

## Audit Trail

```text
createdBy
updatedBy
deletedBy
```

---

## Multilingual Data

```text
Language
 ↓
Translation Tables
```

---

## Realtime Communication

```text
Message
 ↓
WebSocket
```

---

# 47. Cách tư duy khi nhìn từng model

Thay vì hỏi:

> Field này viết Prisma syntax như thế nào?

Hãy hỏi:

### 1. Model này đại diện cho object nào ngoài đời?

Ví dụ:

```text
SKU
```

→ một phiên bản sản phẩm cụ thể.

---

### 2. Ai sở hữu nó?

Ví dụ:

```text
CartItem
```

→ User.

---

### 3. Nó phụ thuộc vào model nào?

Ví dụ:

```text
CartItem
```

phụ thuộc vào:

```text
User
SKU
```

---

### 4. Nếu parent bị delete thì chuyện gì xảy ra?

Hãy nhìn:

```text
Cascade
SetNull
NoAction
```

---

### 5. Dữ liệu có cần lưu lịch sử không?

Nếu có, có thể cần snapshot.

Ví dụ:

```text
ProductSKUSnapshot
receiver Json
```

---

# 48. Bản đồ quan hệ cuối cùng

```text
                       Permission
                           ▲
                           │
                           │ M:N
                           ▼
                         Role
                           │
                           │ 1:N
                           ▼
                          User
          ┌────────────────┼──────────────────┐
          │                │                  │
          ▼                ▼                  ▼
       Device           CartItem            Order
          │                │                  │
          ▼                ▼                  ├── Payment
    RefreshToken          SKU                 │
                           │                  ├── ProductSKUSnapshot
                           ▼                  │
                        Product ◄─────────────┘
                    ┌──────┼───────┐
                    │      │       │
                    ▼      ▼       ▼
                  Brand Category  Review
                           │         │
                           │         ▼
                           │    ReviewMedia
                           │
                           ▼
                       Category
                      (self relation)
```

Đa ngôn ngữ:

```text
Language
 ├── ProductTranslation ─── Product
 ├── CategoryTranslation ── Category
 ├── BrandTranslation ───── Brand
 └── UserTranslation ────── User
```

Realtime:

```text
User A
  │
  ▼
Message
  │
  ▼
User B
  │
  ▼
Websocket
```

---

# 49. Checklist tự kiểm tra

Sau khi đọc xong, hãy thử tự trả lời:

1. Product khác SKU ở đâu?
2. Tại sao CartItem lưu `skuId` chứ không lưu `productId`?
3. Tại sao Order cần `ProductSKUSnapshot`?
4. Role và Permission là quan hệ gì?
5. Product và Category là quan hệ gì?
6. `deletedAt` dùng để làm gì?
7. `onDelete: Cascade` khác `SetNull` thế nào?
8. Device và RefreshToken giúp giải quyết vấn đề gì?
9. Tại sao Category cần self relation?
10. Vì sao Order lưu `receiver` dưới dạng snapshot?
11. Payment khác PaymentTransaction thế nào?
12. `@@unique([userId, skuId])` giải quyết vấn đề gì?
13. `@@unique([orderId, productId])` trên Review có tác dụng gì?
14. Translation table giúp hệ thống multilingual như thế nào?
15. `createdBy`, `updatedBy`, `deletedBy` dùng cho mục đích gì?

Nếu có thể tự giải thích rõ 15 câu trên mà không nhìn tài liệu, bạn đã hiểu phần lớn thiết kế database trong schema này.

---

# 50. Thứ tự nên học lại

Khuyên học theo thứ tự:

```text
User
 ↓
Role / Permission
 ↓
Device / RefreshToken
 ↓
Product
 ↓
SKU
 ↓
Brand
 ↓
Category
 ↓
CartItem
 ↓
Order
 ↓
ProductSKUSnapshot
 ↓
Payment
 ↓
Review
 ↓
Translation
 ↓
Message / Websocket
```

Đừng cố thuộc toàn bộ Prisma syntax ngay từ đầu.

Mục tiêu trước tiên là:

> Nhìn model và hiểu dữ liệu ngoài đời mà nó đang biểu diễn.

Sau đó mới học sâu:

```text
@id
@default
@relation
@unique
@@unique
@@index
onDelete
onUpdate
```

Đó là cách chuyển từ tư duy Frontend sang tư duy Backend / Database hiệu quả hơn.
