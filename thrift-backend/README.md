# Thrift Store API

## Endpoints

### Seller
- `GET /api/v1/seller/listings` — Get authenticated seller's listings

### Products
- `GET /api/v1/products` — List active products (public)
- `POST /api/v1/products` — Create a new listing (auth)
- `GET /api/v1/products/{id}` — Get a single product (public)
