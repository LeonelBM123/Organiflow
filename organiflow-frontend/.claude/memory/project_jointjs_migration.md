---
name: JointJS migration plan
description: Plan to migrate workflow editor from Syncfusion to JointJS, including auto-swimlanes from departments feature
type: project
---

Migrating workflow editor from Syncfusion Diagram to JointJS (@joint/core).

**Why:** Syncfusion `saveDiagram()` produces ~33KB per collaboration broadcast. JointJS `graph.toJSON()` produces ~4KB for the same diagram (~85% reduction).

**Integrated feature:** On new workflow, auto-generate swimlanes from tenant's active departments (via `GET /api/v1/departments`) instead of an empty canvas.

**Files rewritten:** workflow-editor.component.ts, workflow-editor.component.html, workflow.mapper.ts, symbol-palette.component.ts

**Files NOT changed:** collaboration.service.ts (zero changes), workflow.model.ts, node-panel, toolbar, remote-cursors, presence-bar, all backend

**New files:** diagram.service.ts (JointJS wrapper), jointjs-shapes.ts (custom shapes)

**Full plan:** `docs/JOINTJS_MIGRATION_PLAN.md`

**PROGRESO ACTUAL:** Migración COMPLETA — build sin errores
**Fases completadas:** 0 (deps), 1 (shapes), 2 (DiagramService), 3 (mapper+departmentsToLanes), 4 (palette), 5 (editor+html+scss)
**Pendiente:** Fase 6 — prueba de colaboración en tiempo real con el servidor corriendo
**Archivos nuevos creados:** services/jointjs-shapes.ts, services/diagram.service.ts
**Archivos reescritos:** workflow.mapper.ts, symbol-palette.component.ts+html+scss, workflow-editor.component.ts+html+scss, main.ts, angular.json

**Why:** Performance for real-time collaboration. uiSchema format changes from Syncfusion proprietary JSON to JointJS `{ cells: [...] }`.

**How to apply:** When implementing any workflow editor change, follow the phases in the plan doc. The collaboration layer is untouched.
