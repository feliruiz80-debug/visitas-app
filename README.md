# Catálogo Escolar · Mayorista Sofia

Revista digital con las fotos reales del catálogo físico, mejoradas, y animación de pasar hojas.

## Uso

```bash
npm install
npm run dev
```

Abrí la URL de Vite (por defecto http://localhost:5173).

## Páginas

Las hojas mejoradas están en `public/catalog/pages/`:

- `03-papeleria.jpg`
- `04-blocks-papel-glace.jpg`
- `05-adhesivos.jpg`
- `07-temperas-acuarelas.jpg`
- `08-pinceles.jpg`
- `09-masas-plastilinas.jpg`
- `10-marcadores-agua.jpg`
- `11-marcadores-permanentes.jpg`

Son las mismas fotos del catálogo, con más nitidez, contraste y blanco limpio (sin ilustrar).

Para regenerarlas:

```bash
python3 scripts/enhance_catalog_photos.py
```
