FROM node:22-slim

WORKDIR /app

# OpenSSL & CA certificates dibutuhkan oleh Prisma Query Engine pada Linux
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/api-noted/package.json apps/api-noted/
COPY apps/compUI/package.json apps/compUI/
COPY apps/noted/package.json apps/noted/
COPY apps/portal/package.json apps/portal/
COPY apps/userMgmt/package.json apps/userMgmt/
COPY packages/package.json packages/
COPY packages/api/products/package.json packages/api/products/
COPY packages/shared/auth/package.json packages/shared/auth/
COPY packages/shared/models/package.json packages/shared/models/
COPY packages/shared/test-utils/package.json packages/shared/test-utils/
COPY packages/shared/ui/package.json packages/shared/ui/
COPY packages/shop/data/package.json packages/shop/data/
COPY packages/shop/feature-product-detail/package.json packages/shop/feature-product-detail/
COPY packages/shop/feature-products/package.json packages/shop/feature-products/
COPY packages/shop/shared-ui/package.json packages/shop/shared-ui/

RUN npm install --no-audit --no-fund

COPY apps/api-noted/prisma apps/api-noted/prisma/
RUN npx prisma generate --schema=apps/api-noted/prisma/schema.prisma

EXPOSE 3002

CMD ["sh"]
