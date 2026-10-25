# Catálogo Escolar · Mayorista Sofia

Revista digital con las páginas reales del catálogo físico y animación de pasar hojas.

## Uso

```bash
npm install
npm run dev
```

Abrí la URL de Vite (por defecto http://localhost:5173).

Pasá las páginas arrastrando la hoja, con los botones o con las flechas del teclado.

## Páginas

Las hojas del catálogo están en `public/catalog/pages/`:

| Archivo | Contenido |
| --- | --- |
| `03-papeleria.jpg` | Papelería |
| `04-blocks-papel-glace.jpg` | Blocks y Papel Glacé |
| `05-adhesivos.jpg` | Adhesivos |
| `07-temperas-acuarelas.jpg` | Témperas y Acuarelas |
| `08-pinceles.jpg` | Pinceles |
| `09-masas-plastilinas.jpg` | Masas y Plastilinas |
| `10-marcadores-agua.jpg` | Marcadores al agua |
| `11-marcadores-permanentes.jpg` | Marcadores permanentes / pizarra |

Para sumar o reemplazar una hoja, poné la foto en esa carpeta y registrala en `src/data/pages.ts`.
