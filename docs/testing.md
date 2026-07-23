# Testing

No test suite is currently configured. The project uses Next.js's built-in toolchain.

## Running the App

```bash
# Full test: deploy and verify manually
docker compose up -d --build

# Check health
curl http://localhost:3000/api/health

# Manual test flow:
# 1. Register a user at /auth/register
# 2. Browse products at /products
# 3. Add to cart, checkout at /checkout
# 4. View order at /account/orders
# 5. Download purchased file
# 6. Test admin panel at /admin
# 7. Test account deletion at /account
```
