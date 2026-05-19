# Prompt Master Reference

**Repo:** https://github.com/nidhinjs/prompt-master  
**Stars:** 7.9k | **License:** MIT | **Versión:** 1.6.0  
**Creado por:** nidhinjs

Una Claude Skill que escribe prompts precisos para cualquier herramienta de IA. Zero tokens o créditos desperdiciados.

---

## ¿Por qué existe?

Cada usuario de IA desperdicia créditos igual:

> Escribe prompt vago → output incorrecto → re-prompt → más cerca → re-prompt otra vez → finalmente obtienes lo que querías en el intento 4

Eso son 3 llamadas API desperdiciadas. Multiplica por 50 prompts al día. Prompt Master resuelve esto aplicando un pipeline estructurado.

---

## Pipeline Interno

1. **Detecta la herramienta destino** — rutas silenciosamente al enfoque correcto
2. **Extrae 9 dimensiones de intento** — task, input, output, constraints, context, audience, memory, success criteria, examples
3. **Preguntas clarificadoras** — máximo 3 si falta info crítica
4. **Rutea al framework correcto** — elige la arquitectura de prompt automáticamente
5. **Aplica técnicas seguras** — role assignment, few-shot, XML structure, grounding anchors, memory block
6. **Token efficiency audit** — elimina cada palabra que no cambia el output
7. **Entrega el prompt** — un bloque limpio para copiar + nota estratégica de una línea

---

## 9 Dimensiones de Intento

| Dimensión | Qué extrae | ¿Crítica? |
|-----------|------------|-----------|
| **Task** | Acción específica — convierte verbos vagos en operaciones precisas | Siempre |
| **Target tool** | Qué sistema IA recibe el prompt | Siempre |
| **Output format** | Forma, longitud, estructura del resultado | Siempre |
| **Constraints** | Qué DEBE y NO DEBE pasar | Si es complejo |
| **Input** | Qué provee el usuario junto al prompt | Si aplica |
| **Context** | Dominio, estado del proyecto, decisiones previas | Si hay historial |
| **Audience** | Quién lee el output, su nivel técnico | Si es para usuarios |
| **Success criteria** | Cómo saber que funcionó | Si es complejo |
| **Examples** | Pares input/output para fijar formato | Si es crítico |

---

## 30+ Tool Profiles

### Chat LLMs

| Tool | Estrategia |
|------|------------|
| **Claude 4.x** | Literal — da contexto y razón, no solo qué. XML tags para secciones. NO "think step by step" (adaptive thinking). Template M para tareas agénticas |
| **ChatGPT / GPT-5.x** | Compacto. Contrato de output explícito. Constrain verbosidad |
| **o3 / o4-mini** | **Short clean ONLY.** NO CoT, NO "think step by step" — piensan internamente |
| **Gemini 2.x / 3** | Long-context. Añadir "Cite only sources you are certain of". Formato explícito |
| **DeepSeek-R1** | Como o3 — instrucciones cortas. CoT degrada output |
| **Qwen3 thinking** | Como o3. NO CoT. En non-thinking mode: como Qwen2.5 instruct |

### Coding Agents

| Tool | Estrategia |
|------|------------|
| **Claude Code** | Starting state + target state + stop conditions (MANDATORY) + file scope. Front-load everything. Template M para tareas complejas |
| **Cursor / Windsurf** | File path + function name + current behavior + desired change + do-not-touch list |
| **GitHub Copilot** | Function signature + docstring exacta. Sin ambigüedad |
| **Bolt / v0 / Lovable** | Stack spec + qué NO scaffold. "Do not add auth, dark mode" |

### Image AI

| Tool | Estrategia |
|------|------------|
| **Midjourney** | Comma-separated. Subject → style → mood → lighting. `--ar 16:9 --v 6 --style raw`. `--no [unwanted]` |
| **DALL-E 3** | Prose description. "Do not include text in image." Foreground/midground/background |
| **Stable Diffusion** | `(word:weight)` syntax. CFG 7-12. Negative prompt MANDATORY |

### Agentic / Autonomous

| Tool | Estrategia |
|------|------------|
| **Devin / SWE-agent** | Starting state + target state. Forbidden actions list CRITICAL. Scope filesystem |
| **Antigravity** | Task-based. Prompt for Artifact before execution. Specify autonomy level |
| **Manus** | Describe end deliverable, not steps. Verification checkpoints |

---

## 12 Prompt Templates (Auto-Selected)

| Template | Best For |
|----------|----------|
| **RTF** (Role, Task, Format) | Fast one-shot tasks |
| **CO-STAR** (Context, Objective, Style, Tone, Audience, Response) | Professional documents, reports |
| **RISEN** (Role, Instructions, Steps, End Goal, Narrowing) | Complex multi-step projects |
| **CRISPE** (Capacity, Role, Insight, Statement, Personality, Experiment) | Creative work, brand voice |
| **Chain of Thought** | Math, logic, debugging |
| **Few-Shot** | Consistent structured output |
| **File-Scope Template** | Cursor, Windsurf, Copilot |
| **ReAct + Stop Conditions** | Claude Code, Devin, AutoGPT |
| **Visual Descriptor** | Midjourney, DALL-E, Stable Diffusion |
| **Reference Image Editing** | Edit existing image |
| **ComfyUI** | Node-based image workflows |
| **Prompt Decompiler** | Break down / adapt existing prompts |

---

## 35 Credit-Killing Patterns

### Task Patterns (7)

| # | Patrón | Before → After |
|---|--------|----------------|
| 1 | Vague task verb | "help me with my code" → "Refactor `getUserData()` to use async/await" |
| 2 | Two tasks in one | Split into sequential prompts |
| 3 | No success criteria | Add "Done when:" |
| 4 | Over-permissive agent | Allowed + forbidden actions list |
| 5 | Emotional description | Extract specific technical fault |
| 6 | Build the whole thing | Break into Prompt 1 (scaffold), Prompt 2 (feature), Prompt 3 (polish) |
| 7 | Implicit reference | Always restate full task |

### Context Patterns (6)

| # | Patrón | Fix |
|---|--------|-----|
| 8 | Assumed prior knowledge | Include Memory Block |
| 9 | No project context | Add full context (role, company, experience) |
| 10 | Forgotten stack | Always include Memory Block |
| 11 | Hallucination invite | "Cite only sources you are certain of" |
| 12 | Undefined audience | Specify technical level and role |
| 13 | No mention of prior failures | State what was tried and why it failed |

### Format Patterns (6)

| # | Patrón | Fix |
|---|--------|-----|
| 14 | Missing output format | "3 bullet points, each under 20 words" |
| 15 | Implicit length | "Exactly 3 sentences" |
| 16 | No role assignment | "You are a senior backend engineer..." |
| 17 | Vague aesthetic | Translate to concrete values: hex, px, font |
| 18 | No negative prompts (image AI) | Add `--no watermark, blur, extra fingers` |
| 19 | Prose prompt for Midjourney | Convert to comma-separated descriptors |

### Scope Patterns (6)

| # | Patrón | Fix |
|---|--------|-----|
| 20 | No scope boundary | "Fix only login form validation in `src/auth.js`" |
| 21 | No stack constraints | "React 18, TypeScript strict, Tailwind only" |
| 22 | No stop condition | Stop conditions + checkpoint per step |
| 23 | No file path for IDE AI | "Update `handleLogin()` in `src/pages/Login.tsx` only" |
| 24 | Wrong template for tool | Adapt to tool's syntax |
| 25 | Pasting entire codebase | Scope to relevant function and file only |

---

## Memory Block System

Cuando la conversación tiene historia, se antepone un Memory Block para que el agente nunca contradiga trabajo anterior:

```
## Context (carry forward)
- Stack: React 18 + TypeScript + Supabase
- Auth uses JWT stored in httpOnly cookies, not localStorage
- Component naming: PascalCase, no default exports
- Architecture: no Redux, context API only
```

**Colocar en el primer 30% del prompt** para que sobreviva al attention decay del modelo.

---

## Técnicas Seguras (Solo 5)

| Técnica | Cuándo usar |
|---------|-------------|
| **Role Assignment** | Tareas complejas: "Senior backend engineer specializing in distributed systems" |
| **Few-Shot Examples** | Cuando el formato es más fácil de mostrar que describir (2-5 ejemplos) |
| **XML Structural Tags** | Claude-based tools: `<context>`, `<task>`, `<constraints>` |
| **Grounding Anchors** | Tareas factuales: "Use only information you are highly confident is accurate" |
| **Chain of Thought** | Solo en LLMs estándar (Claude, GPT, Gemini). NUNCA en o3/R1/Qwen3-thinking |

**Técnicas EXCLUIDAS** (alto riesgo de fabricación): Tree of Thought, Graph of Thought, Universal Self-Consistency, prompt chaining.

---

## Output Format

```
[Prompt block listo para copiar]

🎯 Target: [tool name] · 💡 [One sentence — qué se optimizó y por qué]

[Si necesita setup: nota de 1-2 líneas. Solo cuando es genuinamente necesario.]
```

---

## Lo que aprendí

1. **El mejor prompt no es el más largo — es donde cada palabra es estructural.** Prompt Master elimina todo lo que no cambia el output.
2. **35 patrones que matan créditos** — la mayoría son errores de scope, contexto o formato que se arreglan con estructura explícita.
3. **Cada herramienta IA tiene su propia sintaxis** — Midjourney necesita commas, no prosa. o3 necesita instrucciones cortas, no CoT. Claude Code necesita stop conditions.
4. **Memory Block es el fix más importante para sesiones largas** — la mayoría de re-prompts vienen de que la IA olvida lo que ya decidiste.
5. **No todas las técnicas de prompting son seguras** — ToT, GoT y prompt chaining aumentan el riesgo de fabricación.
6. **Para agentes (Cursor, Claude Code, Devin), las stop conditions son MANDATORIAS** — sin ellas, loops infinitos queman créditos.
7. **Los modelos de razonamiento (o3, R1, Qwen3-thinking) son diferentes** — añadirles CoT activamente degrada su output.
