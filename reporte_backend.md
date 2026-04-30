# Especificaciones Técnicas: Módulo de Reportes (Backend .NET)

## 1. Contexto del Proyecto
Se requiere implementar la lógica de backend para un sistema de gestión de inventarios. El frontend está desarrollado en Angular y utiliza un dashboard moderno con filtros dinámicos y visualizaciones duales (Gráficos y Tablas).

## 2. Requerimientos de Entrada (Filtros)
El backend debe exponer un endpoint (preferiblemente POST para facilitar el envío de objetos complejos) que reciba los siguientes parámetros en un `ReporteRequestDto`:

- **Rango de Fechas:** `FechaInicio` y `FechaFin` (DateTime?).
- **Ubicación:** `UbicacionId` (int? - usado en reportes generales).
- **Traslados:** `UbicacionOrigenId` y `UbicacionDestinoId` (int? - específicos para reportes de movimiento).
- **Categoría:** `CategoriaId` (int?).
- **Estado de Activos:** `Estado` (string: 'Todos', 'Nuevo', 'Usado', 'Dañado').
- **Tipo de Reporte:** `Tipo` (int: 0=Inventario, 1=Prestamos, 2=Mantenimiento, 3=Traslados).

## 3. Estructura de Respuesta (DTO de Salida)
La respuesta debe ser un objeto JSON con tres secciones principales:

### A. Resumen de KPIs (Tarjetas)
Una lista de objetos para los indicadores superiores que cambian según el tipo de reporte:
```json
"kpis": [
  { "label": "VALORACIÓN TOTAL", "value": "S/ 15,200" },
  { "label": "ACTIVOS EN RED", "value": "124" },
  { "label": "DISPONIBILIDAD", "value": "92%" }
]
```

### B. Datos para Gráficos (Chart.js)
Estructura compatible con arreglos de etiquetas y valores:
```json
"grafico": {
  "labels": ["Ene", "Feb", "Mar", ...],
  "valores": [10, 25, 15, ...]
}
```

### C. Datos para Tablas
Lista de objetos que varían según el tipo de reporte:
- **General/Préstamos/Mantenimiento:** `Id`, `NombreArticulo`, `Ubicacion`, `Estado`, `Valor`.
- **Traslados:** `Id`, `NombreArticulo`, `UbicacionOrigen`, `UbicacionDestino`, `Fecha`, `EstadoTraslado`.

## 4. Lógica de Negocio sugerida
1. **Inventario General:** Sumar costos y contar artículos por estado/ubicación.
2. **Control de Préstamos:** Filtrar artículos con fecha de retorno vencida para el KPI de "Atrasados".
3. **Mantenimiento:** Calcular costos acumulados de la tabla de reparaciones.
4. **Historial de Traslados:** Realizar Joins entre la tabla `Traslados` y `Ubicaciones` para obtener los nombres de origen y destino.

## 5. Tecnologías Utilizadas en Front
- **Frontend:** Angular 19 + Angular Material.
- **Gráficos:** Chart.js.
- **Backend Requerido:** C# / .NET 8 con Entity Framework Core.
