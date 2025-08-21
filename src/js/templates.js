(function () {
  function getTemplateGroup(templates, objetivo, nivel) {
    if (!templates) return null;
    const group = templates[objetivo] && templates[objetivo][nivel];
    return group || null;
  }

  function getAvailableOptionsFor(templates, objetivo, nivel, genero) {
    const group = getTemplateGroup(templates, objetivo, nivel);
    if (!group) return [];
    const genderNode = group[genero];
    if (genderNode && typeof genderNode === 'object' && !('calentamiento' in genderNode)) {
      return Object.keys(genderNode).filter(k => k === '1' || k === '2' || /^opcion/i.test(k));
    }
    return [];
  }

  function resolveTemplate(templates, objetivo, nivel, genero, opcion) {
    const group = getTemplateGroup(templates, objetivo, nivel);
    if (!group) return null;
    if (group[genero]) {
      const genderNode = group[genero];
      if (genderNode && typeof genderNode === 'object' && ('calentamiento' in genderNode)) {
        return genderNode;
      }
      if (genderNode && typeof genderNode === 'object') {
        if (opcion && genderNode[opcion]) return genderNode[opcion];
        const keys = Object.keys(genderNode);
        return genderNode[keys[0]] || null;
      }
    }
    if (group.default) return group.default;
    if ('calentamiento' in group && 'rutina' in group) return group;
    return null;
  }

  function updateTemplateOptionVisibility(params) {
    const { templates, selectTemplateObjetivo, selectTemplateNivel, templateOpcionWrapper, selectTemplateOpcion, templateRadioMujer, templateRadioHombre } = params || {};
    if (!selectTemplateObjetivo || !selectTemplateNivel || !templateOpcionWrapper) return;
    const objetivo = selectTemplateObjetivo.value;
    const nivel = selectTemplateNivel.value;
    const genero = (templateRadioMujer && templateRadioMujer.checked) ? 'mujer' : 'hombre';
    const options = getAvailableOptionsFor(templates, objetivo, nivel, genero);
    if (options.length > 1) {
      templateOpcionWrapper.classList.remove('hidden');
      if (selectTemplateOpcion) {
        selectTemplateOpcion.innerHTML = '';
        options.forEach(optKey => {
          const opt = document.createElement('option');
          const normalized = optKey.replace(/opcion/gi, '').trim() || optKey;
          opt.value = normalized;
          opt.textContent = `Opción ${normalized}`;
          selectTemplateOpcion.appendChild(opt);
        });
      }
    } else {
      templateOpcionWrapper.classList.add('hidden');
    }
  }

  window.Templates = {
    getTemplateGroup,
    getAvailableOptionsFor,
    resolveTemplate,
    updateTemplateOptionVisibility
  };
})();


