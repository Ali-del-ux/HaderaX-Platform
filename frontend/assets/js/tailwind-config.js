/**
 * Unified Tailwind CSS Configuration — HaderaX Brand Identity
 * 
 * Official Emblem & Logo Palette:
 * - Brand Sky Cyan: #0EA5E9 (Signature "إكس" & Celestial Dome)
 * - Primary Action Sky: #0284C7 / Hover: #0369A1 (WCAG AA & AAA Compliant)
 * - Citadel Gold: #F59E0B / #FBBF24 / #FEF08A (Academic Heritage & Distinction)
 * - Deep Cosmic Slate: #0F172A / #080D1A (High-Contrast Text & Shells)
 * - Canvas & Surfaces: #FFFFFF & #F8FAFC (Clean Human-Grade Surfaces)
 * 
 * IMPORTANT: This file MUST be loaded synchronously (no `defer`) immediately
 * after the Tailwind CDN script so that the `tailwind` global is available.
 */
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                /* --- Brand Signature Tokens (Derived directly from SVG Logo) --- */
                "brand-sky": "#0EA5E9",                // لون حرف "إكس" والقبة السماوية في الشعار
                "brand-sky-light": "#38BDF8",
                "brand-sky-deep": "#0284C7",
                "brand-sky-dark": "#0369A1",
                "brand-sky-muted": "#E0F2FE",          // خلفية هادئة للشارات التقنية

                /* --- Primary Interactive Tokens (Tech Sky Blue) --- */
                "primary": "#0284C7",                  // أزرق الشعار التقني الأساسي
                "primary-container": "#0284C7",        // خلفية الأزرار الرئيسية مع تباين عالي مع النص الأبيض
                "primary-hover": "#0369A1",            // تباين داكن عند التحويم
                "surface-tint": "#0369A1",
                "on-primary": "#ffffff",
                "primary-fixed": "#E0F2FE",
                "primary-fixed-dim": "#BAE6FD",
                "on-primary-container": "#ffffff",
                "on-primary-fixed": "#0369A1",
                "on-primary-fixed-variant": "#075985",

                /* --- Secondary Refined Tokens (Cosmic Slate & Architectural Grey) --- */
                "secondary": "#64748B",                // رمادي سلِيت راقٍ مريح للعين (تباين 4.7:1)
                "secondary-container": "#1E293B",
                "secondary-hover": "#0F172A",
                "secondary-fixed": "#F1F5F9",
                "secondary-fixed-dim": "#94A3B8",
                "on-secondary": "#ffffff",
                "on-secondary-container": "#F8FAFC",
                "on-secondary-fixed": "#0F172A",
                "on-secondary-fixed-variant": "#1E293B",
                "sky-light": "#38BDF8",
                "sky-deep": "#0284C7",
                "cyan-accent": "#0EA5E9",

                /* --- Hadera Citadel Gold (Heritage & Academic Honors) --- */
                "gold-accent": "#F59E0B",              // ذهب قلعة الحاضرة الأصلي للشعار والأوسمة
                "gold-light": "#FBBF24",
                "gold-deep": "#B45309",
                "hadera-gold": "#F59E0B",
                "crimson-muted": "#FEF3C7",            // وسام ذهبي أكاديمي هادئ
                "amber-muted": "#FEF3C7",

                /* --- Surfaces & Light Themes --- */
                "surface-container-lowest": "#ffffff",
                "surface-alt": "#F8FAFC",
                "surface": "#F1F5F9",
                "border-subtle": "#E2E8F0",
                "sky-muted": "#E0F2FE",

                "on-surface": "#0F172A",               // كحلي فاحم عالي التباين للنصوص
                "on-surface-variant": "#475569",
                "on-background": "#0F172A",
                "background": "#F8FAFC",

                /* --- Dark / Cosmic Obsidian Surfaces --- */
                "obsidian-dark": "#080D1A",            // أرضية الشعار الكحلية العميقة
                "obsidian-card": "#0F172A",
                "obsidian-surface": "#1E293B",
                "obsidian-border": "#334155",

                /* --- Extended Material 3 Palette --- */
                "inverse-primary": "#38BDF8",
                "inverse-surface": "#0F172A",
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
                "surface-dim": "#E2E8F0",
                "surface-variant": "#F1F5F9",
                "surface-container": "#F8FAFC",
                "surface-container-low": "#FFFFFF",
                "surface-container-high": "#E2E8F0",
                "surface-container-highest": "#CBD5E1",

                /* --- Error Tokens --- */
                "error": "#DC2626",
                "error-container": "#FEE2E2",
                "on-error": "#ffffff",
                "on-error-container": "#991B1B",

                /* --- Outline Tokens --- */
                "outline": "#E2E8F0",
                "outline-variant": "#CBD5E1",
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
