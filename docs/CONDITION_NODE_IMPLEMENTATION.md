# Guía de Implementación Frontend: Variables de Ejecución

Ahora que el backend cuenta con un verdadero motor BPM con memoria (Variables Globales), saltos condicionales y evaluación AND-join; es necesario conectar la interfaz del diagrama (Angular) para alimentar estos sistemas lógicos.

## 1. El concepto clave

En el backend, todas las respuestas de los formularios que se llenan durante una tarea (`formData`) se combinan en un pozo de memoria compartido de la ejecución actual, llamado `globalVariables`. 

Por ejemplo, si la "Tarea 1" despliega un `formSchema` con un checkbox `"aprobado" -> true`, este par llave/valor viaja al backend y se instala en `globalVariables.aprobado = true`. 
Cuando el flujo llegue a un nodo de tipo `CONDITION`, las flechas que salgan de él evaluarán esa variable estricta y se abrirá el camino adecuado.

## 2. Lo que se debe construir en el Frontend

Para que el usuario que diseña el diagrama aproveche este poder, se deben agregar opciones de configuración en el **Panel de Conectores (Edges)**.

### A. Modificación a `connector-panel.component.html/.ts` (Nuevo o Existente)
Al igual que existe un `node-panel` para editar nodos al hacer clic, debe existir algo similar al hacer clic en un conector/flecha.

Si la flecha (`Connector`) nace (su `sourceID`) de un nodo `CONDITION`, debes mostrar un formulario de reglas:
1. **Atributo del form de origen que define la condición:** Un input text llamado `field` donde pondrán qué campo del formulario evaluará (ej. `"aprobado"`).
2. **Operador lógico:** Un select `"=="`, `"!="`, `">"`, `"<"`.
3. **Valor comparativo:** El valor esperado para que la fecha se habilite (`true`, o `2500`...)

### B. Mapeo en Syncfusion `addInfo`
Una vez configurado este panel, debes guardar la regla en el propio de Syncfusion. Así como el `formSchema` se guarda en `node.addInfo.formSchema`, las condiciones deben guardarse en `connector.addInfo.conditionRule`.

```json
{
  "addInfo": {
    "relationType": "CONDITIONAL",
    "conditionRule": {
      "field": "aprobado",
      "operator": "==",
      "value": "true"
    }
  }
}
```

> [!TIP]
> Recuerda que si el usuario escribe `true` en el panel (como string), el sistema actual evaluará `"true".equals("true")` en Java, lo cual es perfectamente legal ya que se convierte todo a texto seguro para las validaciones lógicas primarias.

### C. El Mapper ya está preparado
Afortunadamente, el `WorkflowMapper` (`fromSyncfusion`) ya tiene soporte para buscar la propiedad `conditionRule` en la línea `214`.

```typescript
// extract from workflow.mapper.ts
conditionRule: info['conditionRule'] as WorkflowEdge['conditionRule']
```
Por tanto, si depositas el formulario de condición dentro de `addInfo.conditionRule`, ¡el Mapper lo empaquetará automáticamente y se mandará al backend!

## 3. Resumen de Flujo Esperado

1. Usuario crea tarea de "Aprobación de crédito". Añade Formulario -> Checkbox `CreditoAprobado`.
2. Usuario une eso a un Nodo `CONDITION`.
3. Del Nodo `CONDITION` saca 2 flechas: 
    * Camino A (Flecha 1, al hacer click): Field `CreditoAprobado` == `true`
    * Camino B (Flecha 2, al hacer click): Field `CreditoAprobado` == `false`
4. ¡El backend se ocupará automáticamente del enrutamiento exacto!
