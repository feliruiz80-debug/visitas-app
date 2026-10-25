# Catálogo Escolar · Mayorista Sofia

Revista digital con animación de pasar hojas, al estilo del catálogo físico de Librería Mayorista Sofia.

## Uso

```bash
npm install
npm run dev
```

Abrí la URL de Vite (por defecto http://localhost:5173).

Pasá las páginas con los botones, deslizando o con las flechas del teclado.

## Imágenes de productos

Colocá las fotos en `public/catalog/` con el nombre del producto, por ejemplo:

- `public/catalog/cartulina-lisos.jpg`
- `public/catalog/papel-afiche.jpg`

Si no hay foto, la tarjeta muestra un placeholder con el nombre de archivo esperado.
También podés poner una URL en la columna `imagen` de la planilla.

## Base de datos (Google Sheets)

La revista lee productos desde esta planilla:

https://docs.google.com/spreadsheets/d/177FpyOQyCiRpEtUrTJfFzhsajNO-Tiza3ZRSD60KELw

Para que se actualice sola, compartila como **Cualquier persona con el enlace → Lector**.

### Columnas sugeridas

| Columna | Uso |
| --- | --- |
| `producto` | Nombre del producto (obligatoria) |
| `categoria` | Agrupa páginas (Papelería, Marcadores, etc.) |
| `subcategoria` | Bloque interno opcional |
| `cantidades` | Presentación / cantidades (va en la descripción) |
| `descripcion` | Texto extra opcional |
| `marca` | Marcas |
| `tags` | Variantes separadas por coma |
| `imagen` | URL de foto opcional |

Los productos se **agrupan por nombre** dentro de cada categoría y las cantidades se combinan en la descripción.

Si la planilla no es pública, la app muestra un catálogo de respaldo con la misma estructura visual.
