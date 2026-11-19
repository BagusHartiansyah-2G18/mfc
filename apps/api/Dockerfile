FROM node:22-slim

WORKDIR /app

# OpenSSL & CA certificates dibutuhkan oleh Prisma Query Engine pada Linux
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Salin manifest workspace terlebih dahulu untuk memaksimalkan cache npm install
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/compUI/package.json apps/compUI/
COPY apps/portal/package.json apps/portal/
COPY apps/shop/package.json apps/shop/
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

# Generate Prisma Client untuk target Linux engine
COPY apps/api/prisma apps/api/prisma/
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

EXPOSE 3001

CMD ["sh"]
