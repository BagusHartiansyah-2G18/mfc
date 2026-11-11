FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/compUI/package.json apps/compUI/
COPY apps/portal/package.json apps/portal/
COPY apps/userMgmt/package.json apps/userMgmt/
COPY packages/shared/ui/package.json packages/shared/ui/

RUN npm install

EXPOSE 4202

CMD ["sh"]
