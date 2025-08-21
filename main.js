// main.js
const { app, BrowserWindow, ipcMain, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Configuraciones de seguridad
app.on('web-contents-created', (event, contents) => {
  // Deshabilitar navegación
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });

  // Deshabilitar nuevas ventanas
  contents.setWindowOpenHandler(({ url }) => {
    return { action: 'deny' };
  });
});

// Configurar CSP para todas las ventanas
app.on('ready', () => {
  // Configurar CSP global
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://unpkg.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://wa.me;"]
      }
    });
  });
});

// Define una carpeta dedicada para guardar las rutinas en la carpeta de Documentos del usuario.
const routinesPath = path.join(app.getPath('documents'), 'SomnusFitnessRoutines');

// Asegúrate de que la carpeta de rutinas exista. Si no, la crea.
if (!fs.existsSync(routinesPath)) {
    fs.mkdirSync(routinesPath, { recursive: true });
}

// Gestión de ventanas múltiples
let windows = new Map(); // Almacenar todas las ventanas
let windowCounter = 0;

// Inicializar cliente de WhatsApp
let whatsappClient = null;
let isWhatsAppReady = false;
let mainWindow = null;

function initializeWhatsApp() {
    whatsappClient = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    whatsappClient.on('qr', (qr) => {
        console.log('QR RECIBIDO, enviando al frontend...');
        console.log('QR data:', qr);
        if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('whatsapp-qr', qr);
            console.log('QR enviado al frontend');
        } else {
            console.log('mainWindow no está disponible');
        }
    });

    whatsappClient.on('ready', () => {
        console.log('Cliente WhatsApp listo!');
        isWhatsAppReady = true;
        if (mainWindow) {
            mainWindow.webContents.send('whatsapp-ready');
        }
    });

    whatsappClient.on('auth_failure', (msg) => {
        console.error('Error de autenticación WhatsApp:', msg);
        isWhatsAppReady = false;
        if (mainWindow) {
            mainWindow.webContents.send('whatsapp-error', 'Error de autenticación');
        }
    });

    whatsappClient.on('disconnected', (reason) => {
        console.log('Cliente WhatsApp desconectado:', reason);
        isWhatsAppReady = false;
        if (mainWindow) {
            mainWindow.webContents.send('whatsapp-disconnected', reason);
        }
    });

    whatsappClient.initialize();
}

const createWindow = (windowData = null) => {
  windowCounter++;
  const isMainWindow = !mainWindow;
  
  const newWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'src/preload.js'),
      contextIsolation: true, 
      nodeIntegration: false,
      enableRemoteModule: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      enableWebSQL: false,
      spellcheck: false
    },
    show: false,
    titleBarStyle: 'default',
    title: windowData ? `Somnus Fitness - ${windowData.clientName}` : `Somnus Fitness - Ventana ${windowCounter}`
  });

  // Si es la ventana principal, guardarla como tal
  if (isMainWindow) {
    mainWindow = newWindow;
  }

  // Almacenar la ventana en el mapa
  const windowId = windowData?.id || `window-${windowCounter}`;
  windows.set(windowId, {
    window: newWindow,
    id: windowId,
    clientName: windowData?.clientName || `Ventana ${windowCounter}`,
    routineData: windowData?.routineData || null
  });

  newWindow.loadFile(path.join(__dirname, 'src/index.html'));
  
  // Si hay datos de rutina, enviarlos cuando la ventana esté lista
  if (windowData?.routineData) {
    newWindow.webContents.once('dom-ready', () => {
      newWindow.webContents.send('load-routine-data', windowData.routineData);
    });
  }
  
  // Mostrar la ventana cuando esté lista para evitar parpadeo
  newWindow.once('ready-to-show', () => {
    newWindow.show();
    if (windowData?.clientName) {
      newWindow.setTitle(`Somnus Fitness - ${windowData.clientName}`);
    }
  });

  // Limpiar cuando la ventana se cierre
  newWindow.on('closed', () => {
    windows.delete(windowId);
    if (newWindow === mainWindow) {
      mainWindow = null;
    }
  });
  
  return { window: newWindow, id: windowId };
};

app.whenReady().then(() => {
  // Inicializar WhatsApp
  initializeWhatsApp();
  
  // Manejador para leer el archivo de ejercicios
  ipcMain.handle('get-exercises', async () => {
    const filePath = path.join(__dirname, 'src/exercises.json');
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Error al leer exercises.json:', error);
        return {};
    }
  });

  // Manejador para agregar/actualizar un ejercicio en exercises.json
  ipcMain.handle('add-exercise', async (event, { category, name, link }) => {
    const filePath = path.join(__dirname, 'src/exercises.json');
    try {
      if (!category || !name || !link) {
        return { success: false, error: 'Faltan campos requeridos.' };
      }
      // Leer JSON actual
      let data = {};
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        data = JSON.parse(fileContent || '{}');
      } catch (e) {
        data = {};
      }
      if (typeof data !== 'object' || Array.isArray(data) || data === null) {
        data = {};
      }
      // Asegurar categoría
      if (!data[category]) {
        data[category] = [];
      }
      if (!Array.isArray(data[category])) {
        data[category] = [];
      }
      // Buscar si existe por nombre (case-insensitive)
      const existingIndex = data[category].findIndex(e => String(e.name || '').toLowerCase() === String(name).toLowerCase());
      if (existingIndex >= 0) {
        // Actualizar link si cambia
        data[category][existingIndex].link = link;
      } else {
        data[category].push({ name, link });
      }
      // Escribir archivo con identación de 2 espacios
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      return { success: true };
    } catch (error) {
      console.error('Error al guardar exercises.json:', error);
      return { success: false, error: error.message };
    }
  });

  // Manejador para eliminar un ejercicio
  ipcMain.handle('delete-exercise', async (event, { category, name }) => {
    const filePath = path.join(__dirname, 'src/exercises.json');
    try {
      if (!category || !name) return { success: false, error: 'Categoría y nombre requeridos.' };
      let data = {};
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        data = JSON.parse(fileContent || '{}');
      } catch (e) {
        data = {};
      }
      if (!data[category] || !Array.isArray(data[category])) {
        return { success: false, error: 'La categoría no existe.' };
      }
      const before = data[category].length;
      data[category] = data[category].filter(e => String(e.name || '').toLowerCase() !== String(name).toLowerCase());
      if (data[category].length === before) {
        return { success: false, error: 'Ejercicio no encontrado.' };
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      return { success: true };
    } catch (err) {
      console.error('Error al eliminar ejercicio:', err);
      return { success: false, error: err.message };
    }
  });

  // Manejador para leer el archivo de plantillas
  ipcMain.handle('get-templates', async () => {
    const filePath = path.join(__dirname, 'src/templates.json');
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.error('Error al leer templates.json:', error);
      return {};
    }
  });

  // Manejador para obtener la lista de rutinas guardadas.
  ipcMain.handle('get-routines', async () => {
    const files = fs.readdirSync(routinesPath);
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  });

  // Manejador para cargar los datos de una rutina específica.
  ipcMain.handle('load-routine', async (event, clientName) => {
    const filePath = path.join(routinesPath, `${clientName}.json`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  });

  // Manejador para guardar los datos de una rutina.
  ipcMain.handle('save-routine', async (event, { clientName, data }) => {
    const filePath = path.join(routinesPath, `${clientName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return { success: true, path: filePath };
  });

  // Manejador para abrir la carpeta de guardado.
  ipcMain.handle('open-routines-folder', () => {
    shell.openPath(routinesPath).catch(err => console.error('Failed to open path:', err));
  });
  
    // Manejador para abrir enlaces externos en el navegador por defecto
  ipcMain.on('open-external-link', (event, url) => {
    shell.openExternal(url);
  });

  // Manejador para verificar estado de WhatsApp
  ipcMain.handle('whatsapp-status', async () => {
    return { 
      isReady: isWhatsAppReady, 
      message: isWhatsAppReady ? 'WhatsApp conectado' : 'WhatsApp no conectado. Haz clic en "Conectar WhatsApp" para escanear el código QR.'
    };
  });

  // Manejador para mostrar QR de WhatsApp
  ipcMain.handle('show-whatsapp-qr', async () => {
    if (!whatsappClient) {
      initializeWhatsApp();
    }
    return { success: true };
  });

  // Manejador para generar PDF y obtener ruta donde guardarlo
  ipcMain.handle('generate-pdf-for-whatsapp', async (event, { routineData, fileName }) => {
    try {
      const { dialog } = require('electron');
      
      // Mostrar diálogo para guardar archivo
      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Guardar PDF para WhatsApp',
        defaultPath: fileName || 'rutina.pdf',
        filters: [
          { name: 'PDF Files', extensions: ['pdf'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled) {
        return { success: false, canceled: true };
      }

      const savePath = result.filePath;
      
      // Generar PDF usando la misma lógica que ya tienes
      const PDFDocument = require('pdfkit');
      const fs = require('fs');
      
      // Crear el PDF
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const stream = fs.createWriteStream(savePath);
      doc.pipe(stream);

      // Contenido del PDF
      const { clientName, rutina, calentamiento, seguimiento } = routineData;
      
      // Título
      doc.fontSize(18).text('RUTINA DE ENTRENAMIENTO', { align: 'center' });
      doc.moveDown();
      
      // Información del cliente
      if (seguimiento) {
        doc.fontSize(14).text('INFORMACIÓN DEL CLIENTE', { underline: true });
        doc.fontSize(12);
        if (seguimiento.nombre) doc.text(`Nombre: ${seguimiento.nombre}`);
        if (seguimiento.fecha) doc.text(`Fecha: ${seguimiento.fecha}`);
        if (seguimiento.edad) doc.text(`Edad: ${seguimiento.edad} años`);
        if (seguimiento.eps) doc.text(`EPS: ${seguimiento.eps}`);
        if (seguimiento.objetivos) doc.text(`Objetivos: ${seguimiento.objetivos}`);
        doc.moveDown();
      }
      
      // Calentamiento
      if (calentamiento && calentamiento.trim()) {
        doc.fontSize(14).text('CALENTAMIENTO', { underline: true });
        doc.fontSize(11).text(calentamiento);
        doc.moveDown();
      }
      
      // Rutina
      if (rutina && rutina.length > 0) {
        doc.fontSize(14).text('RUTINA DE EJERCICIOS', { underline: true });
        doc.moveDown();
        
        rutina.forEach((day, dayIndex) => {
          if (day.exercises && day.exercises.length > 0) {
            doc.fontSize(12).text(`Día ${dayIndex + 1}:`, { underline: true });
            doc.fontSize(10);
            
            day.exercises.forEach((exercise, exIndex) => {
              if (exercise.nombre && exercise.nombre.trim()) {
                const exerciseText = `${exIndex + 1}. ${exercise.nombre}`;
                const details = [];
                if (exercise.series) details.push(`Series: ${exercise.series}`);
                if (exercise.repeticiones) details.push(`Reps: ${exercise.repeticiones}`);
                if (exercise.peso) details.push(`Peso: ${exercise.peso}`);
                
                doc.text(exerciseText);
                if (details.length > 0) {
                  doc.fontSize(9).text(`   ${details.join(' | ')}`);
                  doc.fontSize(10);
                }
              }
            });
            doc.moveDown();
          }
        });
      }

      // Finalizar el documento
      doc.end();

      // Esperar a que termine de escribir
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      return { 
        success: true, 
        filePath: savePath,
        message: `PDF guardado en: ${savePath}`
      };
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      return { success: false, error: error.message };
    }
  });

  // Manejador para enviar PDF ya guardado por WhatsApp
  ipcMain.handle('send-whatsapp-saved-pdf', async (event, { phoneNumber, pdfPath, clientName }) => {
    try {
      // Verificar que se proporcione un número de teléfono
      if (!phoneNumber || phoneNumber.trim() === '') {
        return { success: false, error: 'Se requiere un número de teléfono válido.' };
      }
      
      // Verificar que WhatsApp esté listo
      if (!isWhatsAppReady || !whatsappClient) {
        return { success: false, error: 'WhatsApp no está conectado. Por favor, escanea el código QR primero.' };
      }

      // Verificar que el archivo PDF existe
      if (!fs.existsSync(pdfPath)) {
        return { success: false, error: 'El archivo PDF no existe. Por favor, guarda el PDF primero.' };
      }

      // Formatear número de teléfono
      let formattedNumber = phoneNumber.replace(/\D/g, '');
      if (!formattedNumber.startsWith('57')) {
        formattedNumber = '57' + formattedNumber;
      }
      formattedNumber += '@c.us';
      
      // Crear mensaje para WhatsApp
      const message = `🏋️‍♂️ *RUTINA DE ENTRENAMIENTO - ${(clientName || 'CLIENTE').toUpperCase()}* 🏋️‍♀️\n\n📄 Aquí tienes tu rutina personalizada de entrenamiento.\n\n¡A entrenar! 💪`;
      
      try {
        // Enviar mensaje
        await whatsappClient.sendMessage(formattedNumber, message);
        
        // Enviar PDF
        const media = MessageMedia.fromFilePath(pdfPath);
        const pdfFileName = path.basename(pdfPath);
        await whatsappClient.sendMessage(formattedNumber, media, { 
          caption: `📄 *${pdfFileName}* - Rutina completa de entrenamiento` 
        });
        
        return { 
          success: true, 
          message: 'PDF enviado por WhatsApp correctamente',
          pdfPath: pdfPath
        };
      } catch (whatsappError) {
        console.error('Error al enviar por WhatsApp:', whatsappError);
        return { success: false, error: 'Error al enviar por WhatsApp: ' + whatsappError.message };
      }
    } catch (error) {
      console.error('Error al enviar PDF:', error);
      return { success: false, error: error.message };
    }
  });

  // Manejador para enviar rutina por WhatsApp (versión original - mantener para compatibilidad)
  ipcMain.handle('send-whatsapp', async (event, routineData) => {
    try {
      const { clientName, rutina, calentamiento, seguimiento, phoneNumber } = routineData;
      
      // Verificar que se proporcione un número de teléfono
      if (!phoneNumber || phoneNumber.trim() === '') {
        return { success: false, error: 'Por favor, proporciona un número de teléfono válido.' };
      }
      
      // Verificar que WhatsApp esté listo
      if (!isWhatsAppReady || !whatsappClient) {
        return { success: false, error: 'WhatsApp no está conectado. Por favor, escanea el código QR primero.' };
      }
      
      // Generar el PDF
      const PDFDocument = require('pdfkit');
      const fs = require('fs');
      const path = require('path');
      
      // Crear un nombre de archivo único
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const pdfFileName = `rutina-${clientName}-${timestamp}.pdf`;
      const pdfPath = path.join(routinesPath, pdfFileName);
      
      // Crear el documento PDF
      const doc = new PDFDocument({ 
        size: 'A4', 
        layout: 'landscape',
        margins: { top: 20, bottom: 20, left: 20, right: 20 }
      });
      
      // Pipe el PDF a un archivo
      const writeStream = fs.createWriteStream(pdfPath);
      doc.pipe(writeStream);
      
      // Agregar contenido al PDF
      doc.fontSize(24).font('Helvetica-Bold').text('SOMNUS FITNESS', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(18).font('Helvetica').text(`Rutina de Entrenamiento - ${clientName}`, { align: 'center' });
      doc.moveDown(1);
      
      // Información del cliente
      if (seguimiento) {
        doc.fontSize(14).font('Helvetica-Bold').text('INFORMACIÓN DEL CLIENTE');
        doc.fontSize(12).font('Helvetica');
        if (seguimiento.fecha) doc.text(`Fecha: ${seguimiento.fecha}`);
        if (seguimiento.edad) doc.text(`Edad: ${seguimiento.edad} años`);
        if (seguimiento.objetivos) doc.text(`Objetivos: ${seguimiento.objetivos}`);
        doc.moveDown(1);
      }
      
      // Calentamiento
      if (calentamiento && calentamiento.trim()) {
        doc.fontSize(14).font('Helvetica-Bold').text('CALENTAMIENTO');
        doc.fontSize(12).font('Helvetica').text(calentamiento);
        doc.moveDown(1);
      }
      
      // Rutina
      if (rutina && rutina.length > 0) {
        doc.fontSize(16).font('Helvetica-Bold').text('RUTINA DE ENTRENAMIENTO');
        doc.moveDown(1);
        
        // Calcular disposición piramidal para una sola página
        const pageWidth = doc.page.width - 30; // Margen de 15 en cada lado
        const pageHeight = doc.page.height;
        const availableHeight = pageHeight - doc.y - 30; // Espacio disponible
        const margin = 15;
        
        // Calcular tamaño de tarjetas basado en el número de días
        let cardWidth, cardHeight, rows, cols;
        
        if (rutina.length <= 3) {
          // 1-3 días: 3 columnas
          cols = 3;
          cardWidth = (pageWidth - (cols + 1) * margin) / cols;
          rows = Math.ceil(rutina.length / cols);
          cardHeight = (availableHeight - (rows - 1) * margin) / rows;
        } else if (rutina.length <= 6) {
          // 4-6 días: 3 columnas, 2 filas
          cols = 3;
          cardWidth = (pageWidth - (cols + 1) * margin) / cols;
          rows = 2;
          cardHeight = (availableHeight - margin) / rows;
        } else {
          // 7 días: 4 columnas, 2 filas
          cols = 4;
          cardWidth = (pageWidth - (cols + 1) * margin) / cols;
          rows = 2;
          cardHeight = (availableHeight - margin) / rows;
        }
        
        const startY = doc.y;
        
        rutina.forEach((day, index) => {
          let row, col;
          
          if (rutina.length <= 3) {
            // Disposición lineal para pocos días
            row = Math.floor(index / cols);
            col = index % cols;
          } else if (rutina.length <= 6) {
            // Disposición piramidal para 4-6 días
            if (index === 0) { col = 1; row = 0; } // Centrado arriba
            else if (index === 1) { col = 0; row = 1; } // Izquierda abajo
            else if (index === 2) { col = 1; row = 1; } // Centro abajo
            else if (index === 3) { col = 2; row = 1; } // Derecha abajo
            else if (index === 4) { col = 0; row = 0; } // Izquierda arriba
            else if (index === 5) { col = 2; row = 0; } // Derecha arriba
          } else {
            // Disposición para 7 días
            if (index === 0) { col = 1; row = 0; } // Centro arriba
            else if (index === 1) { col = 0; row = 0; } // Izquierda arriba
            else if (index === 2) { col = 2; row = 0; } // Derecha arriba
            else if (index === 3) { col = 3; row = 0; } // Extrema derecha arriba
            else if (index === 4) { col = 0; row = 1; } // Izquierda abajo
            else if (index === 5) { col = 1; row = 1; } // Centro abajo
            else if (index === 6) { col = 2; row = 1; } // Derecha abajo
          }
          
          const x = 15 + (col * (cardWidth + margin));
          const y = startY + (row * (cardHeight + margin));
          
          // Dibujar tarjeta del día
          drawDayCard(doc, day, x, y, cardWidth, cardHeight, index + 1);
        });
        
        // Función auxiliar para dibujar cada tarjeta de día
        function drawDayCard(doc, day, x, y, width, height, dayNumber) {
          // Guardar posición actual
          const originalX = doc.x;
          const originalY = doc.y;
          
          // Fondo de la tarjeta
          doc.rect(x, y, width, height).fillAndStroke('#f8fafc', '#e2e8f0');
          
          // Header de la tarjeta
          doc.rect(x, y, width, 25).fillAndStroke('#3b82f6', '#3b82f6');
          
          // Título del día
          doc.fillColor('white');
          doc.fontSize(12).font('Helvetica-Bold');
          doc.text(`DÍA ${dayNumber}`, x + 10, y + 5);
          
          // Grupo muscular
          if (day.muscleGroup) {
            doc.fontSize(9);
            doc.text(day.muscleGroup.toUpperCase(), x + 10, y + 15);
          }
          
          // Tabla de ejercicios
          const tableY = y + 30;
          
          // Headers de la tabla con colores suaves
          const headers = ['Ejercicio', 'Carga', 'Series', 'Reps'];
          const colWidths = [width * 0.5, width * 0.15, width * 0.15, width * 0.15];
          const headerColors = ['#374151', '#92400e', '#1e40af', '#166534'];
          
          let headerX = x + 5;
          headers.forEach((header, i) => {
            doc.fillColor(headerColors[i]);
            doc.fontSize(8).font('Helvetica-Bold');
            doc.text(header, headerX, tableY);
            headerX += colWidths[i];
          });
          
          // Línea separadora más suave
          doc.strokeColor('#d1d5db');
          doc.lineWidth(1);
          doc.moveTo(x + 5, tableY + 5).lineTo(x + width - 5, tableY + 5).stroke();
          
          // Ejercicios con colores suaves
          if (day.exercises && day.exercises.length > 0) {
            doc.fontSize(7).font('Helvetica');
            
            day.exercises.forEach((ex, exIndex) => {
              const exerciseY = tableY + 10 + (exIndex * 8);
              
              // Verificar si hay espacio
              if (exerciseY < y + height - 10) {
                let exX = x + 5;
                
                // Nombre del ejercicio
                doc.fillColor('#4b5563');
                doc.text(ex.name || '', exX, exerciseY);
                
                exX += colWidths[0];
                doc.fillColor('#92400e'); // Naranja suave para carga
                doc.text(ex.carga || '', exX, exerciseY);
                exX += colWidths[1];
                doc.fillColor('#1e40af'); // Azul suave para series
                doc.text(ex.series || '', exX, exerciseY);
                exX += colWidths[2];
                doc.fillColor('#166534'); // Verde suave para reps
                doc.text(ex.reps || '', exX, exerciseY);
              }
            });
          } else {
            doc.fontSize(7).font('Helvetica-Oblique');
            doc.fillColor('#6b7280');
            doc.text("(Sin ejercicios)", x + 10, tableY + 15);
          }
          
          // Restaurar posición original
          doc.x = originalX;
          doc.y = originalY;
        }
      }
      
      // Footer
      doc.fontSize(10).font('Helvetica').text('SOMNUS FITNESS - Transformando vidas a través del fitness', { align: 'center' });
      
      // Finalizar el PDF
      doc.end();
      
      // Esperar a que se complete la escritura
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
      
      // Crear mensaje para WhatsApp
      let message = `🏋️‍♂️ *RUTINA DE ENTRENAMIENTO - ${clientName.toUpperCase()}* 🏋️‍♀️\n\n`;
      message += `📋 *INFORMACIÓN DEL CLIENTE:*\n`;
      if (seguimiento) {
        if (seguimiento.fecha) message += `📅 Fecha: ${seguimiento.fecha}\n`;
        if (seguimiento.edad) message += `👤 Edad: ${seguimiento.edad} años\n`;
        if (seguimiento.objetivos) message += `🎯 Objetivos: ${seguimiento.objetivos}\n`;
      }
      
      // Agregar resumen de la rutina
      if (rutina && rutina.length > 0) {
        message += `\n💪 *RESUMEN DE LA RUTINA:*\n`;
        rutina.forEach((day, index) => {
          const dayTitle = `Día ${index + 1}` + (day.muscleGroup ? ` - ${day.muscleGroup}` : '');
          const exerciseCount = day.exercises ? day.exercises.length : 0;
          message += `📅 ${dayTitle}: ${exerciseCount} ejercicios\n`;
        });
      }
      
      message += `\n💪 *SOMNUS FITNESS* 💪\n`;
      message += `Transformando vidas a través del fitness\n`;
      message += `📱 Generado automáticamente desde la aplicación`;
      
      // Formatear número de teléfono
      let formattedNumber = phoneNumber.replace(/\D/g, ''); // Remover caracteres no numéricos
      if (!formattedNumber.startsWith('57')) {
        formattedNumber = '57' + formattedNumber; // Agregar código de país Colombia
      }
      formattedNumber += '@c.us'; // Formato requerido por WhatsApp Web.js
      
      try {
        // Enviar mensaje
        await whatsappClient.sendMessage(formattedNumber, message);
        
        // Enviar PDF
        const media = MessageMedia.fromFilePath(pdfPath);
        await whatsappClient.sendMessage(formattedNumber, media, { 
          caption: `📄 *${pdfFileName}* - Rutina completa de entrenamiento` 
        });
        
        return { 
          success: true, 
          message: `Rutina enviada exitosamente a ${phoneNumber}`,
          pdfPath: pdfPath
        };
      } catch (whatsappError) {
        console.error('Error al enviar por WhatsApp:', whatsappError);
        return { success: false, error: 'Error al enviar por WhatsApp: ' + whatsappError.message };
      }
    } catch (error) {
      console.error('Error al generar PDF o enviar:', error);
      return { success: false, error: error.message };
    }
  });

  // Exportar PDF desde main (opcional respaldo si jsPDF falla en renderer)
  ipcMain.handle('export-pdf', async (event, { htmlContent, pdfFileName }) => {
    try {
      const PDFDocument = require('pdfkit');
      const { JSDOM } = require('jsdom');
      if (!htmlContent) return { success: false, error: 'Sin contenido HTML' };
      const pdfPath = path.join(routinesPath, pdfFileName || `export-${Date.now()}.pdf`);
      const doc = new PDFDocument({ size: 'A4', layout: 'portrait', margins: { top: 20, bottom: 20, left: 20, right: 20 } });
      const writeStream = fs.createWriteStream(pdfPath);
      doc.pipe(writeStream);
      // Render mínimo: sólo texto plano de respaldo
      const dom = new JSDOM(htmlContent);
      const text = dom.window.document.body.textContent || '';
      doc.fontSize(12).text(text);
      doc.end();
      await new Promise((resolve, reject) => { writeStream.on('finish', resolve); writeStream.on('error', reject); });
      return { success: true, path: pdfPath };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // Manejador para enviar un archivo arbitrario por WhatsApp (Business o normal via Web.js)
  ipcMain.handle('send-whatsapp-file', async (event, { phoneNumber, filePath, caption }) => {
    try {
      if (!phoneNumber || !filePath) {
        return { success: false, error: 'Número y archivo son requeridos.' };
      }
      if (!isWhatsAppReady || !whatsappClient) {
        return { success: false, error: 'WhatsApp no está conectado. Escanea el QR primero.' };
      }
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'El archivo no existe: ' + filePath };
      }
      let formattedNumber = phoneNumber.replace(/\D/g, '');
      if (!formattedNumber.startsWith('57')) {
        formattedNumber = '57' + formattedNumber;
      }
      formattedNumber += '@c.us';
      const media = MessageMedia.fromFilePath(filePath);
      await whatsappClient.sendMessage(formattedNumber, media, { caption: caption || '' });
      return { success: true };
    } catch (error) {
      console.error('Error enviando archivo por WhatsApp:', error);
      return { success: false, error: error.message };
    }
  });

  // Manejador para enviar solo texto por WhatsApp
  ipcMain.handle('send-whatsapp-text', async (event, { phoneNumber, message }) => {
    try {
      if (!phoneNumber || !message) {
        return { success: false, error: 'Número y mensaje son requeridos.' };
      }
      if (!isWhatsAppReady || !whatsappClient) {
        return { success: false, error: 'WhatsApp no está conectado. Escanea el QR primero.' };
      }
      let formattedNumber = phoneNumber.replace(/\D/g, '');
      if (!formattedNumber.startsWith('57')) {
        formattedNumber = '57' + formattedNumber;
      }
      formattedNumber += '@c.us';
      await whatsappClient.sendMessage(formattedNumber, message);
      return { success: true };
    } catch (error) {
      console.error('Error enviando texto por WhatsApp:', error);
      return { success: false, error: error.message };
    }
  });

  // Manejador para crear nueva ventana
  ipcMain.handle('create-new-window', async (event, windowData) => {
    try {
      const result = createWindow(windowData);
      return { success: true, windowId: result.id };
    } catch (error) {
      console.error('Error creando ventana:', error);
      return { success: false, error: error.message };
    }
  });

  // Manejador para cerrar ventana específica
  ipcMain.handle('close-window', async (event, windowId) => {
    try {
      const windowInfo = windows.get(windowId);
      if (windowInfo && windowInfo.window) {
        windowInfo.window.close();
        return { success: true };
      }
      return { success: false, error: 'Ventana no encontrada' };
    } catch (error) {
      console.error('Error cerrando ventana:', error);
      return { success: false, error: error.message };
    }
  });

  // Manejador para obtener lista de ventanas
  ipcMain.handle('get-windows-list', async () => {
    const windowsList = Array.from(windows.values()).map(w => ({
      id: w.id,
      clientName: w.clientName,
      title: w.window.getTitle()
    }));
    return windowsList;
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Handler para abrir WhatsApp Web
ipcMain.handle('open-whatsapp-web', async () => {
  try {
    console.log('Abriendo WhatsApp Web...');
    await shell.openExternal('https://web.whatsapp.com');
    return { success: true };
  } catch (error) {
    console.error('Error abriendo WhatsApp Web:', error);
    return { success: false, error: error.message };
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
