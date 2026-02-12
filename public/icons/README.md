# PWA Icons

This directory contains placeholder icons for the PWA. Replace these SVG files with your actual PNG icons.

A favicon.svg has also been created in the `public/` directory - replace it with your actual favicon.

## Required Sizes

- 192x192 (Standard PWA icon)
- 512x512 (High-res PWA icon)

These two sizes are sufficient for most PWA needs. Browsers will scale them as needed.

## How to Replace

1. Create your app icon/logo
2. Use one of these tools to generate all sizes:
   - [RealFaviconGenerator](https://realfavicongenerator.net/)
   - [PWA Builder Image Generator](https://www.pwabuilder.com/imageGenerator)
   - ImageMagick: `convert logo.png -resize 192x192 icon-192x192.png`

3. Replace the SVG files in this directory with PNG files
4. Update `manifest.json` to change `type: "image/svg+xml"` to `type: "image/png"`
5. Update `src/app/layout.tsx` metadata icons to use `.png` extensions

## Tips

- Use PNG format for best compatibility
- Ensure icons have transparent backgrounds or solid color backgrounds
- For maskable icons, keep important content in the center 80% of the image
- Test on both iOS and Android devices
