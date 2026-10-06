```sql
Table Language {
  id Int [pk, increment]
  name String
  code String [unique]

  createdById Int [ref: > User.id, null]
  updatedById Int [ref: > User.id, null]

  deletedAt DateTime [null]
  createdAt DateTime [default: `now()`]
  updatedAt DateTime
}

Table User {
  id Int [pk, increment]
  email String [unique]
  name String
  password String
  phoneNumber String
  avatar String [null]
  totpSecret String [null]
  status UserStatus [default: 'ACTIVE']
  roleId Int [ref: > Role.id]

  createdById Int [ref: > User.id, null]
  updatedById Int [ref: > User.id, null]

  deletedAt DateTime [null]
  createdAt DateTime [default: `now()`]
  updatedAt DateTime
}

Table UserTranslation {
  id Int [pk, increment]
  userId Int [ref: > User.id]
  languageId Int [ref: > Language.id]
  address String [null]
  description String [null]

  createdById Int [ref: > User.id, null]
  updatedById Int [ref: > User.id, null]

  deletedAt DateTime [null]
  createdAt DateTime [default: `now()`]
  updatedAt DateTime
}

Table VerificationCode {
  id Int [pk, increment]
  email String
  code String
  type VerificationCodeType

  expiresAt DateTime
  createdAt DateTime [default: `now()`]

  indexes {
    (email, code, type)
    expiresAt
  }
}

Table RefreshToken {
  token String [unique]
  userId Int [ref: > User.id]

  expiresAt DateTime
  createdAt DateTime [default: `now()`]

  indexes {
    expiresAt
  }
}

Table Permission {
  id Int [pk, increment]
  name String
  description String
  path String
  method HTTPMethod

  createdById Int [ref: > User.id, null]
  updatedById Int [ref: > User.id, null]

  deletedAt DateTime [null]
  createdAt DateTime [default: `now()`]
  updatedAt DateTime
}

Table Role {
  id Int [pk, increment]
  name String [unique]
  description String
  isActive Boolean [default: true]

  createdById Int [ref: > User.id, null]
  updatedById Int [ref: > User.id, null]

  deletedAt DateTime [null]
  createdAt DateTime [default: `now()`]
  updatedAt DateTime
}

Table Product {
  id Int [pk, increment]
  base_price Float
  virtual_price Float
  brandId Int [ref: > Brand.id]
  images String[]

  createdById Int [ref: > User.id, null]
  updatedById Int [ref: > User.id, null]

  deletedAt DateTime [null]
  createdAt DateTime [default: `now()`]
  updatedAt DateTime
}

Table ProductTranslation {
  id Int [pk, increment]
  productId Int [ref: > Product.id]
  languageId Int [ref: > Language.id]
  name String
  description String

  createdById Int [ref: > User.id, null]
  updatedById Int [ref: > User.id, null]

  deletedAt DateTime [null]
  createdAt DateTime [default: `now()`]
  updatedAt DateTime
}

Table Category {
  id Int [pk, increment]
  parentCategoryId Int [ref: > Category.id, null]

  createdById Int [ref: > User.id, null]
  updatedById Int [ref: > User.id, null]

  deletedAt DateTime [null]
  createdAt DateTime [default: `now()`]
  updatedAt DateTime
}

Table CategoryTranslation {
  id Int [pk, increment]
  categoryId Int [ref: > Category.id]
  languageId Int [ref: > Language.id]
  name String
  description String

  createdById Int [ref: > User.id, null]
  updatedById Int [ref: > User.id, null]

  deletedAt DateTime [null]
  createdAt DateTime [default: `now()`]
  updatedAt DateTime
}

Table Variant {
  id Int [pk, increment]
  name String
  productId Int [ref: > Product.id]

  createdById Int [ref: > User.id, null]
  updatedById Int [ref: > User.id, null]

  deletedAt DateTime [null]
  createdAt DateTime [default: `now()`]
  updatedAt DateTime
}

Table VariantOption {
  id Int [pk, increment]
  value String
  variantId Int [ref: > Variant.id]

  createdById Int [ref: > User.id, null]
  updatedById Int [ref: > User.id, null]

  deletedAt DateTime [null]
  createdAt DateTime [default: `now()`]
  updatedAt DateTime
}

Table SKU {
  id Int [pk, increment]
  value String
  price Float
  stock Int
  images String[]
  productId Int [ref: > Product.id]

  createdById Int [ref: > User.id, null]
  updatedById Int [ref: > User.id, null]

  deletedAt DateTime [null]
  createdAt DateTime [default: `now()`]
  updatedAt DateTime
}

Table Brand {
  id Int [pk, increment]
  logo String

  createdById Int [ref: > User.id, null]
  updatedById Int [ref: > User.id, null]

  deletedAt DateTime [null]
  createdAt DateTime [default: `now()`]
  updatedAt DateTime
}

Table BrandTranslation {
  id Int [pk, increment]
  brandId Int [ref: > Brand.id]
  languageId Int [ref: > Language.id]
  name String
  description String

  createdById Int [ref: > User.id, null]
  updatedById Int [ref: > User.id, null]

  deletedAt DateTime [null]
  createdAt DateTime [default: `now()`]
  updatedAt DateTime
}

Table CartItem {
  id Int [pk, increment]
  quantity Int
  skuId Int [ref: > SKU.id]
  userId Int [ref: > User.id]

  createdAt DateTime [default: `now()`]
  updatedAt DateTime
}

Table ProductSKUSnapshot {
  id Int [pk, increment]
  productName String
  price Float
  images String[]
  skuValue String
  skuId Int [ref: > SKU.id]
  orderId Int [ref: > Order.id]

  createdAt DateTime [default: `now()`]
}

Table Order {
  id Int [pk, increment]
  userId Int [ref: > User.id]
  status OrderStatus

  createdById Int [ref: > User.id, null]
  updatedById Int [ref: > User.id, null]

  deletedAt DateTime [null]
  createdAt DateTime [default: `now()`]
  updatedAt DateTime
}

Table Review {
  id Int [pk, increment]
  content String
  rating Int
  productId Int [ref: > Product.id]
  userId Int [ref: > User.id]

  deletedAt DateTime [null]
  createdAt DateTime [default: `now()`]
  updatedAt DateTime
}

Table PaymentTransaction {
  id Int [pk, increment]
  gateway String
  transactionDate DateTime [default: `now()`]
  accountNumber String
  subAccount String [null]
  amountIn Int [default: 0]
  amountOut Int [default: 0]
  accumulated Int [default: 0]
  code String [null]
  transactionContent String [null]
  referenceNumber String [null]
  body String [null]

  createdAt DateTime [default: `now()`]
}

Table Message {
   id Int [pk, increment]
   fromUserId Int [ref: > User.id]
   toUserId Int [ref: > User.id]
   content String

   readAt DateTime [null]
   createdAt DateTime [default: `now()`]
}

Enum OrderStatus {
  PENDING_CONFIRMATION
  PENDING_PICKUP
  PENDING_DELIVERY
  DELIVERED
  RETURNED
  CANCELLED
}

Enum VerificationCode {
  REGISTER
  FORGOT_PASSWORD
}

Enum UserStatus {
  ACTIVE
  BLOCKED
}

Enum HTTPMethod {
  GET
  POST
  PUT
  DELETE
  PATCH
  OPTIONS
  HEAD
}

// Many-to-Many Relationships
Table ProductsCategories {
  product_id Int [ref: > Product.id]
  category_id Int [ref: > Category.id]
}

Table PermissionsRoles {
  permission_id Int [ref: > Permission.id]
  role_id Int [ref: > Role.id]
}

Table SkusVariantOptions {
  sku_id Int [ref: > SKU.id]
  variant_option_id Int [ref: > VariantOption.id]
}
```
