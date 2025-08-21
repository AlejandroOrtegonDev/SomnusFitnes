(function () {
  let tabs = new Map(); // Almacenar las pestañas internas
  let tabCounter = 0;
  let activeTabId = 'main'; // ID de la pestaña activa
  let mainTabData = null; // Datos de la pestaña principal

  function createNewTab(routineData = null, clientName = null) {
    // Guardar los datos de la pestaña actual antes de cambiar
    saveCurrentTabData();
    
    tabCounter++;
    const tabId = `tab-${tabCounter}`;
    
    // Crear nueva pestaña
    const newTab = {
      id: tabId,
      clientName: clientName || 'Nueva ventana',
      data: routineData || {
        // Datos vacíos por defecto
        nombre: '',
        fecha: '',
        edad: '',
        eps: '',
        objetivos: '',
        contacto: '',
        whatsapp: '',
        firma: '',
        cedula: '',
        days: [],
        genero: 'hombre'
      },
      created: new Date()
    };
    
    tabs.set(tabId, newTab);
    
    // Cambiar a la nueva pestaña
    switchToTab(tabId);
    
    updateTabsDisplay();
    
    if (window.UI && window.UI.showToast) {
      window.UI.showToast(`Nueva pestaña creada: ${newTab.clientName}`);
    }
  }

  function createNewRoutine() {
    // Limpiar la rutina actual en la misma pestaña
    if (typeof window.clearUI === 'function') {
      window.clearUI();
    } else if (window.Data && typeof window.Data.clearUI === 'function') {
      window.Data.clearUI();
    }
    
    // Limpiar campos específicos
    const clientNameInput = document.getElementById('sheet-nombre');
    if (clientNameInput) clientNameInput.value = '';
    
    const dateInput = document.getElementById('sheet-fecha');
    if (dateInput) dateInput.value = '';
    
    const ageInput = document.getElementById('sheet-edad');
    if (ageInput) ageInput.value = '';
    
    const epsInput = document.getElementById('sheet-eps');
    if (epsInput) epsInput.value = '';
    
    const objectivesInput = document.getElementById('sheet-objetivos');
    if (objectivesInput) objectivesInput.value = '';
    
    const contactInput = document.getElementById('sheet-contacto');
    if (contactInput) contactInput.value = '';
    
    const whatsappInput = document.getElementById('sheet-whatsapp');
    if (whatsappInput) whatsappInput.value = '';
    
    const firmInput = document.getElementById('sheet-firma');
    if (firmInput) firmInput.value = '';
    
    const cedulaInput = document.getElementById('sheet-cedula');
    if (cedulaInput) cedulaInput.value = '';
    
    // Limpiar el contenedor de días
    const daysContainer = document.getElementById('days-container');
    if (daysContainer) {
      daysContainer.innerHTML = '';
    }
    
    // Resetear contador de días
    if (window.setDayCounter) {
      window.setDayCounter(0);
    }
    
    // Limpiar tablas de seguimiento
    const tablaHombre = document.getElementById('tabla-hombre');
    const tablaMujer = document.getElementById('tabla-mujer');
    
    if (tablaHombre && window.Tables && typeof window.Tables.fillTable === 'function') {
      window.Tables.fillTable(tablaHombre, true);
    }
    
    if (tablaMujer && window.Tables && typeof window.Tables.fillTable === 'function') {
      window.Tables.fillTable(tablaMujer, false);
    }
    
    // Resetear radio buttons de género
    const radioHombre = document.getElementById('genero-hombre');
    const radioMujer = document.getElementById('genero-mujer');
    
    if (radioHombre) radioHombre.checked = true;
    if (radioMujer) radioMujer.checked = false;
    
    // Mostrar tabla de hombre por defecto
    const tablaHombreContainer = document.getElementById('tabla-hombre-container');
    const tablaMujerContainer = document.getElementById('tabla-mujer-container');
    
    if (tablaHombreContainer) tablaHombreContainer.style.display = 'block';
    if (tablaMujerContainer) tablaMujerContainer.style.display = 'none';
    
    // Actualizar las pestañas para mostrar "Nueva rutina"
    updateTabsDisplay();
    
    // Mostrar mensaje de confirmación
    if (window.UI && window.UI.showToast) {
      window.UI.showToast('Nueva rutina creada');
    }
  }

  function saveCurrentTabData() {
    // Recopilar datos manualmente desde la interfaz
    const currentData = {
      nombre: '',
      fecha: '',
      edad: '',
      eps: '',
      objetivos: '',
      contacto: '',
      whatsapp: '',
      firma: '',
      cedula: '',
      genero: 'hombre',
      rutina: [],
      calentamiento: '',
      seguimiento: {},
      tablaHombre: [],
      tablaMujer: []
    };
    
    // Recopilar campos básicos
    const fields = {
      'sheet-nombre': 'nombre',
      'sheet-fecha': 'fecha', 
      'sheet-edad': 'edad',
      'sheet-eps': 'eps',
      'sheet-objetivos': 'objetivos',
      'sheet-contacto': 'contacto',
      'sheet-whatsapp': 'whatsapp',
      'sheet-firma': 'firma',
      'sheet-cedula': 'cedula'
    };
    
    Object.entries(fields).forEach(([elementId, dataKey]) => {
      const element = document.getElementById(elementId);
      if (element) {
        currentData[dataKey] = element.value || '';
      }
    });
    
    // Determinar género
    const radioMujer = document.getElementById('genero-mujer');
    if (radioMujer && radioMujer.checked) {
      currentData.genero = 'mujer';
    }
    
    // Recopilar calentamiento
    const calentamientoText = document.getElementById('calentamiento-text');
    if (calentamientoText) {
      currentData.calentamiento = calentamientoText.value || '';
    }
    
    // Recopilar días de rutina
    const daysContainer = document.getElementById('days-container');
    if (daysContainer && daysContainer.children.length > 0) {
      currentData.rutina = Array.from(daysContainer.children).map((dayCard, index) => {
        const dayData = { id: index + 1, exercises: [] };
        
        // Intentar extraer ejercicios de la tarjeta
        const exerciseRows = dayCard.querySelectorAll('tbody tr');
        if (exerciseRows) {
          exerciseRows.forEach((row, rowIndex) => {
            const inputs = row.querySelectorAll('input');
            if (inputs.length >= 4) {
              const exercise = {
                nombre: inputs[0].value || '',
                series: inputs[1].value || '',
                repeticiones: inputs[2].value || '',
                peso: inputs[3].value || ''
              };
              
              // Solo agregar si tiene algún contenido
              if (exercise.nombre || exercise.series || exercise.repeticiones || exercise.peso) {
                dayData.exercises.push(exercise);
              }
            }
          });
        }
        
        return dayData;
      });
    }
    
    console.log('Guardando datos de pestaña:', activeTabId, currentData);
    
    // Guardar en la pestaña activa
    if (activeTabId === 'main') {
      mainTabData = currentData;
    } else if (tabs.has(activeTabId)) {
      const tab = tabs.get(activeTabId);
      tab.data = currentData;
      tab.clientName = currentData.nombre || 'Nueva ventana';
      tabs.set(activeTabId, tab);
    }
  }

  function switchToTab(tabId) {
    // Guardar datos actuales ANTES de cambiar
    saveCurrentTabData();
    
    // Cambiar pestaña activa
    const previousTab = activeTabId;
    activeTabId = tabId;
    
    // Limpiar completamente la interfaz primero
    clearCurrentInterface();
    
    // Cargar datos de la nueva pestaña
    let tabData = null;
    
    if (tabId === 'main') {
      tabData = mainTabData;
    } else if (tabs.has(tabId)) {
      tabData = tabs.get(tabId).data;
    }
    
    // Si hay datos, cargarlos. Si no, dejar interfaz limpia
    if (tabData && Object.keys(tabData).length > 0) {
      loadTabData(tabData);
    }
    
    updateTabsDisplay();
    
    if (window.UI && window.UI.showToast) {
      const tabName = tabId === 'main' ? 'Pestaña principal' : (tabs.get(tabId)?.clientName || 'Pestaña');
      window.UI.showToast(`Cambiado a: ${tabName}`);
    }
  }

  function clearCurrentInterface() {
    // Limpiar todos los campos de entrada
    const fields = [
      'sheet-nombre', 'sheet-fecha', 'sheet-edad', 'sheet-eps', 
      'sheet-objetivos', 'sheet-contacto', 'sheet-whatsapp', 
      'sheet-firma', 'sheet-cedula'
    ];
    
    fields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) field.value = '';
    });
    
    // Limpiar contenedor de días
    const daysContainer = document.getElementById('days-container');
    if (daysContainer) {
      daysContainer.innerHTML = '';
    }
    
    // Resetear contador de días
    if (window.setDayCounter) {
      window.setDayCounter(0);
    }
    
    // Resetear tablas de seguimiento
    const tablaHombre = document.getElementById('tabla-hombre');
    const tablaMujer = document.getElementById('tabla-mujer');
    
    if (tablaHombre && window.Tables && typeof window.Tables.fillTable === 'function') {
      window.Tables.fillTable(tablaHombre, true);
    }
    
    if (tablaMujer && window.Tables && typeof window.Tables.fillTable === 'function') {
      window.Tables.fillTable(tablaMujer, false);
    }
    
    // Resetear género a hombre
    const radioHombre = document.getElementById('genero-hombre');
    const radioMujer = document.getElementById('genero-mujer');
    
    if (radioHombre) radioHombre.checked = true;
    if (radioMujer) radioMujer.checked = false;
    
    // Mostrar tabla de hombre por defecto
    const tablaHombreContainer = document.getElementById('tabla-hombre-container');
    const tablaMujerContainer = document.getElementById('tabla-mujer-container');
    
    if (tablaHombreContainer) tablaHombreContainer.style.display = 'block';
    if (tablaMujerContainer) tablaMujerContainer.style.display = 'none';
  }

  function loadTabData(data) {
    console.log('Cargando datos en pestaña:', activeTabId, data);
    
    // Cargar campos básicos
    const fields = {
      'sheet-nombre': 'nombre',
      'sheet-fecha': 'fecha', 
      'sheet-edad': 'edad',
      'sheet-eps': 'eps',
      'sheet-objetivos': 'objetivos',
      'sheet-contacto': 'contacto',
      'sheet-whatsapp': 'whatsapp',
      'sheet-firma': 'firma',
      'sheet-cedula': 'cedula'
    };
    
    Object.entries(fields).forEach(([elementId, dataKey]) => {
      const element = document.getElementById(elementId);
      if (element && data[dataKey] !== undefined) {
        element.value = data[dataKey] || '';
      }
    });
    
    // Configurar género
    const radioHombre = document.getElementById('genero-hombre');
    const radioMujer = document.getElementById('genero-mujer');
    
    if (data.genero === 'mujer') {
      if (radioMujer) radioMujer.checked = true;
      if (radioHombre) radioHombre.checked = false;
    } else {
      if (radioHombre) radioHombre.checked = true;
      if (radioMujer) radioMujer.checked = false;
    }
    
    // Cargar calentamiento
    const calentamientoText = document.getElementById('calentamiento-text');
    if (calentamientoText && data.calentamiento) {
      calentamientoText.value = data.calentamiento;
    }
    
    // Cargar días de rutina
    if (data.rutina && Array.isArray(data.rutina) && data.rutina.length > 0) {
      const daysContainer = document.getElementById('days-container');
      if (daysContainer) {
        daysContainer.innerHTML = '';
        
        // Resetear contador antes de recrear días
        if (window.setDayCounter) {
          window.setDayCounter(0);
        }
        
        // Recrear días con ejercicios
        data.rutina.forEach((dayData, index) => {
          if (window.Days && typeof window.Days.createDayCard === 'function') {
            // Crear el contexto necesario para createDayCard
            const ctx = {
              daysContainer: daysContainer,
              setDayCounter: window.setDayCounter,
              openExerciseModal: window.openExerciseModal || (() => {}),
              exercisesData: window.exercisesData || []
            };
            
            // Crear la tarjeta del día
            window.Days.createDayCard(ctx, dayData);
            
            // Llenar los ejercicios si existen
            if (dayData.exercises && dayData.exercises.length > 0) {
              // Obtener la tarjeta recién creada
              const dayCards = daysContainer.querySelectorAll('.day-card');
              const currentCard = dayCards[dayCards.length - 1];
              
              if (currentCard) {
                const exerciseRows = currentCard.querySelectorAll('tbody tr');
                
                dayData.exercises.forEach((exercise, exerciseIndex) => {
                  if (exerciseRows[exerciseIndex]) {
                    const inputs = exerciseRows[exerciseIndex].querySelectorAll('input');
                    if (inputs.length >= 4) {
                      inputs[0].value = exercise.nombre || '';
                      inputs[1].value = exercise.series || '';
                      inputs[2].value = exercise.repeticiones || '';
                      inputs[3].value = exercise.peso || '';
                    }
                  }
                });
              }
            }
          }
        });
      }
    }
    
    // Actualizar displays de tablas según el género
    const tablaHombreContainer = document.getElementById('tabla-hombre-container');
    const tablaMujerContainer = document.getElementById('tabla-mujer-container');
    
    if (data.genero === 'mujer') {
      if (tablaHombreContainer) tablaHombreContainer.style.display = 'none';
      if (tablaMujerContainer) tablaMujerContainer.style.display = 'block';
    } else {
      if (tablaHombreContainer) tablaHombreContainer.style.display = 'block';
      if (tablaMujerContainer) tablaMujerContainer.style.display = 'none';
    }
  }

  function duplicateCurrentTab() {
    saveCurrentTabData();
    
    let currentData = null;
    let currentName = 'Nueva ventana';
    
    if (activeTabId === 'main') {
      currentData = mainTabData;
      const clientNameInput = document.getElementById('sheet-nombre');
      currentName = clientNameInput ? clientNameInput.value : 'Nueva ventana';
    } else if (tabs.has(activeTabId)) {
      const tab = tabs.get(activeTabId);
      currentData = tab.data;
      currentName = tab.clientName;
    }
    
    const newName = `${currentName} - Copia`;
    createNewTab(currentData, newName);
  }

  function openClientInNewWindow(clientName) {
    if (!window.electronAPI || !window.electronAPI.loadRoutine) {
      console.error('La API de carga no está disponible');
      return;
    }

    window.electronAPI.loadRoutine(clientName).then(routineData => {
      if (routineData) {
        createNewWindow(routineData, clientName);
      } else {
        if (window.UI && window.UI.showToast) {
          window.UI.showToast('No se pudo cargar la rutina');
        }
      }
    }).catch(error => {
      console.error('Error cargando rutina:', error);
    });
  }

  function updateWindowsList() {
    const windowsList = document.getElementById('windows-list');
    if (!windowsList) return;

    windowsList.innerHTML = '';
    
    if (windows.size === 0) {
      windowsList.innerHTML = '<p class="text-gray-500 text-sm">No hay ventanas adicionales abiertas</p>';
      return;
    }

    windows.forEach((windowInfo, id) => {
      const windowItem = document.createElement('div');
      windowItem.className = 'flex items-center justify-between p-2 bg-gray-50 rounded mb-2';
      
      windowItem.innerHTML = `
        <div class="flex-1">
          <div class="font-medium text-sm">${windowInfo.clientName}</div>
          <div class="text-xs text-gray-500">Creada: ${windowInfo.created.toLocaleTimeString()}</div>
        </div>
        <button class="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600" 
                onclick="WindowManager.closeWindow('${id}')">
          Cerrar
        </button>
      `;
      
      windowsList.appendChild(windowItem);
    });
  }

  function closeTab(tabId) {
    if (tabs.has(tabId)) {
      tabs.delete(tabId);
      
      // Si cerramos la pestaña activa, cambiar a main
      if (activeTabId === tabId) {
        switchToTab('main');
      } else {
        updateTabsDisplay();
      }
      
      if (window.UI && window.UI.showToast) {
        window.UI.showToast('Pestaña cerrada');
      }
    }
  }

  function setupWindowManagerUI() {
    // Crear el sistema de pestañas en la parte superior
    createTabsSystem();
  }

  function createTabsSystem() {
    // Buscar el contenedor principal de la aplicación
    const appContainer = document.querySelector('main') || document.querySelector('.container') || document.body;
    if (!appContainer) return;

    // Crear el contenedor de pestañas
    let tabsContainer = document.getElementById('tabs-container');
    if (!tabsContainer) {
      tabsContainer = document.createElement('div');
      tabsContainer.id = 'tabs-container';
      
      // Buscar el primer elemento hijo que contenga el contenido principal
      const firstChild = appContainer.firstElementChild;
      if (firstChild) {
        appContainer.insertBefore(tabsContainer, firstChild);
      } else {
        appContainer.appendChild(tabsContainer);
      }
    }

    updateTabsDisplay();
  }

  function updateTabsDisplay() {
    const tabsContainer = document.getElementById('tabs-container');
    if (!tabsContainer) return;

    // Limpiar pestañas existentes
    tabsContainer.innerHTML = '';

    // Pestaña principal (main)
    const mainTab = document.createElement('div');
    mainTab.className = activeTabId === 'main' ? 'window-tab current' : 'window-tab other';
    
    let mainTabName = 'Nueva ventana';
    if (activeTabId === 'main') {
      const clientNameInput = document.getElementById('sheet-nombre');
      mainTabName = clientNameInput && clientNameInput.value.trim() 
        ? clientNameInput.value.trim() 
        : 'Nueva ventana';
    } else if (mainTabData && mainTabData.nombre) {
      mainTabName = mainTabData.nombre;
    }
    
    mainTab.innerHTML = `
      <span class="tab-name" title="${mainTabName}">${mainTabName}</span>
      ${activeTabId === 'main' ? '<div class="tab-indicator" title="Pestaña actual"></div>' : ''}
    `;
    
    // Evento para cambiar a la pestaña principal
    if (activeTabId !== 'main') {
      mainTab.addEventListener('click', () => switchToTab('main'));
    }
    
    tabsContainer.appendChild(mainTab);

    // Pestañas adicionales
    tabs.forEach((tabInfo, id) => {
      const tab = document.createElement('div');
      tab.className = activeTabId === id ? 'window-tab current' : 'window-tab other';
      
      const isActive = activeTabId === id;
      const tabName = isActive ? 
        (document.getElementById('sheet-nombre')?.value.trim() || tabInfo.clientName) : 
        tabInfo.clientName;
      
      tab.innerHTML = `
        <span class="tab-name" title="${tabName}">${tabName}</span>
        ${isActive ? '<div class="tab-indicator" title="Pestaña actual"></div>' : ''}
        <button class="tab-close" 
                onclick="WindowManager.closeTab('${id}')" title="Cerrar pestaña">
          ×
        </button>
      `;
      
      // Evento para cambiar de pestaña
      if (!isActive) {
        tab.addEventListener('click', (e) => {
          if (!e.target.classList.contains('tab-close')) {
            switchToTab(id);
          }
        });
      }
      
      tabsContainer.appendChild(tab);
    });

    // Botón [+] para nueva pestaña
    const addButton = document.createElement('button');
    addButton.className = 'add-window-btn';
    addButton.innerHTML = '+';
    addButton.title = 'Nueva pestaña';
    addButton.onclick = () => createNewTab();
    
    tabsContainer.appendChild(addButton);
  }





  function setupClientNameListener() {
    // Escuchar cambios en el nombre del cliente para actualizar la pestaña
    const clientNameInput = document.getElementById('sheet-nombre');
    if (clientNameInput) {
      clientNameInput.addEventListener('input', () => {
        // Actualizar las pestañas cuando cambie el nombre
        updateTabsDisplay();
      });
    }
  }

  function interceptPopulateUI() {
    // Guardar referencias originales
    if (!window._originalPopulateUI) {
      window._originalPopulateUI = window.populateUI;
    }
    if (!window._originalGatherData) {
      window._originalGatherData = window.gatherData;
    }
    
    // Interceptar la función populateUI global para aplicar solo a la pestaña activa
    window.populateUI = function(data) {
      // Aplicar los datos a la pestaña activa
      if (activeTabId === 'main') {
        mainTabData = data;
      } else if (tabs.has(activeTabId)) {
        const tab = tabs.get(activeTabId);
        tab.data = data;
        tab.clientName = data.nombre || 'Nueva ventana';
        tabs.set(activeTabId, tab);
      }
      
      // Llamar a la función original
      if (window._originalPopulateUI) {
        return window._originalPopulateUI.call(this, data);
      } else if (window.Data && typeof window.Data.populateUI === 'function') {
        return window.Data.populateUI(data);
      }
      
      // Actualizar pestañas después de cargar
      updateTabsDisplay();
    };
    
    // Interceptar gatherData para obtener datos de la pestaña activa
    window.gatherData = function() {
      // Primero, guardar datos actuales
      saveCurrentTabData();
      
      // Luego, obtener datos de la pestaña activa
      if (activeTabId === 'main') {
        return mainTabData || (window._originalGatherData ? window._originalGatherData.call(this) : {});
      } else if (tabs.has(activeTabId)) {
        return tabs.get(activeTabId).data || {};
      }
      
      // Fallback a la función original
      return window._originalGatherData ? window._originalGatherData.call(this) : {};
    };
  }

  // Inicializar cuando el DOM esté listo
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setupWindowManagerUI();
        setupClientNameListener();
        // Temporalmente deshabilitado para diagnosticar el problema
        // setTimeout(interceptPopulateUI, 100);
      });
    } else {
      setupWindowManagerUI();
      setupClientNameListener();
      // Temporalmente deshabilitado para diagnosticar el problema
      // setTimeout(interceptPopulateUI, 100);
    }
  }

  // Exponer funciones públicas
  window.WindowManager = {
    createNewTab,
    createNewRoutine,
    duplicateCurrentTab,
    closeTab,
    switchToTab,
    updateTabsDisplay,
    init
  };

  // Auto-inicializar
  init();
})();
