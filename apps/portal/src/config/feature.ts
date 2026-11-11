import { load } from "js-yaml";
import { z } from "zod";
import type { FeatureMenu } from "@org/ui";

const featureItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  path: z.string(),
  icon: z.string().optional(),
  order: z.number().optional(),
  enabled: z.boolean().optional(),
  badge: z.string().optional(),
});

const featureMenuSchema = z.object({
  brand: z.string(),
  shell: z
    .object({
      sidebar: z
        .object({
          collapsible: z.boolean().optional(),
          defaultOpen: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  menus: z.array(
    z.object({
      section: z.string(),
      items: z.array(featureItemSchema),
    })
  ),
});

const FALLBACK_MENU: FeatureMenu = {
  brand: "BGS Platform",
  menus: [
    {
      section: "Umum",
      items: [{ id: "beranda", label: "Beranda", path: "/", icon: "home", order: 10, enabled: true }],
    },
  ],
};

export async function loadFeatureMenu(url = "/feature.yml"): Promise<FeatureMenu> {
  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    const text = await res.text();
    const raw = load(text) as unknown;
    const parsed = featureMenuSchema.parse(raw);
    // Filter enabled === false (cukup enabled, tanpa roles)
    parsed.menus = parsed.menus.map((s) => ({
      ...s,
      items: s.items.filter((i) => i.enabled !== false),
    }));
    return parsed;
  } catch (err) {
    console.warn("[feature] Failed to load feature.yml, using fallback", err);
    return FALLBACK_MENU;
  }
}
