# Lista de precios · Librería Mayorista Sofía

Buscador de la lista mayorista del 6 de octubre de 2026. Se busca por nombre, marca o código, se filtra por rubro y se arma un pedido para copiar.

Los precios salen de la lista vigente, en pesos y con impuestos. Las fotos se pueden sumar después.

## Uso

```bash
npm install
npm run dev
```

Abrí la URL de Vite (por defecto http://localhost:5173).

## Atajos

- `/` enfoca la búsqueda
- Flechas arriba y abajo recorren los resultados
- Enter suma el artículo resaltado
- Escape cierra el pedido o borra la búsqueda

El pedido queda guardado en el navegador.

## Regenerar la lista

Si llega un PDF nuevo de Crystal Reports con el mismo formato:

```bash
python3 scripts/build_price_list.py lista.pdf
```

Eso vuelve a escribir `public/lista.json`.
