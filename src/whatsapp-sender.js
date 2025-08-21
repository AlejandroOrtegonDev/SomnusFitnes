// whatsapp-sender.js - Sistema simple de envío por WhatsApp
// Autor: Sistema Somnus Fitness
// Descripción: Envía rutinas de ejercicio por WhatsApp de forma fácil y directa

(function() {
    'use strict';

    // Función principal para enviar por WhatsApp
    function sendRoutineToWhatsApp() {
        console.log('🚀 Iniciando envío por WhatsApp...');

        try {
            // 1. Obtener datos de la rutina actual
            const routineData = gatherRoutineData();
            if (!routineData) {
                alert('❌ Error: No se pudieron obtener los datos de la rutina');
                return;
            }
            console.log('✅ Datos de rutina obtenidos');

            // 2. Obtener número de WhatsApp
            const phoneNumber = getPhoneNumber();
            if (!phoneNumber) {
                return; // Usuario canceló
            }
            console.log('✅ Número de teléfono obtenido:', phoneNumber);

            // 3. Formatear mensaje
            const message = formatRoutineMessage(routineData);
            console.log('✅ Mensaje formateado, longitud:', message.length);

            // 4. Crear enlace de WhatsApp
            const whatsappUrl = createWhatsAppUrl(phoneNumber, message);
            console.log('✅ URL de WhatsApp creada');

            // 5. Abrir WhatsApp
            openWhatsApp(whatsappUrl, phoneNumber);

        } catch (error) {
            console.error('❌ Error en sendRoutineToWhatsApp:', error);
            alert('❌ Error inesperado: ' + error.message);
        }
    }

    // Función para obtener datos de la rutina
    function gatherRoutineData() {
        try {
            // Usar la función global si está disponible
            if (window.gatherData && typeof window.gatherData === 'function') {
                return window.gatherData();
            }

            // Método alternativo: recopilar datos manualmente
            const data = {
                seguimiento: {},
                calentamiento: '',
                rutina: [],
                genero: 'hombre'
            };

            // Datos del cliente
            const nombreInput = document.getElementById('sheet-nombre');
            const fechaInput = document.getElementById('sheet-fecha');
            const whatsappInput = document.getElementById('sheet-whatsapp');
            const objetivosInput = document.getElementById('sheet-objetivos');

            if (nombreInput) data.seguimiento.nombre = nombreInput.value;
            if (fechaInput) data.seguimiento.fecha = fechaInput.value;
            if (whatsappInput) data.seguimiento.whatsapp = whatsappInput.value;
            if (objetivosInput) data.seguimiento.objetivos = objetivosInput.value;

            // Calentamiento
            const calentamientoText = document.getElementById('calentamiento-text');
            if (calentamientoText) data.calentamiento = calentamientoText.value;

            // Rutina de ejercicios
            const daysContainer = document.getElementById('days-container');
            if (daysContainer) {
                const dayCards = daysContainer.querySelectorAll('.day-card');
                dayCards.forEach((card, index) => {
                    const muscleGroupInput = card.querySelector('.day-muscle-group');
                    const muscleGroup = muscleGroupInput ? muscleGroupInput.value : '';
                    
                    const exercises = [];
                    const exerciseRows = card.querySelectorAll('tbody tr');
                    exerciseRows.forEach(row => {
                        const nameCell = row.cells[0];
                        const seriesCell = row.cells[2];
                        const repsCell = row.cells[3];
                        const progressiveCheckbox = row.cells[1] ? row.cells[1].querySelector('.progressive-checkbox') : null;
                        
                        if (nameCell && nameCell.textContent.trim()) {
                            exercises.push({
                                name: nameCell.textContent.trim(),
                                series: seriesCell ? seriesCell.textContent.trim() : '',
                                reps: repsCell ? repsCell.textContent.trim() : '',
                                progressive: progressiveCheckbox ? progressiveCheckbox.checked : false
                            });
                        }
                    });

                    if (exercises.length > 0 || muscleGroup) {
                        data.rutina.push({
                            muscleGroup: muscleGroup,
                            exercises: exercises
                        });
                    }
                });
            }

            return data;
        } catch (error) {
            console.error('Error al recopilar datos:', error);
            return null;
        }
    }

    // Función para obtener número de teléfono
    function getPhoneNumber() {
        // Primero intentar obtener del formulario
        const whatsappInput = document.getElementById('sheet-whatsapp');
        let phoneNumber = '';
        
        if (whatsappInput && whatsappInput.value.trim()) {
            phoneNumber = whatsappInput.value.trim();
        } else {
            // Pedir al usuario
            phoneNumber = prompt('📱 Ingresa el número de WhatsApp:\n(Ejemplo: 3001234567)');
            if (!phoneNumber) {
                console.log('Usuario canceló');
                return null;
            }
        }

        // Limpiar y validar
        phoneNumber = phoneNumber.replace(/\D/g, '');
        if (phoneNumber.length < 10) {
            alert('❌ Número inválido. Debe tener al menos 10 dígitos.\nEjemplo: 3001234567');
            return null;
        }

        // Agregar código de país Colombia si no lo tiene
        if (!phoneNumber.startsWith('57')) {
            phoneNumber = '57' + phoneNumber;
        }

        return phoneNumber;
    }

    // Función para formatear el mensaje
    function formatRoutineMessage(data) {
        let message = '🏋️ *RUTINA DE EJERCICIOS - SOMNUS FITNESS* 🏋️\n\n';

        // Información del cliente
        if (data.seguimiento && data.seguimiento.nombre) {
            message += `👤 *Cliente:* ${data.seguimiento.nombre}\n`;
        }
        if (data.seguimiento && data.seguimiento.fecha) {
            message += `📅 *Fecha:* ${data.seguimiento.fecha}\n`;
        }
        if (data.seguimiento && data.seguimiento.objetivos) {
            message += `🎯 *Objetivos:* ${data.seguimiento.objetivos}\n`;
        }
        message += '\n';

        // Calentamiento
        if (data.calentamiento && data.calentamiento.trim()) {
            message += `🔥 *CALENTAMIENTO:*\n${data.calentamiento.trim()}\n\n`;
        }

        // Rutina de ejercicios
        if (data.rutina && data.rutina.length > 0) {
            message += '💪 *RUTINA DE EJERCICIOS:*\n\n';
            
            data.rutina.forEach((day, index) => {
                message += `*📍 DÍA ${index + 1}`;
                if (day.muscleGroup && day.muscleGroup.trim()) {
                    message += ` - ${day.muscleGroup.toUpperCase()}`;
                }
                message += '*\n';

                if (day.exercises && day.exercises.length > 0) {
                    day.exercises.forEach((exercise, exerciseIndex) => {
                        if (exercise.name && exercise.name.trim()) {
                            message += `${exerciseIndex + 1}. *${exercise.name}*`;
                            
                            const details = [];
                            if (exercise.series && exercise.series.trim()) {
                                details.push(`${exercise.series} series`);
                            }
                            if (exercise.reps && exercise.reps.trim()) {
                                details.push(`${exercise.reps} reps`);
                            }
                            if (exercise.progressive) {
                                details.push('Progresivo ⬆️');
                            }
                            
                            if (details.length > 0) {
                                message += ` - ${details.join(' × ')}`;
                            }
                            message += '\n';
                        }
                    });
                } else {
                    message += '_Sin ejercicios definidos_\n';
                }
                message += '\n';
            });
        }

        // Pie del mensaje
        message += '━━━━━━━━━━━━━━━━━━━━━\n';
        message += '📱 *SOMNUS FITNESS*\n';
        message += '💪 _¡Tu mejor versión te espera!_\n';
        message += '🔥 _Constancia = Resultados_';

        return message;
    }

    // Función para crear URL de WhatsApp
    function createWhatsAppUrl(phoneNumber, message) {
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    }

    // Función para abrir WhatsApp con QR Code
    function openWhatsApp(whatsappUrl, phoneNumber) {
        console.log('📱 Generando código QR para WhatsApp...');
        
        // Mostrar modal con QR
        showWhatsAppQR(whatsappUrl, phoneNumber);
    }

    // Función para mostrar QR de WhatsApp
    function showWhatsAppQR(whatsappUrl, phoneNumber) {
        // Crear modal si no existe
        let modal = document.getElementById('whatsapp-qr-modal-sender');
        if (!modal) {
            createQRModal();
            modal = document.getElementById('whatsapp-qr-modal-sender');
        }

        // Limpiar contenido anterior
        const qrContainer = document.getElementById('whatsapp-qr-container');
        const phoneDisplay = document.getElementById('whatsapp-phone-display');
        const linkDisplay = document.getElementById('whatsapp-link-display');
        
        if (phoneDisplay) {
            phoneDisplay.textContent = `+${phoneNumber}`;
        }
        
        if (linkDisplay) {
            linkDisplay.textContent = `wa.me/${phoneNumber}`;
            linkDisplay.href = whatsappUrl;
        }

        if (qrContainer) {
            qrContainer.innerHTML = '';
            
            // Verificar que QRCode esté disponible
            if (typeof QRCode !== 'undefined') {
                try {
                    console.log('📱 Generando QR code...');
                    new QRCode(qrContainer, {
                        text: whatsappUrl,
                        width: 200,
                        height: 200,
                        colorDark: "#25D366", // Verde de WhatsApp
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.H
                    });
                    console.log('✅ QR code generado exitosamente');
                } catch (error) {
                    console.error('❌ Error al generar QR:', error);
                    qrContainer.innerHTML = '<p class="text-red-500 text-center">Error al generar QR</p>';
                }
            } else {
                console.error('❌ QRCode library no disponible');
                qrContainer.innerHTML = '<p class="text-red-500 text-center">QRCode library no disponible</p>';
            }
        }

        // Mostrar modal
        modal.classList.remove('hidden');
        console.log('✅ Modal QR mostrado');
    }

    // Función para crear el modal de QR
    function createQRModal() {
        const modalHTML = `
            <div id="whatsapp-qr-modal-sender" class="hidden fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50" style="z-index: 9999;">
                <div class="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl border-2 border-green-500">
                    <div class="text-center mb-6">
                        <h3 class="text-2xl font-bold text-green-600 mb-2">📱 Enviar por WhatsApp</h3>
                        <p class="text-gray-600">Escanea el código QR con tu teléfono</p>
                    </div>
                    
                    <div class="flex justify-center mb-6">
                        <div id="whatsapp-qr-container" class="bg-white p-4 rounded-lg border-2 border-gray-200 w-52 h-52 flex items-center justify-center">
                            <div class="text-gray-500">Generando QR...</div>
                        </div>
                    </div>
                    
                    <div class="text-center mb-6">
                        <div class="text-sm text-gray-600 mb-2">Número de destino:</div>
                        <div id="whatsapp-phone-display" class="font-bold text-lg text-green-600">+57XXXXXXXXX</div>
                    </div>
                    
                    <div class="space-y-3">
                        <button onclick="copyWhatsAppLink()" class="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-semibold">
                            📋 Copiar Enlace
                        </button>
                        <a id="whatsapp-link-display" href="#" target="_blank" class="block w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-semibold text-center">
                            🌐 Abrir en Navegador
                        </a>
                        <button onclick="closeWhatsAppQR()" class="w-full py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-all font-semibold">
                            ✖️ Cerrar
                        </button>
                    </div>
                    
                    <div class="mt-4 text-xs text-gray-500 text-center">
                        💡 También puedes hacer clic en "Abrir en Navegador" o copiar el enlace
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        console.log('✅ Modal QR creado');
    }

    // Función para copiar al portapapeles (mejorada)
    function copyToClipboard(text) {
        return new Promise((resolve, reject) => {
            try {
                // Método 1: Clipboard API moderna
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(text)
                        .then(() => {
                            console.log('📋 Copiado al portapapeles (Clipboard API)');
                            resolve(true);
                        })
                        .catch(() => {
                            // Fallback al método tradicional
                            fallbackCopy();
                        });
                } else {
                    // Fallback al método tradicional
                    fallbackCopy();
                }

                function fallbackCopy() {
                    try {
                        // Método 2: execCommand (compatible con más navegadores)
                        const textArea = document.createElement('textarea');
                        textArea.value = text;
                        textArea.style.position = 'fixed';
                        textArea.style.left = '-999999px';
                        textArea.style.top = '-999999px';
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();
                        
                        const successful = document.execCommand('copy');
                        document.body.removeChild(textArea);
                        
                        if (successful) {
                            console.log('📋 Copiado al portapapeles (execCommand)');
                            resolve(true);
                        } else {
                            console.log('⚠️ No se pudo copiar al portapapeles');
                            resolve(false);
                        }
                    } catch (err) {
                        console.log('⚠️ Error al copiar:', err.message);
                        resolve(false);
                    }
                }
            } catch (error) {
                console.log('⚠️ Error general al copiar:', error.message);
                resolve(false);
            }
        });
    }

    // Función para mostrar notificación
    function showToast(message) {
        const toast = document.getElementById('toast-notification');
        if (toast) {
            toast.textContent = message;
            toast.classList.remove('hidden');
            setTimeout(() => toast.classList.add('hidden'), 3000);
        }
    }

    // Funciones globales para el modal
    window.copyWhatsAppLink = function() {
        const linkElement = document.getElementById('whatsapp-link-display');
        if (linkElement && linkElement.href) {
            copyToClipboard(linkElement.href);
            showToast('📋 Enlace copiado al portapapeles');
            
            // Cambiar texto del botón temporalmente
            const button = event.target;
            const originalText = button.textContent;
            button.textContent = '✅ ¡Copiado!';
            button.style.backgroundColor = '#10b981';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = '';
            }, 2000);
        }
    };

    window.closeWhatsAppQR = function() {
        const modal = document.getElementById('whatsapp-qr-modal-sender');
        if (modal) {
            modal.classList.add('hidden');
            console.log('✅ Modal QR cerrado');
        }
    };

    // Exponer función globalmente
    window.sendRoutineToWhatsApp = sendRoutineToWhatsApp;

    // Inicializar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {
        console.log('✅ WhatsApp Sender inicializado');
        
        // Buscar el botón de WhatsApp y agregar evento
        const whatsappButton = document.getElementById('btn-whatsapp-send');
        if (whatsappButton) {
            whatsappButton.addEventListener('click', sendRoutineToWhatsApp);
            console.log('✅ Evento agregado al botón de WhatsApp');
        }
    });

})();

console.log('📱 WhatsApp Sender cargado correctamente');
