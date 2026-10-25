# Catálogo Escolar · Mayorista Sofia

Revista digital profesional con el mismo formato del catálogo físico y animación de pasar hojas.

## Uso

```bash
npm install
npm run dev
```

Abrí la URL de Vite (por defecto http://localhost:5173).

## Qué verás

- Portada y página de pedido
- Hojas digitales: Papelería, Blocks, Adhesivos, Témperas, Pinceles, Masas, Marcadores
- Layout tipo revista (título ESCOLAR, línea roja, cards, tags, pie navy)
- Fotos de producto digitalizadas en `public/catalog/digital/products/`

## Actualizar contenido

Editá `src/data/digitalCatalog.ts` para textos, tags y orden.
Las imágenes de producto viven en `public/catalog/digital/products/{id}.jpg`.
