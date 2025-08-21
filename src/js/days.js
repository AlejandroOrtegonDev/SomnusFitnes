(function () {
  function createDayCard(ctx, dayData = null) {
    const {
      daysContainer,
      dayCounter,
      setDayCounter,
      showToast,
      openExerciseModal,
      setCurrentExerciseTableBody
    } = ctx || {};

    if (!daysContainer) return;
    if ((dayCounter || 0) >= 7 && !dayData) {
      if (typeof showToast === 'function') showToast("No se pueden agregar más de 7 días.");
      return;
    }
    
    const newCounter = (dayCounter || 0) + 1;
    if (typeof setDayCounter === 'function') setDayCounter(newCounter);
    
    // Encontrar o crear la fila actual (cada fila contiene 3 días máximo)
    let currentRow = daysContainer.querySelector('.days-row:last-child');
    if (!currentRow || currentRow.children.length >= 3) {
      currentRow = document.createElement('div');
      currentRow.className = 'days-row';
      daysContainer.appendChild(currentRow);
    }
    
    const card = document.createElement('div');
    card.className = 'day-card';
    card.id = `day-${newCounter}`;
    card.innerHTML = `
      <table class="day-table">
        <colgroup>
          <col class="col-name" />
          <col class="col-sp" />
          <col class="col-s" />
          <col class="col-r" />
        </colgroup>
        <thead>
          <tr>
            <th colspan="4" class="day-title-cell">Día ${newCounter} <input type="text" class="day-muscle-group" placeholder="músculo a ejercitar" /></th>
          </tr>
          <tr>
            <th>Ejercicio</th>
            <th>SP</th>
            <th>S</th>
            <th>R</th>
          </tr>
        </thead>
        <tbody></tbody>
        <tfoot>
          <tr>
            <td colspan="2" class="add-exercise-cell">Agregar ejercicio</td>
            <td colspan="2" class="remove-exercise-cell">Eliminar ejercicio</td>
          </tr>
        </tfoot>
      </table>`;
    currentRow.appendChild(card);

    const tbody = card.querySelector('tbody');
    const tfoot = card.querySelector('tfoot');
    const mgInput = card.querySelector('.day-muscle-group');

    // Ajusta dinámicamente la altura de la tarjeta según número de ejercicios
    const autoResizeDayCard = () => {
      if (!tbody) return;
      
      // Marcar filas vacías para que se oculten en la impresión
      Array.from(tbody.rows).forEach(row => {
        const nameCell = row.cells[0];
        const hasContent = nameCell && nameCell.textContent.trim() !== '';
        if (hasContent) {
          row.classList.remove('empty-row');
        } else {
          row.classList.add('empty-row');
        }
      });
      
      // Contar solo filas que tienen contenido real
      const realExercises = Array.from(tbody.rows).filter(row => {
        const nameCell = row.cells[0];
        return nameCell && nameCell.textContent.trim() !== '';
      }).length;
      
      const headerAndControls = 120; // Reducido para mejor ajuste
      const perRow = 48; // Altura por fila de ejercicio
      const minRowsForDisplay = Math.max(3, realExercises); // Mínimo 3 filas para estructura
      const calculatedHeight = headerAndControls + minRowsForDisplay * perRow;
      const finalHeight = Math.max(200, calculatedHeight); // Altura mínima más pequeña
      
      card.style.minHeight = finalHeight + 'px';
      card.style.height = 'auto';
      
      // Marcar la tarjeta con atributo para CSS responsive
      card.setAttribute('data-exercises', realExercises);
    };

    // Si viene con datos, establecer el músculo
    if (dayData && dayData.muscleGroup && mgInput) {
      mgInput.value = dayData.muscleGroup;
    }
    if (dayData && dayData.exercises) {
      dayData.exercises.forEach(ex => {
        const newRow = tbody.insertRow();
        newRow.dataset.link = ex.link;
        const progressiveChecked = ex.progressive ? 'checked' : '';
        newRow.innerHTML = `
          <td class="exercise-link"><div class="exercise-name">${ex.name}</div></td>
          <td class="progressive-cell"><input type="checkbox" class="progressive-checkbox" ${progressiveChecked} /></td>
          <td contenteditable="true">${ex.series || ''}</td>
          <td contenteditable="true">${ex.reps || ''}</td>
        `;
      });
      autoResizeDayCard();
    }

    // Redimensionar al crear la tarjeta (sin ejercicios)
    autoResizeDayCard();
    
    // Listener para detectar cambios en el contenido de las celdas
    if (tbody) {
      tbody.addEventListener('input', () => {
        // Pequeño delay para que el contenido se actualice
        setTimeout(autoResizeDayCard, 10);
      });
      
      // También escuchar cambios en los checkboxes
      tbody.addEventListener('change', () => {
        setTimeout(autoResizeDayCard, 10);
      });
    }
    
    if (tfoot) {
      tfoot.addEventListener('click', (e) => {
        if (e.target && e.target.closest('.add-exercise-cell')) {
          if (typeof setCurrentExerciseTableBody === 'function') setCurrentExerciseTableBody(tbody);
          if (typeof openExerciseModal === 'function') openExerciseModal();
          return;
        }
        if (e.target && e.target.closest('.remove-exercise-cell')) {
          if (tbody && tbody.rows.length > 0) {
            tbody.deleteRow(tbody.rows.length - 1);
            autoResizeDayCard();
          }
        }
      });
    }
  }

  function openExerciseModal(ctx) {
    const { exerciseModal, exerciseSelection, exercisesData } = ctx || {};
    if (!exerciseModal || !exerciseSelection) return;
    
    exerciseSelection.innerHTML = '';
    
    // Crear input de búsqueda
    const searchDiv = document.createElement('div');
    searchDiv.className = 'mb-4';
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Buscar ejercicio...';
    searchInput.className = 'w-full p-2 border rounded mb-2 text-lg';
    searchDiv.appendChild(searchInput);
    exerciseSelection.appendChild(searchDiv);

    // Función para renderizar la lista filtrada
    function renderExerciseList(filterText = '') {
      Array.from(exerciseSelection.querySelectorAll('.exercise-category')).forEach(el => el.remove());
      for (const category in exercisesData) {
        const filteredExercises = exercisesData[category].filter(exercise =>
          exercise.name.toLowerCase().includes(filterText.toLowerCase())
        );
        if (filteredExercises.length === 0) continue;
        
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'exercise-category';
        const categoryTitle = document.createElement('h4');
        categoryTitle.className = "font-bold text-xl border-b-2 border-blue-500 pb-1 mb-2";
        categoryTitle.textContent = category;
        categoryDiv.appendChild(categoryTitle);
        
        const exerciseList = document.createElement('ul');
        filteredExercises.forEach(exercise => {
          const exerciseItem = document.createElement('li');
          exerciseItem.className = "p-3 cursor-pointer border-b hover:bg-gray-100 text-lg";
          exerciseItem.textContent = exercise.name;
          exerciseItem.dataset.name = exercise.name;
          exerciseItem.dataset.link = exercise.link;
          exerciseList.appendChild(exerciseItem);
        });
        categoryDiv.appendChild(exerciseList);
        exerciseSelection.appendChild(categoryDiv);
      }
    }

    // Render inicial
    renderExerciseList();
    
    // Evento de búsqueda
    searchInput.addEventListener('input', (e) => {
      renderExerciseList(e.target.value);
    });
    
    exerciseModal.classList.remove('hidden');
  }

  function closeExerciseModal(ctx) {
    const { exerciseModal } = ctx || {};
    if (exerciseModal) exerciseModal.classList.add('hidden');
  }

  function removeDayCard(ctx) {
    const { dayCounter, setDayCounter, daysContainer, showConfirmation } = ctx || {};
    if ((dayCounter || 0) <= 0) return;
    
    if (typeof showConfirmation === 'function') {
      showConfirmation("¿Estás seguro de que quieres eliminar el último día?", () => {
        const lastDay = document.getElementById(`day-${dayCounter}`);
        if (lastDay) {
          const parentRow = lastDay.parentElement;
          parentRow.removeChild(lastDay);
          
          // Si la fila queda vacía, eliminarla
          if (parentRow.children.length === 0) {
            daysContainer.removeChild(parentRow);
          }
          
          if (typeof setDayCounter === 'function') setDayCounter((dayCounter || 0) - 1);
        }
      });
    }
  }

  window.Days = { createDayCard, openExerciseModal, closeExerciseModal, removeDayCard };
})();
