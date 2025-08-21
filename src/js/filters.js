(function () {
  function init(params) {
    const {
      clientListDiv,
      noResultsP,
      searchClientInput,
      filterObjetivo,
      filterFechaDesde,
      filterFechaHasta,
      btnLimpiarFiltros,
      electronAPI,
      populateUI
    } = params || {};

    let allClients = [];

    async function loadClientList() {
      if (!clientListDiv || !electronAPI) return;
      const clients = await electronAPI.getRoutines();
      allClients = clients || [];
      applyFilters();
    }

    function applyFilters() {
      if (!clientListDiv) return;
      const searchTerm = searchClientInput ? (searchClientInput.value || '').toLowerCase() : '';
      // Filtros adicionales (objetivo/fechas) aún no implementados
      const filteredClients = allClients.filter(name => !searchTerm || String(name).toLowerCase().includes(searchTerm));

      clientListDiv.innerHTML = '';
      if (filteredClients.length === 0) {
        if (noResultsP) noResultsP.classList.remove('hidden');
        return;
      }
      if (noResultsP) noResultsP.classList.add('hidden');

      filteredClients.forEach(client => {
        const btn = document.createElement('button');
        btn.className = 'block w-full text-left p-3 rounded-md hover:bg-gray-200 border border-gray-200 bg-white';
        btn.innerHTML = `
          <div class="font-semibold text-gray-800">${client}</div>
          <div class="text-sm text-gray-500">Última modificación: ${new Date().toLocaleDateString('es-ES')}</div>
        `;
        btn.onclick = async () => {
          try {
            const data = await electronAPI.loadRoutine(client);
            if (data && typeof populateUI === 'function') {
              populateUI(data);
            }
          } catch (e) {
            console.error('Error cargando rutina:', e);
          }
        };
        clientListDiv.appendChild(btn);
      });
    }

    function clearFilters() {
      if (searchClientInput) searchClientInput.value = '';
      if (filterObjetivo) filterObjetivo.value = '';
      if (filterFechaDesde) filterFechaDesde.value = '';
      if (filterFechaHasta) filterFechaHasta.value = '';
      applyFilters();
    }

    // Bind events si se entregan los elementos
    if (searchClientInput) searchClientInput.addEventListener('input', applyFilters);
    if (filterObjetivo) filterObjetivo.addEventListener('change', applyFilters);
    if (filterFechaDesde) filterFechaDesde.addEventListener('change', applyFilters);
    if (filterFechaHasta) filterFechaHasta.addEventListener('change', applyFilters);
    if (btnLimpiarFiltros) btnLimpiarFiltros.addEventListener('click', clearFilters);

    return { loadClientList, applyFilters, clearFilters };
  }

  window.Filters = { init };
})();


