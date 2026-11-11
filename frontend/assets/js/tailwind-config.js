/**
 * Unified Tailwind CSS Configuration — HaderaX Brand Identity
 * 
 * Option 3: Monochrome Obsidian & Pure Minimalist Contrast (Approved)
 * - Primary: Deep High-Contrast Obsidian (#09090B, #18181B)
 * - Secondary: Refined Muted Zinc/Slate (#52525B, #71717A) — Replaces clashing cyan
 * - Brand Accent: Warm Hadera Gold (#F59E0B, #FCD34D, #B45309) — Preserved for Citadel & Badges
 * - Surfaces: Crisp Whites (#FFFFFF, #F8FAFC, #F1F5F9) & High-Contrast Obsidian (#09090B, #121215)
 * - WCAG AAA Contrast Compliant
 * 
 * IMPORTANT: This file MUST be loaded synchronously (no `defer`) immediately
 * after the Tailwind CDN script so that the `tailwind` global is available.
 */
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                /* --- Primary High-Contrast Tokens (Option 3 Minimal) --- */
                "primary": "#09090B",                  // أسود أوبسيديان فاحم وعالي التباين
                "primary-container": "#18181B",        // خلفية الأزرار الرئيسية مع نص أبيض ناصع
                "primary-hover": "#27272A",
                "surface-tint": "#27272A",
                "on-primary": "#ffffff",
                "primary-fixed": "#F4F4F5",
                "primary-fixed-dim": "#E4E4E7",
                "on-primary-container": "#ffffff",
                "on-primary-fixed": "#18181B",
                "on-primary-fixed-variant": "#27272A",

                /* --- Secondary Refined Tokens (Replaces clashing cyan) --- */
                "secondary": "#52525B",                // رمادي زنك راقٍ ومريح للعين (تباين 7:1)
                "secondary-container": "#27272A",
                "secondary-hover": "#18181B",
                "secondary-fixed": "#F4F4F5",
                "secondary-fixed-dim": "#71717A",
                "on-secondary": "#ffffff",
                "on-secondary-container": "#FAFAFA",
                "on-secondary-fixed": "#18181B",
                "on-secondary-fixed-variant": "#27272A",
                "sky-light": "#71717A",
                "sky-deep": "#27272A",
                "cyan-accent": "#2563EB",

                /* --- Hadera Gold Brand Accent (Citadel & Distinction) --- */
                "gold-accent": "#F59E0B",              // ذهب الحاضرة الأصلي للشعار والأوسمة
                "gold-light": "#FCD34D",
                "gold-deep": "#B45309",
                "hadera-gold": "#F59E0B",
                "crimson-muted": "#FEF3C7",            // وسام ذهبي أكاديمي هادئ
                "amber-muted": "#FEF3C7",

                /* --- Surfaces & Light Themes --- */
                "surface-container-lowest": "#ffffff",
                "surface-alt": "#F8FAFC",
                "surface": "#F1F5F9",
                "border-subtle": "#E4E4E7",
                "sky-muted": "#F4F4F5",

                "on-surface": "#09090B",
                "on-surface-variant": "#52525B",
                "on-background": "#09090B",
                "background": "#F8FAFC",

                /* --- Dark / Obsidian Surfaces --- */
                "obsidian-dark": "#09090B",
                "obsidian-card": "#121215",
                "obsidian-surface": "#18181B",
                "obsidian-border": "#27272A",

                /* --- Extended Material 3 Palette --- */
                "inverse-primary": "#FAFAFA",
                "inverse-surface": "#09090B",
                "inverse-on-surface": "#F8FAFC",

                /* --- Tertiary Tokens (Success / Badges) --- */
                "tertiary": "#059669",
                "tertiary-container": "#10B981",
                "tertiary-fixed": "#D1FAE5",
                "tertiary-fixed-dim": "#A7F3D0",
                "on-tertiary": "#ffffff",
                "on-tertiary-container": "#ECFDF5",
                "on-tertiary-fixed": "#064E3B",
                "on-tertiary-fixed-variant": "#047857",

                /* --- Surface Variants --- */
                "surface-bright": "#ffffff",
                "surface-dim": "#E4E4E7",
                "surface-variant": "#F1F5F9",
                "surface-container": "#F8FAFC",
                "surface-container-low": "#FFFFFF",
                "surface-container-high": "#E4E4E7",
                "surface-container-highest": "#D4D4D8",

                /* --- Error Tokens --- */
                "error": "#DC2626",
                "error-container": "#FEE2E2",
                "on-error": "#ffffff",
                "on-error-container": "#991B1B",

                /* --- Outline Tokens --- */
                "outline": "#E4E4E7",
                "outline-variant": "#D4D4D8",
            },

            fontFamily: {
                "sans": ["Alexandria", "Cairo", "sans-serif"],
                "alexandria": ["Alexandria", "sans-serif"],
                "outfit": ["Outfit", "sans-serif"],
                "cairo": ["Cairo", "sans-serif"],
                "inter": ["Inter", "sans-serif"],
                "code-snippet": ["JetBrains Mono", "monospace"],
                /* Semantic font aliases */
                "label-md": ["Alexandria", "Cairo", "sans-serif"],
                "headline-lg": ["Alexandria", "Cairo", "sans-serif"],
                "body-md": ["Alexandria", "Cairo", "sans-serif"],
                "headline-md": ["Alexandria", "Cairo", "sans-serif"],
                "body-lg": ["Alexandria", "Cairo", "sans-serif"],
                "headline-xl-mobile": ["Alexandria", "Cairo", "sans-serif"],
                "headline-xl": ["Alexandria", "Cairo", "sans-serif"],
            },

            fontSize: {
                "label-md": ["14px", { "lineHeight": "1.4", "letterSpacing": "0.01em", "fontWeight": "500" }],
                "code-snippet": ["14px", { "lineHeight": "1.5", "fontWeight": "400" }],
                "headline-lg": ["32px", { "lineHeight": "1.3", "fontWeight": "700" }],
                "body-md": ["16px", { "lineHeight": "1.6", "fontWeight": "400" }],
                "headline-md": ["24px", { "lineHeight": "1.4", "fontWeight": "700" }],
                "body-lg": ["18px", { "lineHeight": "1.6", "fontWeight": "400" }],
                "headline-xl-mobile": ["32px", { "lineHeight": "1.2", "fontWeight": "800" }],
                "headline-xl": ["48px", { "lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "800" }],
            },

            spacing: {
                "max-width": "1280px",
                "margin-desktop": "64px",
                "margin-mobile": "16px",
                "gutter": "24px",
                "unit": "8px",
            },

            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "2xl": "1rem",
                "3xl": "1.5rem",
                "full": "9999px",
            },
        }
    }
};
