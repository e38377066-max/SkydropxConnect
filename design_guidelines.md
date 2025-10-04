# Guías de Diseño - Plataforma de Envíos Skydropx

## Enfoque de Diseño

**Sistema Seleccionado:** Material Design + Influencias de Stripe/Shopify
**Justificación:** Plataforma transaccional que requiere claridad, confianza y eficiencia. Material Design proporciona componentes robustos para formularios y tablas, mientras que Stripe/Shopify aportan profesionalismo en interfaces de pago/logística.

**Principios Clave:**
- Claridad sobre ornamentación: Priorizar legibilidad y flujo de trabajo eficiente
- Confianza visual: Diseño limpio y profesional que inspire seguridad en transacciones
- Jerarquía funcional: Guiar al usuario claramente a través de procesos complejos (cotizar → crear guía → rastrear)

---

## Elementos de Diseño Core

### A. Paleta de Color

**Modo Claro:**
- Primary: 214 100% 45% (Azul confiable, sector logística)
- Primary Hover: 214 100% 40%
- Secondary: 142 76% 36% (Verde éxito para confirmaciones)
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Border: 220 13% 91%
- Text Primary: 220 9% 15%
- Text Secondary: 220 9% 46%

**Modo Oscuro:**
- Primary: 214 100% 55%
- Primary Hover: 214 100% 60%
- Secondary: 142 76% 45%
- Background: 220 13% 8%
- Surface: 220 13% 12%
- Border: 220 13% 20%
- Text Primary: 220 9% 98%
- Text Secondary: 220 9% 70%

**Estados Funcionales:**
- Success: 142 76% 36%
- Warning: 38 92% 50%
- Error: 0 84% 60%
- Info: 199 89% 48%

### B. Tipografía

**Familias:** 
- Principal: 'Inter' (Google Fonts) - Claridad en interfaces de datos
- Monospace: 'JetBrains Mono' - Números de guía y códigos

**Escala:**
- Hero/Landing: text-5xl font-bold (48px)
- Título Página: text-3xl font-semibold (30px)
- Subtítulo: text-xl font-medium (20px)
- Body: text-base (16px)
- Small/Labels: text-sm (14px)
- Caption: text-xs (12px)

### C. Sistema de Espaciado

**Primitivas Tailwind:** Unidades de **4, 6, 8, 12, 16**
- Componentes internos: p-4, gap-4
- Secciones: py-12, px-6
- Márgenes verticales grandes: my-16
- Contenedores: max-w-7xl con px-6

**Grid Layouts:**
- Formularios: Single column móvil, 2-col tablet (md:grid-cols-2)
- Dashboard cards: 1/2/3 columnas (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)

---

## D. Biblioteca de Componentes

### Navegación
- **Header:** Fondo surface con border-b sutil, logo izquierda, menú principal centro, botones acción derecha
- **Navegación Principal:** Links con hover:text-primary, active con border-b-2 primary
- **Mobile Menu:** Slide-in desde derecha, overlay semi-transparente

### Formularios (Crítico para cotización/guías)
- **Input Fields:** border-2 border-border, focus:border-primary, rounded-lg, h-12
- **Labels:** text-sm font-medium mb-2, color text-secondary
- **Select/Dropdown:** Mismo estilo que inputs, chevron icon derecha
- **Radio/Checkbox:** Primary color, tamaño 20px, label ml-2
- **Validation:** Error states con border-error y text-error text-sm mt-1
- **Modo Oscuro:** bg-surface, border ajustado a palette oscura

### Botones
- **Primary:** bg-primary text-white, hover:bg-primary-hover, px-6 py-3, rounded-lg, font-medium
- **Secondary:** border-2 border-primary text-primary, hover:bg-primary/10
- **Outline sobre imágenes:** bg-white/10 backdrop-blur-md border-white/30 (sin hover extra)
- **Icon Buttons:** w-10 h-10, rounded-lg, icon centered

### Tablas (Dashboard pedidos)
- **Header:** bg-surface, text-sm font-semibold, border-b-2
- **Rows:** hover:bg-surface/50, border-b border-border, py-4
- **Badges Estado:** rounded-full px-3 py-1, colores según estado (en tránsito=blue, entregado=green, pendiente=warning)
- **Acciones:** Icon buttons alineados a la derecha

### Cards
- **Cotizaciones/Paqueterías:** border border-border, rounded-xl, p-6, hover:shadow-lg transition
- **Pricing cards:** Resaltar opción recomendada con border-primary border-2
- **Rastreo:** Timeline vertical con círculos de estado, línea conectora

### Overlays
- **Modals:** max-w-2xl, bg-surface, rounded-2xl, shadow-2xl, overlay bg-black/60
- **Toast Notifications:** Esquina superior derecha, border-l-4 con color según tipo
- **Loading States:** Spinner primary color, skeleton screens para tablas/cards

---

## E. Animaciones

**Filosofía:** Minimal y funcional, evitar distracciones.

**Permitidas:**
- Fade-in inicial de componentes (opacity, 200ms)
- Hover transitions en buttons/cards (150ms)
- Modal appear/disappear (scale 0.95→1, 250ms)
- Loading spinners y progress bars

**Evitar:** Parallax, scroll-driven animations complejas, efectos decorativos

---

## Especificaciones Landing/Marketing

### Hero Section
**Imagen:** Sí - Imagen de fondo mostrando paquetes/entregas o almacén logístico moderno (70vh altura)
- Overlay: bg-gradient-to-r from-primary/90 to-primary/70
- Contenido: Centrado, max-w-4xl
- Headline: text-5xl font-bold text-white, enfatizar "Envía fácil, rápido y seguro"
- CTA Primary: "Cotizar Envío Gratis" (grande, 2xl button)
- Trust badges: Logos paqueterías (DHL, FedEx, Estafeta) debajo

### Estructura de Secciones (6 secciones)
1. **Hero** - Propuesta de valor clara
2. **Cómo Funciona** - 3 pasos visuales (Cotiza → Genera → Rastrea), grid lg:grid-cols-3
3. **Paqueterías Integradas** - Logos en grid con hover effects
4. **Características** - 2x3 grid de features con iconos (Heroicons: truck, shield-check, chart-bar)
5. **Testimonios** - 2 columnas, cards con avatar y cita
6. **CTA Final** - Fondo primary, call to action prominente

### Espaciado Vertical
- Hero: 70vh
- Secciones: py-20 (desktop), py-12 (mobile)
- Gaps internos: gap-12 entre elementos principales

### Imágenes Sugeridas
1. **Hero:** Warehouse moderno con paquetes organizados o repartidor feliz
2. **Características:** Iconos Heroicons (truck, clock, shield-check, chart-bar-square, map-pin, document-check)
3. **Proceso:** Ilustraciones de formulario → guía → paquete rastreado

---

## Notas de Implementación

- **Iconografía:** Heroicons vía CDN, outline style por defecto
- **Responsive:** Mobile-first, breakpoints md:768px, lg:1024px, xl:1280px
- **Accesibilidad:** Mínimo contraste 4.5:1, focus states visibles, labels descriptivos
- **Performance:** Lazy load imágenes, optimizar tablas con paginación virtual si >50 items