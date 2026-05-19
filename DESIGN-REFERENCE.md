# DESIGN.md Reference

**Repo:** https://github.com/google-labs-code/design.md  
**Stars:** 14.4k | **License:** Apache-2.0  
**Creado por:** Google Labs Code

Un formato de especificación para describir una identidad visual a agentes de código. DESIGN.md les da a los agentes una comprensión estructurada y persistente de un sistema de diseño.

---

## ¿Por qué existe?

Los agentes de IA (Claude, Cursor, Copilot, Gemini) no entienden diseño a menos que se lo describas explícitamente. Sin un DESIGN.md, el agente inventa colores, tipografías y espaciados — y cada vez que le pides un cambio, puede inventar algo diferente.

DESIGN.md resuelve esto combinando:
- **YAML front matter** — tokens de diseño legibles por máquina (colores, tipografía, espaciado)
- **Markdown prose** — rationale de diseño legible por humanos (por qué existen esos valores)

---

## Estructura del Archivo

```yaml
---
name: Heritage
colors:
  primary: "#1A1C1E"
  secondary: "#6C7278"
  tertiary: "#B8422E"
  neutral: "#F7F5F2"
typography:
  h1:
    fontFamily: Public Sans
    fontSize: 3rem
  body-md:
    fontFamily: Public Sans
    fontSize: 1rem
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 0.75rem
rounded:
  sm: 4px
  md: 8px
spacing:
  sm: 8px
  md: 16px
---

## Overview

Architectural Minimalism meets Journalistic Gravitas.
```

### Secciones (orden canónico)

| # | Sección | Aliases |
|---|---------|---------|
| 1 | Overview | Brand & Style |
| 2 | Colors | |
| 3 | Typography | |
| 4 | Layout | Layout & Spacing |
| 5 | Elevation & Depth | Elevation |
| 6 | Shapes | |
| 7 | Components | |
| 8 | Do's and Don'ts | |

---

## Token Schema

```yaml
version: <string>          # optional, "alpha"
name: <string>
description: <string>      # optional
colors:
  <token-name>: <Color>
typography:
  <token-name>: <Typography>
rounded:
  <scale-level>: <Dimension>
spacing:
  <scale-level>: <Dimension | number>
components:
  <component-name>:
    <token-name>: <string | token reference>
```

### Tipos de Token

| Type | Format | Example |
|------|--------|---------|
| Color | `#` + hex (sRGB) | `"#1A1C1E"` |
| Dimension | number + unit | `48px`, `-0.02em` |
| Token Ref | `{path.to.token}` | `{colors.primary}` |
| Typography | object | `fontFamily`, `fontSize`, etc. |

### Component Tokens

```yaml
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    rounded: "{rounded.sm}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "{colors.tertiary-container}"
```

Propiedades válidas: `backgroundColor`, `textColor`, `typography`, `rounded`, `padding`, `size`, `height`, `width`.

---

## CLI - `@google/design.md`

```bash
# Instalar
npm install @google/design.md
# En Windows: npm install "@google/design.md"

# Lint (valida estructura)
npx @google/design.md lint DESIGN.md

# Diff (compara dos versiones)
npx @google/design.md diff DESIGN.md DESIGN-v2.md

# Export (convierte tokens a otros formatos)
npx @google/design.md export --format json-tailwind DESIGN.md
npx @google/design.md export --format css-tailwind DESIGN.md
npx @google/design.md export --format dtcg DESIGN.md   # W3C DTCG

# Spec (output de la especificación para agent prompts)
npx @google/design.md spec
npx @google/design.md spec --rules
```

### Windows Tip

Usar `designmd` en lugar de `design.md` en scripts de package.json (el `.md` confunde la resolución de comandos en Windows):

```json
{
  "scripts": {
    "design:lint": "designmd lint DESIGN.md"
  }
}
```

---

## Linting Rules

| Rule | Severity | Qué comprueba |
|------|----------|---------------|
| `broken-ref` | error | Token references `{colors.x}` que no resuelven |
| `missing-primary` | warning | No hay color `primary` definido |
| `contrast-ratio` | warning | Pares bg/text por debajo de WCAG AA (4.5:1) |
| `orphaned-tokens` | warning | Tokens definidos pero nunca referenciados |
| `token-summary` | info | Resumen de tokens definidos |
| `missing-sections` | info | Secciones opcionales ausentes |
| `missing-typography` | warning | Colores definidos pero no typography |
| `section-order` | warning | Secciones fuera del orden canónico |

---

## Programmatic API

```typescript
import { lint } from '@google/design.md/linter';

const report = lint(markdownString);
console.log(report.findings);      // Finding[]
console.log(report.summary);       // { errors, warnings, info }
console.log(report.designSystem);  // Parsed DesignSystemState
```

---

## Export Formats

| Format | Output | Description |
|--------|--------|-------------|
| `json-tailwind` | JSON | Tailwind v3 `theme.extend` config |
| `css-tailwind` | CSS | Tailwind v4 `@theme { ... }` block |
| `dtcg` | JSON | W3C Design Tokens Format |

---

## Lo que aprendí

1. **Los agentes de IA NO adivinan diseño** — necesitan valores exactos (hex, px, fontFamily) o inventan.
2. **DESIGN.md = YAML + Markdown** — tokens para la máquina, prosa para el humano (y el agente).
3. **Token references** con sintaxis `{colors.primary}` permiten relaciones entre tokens (un botón referencia un color).
4. **Component variants** se expresan como entradas separadas con nombre relacionado (`button-primary-hover`).
5. **CLI tool** para lint, diff y export a Tailwind/DTCG — integrable en CI/CD.
6. **WCAG AA checking** automático en el linter — atrapa problemas de contraste antes de deploy.
7. **Útil para proyectos con IA** — si usas Cursor, Claude Code o Copilot, un DESIGN.md alinea el output visual.
