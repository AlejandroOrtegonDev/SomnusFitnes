// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getExercises: () => ipcRenderer.invoke('get-exercises'),
  getTemplates: () => ipcRenderer.invoke('get-templates'),
  addExercise: (data) => ipcRenderer.invoke('add-exercise', data),
  deleteExercise: (data) => ipcRenderer.invoke('delete-exercise', data),
  saveRoutine: (data) => ipcRenderer.invoke('save-routine', data),
  getRoutines: () => ipcRenderer.invoke('get-routines'),
  loadRoutine: (clientName) => ipcRenderer.invoke('load-routine', clientName),
  openRoutinesFolder: () => ipcRenderer.invoke('open-routines-folder'),
  openExternalLink: (url) => ipcRenderer.invoke('open-external-link', url),
  openUrl: (url) => ipcRenderer.invoke('open-url', url),
  exportPdf: (data) => ipcRenderer.invoke('export-pdf', data),
  getWhatsAppStatus: () => ipcRenderer.invoke('whatsapp-status'),
  openWhatsAppWeb: () => ipcRenderer.invoke('open-whatsapp-web'),
  sendWhatsApp: (routineData) => ipcRenderer.invoke('send-whatsapp', routineData),
  sendWhatsAppFile: ({ phoneNumber, filePath, caption }) => ipcRenderer.invoke('send-whatsapp-file', { phoneNumber, filePath, caption }),
  sendWhatsAppText: ({ phoneNumber, message }) => ipcRenderer.invoke('send-whatsapp-text', { phoneNumber, message }),
  showWhatsAppQR: () => ipcRenderer.invoke('show-whatsapp-qr'),
  
  // Event listeners for WhatsApp
  onWhatsAppQR: (callback) => {
    ipcRenderer.on('whatsapp-qr', (event, qrData) => callback(qrData));
  },
  
  onWhatsAppReady: (callback) => {
    ipcRenderer.on('whatsapp-ready', (event) => callback());
  },
  
  onWhatsAppError: (callback) => {
    ipcRenderer.on('whatsapp-error', (event, error) => callback(error));
  },

  onWhatsAppDisconnected: (callback) => {
    ipcRenderer.on('whatsapp-disconnected', (event, reason) => callback(reason));
  },

  // APIs para ventanas múltiples
  createNewWindow: (windowData) => ipcRenderer.invoke('create-new-window', windowData),
  closeWindow: (windowId) => ipcRenderer.invoke('close-window', windowId),
  getWindowsList: () => ipcRenderer.invoke('get-windows-list'),
  
  // Listener para cargar datos de rutina en ventanas nuevas
  onLoadRoutineData: (callback) => {
    ipcRenderer.on('load-routine-data', (event, routineData) => callback(routineData));
  },

  // APIs adicionales de WhatsApp
  getWhatsAppStatus: () => ipcRenderer.invoke('whatsapp-status'),
  showWhatsAppQR: () => ipcRenderer.invoke('show-whatsapp-qr'),
  sendWhatsApp: (data) => ipcRenderer.invoke('send-whatsapp', data),
  sendWhatsAppText: (data) => ipcRenderer.invoke('send-whatsapp-text', data),
  sendWhatsAppFile: (data) => ipcRenderer.invoke('send-whatsapp-file', data),
  openWhatsAppWeb: () => ipcRenderer.invoke('open-whatsapp-web'),
  
  // APIs para guardar y enviar PDF actual
  generatePDFForWhatsApp: (data) => ipcRenderer.invoke('generate-pdf-for-whatsapp', data),
  sendWhatsAppSavedPDF: (data) => ipcRenderer.invoke('send-whatsapp-saved-pdf', data),

  // Listeners adicionales de WhatsApp
  onWhatsAppQR: (callback) => {
    ipcRenderer.on('whatsapp-qr', (event, qrData) => callback(qrData));
  },
  onWhatsAppReady: (callback) => {
    ipcRenderer.on('whatsapp-ready', () => callback());
  },
  onWhatsAppError: (callback) => {
    ipcRenderer.on('whatsapp-error', (event, error) => callback(error));
  },
  onWhatsAppDisconnected: (callback) => {
    ipcRenderer.on('whatsapp-disconnected', (event, reason) => callback(reason));
  }
});
