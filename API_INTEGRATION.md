# Frontend API integration

This document is for the React frontend repository. Do not run backend build, start, database, or OpenAPI export commands from this repository.

## Source of truth

- API contract: `contracts/openapi.json`
- Orval configuration: `orval.config.ts`
- Local backend URL: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api`
- Live OpenAPI document: `http://localhost:3000/api-json`

Use the OpenAPI contract and Orval-generated code for endpoint paths, parameters, request bodies, and response types. Do not recreate those types manually.

## Initial setup

Install the generator and React Query:

```bash
npm install @tanstack/react-query
npm install -D orval
```

Add these scripts to the frontend `package.json`:

```json
{
  "scripts": {
    "api:generate": "orval",
    "api:update": "curl --fail --silent http://localhost:3000/api-json --output contracts/openapi.json && npm run api:generate"
  }
}
```

Generate the client:

```bash
npm run api:generate
```

The generated client is written to `src/api/generated`. Never edit generated files manually.

## Updating the contract

The backend must be running before using `api:update`. To update the frontend after a backend API change, run:

```bash
npm run api:update
```

Alternatively, replace `contracts/openapi.json` with the latest file from the backend repository and run `npm run api:generate`.

Commit the updated contract and generated client together. If generation changes unexpectedly, inspect the OpenAPI change before modifying application code.

## Base URL

The generated client uses relative URLs. Choose one frontend-level strategy:

- Proxy API requests to `http://localhost:3000` during development and use the same origin in production.
- Configure a single custom HTTP client that prefixes requests with `VITE_API_URL`.

Do not hardcode the API origin in components or features. When using a Vite environment variable, document it in `.env.example`:

```env
VITE_API_URL=http://localhost:3000
```

## Successful responses

Every documented successful JSON response uses this envelope:

```ts
type ApiResponse<T> = {
  data: T
  statusCode: number
}
```

For example, `GET /products?page=1&limit=20` returns:

```json
{
  "data": {
    "data": [],
    "page": 1,
    "limit": 20,
    "totalItems": 0,
    "totalPages": 0
  },
  "statusCode": 200
}
```

The outer `data` belongs to the response envelope. The inner `data` is the paginated product array. Follow the generated return type instead of guessing how many levels to unwrap.

Date-time fields are ISO 8601 strings in JSON, not JavaScript `Date` objects. Convert them only at the UI boundary when formatting or performing date calculations.

## Authentication

1. Call `POST /auth/login`.
2. Read `accessToken` and `refreshToken` from the response envelope payload.
3. Send the access token to protected endpoints:

   ```http
   Authorization: Bearer <accessToken>
   ```

4. When the access token expires, call `POST /auth/refresh-token` with `{ "refreshToken": "..." }`.
5. Replace both tokens and retry the original request once.
6. Clear authentication state after logout or when refresh fails.

Keep token attachment and refresh behavior in one HTTP client. Do not implement refresh logic inside React components or generated files.

## React Query rules

- Create one `QueryClient` and provide it at the application root.
- Use generated query hooks for server state.
- Use generated mutation hooks for writes, then invalidate the affected generated query keys.
- Components must handle pending, error, empty, and success states.
- Do not copy API data into another global store unless the UI has a concrete non-server-state requirement.

## Rules for AI agents

Before implementing an API-backed feature:

1. Read this file.
2. Inspect the relevant operation and schema in `contracts/openapi.json` or `src/api/generated`.
3. Reuse generated hooks and types.
4. Do not edit `src/api/generated`.
5. Do not invent undocumented request fields or response properties.
6. Run the frontend lint, typecheck, tests, and production build before finishing.
