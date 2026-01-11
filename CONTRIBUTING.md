# Contributing to Azure Workflow Actions

¡Gracias por tu interés en contribuir! 🎉

## 🚀 Cómo Contribuir

### 1. Fork el Repositorio

```bash
gh repo fork YOUR-ORG/azure-workflow-actions
cd azure-workflow-actions
```

### 2. Crea una Rama

```bash
git checkout -b feature/nueva-funcionalidad
# o
git checkout -b fix/corregir-bug
```

### 3. Realiza tus Cambios

- Mantén el código limpio y documentado
- Sigue las convenciones de estilo existentes
- Añade tests si es aplicable
- Actualiza la documentación

### 4. Commit y Push

```bash
git add .
git commit -m "feat: descripción de la nueva funcionalidad"
git push origin feature/nueva-funcionalidad
```

### 5. Crea un Pull Request

- Ve a GitHub y crea un Pull Request
- Describe claramente qué cambios realizaste
- Referencia cualquier issue relacionado

## 📝 Guías de Estilo

### Commits

Usa [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `refactor:` Refactorización de código
- `test:` Añadir o actualizar tests
- `chore:` Cambios en build o herramientas

Ejemplos:
```
feat: añadir soporte para notificaciones por email
fix: corregir error en deploy a slot de staging
docs: actualizar ejemplos de uso
```

### YAML

- Usa 2 espacios para indentación
- Añade comentarios descriptivos
- Mantén nombres consistentes con kebab-case

### Documentación

- Actualiza README.md si añades nuevas features
- Añade ejemplos en EXAMPLES.md
- Documenta inputs/outputs en action.yml

## 🧪 Testing

Antes de enviar un PR:

1. Prueba tus cambios localmente
2. Verifica que la sintaxis YAML es correcta
3. Prueba el workflow en un repo de prueba

```bash
# Validar sintaxis YAML
yamllint .github/workflows/*.yml
yamllint .github/actions/*/action.yml
```

## 📋 Checklist para Pull Requests

- [ ] El código sigue las guías de estilo
- [ ] He actualizado la documentación
- [ ] He añadido ejemplos si es necesario
- [ ] He probado los cambios localmente
- [ ] El commit message sigue Conventional Commits
- [ ] He actualizado el CHANGELOG.md

## 🐛 Reportar Bugs

Usa GitHub Issues con la plantilla de bug:

**Título:** Descripción breve del bug

**Descripción:**
- ¿Qué esperabas que pasara?
- ¿Qué pasó realmente?
- Pasos para reproducir
- Logs o capturas de pantalla

**Ambiente:**
- SO:
- Versión de Node/Java:
- Versión del action:

## 💡 Sugerir Nuevas Funcionalidades

Usa GitHub Issues con la plantilla de feature:

**Título:** Descripción breve de la funcionalidad

**Descripción:**
- ¿Qué problema resuelve?
- ¿Cómo debería funcionar?
- ¿Hay alternativas?
- Ejemplos de uso

## 📜 Código de Conducta

- Sé respetuoso y profesional
- Acepta críticas constructivas
- Enfócate en lo mejor para la comunidad
- Ayuda a otros contribuidores

## 🤝 Obtener Ayuda

Si tienes preguntas:

1. Revisa la documentación (README, USAGE, EXAMPLES)
2. Busca en Issues cerrados
3. Abre un nuevo Issue con la etiqueta `question`
4. Únete a las discusiones en Discussions

## 🎁 Reconocimientos

Todos los contribuidores serán añadidos al README.

---

¡Gracias por hacer este proyecto mejor! 🙌
