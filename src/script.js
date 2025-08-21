// Este evento se dispara cuando el contenido HTML ha sido completamente cargado y parseado.
document.addEventListener('DOMContentLoaded', () => {
    try {
        // --- LÓGICA PARA PESTAÑAS DE LA BARRA LATERAL ---
        const sidebarTabs = document.querySelectorAll('.sidebar-tab');
        const tabContents = document.querySelectorAll('.tab-content');

        if (sidebarTabs.length > 0 && tabContents.length > 0) {
            sidebarTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const targetTab = tab.dataset.tab;
                    sidebarTabs.forEach(t => t.classList.remove('active-tab'));
                    tab.classList.add('active-tab');
                    tabContents.forEach(content => {
                        content.id === `tab-content-${targetTab}`
                            ? content.classList.remove('hidden')
                            : content.classList.add('hidden');
                    });
                });
            });
        } else {
            console.error("No se encontraron los elementos de las pestañas de la barra lateral.");
        }

        // Función principal asíncrona para inicializar la aplicación
        async function initializeApp() {
            const exercisesData = await window.electronAPI.getExercises();
            const templates = await window.electronAPI.getTemplates();

            // Configurar listener para cargar datos de rutina en ventanas nuevas
            if (window.electronAPI.onLoadRoutineData) {
                window.electronAPI.onLoadRoutineData((routineData) => {
                    if (routineData && typeof populateUI === 'function') {
                        setTimeout(() => {
                            populateUI(routineData);
                            if (window.UI && window.UI.showToast) {
                                window.UI.showToast('Rutina cargada en nueva ventana');
                            }
                        }, 500); // Pequeño delay para asegurar que la UI esté lista
                    }
                });
            }

            // --- REFERENCIAS A ELEMENTOS DEL DOM ---
            const sheetSeguimiento = document.getElementById('sheet-seguimiento');
            const sheetCalentamiento = document.getElementById('sheet-calentamiento');
            const calentamientoText = document.getElementById('calentamiento-text');
            const daysContainer = document.getElementById('days-container');
            const btnGeneratePdf = document.getElementById('btn-generate-pdf');
            const btnAddDay = document.getElementById('btn-add-day');
            const btnRemoveDay = document.getElementById('btn-remove-day');
            const tablaHombreContainer = document.getElementById('tabla-hombre-container');
            const tablaMujerContainer = document.getElementById('tabla-mujer-container');
            const radioHombre = document.getElementById('radio-hombre');
            const radioMujer = document.getElementById('radio-mujer');
            const exerciseModal = document.getElementById('exercise-modal');
            const exerciseSelection = document.getElementById('exercise-selection');
            const closeModalBtn = document.querySelector('.close-btn');
            const btnSave = document.getElementById('btn-save');
            const searchClientInput = document.getElementById('search-client');
            const clientListDiv = document.getElementById('client-list');
            const noResultsP = document.getElementById('no-results');
            const btnOpenFolder = document.getElementById('btn-open-folder');
            const btnLoadTemplate = document.getElementById('btn-load-template');
            const selectTemplateObjetivo = document.getElementById('template-objetivo');
            const selectTemplateNivel = document.getElementById('template-nivel');
            const selectTemplateOpcion = document.getElementById('template-opcion');
            const templateOpcionWrapper = document.getElementById('template-opcion-wrapper');
            const templateRadioMujer = document.getElementById('template-radio-mujer');
            const templateRadioHombre = document.getElementById('template-radio-hombre');
            const btnNewRoutine = document.getElementById('btn-new-routine');
            const toast = document.getElementById('toast-notification');
            const confirmModal = document.getElementById('confirmation-modal');
            const confirmMsg = document.getElementById('confirmation-message');
            const confirmYes = document.getElementById('confirm-yes');
            const confirmNo = document.getElementById('confirm-no');
                    const btnWhatsappQr = document.getElementById('btn-whatsapp-qr');

            // --- Elementos de Configuración de Ejercicios ---
            const btnConfigureExercises = document.getElementById('btn-configure-exercises');
            const configModal = document.getElementById('config-exercise-modal');
            const configClose = document.getElementById('config-exercise-close');
            const configCancel = document.getElementById('config-exercise-cancel');
            const configSave = document.getElementById('config-exercise-save');
            const inputCategory = document.getElementById('config-category');
            const inputName = document.getElementById('config-name');
            const inputLink = document.getElementById('config-link');
            const datalistCategories = document.getElementById('categories-list');
            const configSearch = document.getElementById('config-search');
            const configFilterCategory = document.getElementById('config-filter-category');
            const configList = document.getElementById('config-list');

            let currentExerciseTableBody = null;
            let dayCounter = 0;

            // --- FUNCIONES DE UI (delegan en window.UI) ---
            function showToast(message) {
                if (window.UI && typeof window.UI.showToast === 'function') {
                    window.UI.showToast(message);
                    return;
                }
                if (!toast) return;
                toast.textContent = message;
                toast.classList.remove('hidden');
                setTimeout(() => toast.classList.add('hidden'), 3000);
            }

            function showConfirmation(message, onConfirm) {
                if (window.UI && typeof window.UI.showConfirmation === 'function') {
                    window.UI.showConfirmation(message, onConfirm);
                    return;
                }
                if (!confirmModal || !confirmMsg || !confirmYes || !confirmNo) return;
                confirmMsg.textContent = message;
                confirmModal.classList.remove('hidden');
                const yesHandler = () => {
                    onConfirm();
                    confirmModal.classList.add('hidden');
                    confirmYes.removeEventListener('click', yesHandler);
                };
                const noHandler = () => {
                    confirmModal.classList.add('hidden');
                    confirmNo.removeEventListener('click', noHandler);
                };
                confirmYes.addEventListener('click', yesHandler, { once: true });
                confirmNo.addEventListener('click', noHandler, { once: true });
            }

            // --- LÓGICA DE PLANTILLAS ---
            // const templates = {
            //     hipertrofia: {
            //         basico: {
            //             calentamiento: "10 min de cardio ligero (cinta o elíptica).\nEstiramientos dinámicos.",
            //             rutina: [
            //                 { muscleGroup: "Pecho y Tríceps", exercises: [{ name: "Press de Banca con Barra", series: "4", reps: "8-12", carga: "50" }, { name: "Fondos para Pecho", series: "3", reps: "Fallo", carga: "" }] },
            //                 { muscleGroup: "Espalda y Bíceps", exercises: [{ name: "Dominadas", series: "4", reps: "Fallo", carga: "" }, { name: "Curl de Bíceps con Barra", series: "3", reps: "10", carga: "20" }] },
            //             ]
            //         },
            //         intermedio: {
            //             calentamiento: "15 min de cardio moderado.\nMovilidad articular completa.\nEstiramientos dinámicos.",
            //             rutina: [
            //                 { muscleGroup: "Pecho", exercises: [{ name: "Press de Banca con Barra", series: "4", reps: "6-8", carga: "70" }, { name: "Press Inclinado con Mancuernas", series: "3", reps: "8-10", carga: "25" }, { name: "Aperturas con Mancuernas", series: "3", reps: "12", carga: "15" }] },
            //                 { muscleGroup: "Espalda", exercises: [{ name: "Dominadas", series: "4", reps: "8-10", carga: "" }, { name: "Remo con Barra", series: "3", reps: "8-10", carga: "60" }, { name: "Jalón al Pecho", series: "3", reps: "10-12", carga: "50" }] },
            //             ]
            //         }
            //     },
            //     fuerza: {
            //         basico: {
            //             calentamiento: "10 min de cardio.\nMovilidad básica.\nSeries de calentamiento progresivo.",
            //             rutina: [
            //                 { muscleGroup: "Fuerza Compuesta", exercises: [{ name: "Sentadillas con Barra", series: "5", reps: "5", carga: "80" }, { name: "Press de Banca", series: "5", reps: "5", carga: "75" }, { name: "Peso Muerto", series: "3", reps: "5", carga: "100" }] },
            //             ]
            //         }
            //     },
            //     "perdida-peso": {
            //         basico: {
            //             calentamiento: "20 min de cardio moderado (cinta, elíptica o bicicleta).\nEstiramientos dinámicos.",
            //             rutina: [
            //                 { muscleGroup: "Cardio + Fuerza", exercises: [{ name: "Circuito HIIT", series: "4", reps: "30 seg", carga: "" }, { name: "Sentadillas con Peso Corporal", series: "3", reps: "15", carga: "" }, { name: "Burpees", series: "3", reps: "10", carga: "" }] },
            //                 { muscleGroup: "Resistencia", exercises: [{ name: "Plancha Abdominal", series: "3", reps: "45 seg", carga: "" }, { name: "Flexiones", series: "3", reps: "Fallo", carga: "" }, { name: "Mountain Climbers", series: "3", reps: "20", carga: "" }] },
            //             ]
            //         },
            //         intermedio: {
            //             calentamiento: "25 min de cardio variado.\nMovilidad completa.\nCalentamiento específico.",
            //             rutina: [
            //                 { muscleGroup: "HIIT Avanzado", exercises: [{ name: "Sprint en Cinta", series: "6", reps: "30 seg", carga: "" }, { name: "Descanso Activo", series: "6", reps: "90 seg", carga: "" }] },
            //                 { muscleGroup: "Fuerza Metabólica", exercises: [{ name: "Thrusters", series: "4", reps: "12", carga: "15" }, { name: "Wall Balls", series: "4", reps: "15", carga: "8" }, { name: "Box Jumps", series: "4", reps: "10", carga: "" }] },
            //             ]
            //         }
            //     },
            //     rehabilitacion: {
            //         basico: {
            //             calentamiento: "10 min de caminata suave.\nMovilidad articular controlada.\nRespiración profunda.",
            //             rutina: [
            //                 { muscleGroup: "Movilidad", exercises: [{ name: "Estiramientos Suaves", series: "3", reps: "30 seg", carga: "" }, { name: "Movimientos Articulares", series: "2", reps: "10", carga: "" }, { name: "Respiración Diafragmática", series: "3", reps: "5 min", carga: "" }] },
            //                 { muscleGroup: "Fuerza Suave", exercises: [{ name: "Ejercicios con Bandas", series: "2", reps: "12", carga: "Banda suave" }, { name: "Movimientos Controlados", series: "2", reps: "10", carga: "" }] },
            //             ]
            //         }
            //     },
            //     resistencia: {
            //         basico: {
            //             calentamiento: "15 min de cardio progresivo.\nMovilidad dinámica.\nCalentamiento específico.",
            //             rutina: [
            //                 { muscleGroup: "Cardio Base", exercises: [{ name: "Carrera Continua", series: "1", reps: "30 min", carga: "" }, { name: "Bicicleta Estática", series: "1", reps: "20 min", carga: "" }] },
            //                 { muscleGroup: "Resistencia Muscular", exercises: [{ name: "Sentadillas con Peso Corporal", series: "4", reps: "20", carga: "" }, { name: "Flexiones", series: "4", reps: "15", carga: "" }, { name: "Plancha", series: "3", reps: "60 seg", carga: "" }] },
            //             ]
            //         }
            //     },
            //     deportivo: {
            //         basico: {
            //             calentamiento: "20 min de calentamiento deportivo específico.\nMovilidad dinámica.\nActivación neuromuscular.",
            //             rutina: [
            //                 { muscleGroup: "Potencia", exercises: [{ name: "Saltos Verticales", series: "4", reps: "8", carga: "" }, { name: "Lanzamientos de Balón", series: "3", reps: "10", carga: "Medicina ball" }, { name: "Sprint", series: "6", reps: "30m", carga: "" }] },
            //                 { muscleGroup: "Agilidad", exercises: [{ name: "Cone Drills", series: "4", reps: "30 seg", carga: "" }, { name: "Lateral Shuffles", series: "3", reps: "20m", carga: "" }, { name: "Backpedal", series: "3", reps: "15m", carga: "" }] },
            //             ]
            //         }
            //     },
            //     funcional: {
            //         basico: {
            //             calentamiento: "15 min de movilidad funcional.\nActivación del core.\nMovimientos básicos.",
            //             rutina: [
            //                 { muscleGroup: "Movimientos Funcionales", exercises: [{ name: "Turkish Get-Up", series: "3", reps: "5 por lado", carga: "8kg" }, { name: "Kettlebell Swing", series: "3", reps: "15", carga: "12kg" }, { name: "Farmer's Walk", series: "3", reps: "30m", carga: "20kg" }] },
            //                 { muscleGroup: "Core Funcional", exercises: [{ name: "Pallof Press", series: "3", reps: "10 por lado", carga: "Banda" }, { name: "Dead Bug", series: "3", reps: "12", carga: "" }, { name: "Bird Dog", series: "3", reps: "10 por lado", carga: "" }] },
            //             ]
            //         }
            //     },
            //     "yoga-pilates": {
            //         basico: {
            //             calentamiento: "10 min de respiración consciente.\nMovilidad suave.\nCentrado.",
            //             rutina: [
            //                 { muscleGroup: "Secuencia de Yoga", exercises: [{ name: "Saludo al Sol", series: "3", reps: "Secuencia completa", carga: "" }, { name: "Posturas de Pie", series: "1", reps: "30 seg cada una", carga: "" }, { name: "Meditación", series: "1", reps: "10 min", carga: "" }] },
            //                 { muscleGroup: "Pilates Básico", exercises: [{ name: "Hundred", series: "1", reps: "100 respiraciones", carga: "" }, { name: "Roll Up", series: "3", reps: "8", carga: "" }, { name: "Single Leg Stretch", series: "3", reps: "10 por lado", carga: "" }] },
            //             ]
            //         }
            //     }
            // };

            // Utilidades de plantillas (wrappers hacia window.Templates)
            function getTemplateGroup(objetivo, nivel) {
                if (window.Templates) return window.Templates.getTemplateGroup(templates, objetivo, nivel);
                const group = templates && templates[objetivo] && templates[objetivo][nivel];
                return group || null;
            }

            function getAvailableOptionsFor(objetivo, nivel, genero) {
                if (window.Templates) return window.Templates.getAvailableOptionsFor(templates, objetivo, nivel, genero);
                const group = getTemplateGroup(objetivo, nivel);
                if (!group) return [];
                const genderNode = group[genero];
                if (genderNode && typeof genderNode === 'object' && !('calentamiento' in genderNode)) {
                    return Object.keys(genderNode).filter(k => k === '1' || k === '2' || /^opcion/i.test(k));
                }
                return [];
            }

            function resolveTemplate(objetivo, nivel, genero, opcion) {
                if (window.Templates) return window.Templates.resolveTemplate(templates, objetivo, nivel, genero, opcion);
                const group = getTemplateGroup(objetivo, nivel);
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

            function updateTemplateOptionVisibility() {
                if (window.Templates) {
                    return window.Templates.updateTemplateOptionVisibility({
                        templates,
                        selectTemplateObjetivo,
                        selectTemplateNivel,
                        templateOpcionWrapper,
                        selectTemplateOpcion,
                        templateRadioMujer,
                        templateRadioHombre
                    });
                }
                if (!selectTemplateObjetivo || !selectTemplateNivel || !templateOpcionWrapper) return;
                const objetivo = selectTemplateObjetivo.value;
                const nivel = selectTemplateNivel.value;
                const genero = templateRadioMujer && templateRadioMujer.checked ? 'mujer' : 'hombre';
                const options = getAvailableOptionsFor(objetivo, nivel, genero);
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

            if (selectTemplateObjetivo) selectTemplateObjetivo.addEventListener('change', updateTemplateOptionVisibility);
            if (selectTemplateNivel) selectTemplateNivel.addEventListener('change', updateTemplateOptionVisibility);
            if (templateRadioMujer) templateRadioMujer.addEventListener('change', updateTemplateOptionVisibility);
            if (templateRadioHombre) templateRadioHombre.addEventListener('change', updateTemplateOptionVisibility);

            if (btnLoadTemplate) {
                btnLoadTemplate.addEventListener('click', () => {
                    const objetivo = selectTemplateObjetivo ? selectTemplateObjetivo.value : 'hipertrofia';
                    const nivel = selectTemplateNivel ? selectTemplateNivel.value : 'basico';
                    const genero = (templateRadioMujer && templateRadioMujer.checked) ? 'mujer' : 'hombre';
                    const opcion = (templateOpcionWrapper && !templateOpcionWrapper.classList.contains('hidden') && selectTemplateOpcion) ? selectTemplateOpcion.value : null;

                    const template = resolveTemplate(objetivo, nivel, genero, opcion);
                    if (template) {
                        showConfirmation("Cargar esta plantilla reemplazará la rutina actual. ¿Continuar?", () => {
                            populateUI({ rutina: template.rutina, calentamiento: template.calentamiento, seguimiento: {}, tablaHombre: [], tablaMujer: [], genero });
                            showToast("Plantilla cargada con éxito.");
                        });
                    } else {
                        showToast("No hay una plantilla definida para esta selección.");
                    }
                });
            }

            // --- LÓGICA DE TABLAS DE MEDIDAS (CORREGIDA) ---
            const tablaHombre = tablaHombreContainer ? tablaHombreContainer.querySelector('table') : null;
            const tablaMujer = tablaMujerContainer ? tablaMujerContainer.querySelector('table') : null;

            const fillTable = (tableElement, isHombre) => {
                if (window.Tables) return window.Tables.fillTable(tableElement, isHombre);
                if (!tableElement) return;
                const controls = isHombre
                    ? ["PESO", "TORAX", "HOMBRO", "ESPALDA", "BICEPS", "CINTURA", "PIERNA", "PANTORRILLA", "FECHA"]
                    : ["PESO", "CINTURA", "ABDOMEN", "CADERA", "BUSTO", "ESPALDA", "PIERNA", "BICEPS", "FECHA"];
                const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
                let headerHTML = '<thead><tr class="bg-gray-200">';
                headerHTML += '<th class="p-2 border border-gray-400 w-1/4">CONTROL</th>';
                months.forEach(month => { headerHTML += `<th class=\"p-2 border border-gray-400\">${month}</th>`; });
                headerHTML += '</tr></thead>';
                let bodyHTML = '<tbody contenteditable=\"true\">';
                controls.forEach(control => {
                    bodyHTML += '<tr class="border-t border-gray-300">';
                    bodyHTML += `<td class="p-2 border border-gray-400 font-bold bg-gray-100">${control}</td>`;
                    for (let i = 0; i < 12; i++) { bodyHTML += '<td class="p-2 border border-gray-400 h-10"></td>'; }
                    bodyHTML += '</tr>';
                });
                bodyHTML += '</tbody>';
                tableElement.innerHTML = headerHTML + bodyHTML;
            };

            const handleGeneroChange = () => {
                if (window.Tables) return window.Tables.handleGeneroChange(radioHombre, tablaHombreContainer, tablaMujerContainer);
                if (!radioHombre || !tablaHombreContainer || !tablaMujerContainer) return;
                if (radioHombre.checked) {
                    tablaHombreContainer.classList.remove('hidden');
                    tablaMujerContainer.classList.add('hidden');
                } else {
                    tablaHombreContainer.classList.add('hidden');
                    tablaMujerContainer.classList.remove('hidden');
                }
            };
            if (radioHombre) radioHombre.addEventListener('change', handleGeneroChange);
            if (radioMujer) radioMujer.addEventListener('change', handleGeneroChange);

            // --- LÓGICA DE CREACIÓN DE DÍAS Y EJERCICIOS (modularizada) ---
            const createDayCard = (dayData = null) => {
                if (window.Days && typeof window.Days.createDayCard === 'function') {
                    return window.Days.createDayCard({
                        daysContainer,
                        dayCounter,
                        setDayCounter: (n) => { dayCounter = n; },
                        showToast,
                        openExerciseModal,
                        setCurrentExerciseTableBody: (tbody) => { currentExerciseTableBody = tbody; }
                    }, dayData);
                }
                // Fallback anterior si Days no está disponible
                if (!daysContainer) return;
                if (dayCounter >= 7 && !dayData) {
                    showToast("No se pueden agregar más de 7 días.");
                    return;
                }
                dayCounter++;
                
                let currentRow = daysContainer.querySelector('.days-row:last-child');
                if (!currentRow || currentRow.children.length >= 3) {
                    currentRow = document.createElement('div');
                    currentRow.className = 'days-row';
                    daysContainer.appendChild(currentRow);
                }
                
                const card = document.createElement('div');
                card.className = 'day-card';
                card.id = `day-${dayCounter}`;
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
                                <th colspan="4" class="day-title-cell">Día ${dayCounter} <input type="text" class="day-muscle-group" placeholder="músculo a ejercitar" /></th>
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
                    
                    const headerAndControls = 120;
                    const perRow = 48;
                    const minRowsForDisplay = Math.max(3, realExercises);
                    const calculatedHeight = headerAndControls + minRowsForDisplay * perRow;
                    const finalHeight = Math.max(200, calculatedHeight);
                    
                    card.style.minHeight = finalHeight + 'px';
                    card.style.height = 'auto';
                    card.setAttribute('data-exercises', realExercises);
                };
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
                autoResizeDayCard();
                
                // Listener para detectar cambios en el contenido de las celdas
                if (tbody) {
                    tbody.addEventListener('input', () => {
                        setTimeout(autoResizeDayCard, 10);
                    });
                    tbody.addEventListener('change', () => {
                        setTimeout(autoResizeDayCard, 10);
                    });
                }
                
                if (tfoot) {
                    tfoot.addEventListener('click', (e) => {
                        if (e.target && e.target.closest('.add-exercise-cell')) {
                            currentExerciseTableBody = tbody;
                            openExerciseModal();
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
            };
            if (btnAddDay) btnAddDay.addEventListener('click', () => createDayCard());
            if (btnRemoveDay) btnRemoveDay.addEventListener('click', () => {
                if (window.Days && typeof window.Days.removeDayCard === 'function') {
                    return window.Days.removeDayCard({
                        dayCounter,
                        setDayCounter: (n) => { dayCounter = n; },
                        daysContainer,
                        showConfirmation
                    });
                }
                // Fallback anterior
                if (dayCounter <= 0) return;
                showConfirmation("¿Estás seguro de que quieres eliminar el último día?", () => {
                    const lastDay = document.getElementById(`day-${dayCounter}`);
                    if (lastDay) {
                        const parentRow = lastDay.parentElement;
                        parentRow.removeChild(lastDay);
                        if (parentRow.children.length === 0) {
                            daysContainer.removeChild(parentRow);
                        }
                        dayCounter--;
                    }
                });
            });

            // --- LÓGICA DEL MODAL DE EJERCICIOS (modularizada) ---
            const openExerciseModal = () => {
                if (window.Days && typeof window.Days.openExerciseModal === 'function') {
                    return window.Days.openExerciseModal({
                        exerciseModal,
                        exerciseSelection,
                        exercisesData
                    });
                }
                // Fallback anterior
                if (!exerciseModal || !exerciseSelection) return;
                exerciseSelection.innerHTML = '';
                const searchDiv = document.createElement('div');
                searchDiv.className = 'mb-4';
                const searchInput = document.createElement('input');
                searchInput.type = 'text';
                searchInput.placeholder = 'Buscar ejercicio...';
                searchInput.className = 'w-full p-2 border rounded mb-2 text-lg';
                searchDiv.appendChild(searchInput);
                exerciseSelection.appendChild(searchDiv);
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
                renderExerciseList();
                searchInput.addEventListener('input', (e) => {
                    renderExerciseList(e.target.value);
                });
                exerciseModal.classList.remove('hidden');
            };
            const closeExerciseModal = () => {
                if (window.Days && typeof window.Days.closeExerciseModal === 'function') {
                    return window.Days.closeExerciseModal({ exerciseModal });
                }
                if (exerciseModal) exerciseModal.classList.add('hidden');
            };
            if (closeModalBtn) closeModalBtn.addEventListener('click', closeExerciseModal);
            window.addEventListener('click', (e) => { if (e.target == exerciseModal) closeExerciseModal(); });
            if (exerciseSelection) exerciseSelection.addEventListener('click', (e) => {
                if (e.target.tagName === 'LI') {
                    if (currentExerciseTableBody) {
                        const newRow = currentExerciseTableBody.insertRow();
                        newRow.dataset.link = e.target.dataset.link;
                        // Crear celdas para evitar HTML inválido que podría romper bordes/anchos
                        const c1 = document.createElement('td');
                        c1.className = 'exercise-link';
                        const nameWrap = document.createElement('div');
                        nameWrap.className = 'exercise-name';
                        nameWrap.textContent = e.target.dataset.name;
                        c1.appendChild(nameWrap);
                        const c2 = document.createElement('td'); c2.className = 'progressive-cell'; c2.innerHTML = '<input type="checkbox" class="progressive-checkbox" />';
                        const c3 = document.createElement('td'); c3.contentEditable = 'true'; c3.style.textAlign = 'center';
                        const c4 = document.createElement('td'); c4.contentEditable = 'true'; c4.style.textAlign = 'center';
                        newRow.appendChild(c1);
                        newRow.appendChild(c2);
                        newRow.appendChild(c3);
                        newRow.appendChild(c4);
                        // Redimensionar la tarjeta del día del tbody actual
                        const cardEl = currentExerciseTableBody.closest('.day-card');
                        if (cardEl) {
                            const rowsCount = currentExerciseTableBody.rows.length;
                            const baseMinHeight = 360;
                            const extraPerRow = 56;
                            const thresholdRows = 5;
                            const extra = Math.max(0, rowsCount - thresholdRows) * extraPerRow;
                            cardEl.style.minHeight = (baseMinHeight + extra) + 'px';
                            cardEl.style.height = 'auto';
                        }
                        closeExerciseModal();
                    }
                }
            });
            if (daysContainer) daysContainer.addEventListener('click', (e) => {
                if (e.target.tagName === 'TD' && e.target.classList.contains('exercise-link')) {
                    const link = e.target.parentElement.dataset.link;
                    if (link && link !== 'undefined' && link !== 'your-video-id') window.electronAPI.openExternalLink(link);
                    else showToast("Este ejercicio no tiene un video asociado.");
                }
            });

            // --- LÓGICA DE GESTIÓN DE DATOS (modularizada) ---
            function gatherData() {
                if (window.Data && typeof window.Data.gatherData === 'function') {
                    return window.Data.gatherData({
                        sheetSeguimiento,
                        calentamientoText,
                        tablaHombre,
                        tablaMujer,
                        daysContainer,
                        radioHombre
                    });
                }
                // Fallback al comportamiento anterior si Data no está disponible
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

            function populateUI(data) {
                if (window.Data && typeof window.Data.populateUI === 'function') {
                    return window.Data.populateUI({
                        clearUI,
                        calentamientoText,
                        tablaHombre,
                        tablaMujer,
                        tablaHombreContainer,
                        tablaMujerContainer,
                        createDayCard
                    }, data);
                }
                if (!data) return;
                clearUI();
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
                if (data.rutina && daysContainer) data.rutina.forEach(dayData => createDayCard(dayData));
                if (data.genero === 'mujer') {
                    if (tablaHombreContainer) tablaHombreContainer.classList.add('hidden');
                    if (tablaMujerContainer) tablaMujerContainer.classList.remove('hidden');
                } else {
                    if (tablaHombreContainer) tablaHombreContainer.classList.remove('hidden');
                    if (tablaMujerContainer) tablaMujerContainer.classList.add('hidden');
                }
            }

            function clearUI() {
                if (window.Data && typeof window.Data.clearUI === 'function') {
                    return window.Data.clearUI({
                        daysContainer,
                        fillTable,
                        tablaHombre,
                        tablaMujer,
                        setDayCounter: (n) => { dayCounter = n; }
                    });
                }
                document.querySelectorAll('input, textarea').forEach(el => {
                    if (el.type !== 'radio' && el.type !== 'checkbox' && !el.closest('#sidebar-tabs')) el.value = '';
                });
                if (daysContainer) {
                    daysContainer.innerHTML = '';
                    dayCounter = 0;
                }
                fillTable(tablaHombre, true);
                fillTable(tablaMujer, false);
            }

            // --- LÓGICA DE BÚSQUEDA Y FILTROS AVANZADOS ---
            const filterObjetivo = document.getElementById('filter-objetivo');
            const filterFechaDesde = document.getElementById('filter-fecha-desde');
            const filterFechaHasta = document.getElementById('filter-fecha-hasta');
            const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');

            const filters = window.Filters ? window.Filters.init({
                clientListDiv,
                noResultsP,
                searchClientInput,
                filterObjetivo,
                filterFechaDesde,
                filterFechaHasta,
                btnLimpiarFiltros,
                electronAPI: window.electronAPI,
                populateUI
            }) : null;

            if (btnSave) btnSave.addEventListener('click', async () => {
                const clientName = document.getElementById('sheet-nombre').value;
                if (!clientName) {
                    showToast("Por favor, introduce un nombre para guardar.");
                    return;
                }
                const result = await window.electronAPI.saveRoutine({ clientName, data: gatherData() });
                if (result.success) {
                    showToast(`Rutina para ${clientName} guardada.`);
                    if (filters && typeof filters.loadClientList === 'function') {
                        filters.loadClientList();
                    }
                }
            });

            // --- LÓGICA DE EXPORTACIÓN (SIMPLIFICADA) ---
            if (btnGeneratePdf) btnGeneratePdf.addEventListener('click', () => {
                showToast("Generando PDF... por favor espera.");
                
                // Función para asegurar que el contenido esté completamente renderizado
                const ensureContentRendered = () => {
                    return new Promise((resolve) => {
                        // Esperar a que todos los elementos estén completamente renderizados
                        setTimeout(() => {
                            // Forzar un reflow para asegurar que las dimensiones estén calculadas
                            sheetSeguimiento.offsetHeight;
                            sheetCalentamiento.offsetHeight;
                            resolve();
                        }, 100);
                    });
                };
                
                                 // Función para generar PDF usando la API de impresión del navegador
                 const generatePDFViaPrint = () => {
                     const elementsToHide = document.querySelectorAll('.no-print');
                     elementsToHide.forEach(el => el.style.display = 'none');
                     
                     // Crear una nueva ventana para imprimir
                     const printWindow = window.open('', '_blank');
                     if (!printWindow) {
                         console.error('No se pudo abrir la ventana de impresión');
                         return;
                     }
                     printWindow.document.write(`
                         <!DOCTYPE html>
                         <html>
                         <head>
                             <title>Rutina de Entrenamiento</title>
                              <base href="${document.baseURI}">
                             <style>
                                 body { 
                                     font-family: Arial, sans-serif; 
                                     margin: 0; 
                                     padding: 20px; 
                                     background-color: white;
                                 }
                                 .sheet { 
                                     background-color: white; 
                                     padding: 2rem; 
                                     margin-bottom: 2rem;
                                     border-radius: 0.5rem; 
                                     box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                                     page-break-after: always;
                                     width: 100%;
                                     max-width: none;
                                 }
                                 .custom-input-group { 
                                     display: flex; 
                                     align-items: center; 
                                     border-bottom: 1px solid #e5e7eb; 
                                     min-height: 50px;
                                 }
                                 .custom-input-group:last-child { border-bottom: none; }
                                 .custom-input-group label { 
                                     font-weight: 700; 
                                     color: #4b5563; 
                                     padding: 0.75rem; 
                                     width: 120px; 
                                     flex-shrink: 0; 
                                     font-size: 14px;
                                 }
                                 .custom-input-group input { 
                                     border: none; 
                                     padding: 0.75rem; 
                                     width: 100%; 
                                     background-color: transparent; 
                                     font-size: 14px;
                                 }
                                 table { 
                                     width: 100%; 
                                     border-collapse: collapse; 
                                     margin-top: 1rem; 
                                     font-size: 12px;
                                 }
                                 th, td { 
                                     border: 1px solid #ddd; 
                                     padding: 8px; 
                                     text-align: left; 
                                     min-height: 30px;
                                 }
                                 th { background-color: #f2f2f2; }
                                 .day-card { 
                                     background-color: white; 
                                     border: 2px solid #e5e7eb; 
                                     padding: 1rem; 
                                     margin-bottom: 1rem; 
                                     border-radius: 0.5rem;
                                     page-break-inside: avoid;
                                 }
                                 .personal-data-container {
                                     border: 2px solid #e5e7eb;
                                     border-radius: 0.75rem;
                                     overflow: hidden;
                                     box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
                                 }
                                 #tablas-container {
                                     margin-top: 2rem;
                                 }
                                 #tabla-hombre-container, #tabla-mujer-container {
                                     border: 2px solid #e5e7eb;
                                     border-radius: 0.75rem;
                                     overflow: auto;
                                     width: 100%;
                                     box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
                                 }
                                 @media print {
                                     body { 
                                         margin: 0; 
                                         padding: 10px;
                                         background-color: white;
                                     }
                                     .sheet { 
                                         box-shadow: none; 
                                         border: 1px solid #ccc; 
                                         margin-bottom: 1rem;
                                         page-break-after: always;
                                     }
                                     .no-print { display: none !important; }
                                 }
                             </style>
                         </head>
                         <body>
                             ${document.getElementById('sheet-seguimiento').outerHTML}
                             ${document.getElementById('sheet-calentamiento').outerHTML}
                             ${document.getElementById('sheet-rutina').outerHTML}
                         </body>
                         </html>
                     `);
                     printWindow.document.close();
                     
                     setTimeout(() => {
                         printWindow.print();
                         printWindow.close();
                         elementsToHide.forEach(el => el.style.display = '');
                         showToast("PDF generado usando impresión del navegador.");
                     }, 1000);
                 };

                // Intentar usar jsPDF si está disponible
                if (typeof window.jspdf !== 'undefined' && typeof html2canvas !== 'undefined') {
                    ensureContentRendered().then(() => {
                        try {
                            const { jsPDF } = window.jspdf;
                            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
                            const clientName = document.getElementById('sheet-nombre')?.value || 'cliente';
                            const fileName = `rutina-${clientName}.pdf`;
                            const options = { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false };
                            const elementsToHide = document.querySelectorAll('.no-print');
                            elementsToHide.forEach(el => el.style.visibility = 'hidden');

                            const promisePage1 = html2canvas(sheetSeguimiento, {
                                ...options,
                                allowTaint: true,
                                useCORS: true,
                                scale: 1.5,
                                width: sheetSeguimiento.scrollWidth,
                                height: sheetSeguimiento.scrollHeight,
                                scrollX: 0,
                                scrollY: 0
                            }).then(canvas => {
                                const imgData = canvas.toDataURL('image/png');
                                const pdfWidth = pdf.internal.pageSize.getWidth();
                                const imgProps = pdf.getImageProperties(imgData);
                                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                                
                                // Asegurar que la imagen quepa en la página
                                const pageHeight = pdf.internal.pageSize.getHeight();
                                const finalHeight = Math.min(pdfHeight, pageHeight);
                                
                                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, finalHeight);
                            });

                            Promise.all([promisePage1]).then(() => {
                                pdf.addPage();
                                return html2canvas(sheetCalentamiento, options);
                            }).then(canvas => {
                                const imgData = canvas.toDataURL('image/png');
                                const pdfWidth = pdf.internal.pageSize.getWidth();
                                const imgProps = pdf.getImageProperties(imgData);
                                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                                // No realizar captura de la vista de rutina; dibujarla directamente
                                return Promise.resolve();
                            }).then(() => {
                                // Generar la rutina en una sola hoja con layout piramidal y enlaces
                                const routineData = gatherData().rutina || [];
                                if (routineData.length === 0) return;

                                pdf.addPage();
                                
                                // Agregar título "RUTINA DE EJERCICIOS"
                                const pageWidth = pdf.internal.pageSize.getWidth();
                                const pageHeight = pdf.internal.pageSize.getHeight();
                                pdf.setFont('helvetica', 'bold');
                                pdf.setFontSize(16);
                                pdf.setTextColor(0, 0, 0);
                                const title = 'RUTINA DE EJERCICIOS';
                                const titleWidth = pdf.getTextWidth(title);
                                const titleX = (pageWidth - titleWidth) / 2;
                                pdf.text(title, titleX, 20);
                                
                                const margin = 12;
                                const titleOffset = 30; // Espacio para el título
                                const availableHeight = pageHeight - titleOffset - margin;

                                // Determinar disposición piramidal
                                let cols, rows, mapIndexToPos;
                                const n = routineData.length;
                                if (n <= 3) {
                                    cols = 3; rows = 1;
                                    mapIndexToPos = (i) => ({ row: 0, col: i });
                                } else if (n <= 6) {
                                    cols = 3; rows = 2;
                                    const positions = [
                                        { col: 1, row: 0 }, // 0 centro arriba
                                        { col: 0, row: 1 }, // 1 izq abajo
                                        { col: 1, row: 1 }, // 2 centro abajo
                                        { col: 2, row: 1 }, // 3 der abajo
                                        { col: 0, row: 0 }, // 4 izq arriba
                                        { col: 2, row: 0 }  // 5 der arriba
                                    ];
                                    mapIndexToPos = (i) => positions[i] || { col: i % cols, row: Math.floor(i / cols) };
                                } else {
                                    cols = 4; rows = 2;
                                    const positions = [
                                        { col: 1, row: 0 }, // centro arriba
                                        { col: 0, row: 0 },
                                        { col: 2, row: 0 },
                                        { col: 3, row: 0 },
                                        { col: 0, row: 1 },
                                        { col: 1, row: 1 },
                                        { col: 2, row: 1 }
                                    ];
                                    mapIndexToPos = (i) => positions[i] || { col: i % cols, row: Math.floor(i / cols) };
                                }

                                // Calcular dimensiones más conservadoras para evitar que se salgan
                                const safeMargin = 15;
                                const cardWidth = (pageWidth - (cols + 1) * safeMargin) / cols;
                                const maxCardHeight = (availableHeight - (rows + 1) * safeMargin) / rows;
                                
                                // Limitar altura máxima para evitar desbordamiento
                                const cardHeight = Math.min(maxCardHeight, 120); // Altura máxima fija

                                // Calcular altura por fila de ejercicios adaptativa
                                const header1 = 10, header2 = 12, padding = 6;
                                const maxExercises = Math.max(3, ...routineData.map(d => (d.exercises ? d.exercises.length : 0)));
                                const rowH = Math.max(12, Math.floor((cardHeight - header1 - header2 - padding) / maxExercises));
                                const rowSlots = maxExercises; // Usar el número real de ejercicios

                                

                                // Dibujar cada tarjeta
                                for (let i = 0; i < routineData.length; i++) {
                                    const { col, row } = mapIndexToPos(i);
                                    const x = safeMargin + col * (cardWidth + safeMargin);
                                    const y = titleOffset + safeMargin + row * (cardHeight + safeMargin);
                                    drawDayCard(pdf, routineData[i], x, y, cardWidth, cardHeight, i + 1, rowSlots, rowH);
                                }

                                function drawDayCard(pdf, day, x, y, width, height, dayNumber, rowSlots, rowH) {
                                    // Calcular altura real basada en ejercicios actuales
                                    const actualExercises = (day.exercises || []).filter(ex => ex.name && ex.name.trim() !== '').length;
                                    const actualRowSlots = Math.min(6, Math.max(0, actualExercises)); // Usar solo el número real de ejercicios
                                    const actualRowH = actualRowSlots > 0
                                        ? Math.max(8, Math.min(15, Math.floor((height - 22 - 6) / actualRowSlots)))
                                        : 12; // Altura por defecto si no hay ejercicios
                                    
                                    // Ajustar altura total de la tarjeta para que no se salga
                                    const totalCardHeight = Math.min(height, 22 + actualRowSlots * actualRowH + 6);
                                    
                                    // Orden: Ejercicio | SP | S | R
                                    const headers = ['Ejercicio', 'SP', 'S', 'R'];
                                    const colWidths = [width * 0.58, width * 0.14, width * 0.14, width * 0.14];
                                    const colXs = [x, x + colWidths[0], x + colWidths[0] + colWidths[1], x + colWidths[0] + colWidths[1] + colWidths[2], x + width];

                                    // Borde de la tarjeta (usar altura calculada)
                                    pdf.setDrawColor(0, 0, 0);
                                    pdf.setLineWidth(0.6);
                                    pdf.rect(x, y, width, totalCardHeight, 'S');

                                    // Encabezado superior
                                    pdf.setLineWidth(0.6);
                                    pdf.line(x, y + header1, x + width, y + header1);
                                    // Encabezado de columnas
                                    pdf.line(x, y + header1 + header2, x + width, y + header1 + header2);

                                    // Columnas internas (desde debajo del primer encabezado)
                                    const maxColumnHeight = Math.min(actualRowSlots * actualRowH, totalCardHeight - header1 - header2);
                                    for (let k = 1; k < colXs.length - 0; k++) {
                                        const cx = colXs[k];
                                        pdf.line(cx, y + header1, cx, y + header1 + header2 + maxColumnHeight);
                                    }

                                    // Filas (solo las que caben)
                                    for (let r = 1; r <= actualRowSlots; r++) {
                                        const yy = y + header1 + header2 + r * actualRowH;
                                        if (yy <= y + totalCardHeight - 2) { // Dejar un pequeño margen
                                            pdf.line(x, yy, x + width, yy);
                                        }
                                    }

                                    // Textos
                                    pdf.setFont('helvetica', 'normal');
                                    pdf.setFontSize(9);
                                    pdf.setTextColor(0, 0, 0);
                                    const mg = day.muscleGroup ? `(${day.muscleGroup})` : '(músculo a ejercitar)';
                                    pdf.text(`Día ${dayNumber} ${mg}`, x + 5, y + 7);

                                    // Encabezados columnas
                                    let hx = x + 5;
                                    pdf.setFont('helvetica', 'bold');
                                    headers.forEach((h, idx) => {
                                        pdf.text(h, hx, y + header1 + 9);
                                        hx = colXs[idx + 1] + 5;
                                    });

                                    // Celdas de ejercicios con hipervínculos
                                    pdf.setFont('helvetica', 'normal');
                                    
                                    // Filtrar solo ejercicios con contenido
                                    const realExercises = (day.exercises || []).filter(ex => ex.name && ex.name.trim() !== '');
                                    
                                    for (let r = 0; r < realExercises.length; r++) {
                                        const ex = realExercises[r] || {};
                                        const baseY = y + header1 + header2 + (r * actualRowH) + 6;
                                        
                                        // Solo dibujar si cabe dentro de la tarjeta
                                        if (baseY > y + totalCardHeight - 10) break;
                                        
                                        const nameX = x + 5;
                                        const rawName = (ex.name || '').toString();
                                        // Limpiar espacios extra y mostrar nombre completo
                                        const cleanName = rawName.replace(/\s+/g, ' ').trim();
                                        const nameBoxWidth = colWidths[0] - 10;
                                        // Ajuste automático de fuente para que quepa en una sola línea
                                        const baseFontSize = 9;
                                        pdf.setFontSize(baseFontSize);
                                        let textWidth = pdf.getTextWidth(cleanName);
                                        let fitFontSize = baseFontSize;
                                        if (textWidth > nameBoxWidth) {
                                            fitFontSize = Math.max(6, Math.floor(baseFontSize * (nameBoxWidth / textWidth)));
                                            pdf.setFontSize(fitFontSize);
                                            textWidth = pdf.getTextWidth(cleanName);
                                        }
                                        pdf.text(cleanName, nameX, baseY);
                                        if (ex.link && typeof ex.link === 'string' && ex.link.startsWith('http')) {
                                            const linkWidth = Math.min(textWidth, nameBoxWidth);
                                            pdf.link(nameX, baseY - 2, linkWidth, (fitFontSize / 2) + 2, { url: ex.link });
                                        }
                                        // Restaurar tamaño de fuente estándar
                                        pdf.setFontSize(baseFontSize);
                                        // Serie y repeticiones en columnas 3 y 4 (índices 2 y 3)
                                        if (baseY <= y + totalCardHeight - 5) {
                                            pdf.text(((ex.series ?? '') + '').toString(), colXs[2] + 5, baseY);
                                            pdf.text(((ex.reps ?? '') + '').toString(), colXs[3] + 5, baseY);
                                        }

                                        // Dibujar marca de SP solo si está activa (sin recuadro)
                                        const checkX = colXs[1] + 5;
                                        const checkY = baseY - 1.5;
                                        if (ex.progressive && (checkY <= y + totalCardHeight - 8)) {
                                            pdf.setLineWidth(0.6);
                                            // Marca simple tipo "check"
                                            pdf.line(checkX, checkY + 1.2, checkX + 1.2, checkY + 2.4);
                                            pdf.line(checkX + 1.2, checkY + 2.4, checkX + 3.2, checkY);
                                        }
                                    }
                                }
                                pdf.save(fileName);
                                showToast("PDF generado con éxito.");
                            }).catch(async error => {
                                console.error("Error al generar el PDF:", error);
                                // Fallback 1: exportación desde proceso principal a un PDF en Documentos/SomnusFitnessRoutines
                                try {
                                    const clientName = document.getElementById('sheet-nombre')?.value || 'cliente';
                                    const htmlContent = `<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body>${document.getElementById('sheet-seguimiento').outerHTML}${document.getElementById('sheet-calentamiento').outerHTML}${document.getElementById('sheet-rutina').outerHTML}</body></html>`;
                                    const res = await window.electronAPI.exportPdf({ htmlContent, pdfFileName: `rutina-${clientName}.pdf` });
                                    if (res && res.success) {
                                        showToast("PDF exportado en la carpeta de rutinas.");
                                        return;
                                    }
                                    // Si falla, usar impresión del navegador
                                    showToast("Usando método alternativo de impresión...");
                                    generatePDFViaPrint();
                                } catch (fallbackErr) {
                                    console.error("Error en fallback de exportación:", fallbackErr);
                                    showToast("Usando método alternativo de impresión...");
                                    generatePDFViaPrint();
                                }
                            }).finally(() => {
                                elementsToHide.forEach(el => el.style.visibility = 'visible');
                            });
                        } catch (error) {
                            console.error("Error al inicializar PDF:", error);
                            showToast("Usando método alternativo de impresión...");
                            generatePDFViaPrint();
                        }
                    });
                } else {
                    showToast("Librerías no disponibles, usando impresión del navegador...");
                    generatePDFViaPrint();
                }
            });

            if (btnOpenFolder) btnOpenFolder.addEventListener('click', () => window.electronAPI.openRoutinesFolder());
            if (btnNewRoutine) btnNewRoutine.addEventListener('click', () => {
                showConfirmation("¿Estás seguro? Se perderán los cambios no guardados.", () => {
                    clearUI();
                    for(let i=0; i<4; i++){ createDayCard(); }
                    showToast("Nueva rutina iniciada.");
                });
            });

            // --- Lógica del Modal de Configuración de Ejercicios ---
            function openConfigModal() {
                if (!configModal) return;
                // Poblar categorías existentes en datalist
                if (datalistCategories) {
                    datalistCategories.innerHTML = '';
                    Object.keys(exercisesData || {}).forEach(cat => {
                        const opt = document.createElement('option');
                        opt.value = cat;
                        datalistCategories.appendChild(opt);
                    });
                }
                // Poblar selector de filtro de categoría (con "Todas")
                if (configFilterCategory) {
                    const cats = Object.keys(exercisesData || {});
                    configFilterCategory.innerHTML = '';
                    const optAll = document.createElement('option'); optAll.value = ''; optAll.textContent = 'Todas';
                    configFilterCategory.appendChild(optAll);
                    cats.forEach(cat => { const o = document.createElement('option'); o.value = cat; o.textContent = cat; configFilterCategory.appendChild(o); });
                }
                renderConfigList();
                // Limpiar inputs
                if (inputCategory) inputCategory.value = '';
                if (inputName) inputName.value = '';
                if (inputLink) inputLink.value = '';
                configModal.classList.remove('hidden');
            }
            function renderConfigList() {
                if (!configList) return;
                const term = (configSearch && configSearch.value || '').toLowerCase();
                const catFilter = configFilterCategory ? configFilterCategory.value : '';
                configList.innerHTML = '';
                const cats = Object.keys(exercisesData || {});
                cats.forEach(cat => {
                    if (catFilter && cat !== catFilter) return;
                    const items = (exercisesData[cat] || []).filter(e => !term || String(e.name || '').toLowerCase().includes(term));
                    if (items.length === 0) return;
                    const wrapper = document.createElement('div');
                    const header = document.createElement('div');
                    header.className = 'px-3 py-2 bg-gray-50 border-b font-semibold';
                    header.textContent = cat;
                    wrapper.appendChild(header);
                    items.forEach(ex => {
                        const row = document.createElement('div');
                        row.className = 'flex items-center justify-between px-3 py-2 border-b gap-3';
                        const info = document.createElement('div');
                        info.className = 'flex-1 min-w-0';
                        info.innerHTML = `<div class="font-medium truncate">${ex.name}</div><div class="text-xs text-gray-500 truncate">${ex.link || ''}</div>`;
                        const actions = document.createElement('div');
                        actions.className = 'flex items-center gap-2 flex-shrink-0';
                        const btnEdit = document.createElement('button');
                        btnEdit.className = 'px-2 py-1 text-xs bg-blue-600 text-white rounded';
                        btnEdit.textContent = 'Editar';
                        btnEdit.onclick = () => {
                            if (inputCategory) inputCategory.value = cat;
                            if (inputName) inputName.value = ex.name || '';
                            if (inputLink) inputLink.value = ex.link || '';
                            inputName && inputName.focus();
                        };
                        const btnDel = document.createElement('button');
                        btnDel.className = 'px-2 py-1 text-xs bg-red-600 text-white rounded';
                        btnDel.textContent = 'Eliminar';
                        btnDel.onclick = async () => {
                            showConfirmation(`¿Eliminar "${ex.name}" de ${cat}?`, async () => {
                                try {
                                    const res = await window.electronAPI.deleteExercise({ category: cat, name: ex.name });
                                    if (res && res.success) {
                                        exercisesData[cat] = (exercisesData[cat] || []).filter(i => String(i.name || '').toLowerCase() !== String(ex.name || '').toLowerCase());
                                        showToast('Ejercicio eliminado.');
                                        renderConfigList();
                                    } else {
                                        showToast('No se pudo eliminar. ' + (res && res.error ? res.error : ''));
                                    }
                                } catch (err) {
                                    console.error('Error eliminando ejercicio:', err);
                                    showToast('Error al eliminar.');
                                }
                            });
                        };
                        actions.appendChild(btnEdit);
                        actions.appendChild(btnDel);
                        row.appendChild(info);
                        row.appendChild(actions);
                        wrapper.appendChild(row);
                    });
                    configList.appendChild(wrapper);
                });
            }

            if (configSearch) configSearch.addEventListener('input', renderConfigList);
            if (configFilterCategory) configFilterCategory.addEventListener('change', renderConfigList);
            function closeConfigModal() { if (configModal) configModal.classList.add('hidden'); }

            if (btnConfigureExercises) btnConfigureExercises.addEventListener('click', openConfigModal);
            if (configClose) configClose.addEventListener('click', closeConfigModal);
            if (configCancel) configCancel.addEventListener('click', closeConfigModal);
            window.addEventListener('click', (e) => { if (e.target === configModal) closeConfigModal(); });

            if (configSave) configSave.addEventListener('click', async () => {
                const category = inputCategory ? inputCategory.value.trim() : '';
                const name = inputName ? inputName.value.trim() : '';
                const link = inputLink ? inputLink.value.trim() : '';
                if (!category || !name || !link) {
                    showToast('Completa categoría, nombre y link.');
                    return;
                }
                try {
                    const res = await window.electronAPI.addExercise({ category, name, link });
                    if (res && res.success) {
                        // Actualizar en memoria
                        if (!exercisesData[category]) exercisesData[category] = [];
                        const idx = exercisesData[category].findIndex(e => String(e.name || '').toLowerCase() === name.toLowerCase());
                        if (idx >= 0) exercisesData[category][idx].link = link; else exercisesData[category].push({ name, link });
                        showToast('Ejercicio guardado.');
                        closeConfigModal();
                        // Si el modal de selección está abierto, rehacer su contenido
                        if (exerciseModal && !exerciseModal.classList.contains('hidden')) {
                            openExerciseModal();
                        }
                    } else {
                        showToast('No se pudo guardar. ' + (res && res.error ? res.error : ''));
                    }
                } catch (err) {
                    console.error('Error guardando ejercicio:', err);
                    showToast('Error al guardar.');
                }
            });

            // --- INICIALIZACIÓN DE LA APP ---
            clearUI();
            if (filters && typeof filters.loadClientList === 'function') {
                filters.loadClientList();
            }
            // Inicializar visibilidad de opciones de plantillas
            updateTemplateOptionVisibility();

            // Exponer funciones útiles globalmente sin romper nada existente
            window.gatherData = gatherData;

            // Ocultar splash al finalizar
            const splashEl = document.getElementById('splash-screen');
            if (splashEl) {
                setTimeout(() => splashEl.classList.add('hidden'), 250);
            }
        }

        initializeApp();
    } catch (error) {
        console.error("Error fatal durante la inicialización de la aplicación:", error);
        alert("Error crítico: No se pudo iniciar la aplicación. Revise la consola (Ctrl+Shift+I).");
    }
});
