(function () {
  function gatherData(ctx) {
    const {
      sheetSeguimiento,
      calentamientoText,
      tablaHombre,
      tablaMujer,
      daysContainer,
      radioHombre
    } = ctx || {};

    const data = {
      seguimiento: {},
      calentamiento: calentamientoText ? calentamientoText.value : '',
      tablaHombre: [],
      tablaMujer: [],
      rutina: [],
      genero: radioHombre && radioHombre.checked ? 'hombre' : 'mujer'
    };

    if (sheetSeguimiento) sheetSeguimiento.querySelectorAll('input').forEach(input => {
      if (input.type !== 'radio' && input.id) data.seguimiento[input.id.replace('sheet-', '')] = input.value;
    });
    if (tablaHombre) tablaHombre.querySelectorAll('tbody tr').forEach(row => data.tablaHombre.push(Array.from(row.cells).map(cell => cell.innerText)));
    if (tablaMujer) tablaMujer.querySelectorAll('tbody tr').forEach(row => data.tablaMujer.push(Array.from(row.cells).map(cell => cell.innerText)));
    if (daysContainer) {
      daysContainer.querySelectorAll('.day-card').forEach(card => {
        const mgInput = card.querySelector('.day-muscle-group');
        const muscleGroup = mgInput ? mgInput.value : '';
        const exercises = Array.from(card.querySelectorAll('tbody tr')).map(row => ({
          name: row.cells[0]?.textContent || '',
          link: row.dataset?.link,
          series: row.cells[2]?.innerText || '',
          reps: row.cells[3]?.innerText || '',
          progressive: row.cells[1]?.querySelector('.progressive-checkbox')?.checked || false
        }));
        data.rutina.push({ muscleGroup, exercises });
      });
    }
    return data;
  }

  function populateUI(ctx, data) {
    if (!data) return;
    const { clearUI, calentamientoText, tablaHombre, tablaMujer, tablaHombreContainer, tablaMujerContainer, createDayCard } = ctx || {};
    if (typeof clearUI === 'function') clearUI();
    if (data.seguimiento) for (const key in data.seguimiento) {
      const input = document.getElementById(`sheet-${key}`);
      if (input) input.value = data.seguimiento[key];
    }
    if (calentamientoText) calentamientoText.value = data.calentamiento || '';
    if (data.tablaHombre && tablaHombre) data.tablaHombre.forEach((rowData, rIndex) => {
      const row = tablaHombre.rows[rIndex + 1];
      if (row) rowData.forEach((cellData, cIndex) => { if (row.cells[cIndex]) row.cells[cIndex].innerText = cellData; });
    });
    if (data.tablaMujer && tablaMujer) data.tablaMujer.forEach((rowData, rIndex) => {
      const row = tablaMujer.rows[rIndex + 1];
      if (row) rowData.forEach((cellData, cIndex) => { if (row.cells[cIndex]) row.cells[cIndex].innerText = cellData; });
    });
    if (data.rutina && typeof createDayCard === 'function') data.rutina.forEach(dayData => createDayCard(dayData));
    if (data.genero === 'mujer') {
      if (tablaHombreContainer) tablaHombreContainer.classList.add('hidden');
      if (tablaMujerContainer) tablaMujerContainer.classList.remove('hidden');
    } else {
      if (tablaHombreContainer) tablaHombreContainer.classList.remove('hidden');
      if (tablaMujerContainer) tablaMujerContainer.classList.add('hidden');
    }
  }

  function clearUI(ctx) {
    const { daysContainer, fillTable, tablaHombre, tablaMujer, setDayCounter } = ctx || {};
    document.querySelectorAll('input, textarea').forEach(el => {
      if (el.type !== 'radio' && el.type !== 'checkbox' && !el.closest('#sidebar-tabs')) el.value = '';
    });
    if (daysContainer) {
      daysContainer.innerHTML = '';
      if (typeof setDayCounter === 'function') setDayCounter(0);
    }
    if (typeof fillTable === 'function') {
      fillTable(tablaHombre, true);
      fillTable(tablaMujer, false);
    }
  }

  window.Data = { gatherData, populateUI, clearUI };
})();


