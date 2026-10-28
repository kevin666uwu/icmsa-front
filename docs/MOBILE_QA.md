# Revisión adaptable

La navegación pública tiene un menú compacto. El menú del alumno conserva sus nueve destinos y cerrar sesión; el menú institucional usa un diálogo con foco contenido, cierre con Escape y restauración del foco. Los formularios bloquean el desplazamiento del fondo mientras están abiertos.

Las tablas de registros, usuarios y mediciones se presentan como fichas etiquetadas hasta 600 px. Textos largos se ajustan, los controles de formulario usan 16 px en móvil y las acciones tienen una altura mínima de 44 px. La tarjeta pública de campus tiene una clase propia para evitar colisiones con las tarjetas del alumno.

Validación en Chromium con respuestas de API simuladas: sitio público, login, las nueve vistas del alumno, dashboard administrativo, biblioteca, usuarios y organigrama. Se comprueban ancho de documento, errores de JavaScript, accesos del alumno, cierre de sesión, navegación administrativa y formularios de biblioteca. Datos de prueba incluyen nombres, correos, títulos y montos largos.

También se revisa texto al 200% en 320, 390 y 844 px, incluyendo navegación y formularios.

Tamaños de referencia: 320, 360, 390, 430, 768, 1024 y 1440 px; repetir con alturas reducidas y orientación horizontal. Las pruebas de componentes están en `tests/mobile-navigation.test.jsx` y se ejecutan con `npm run check`.

Antes de entregar cambios visuales futuros, comprobar además en Safari/iOS y Chrome/Android reales con cuentas de prueba, teclado abierto, zoom de texto y datos de producción. Las pruebas locales usan datos simulados y no verifican el despliegue en producción.
