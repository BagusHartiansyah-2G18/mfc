FROM node:22-alpine

WORKDIR /app

# Copy workspace manifests first so `npm install` creates @org/* symlinks
# (e.g. node_modules/@org/ui -> packages/shared/ui) inside the image.
# Runtime source is still delivered via the `.:/app` bind-mount in
# docker-compose.yml, so edits stay up-to-date without a rebuild.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/compUI/package.json apps/compUI/
COPY apps/portal/package.json apps/portal/
COPY apps/shop/package.json apps/shop/
COPY packages/package.json packages/
COPY packages/api/products/package.json packages/api/products/
COPY packages/shared/models/package.json packages/shared/models/
COPY packages/shared/test-utils/package.json packages/shared/test-utils/
COPY packages/shared/ui/package.json packages/shared/ui/
COPY packages/shop/data/package.json packages/shop/data/
COPY packages/shop/feature-product-detail/package.json packages/shop/feature-product-detail/
COPY packages/shop/feature-products/package.json packages/shop/feature-products/
COPY packages/shop/shared-ui/package.json packages/shop/shared-ui/

RUN npm install

EXPOSE 4200
EXPOSE 4201

CMD ["sh"]