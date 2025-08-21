(function () {
  function fillTable(tableElement, isHombre) {
    if (!tableElement) return;
    const controls = isHombre
      ? ["PESO", "TORAX", "HOMBRO", "ESPALDA", "BICEPS", "CINTURA", "PIERNA", "PANTORRILLA", "FECHA"]
      : ["PESO", "CINTURA", "ABDOMEN", "CADERA", "BUSTO", "ESPALDA", "PIERNA", "BICEPS", "FECHA"];
    const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

    let headerHTML = '<thead><tr class="bg-gray-200">';
    headerHTML += '<th class="p-2 border border-gray-400 w-1/4">CONTROL</th>';
    months.forEach(month => {
      headerHTML += `<th class="p-2 border border-gray-400">${month}</th>`;
    });
    headerHTML += '</tr></thead>';

    let bodyHTML = '<tbody contenteditable="true">';
    controls.forEach(control => {
      bodyHTML += '<tr class="border-t border-gray-300">';
      bodyHTML += `<td class="p-2 border border-gray-400 font-bold bg-gray-100">${control}</td>`;
      for (let i = 0; i < 12; i++) {
        bodyHTML += '<td class="p-2 border border-gray-400 h-10"></td>';
      }
      bodyHTML += '</tr>';
    });
    bodyHTML += '</tbody>';
    tableElement.innerHTML = headerHTML + bodyHTML;
  }

  function handleGeneroChange(radioHombre, tablaHombreContainer, tablaMujerContainer) {
    if (!radioHombre || !tablaHombreContainer || !tablaMujerContainer) return;
    if (radioHombre.checked) {
      tablaHombreContainer.classList.remove('hidden');
      tablaMujerContainer.classList.add('hidden');
    } else {
      tablaHombreContainer.classList.add('hidden');
      tablaMujerContainer.classList.remove('hidden');
    }
  }

  window.Tables = { fillTable, handleGeneroChange };
})();


