# Catálogo Escolar · Mayorista Sofia

Revista digital con el estilo del catálogo físico de Librería Mayorista Sofia.

## Uso

```bash
npm install
npm run dev
```

Abrí la URL de Vite (por defecto http://localhost:5173).

Pasá las páginas arrastrando la hoja, con los botones o con las flechas del teclado.

## Base de datos (Google Sheets)

Planilla categorizada (gid `2093740033`):

https://docs.google.com/spreadsheets/d/177FpyOQyCiRpEtUrTJfFzhsajNO-Tiza3ZRSD60KELw/edit?gid=2093740033

Formato esperado:

- Filas de **categoría** (solo el nombre en la columna Producto), por ejemplo `PAPELERIA`
- Filas de **producto**: `Código`, `Cantidad`, `Producto`, `Precio unitario`, `Total`, `Imagen (URL)`

La revista arma una hoja por categoría (y parte en varias páginas si hay muchos ítems) y pone las presentaciones (`x 24hjs`, `x 30grs`, etc.) en la descripción.

Hay una copia local en `public/catalog/productos.csv` por si el fetch a Google falla por CORS.

## Imágenes

Podés poner URL en la columna `Imagen (URL)` o un archivo en `public/catalog/{nombre}.jpg`.
