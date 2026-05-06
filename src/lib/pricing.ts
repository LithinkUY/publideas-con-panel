import { PricingConfig, Variant, defaultPricingConfig } from "./types";

// ── Formateo de moneda ────────────────────────────────────────
export function formatPrice(
    amountUSD: number,
    pricing: PricingConfig = defaultPricingConfig
): string {
    const amount = Number(amountUSD);
    if (isNaN(amount)) return "–";
    if (pricing.currency === "UYU") {
        const uyu = amount * pricing.uyu_rate;
        return `$${uyu.toLocaleString("es-UY", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return `US$ ${amount.toFixed(2)}`;
}

export function formatBoth(
    amountUSD: number,
    pricing: PricingConfig = defaultPricingConfig
): string {
    const amount = Number(amountUSD);
    if (isNaN(amount)) return "–";
    const usd = `US$ ${amount.toFixed(2)}`;
    const uyu = `$${(amount * pricing.uyu_rate).toLocaleString("es-UY", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    if (pricing.show_both) return `${usd} / ${uyu}`;
    return pricing.currency === "UYU" ? uyu : usd;
}

// ── Calculo de precio con variantes ──────────────────────────
export function calcVariantExtra(
    basePrice: number,
    variant: Pick<Variant, "price_type" | "price" | "price_percent">
): number {
    if (variant.price_type === "percent") {
        return basePrice * (variant.price_percent / 100);
    }
    return variant.price;
}

export function calcTotal(
    basePrice: number,
    selectedVariants: Pick<Variant, "price_type" | "price" | "price_percent">[],
    quantity = 1,
    m2?: number
): number {
    const base = m2 != null ? basePrice * m2 : basePrice;
    const extras = selectedVariants.reduce(
        (sum, v) => sum + calcVariantExtra(base, v),
        0
    );
    return (base + extras) * quantity;
}

// ── Label del precio de una variante ─────────────────────────
export function variantPriceLabel(
    v: Pick<Variant, "price_type" | "price" | "price_percent">,
    basePrice?: number,
    pricing: PricingConfig = defaultPricingConfig
): string {
    if (v.price_type === "percent") {
        if (basePrice != null) {
            const extra = calcVariantExtra(basePrice, v);
            return `+${v.price_percent}% (${formatPrice(extra, pricing)})`;
        }
        return `+${v.price_percent}%`;
    }
    if (v.price <= 0) return "incluido";
    return `+${formatPrice(v.price, pricing)}`;
}
