import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

const CAKE_STORE_FORM_ID = '00e00d5b-04d9-4e69-8048-5d18f94e65c9';
const CAKE_PRODUCTS_FORM_ID = '94bb4549-dba0-4642-8a87-97bc50421c56';

function escapeHtml(input: unknown): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripMarkdown(input: string): string {
  return input
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/[#>*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveFirstImageUrl(product: any, apiOrigin: string): string {
  const photos = Array.isArray(product?.galeri_foto) ? product.galeri_foto : [];
  const preferred = photos.find((p: any) => p?.jenis_foto === 'Full Product') || photos[0];
  if (!preferred) return '';
  const fileUrl =
    typeof preferred.image_file === 'string'
      ? preferred.image_file
      : preferred.image_file?.fileUrl || preferred.image_file?.url || '';
  const raw = String(fileUrl || preferred.image_url || '').trim();
  if (!raw) return '';
  if (raw.startsWith('/api/') || raw.startsWith('/uploads/')) {
    return `${apiOrigin}${raw}`;
  }
  return raw;
}

@Controller('public/cake/share')
export class CakeShareController {
  constructor(private readonly prisma: PrismaService) {}

  private resolveSafePortalOrigin(redirect?: string): string {
    const fallback = process.env.PORTAL_PUBLIC_URL || 'http://localhost:4200';
    if (!redirect) return fallback;
    try {
      const u = new URL(redirect);
      if (u.protocol === 'http:' || u.protocol === 'https:') {
        return u.origin;
      }
    } catch {
      // ignore invalid redirect
    }
    return fallback;
  }

  private renderOgHtml(params: {
    title: string;
    description: string;
    imageUrl: string;
    shareUrl: string;
    targetUrl: string;
    ogType: 'website' | 'product';
  }): string {
    const title = escapeHtml(params.title);
    const desc = escapeHtml(params.description);
    const image = escapeHtml(params.imageUrl);
    const shareUrl = escapeHtml(params.shareUrl);
    const targetUrl = escapeHtml(params.targetUrl);
    const targetJson = JSON.stringify(params.targetUrl);

    return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <meta property="og:type" content="${params.ogType}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${shareUrl}" />
  ${image ? `<meta property="og:image" content="${image}" />` : ''}
  <meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  ${image ? `<meta name="twitter:image" content="${image}" />` : ''}
  <meta http-equiv="refresh" content="0;url=${targetUrl}" />
  <script>window.location.replace(${targetJson});</script>
</head>
<body style="font-family: system-ui, sans-serif; padding: 24px; text-align: center;">
  <p>Mengarahkan ke <strong>${title}</strong>...</p>
  <p><a href="${targetUrl}">Klik di sini jika tidak otomatis berpindah</a></p>
</body>
</html>`;
  }

  private async loadStoreInfo() {
    const row = await this.prisma.valueForm.findFirst({
      where: { formId: CAKE_STORE_FORM_ID },
      orderBy: { createdAt: 'desc' },
    });
    const answers = ((row?.answers as any)?.answers || row?.answers || {}) as Record<string, any>;
    return {
      name: String(answers.store_name || 'Ummu Hanif — Melayani Konsumen'),
      motto: String(
        answers.motto ||
          answers.deskripsi ||
          'Katalog kue premium, custom cake, brownies, dan pemesanan online.'
      ),
    };
  }

  @Get()
  async shareStore(
    @Query('redirect') redirect: string | undefined,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const store = await this.loadStoreInfo();
    const apiOrigin = `${req.protocol}://${req.get('host')}`;
    const portalOrigin = this.resolveSafePortalOrigin(redirect);
    const targetUrl = `${portalOrigin}/cake`;
    const shareUrl = `${apiOrigin}${req.originalUrl}`;

    // Ambil foto produk pertama sebagai og:image fallback halaman utama
    const latestProduct = await this.prisma.valueForm.findFirst({
      where: { formId: CAKE_PRODUCTS_FORM_ID },
      orderBy: { createdAt: 'desc' },
    });
    const prodAnswers = ((latestProduct?.answers as any)?.answers ||
      latestProduct?.answers ||
      {}) as Record<string, any>;
    const imageUrl = resolveFirstImageUrl(prodAnswers, apiOrigin);

    const html = this.renderOgHtml({
      title: store.name,
      description: stripMarkdown(store.motto).slice(0, 200),
      imageUrl,
      shareUrl,
      targetUrl,
      ogType: 'website',
    });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }

  @Get(':slug')
  async shareProduct(
    @Param('slug') slug: string,
    @Query('redirect') redirect: string | undefined,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const store = await this.loadStoreInfo();
    const apiOrigin = `${req.protocol}://${req.get('host')}`;
    const portalOrigin = this.resolveSafePortalOrigin(redirect);

    const productRows = await this.prisma.valueForm.findMany({
      where: { formId: CAKE_PRODUCTS_FORM_ID },
      orderBy: { createdAt: 'desc' },
    });

    const targetSlug = slug.trim().toLowerCase();
    let matched: Record<string, any> | null = null;
    for (const row of productRows) {
      const a = ((row.answers as any)?.answers || row.answers || {}) as Record<string, any>;
      if (
        String(a.slug || '').toLowerCase() === targetSlug ||
        String(a.kode_produk || '').toLowerCase() === targetSlug ||
        row.id.toLowerCase() === targetSlug
      ) {
        matched = a;
        break;
      }
    }

    if (!matched) {
      const html = this.renderOgHtml({
        title: store.name,
        description: stripMarkdown(store.motto).slice(0, 200),
        imageUrl: '',
        shareUrl: `${apiOrigin}${req.originalUrl}`,
        targetUrl: `${portalOrigin}/cake`,
        ogType: 'website',
      });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    const variants = Array.isArray(matched.varian) ? matched.varian : [];
    const prices = variants.map((v: any) => Number(v?.harga || 0)).filter((n: number) => n > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const priceLabel = minPrice > 0 ? `Mulai Rp ${minPrice.toLocaleString('id-ID')} • ` : '';

    const title = `${matched.nama_produk || 'Produk Kue'} — ${store.name}`;
    const description = `${priceLabel}${stripMarkdown(String(matched.deskripsi || store.motto))}`.slice(0, 220);
    const imageUrl = resolveFirstImageUrl(matched, apiOrigin);
    const targetUrl = `${portalOrigin}/cake/produk/${encodeURIComponent(
      String(matched.slug || matched.kode_produk || slug)
    )}`;

    const html = this.renderOgHtml({
      title,
      description,
      imageUrl,
      shareUrl: `${apiOrigin}${req.originalUrl}`,
      targetUrl,
      ogType: 'product',
    });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }
}
