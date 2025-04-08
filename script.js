// Versión optimizada para móviles Android en GitHub Pages

// 1. Primero verificamos compatibilidad con touch events
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Función mejorada para verificar librerías PDF
function checkPDFLibraries() {
    return {
        jsPDF: typeof jspdf !== 'undefined',
        autoTable: typeof jspdfAutoTable !== 'undefined'
    };
}

// 2. Evento DOMContentLoaded con detección de móvil
document.addEventListener('DOMContentLoaded', function() {
    console.log("Librerías disponibles:", checkPDFLibraries());
    
    // Detectar si es móvil
    if(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        document.body.classList.add('mobile-device');
        console.log("Dispositivo móvil detectado");
    }
});

// 3. Función segura para localStorage con polyfill básico
function getSafeStorage() {
    try {
        if (typeof localStorage === 'undefined' || !window.localStorage) {
            console.warn("LocalStorage no disponible, usando polyfill básico");
            return {
                getItem: (key) => {
                    try {
                        return sessionStorage.getItem(key);
                    } catch(e) {
                        return null;
                    }
                },
                setItem: (key, value) => {
                    try {
                        sessionStorage.setItem(key, value);
                    } catch(e) {
                        console.warn("No se pudo almacenar datos");
                    }
                },
                removeItem: (key) => {
                    try {
                        sessionStorage.removeItem(key);
                    } catch(e) {
                        console.warn("No se pudo eliminar dato");
                    }
                }
            };
        }
        return localStorage;
    } catch (e) {
        console.error("Error al acceder a localStorage:", e);
        return {
            getItem: () => null,
            setItem: () => console.warn("LocalStorage no disponible"),
            removeItem: () => {}
        };
    }
}

// 4. Datos de empleados con comprobación inicial
const employees = [
    {
        id: "EMP001",
        name: "Juan Pérez",
        position: "Limpieza General",
        schedule: "Lunes a Viernes",
        shift: "1er Turno (6:00 - 14:00)",
        startDate: "15/03/2020",
        department: "Área Norte",
        baseSalary: 1200,
        attendance: {
            currentMonth: 18,
            totalDays: 22,
            absences: 2
        },
        efficiency: true,
        records: [
            {
                date: new Date().toISOString().split('T')[0],
                checkIn: "06:00",
                checkOut: "14:00",
                hours: 8,
                type: "Normal",
                workType: "Limpieza General",
                floor: "Piso 3",
                materials: ["Trapeador", "Detergente"]
            }
        ],
        payments: [
            {
                period: "01/05/2023 - 31/05/2023",
                baseSalary: 1200000,
                overtime: 50000,
                bonus: 600000,
                deductions: {
                    absences: 120000,
                    sso: 72000,
                    banavih: 24000,
                    islr: 0
                },
                total: 1754000
            }
        ]
    }
];

// 5. Variables globales con inicialización segura
let currentEmployee = null;
let isCheckingIn = false;
let currentRecord = null;
let attendanceChart = null;
let qrScannerActive = false;
let qrStream = null;

// 6. Inicialización mejorada para móviles
document.addEventListener('DOMContentLoaded', function() {
    const storage = getSafeStorage();
    
    try {
        // Verificar HTTPS en móviles
        if(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && 
           window.location.protocol !== 'https:') {
            showMessage(
                "Advertencia de Seguridad", 
                "Para mejor funcionamiento en móvil, accede via HTTPS. " +
                "GitHub Pages ya provee HTTPS automáticamente."
            );
        }

        // Inicializar datos solo si no existen
        if (!storage.getItem('employees')) {
            storage.setItem('employees', JSON.stringify(employees));
        }
        
        updateClock();
        setInterval(updateClock, 1000);
        setupEventListeners();
        
    } catch (error) {
        console.error("Error inicial:", error);
        showMessage("Error", "No se pudieron cargar los datos iniciales");
    }
});

// 7. Configuración de event listeners para touch y click
function setupEventListeners() {
    // Función auxiliar para agregar ambos eventos
    const addDualEvents = (element, event, handler) => {
        element.addEventListener(event, handler);
        if(isTouchDevice) {
            element.addEventListener('touchstart', handler, {passive: true});
        }
    };

    // QR Scanner
    const startScannerBtn = document.getElementById('start-scanner');
    const stopScannerBtn = document.getElementById('stop-scanner');
    
    if(startScannerBtn && stopScannerBtn) {
        addDualEvents(startScannerBtn, 'click', startQRScanner);
        addDualEvents(stopScannerBtn, 'click', stopQRScanner);
    }
    
    // Navegación
    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) {
        addDualEvents(logoutBtn, 'click', logout);
    }
    
    // Tabs - Mejorado para touch
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        addDualEvents(button, 'click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Registro de tiempo
    const checkInBtn = document.getElementById('check-in-btn');
    const checkOutBtn = document.getElementById('check-out-btn');
    const saveDetailsBtn = document.getElementById('save-work-details');
    
    if(checkInBtn) addDualEvents(checkInBtn, 'click', startCheckIn);
    if(checkOutBtn) addDualEvents(checkOutBtn, 'click', checkOut);
    if(saveDetailsBtn) addDualEvents(saveDetailsBtn, 'click', saveWorkDetails);
    
    // Pagos
    const periodSelect = document.getElementById('payment-period');
    const generatePdfBtn = document.getElementById('generate-pdf');
    
    if(periodSelect) periodSelect.addEventListener('change', updatePaymentInfo);
    if(generatePdfBtn) addDualEvents(generatePdfBtn, 'click', generatePaymentPDF);
    
    // Modal
    const closeModalBtn = document.querySelector('.close-modal');
    const confirmModalBtn = document.getElementById('modal-confirm');
    
    if(closeModalBtn) addDualEvents(closeModalBtn, 'click', closeModal);
    if(confirmModalBtn) addDualEvents(confirmModalBtn, 'click', closeModal);
    
    // QR Generation
    const generateQrBtn = document.getElementById('generate-qr-btn');
    const downloadQrBtn = document.getElementById('download-qr-btn');
    
    if(generateQrBtn) addDualEvents(generateQrBtn, 'click', generateEmployeeQR);
    if(downloadQrBtn) addDualEvents(downloadQrBtn, 'click', downloadQR);
}

// 8. QR Scanner optimizado para móviles
async function startQRScanner() {
    const video = document.getElementById('qr-video');
    if(!video) return;

    // Verificar compatibilidad con cámara
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showMessage(
            "Función no compatible", 
            "Tu navegador no soporta acceso a cámara. Prueba con:" +
            "\n- Chrome o Firefox en Android" +
            "\n- Asegúrate de dar permisos de cámara" +
            "\n- La URL debe comenzar con https://"
        );
        return;
    }

    try {
        // Configuración óptima para móviles
        const constraints = {
            video: {
                facingMode: 'environment', // Usar cámara trasera
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        // Detener cualquier stream previo
        if (qrStream) {
            qrStream.getTracks().forEach(track => track.stop());
        }

        // Solicitar acceso a la cámara
        qrStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = qrStream;
        
        // Configuración especial para iOS
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');

        // Esperar a que el video esté listo
        await new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play()
                    .then(resolve)
                    .catch(e => {
                        console.error("Error al reproducir video:", e);
                        resolve(); // Continuar aunque falle el play
                    });
            };
        });

        // Actualizar UI
        document.getElementById('start-scanner').style.display = 'none';
        document.getElementById('stop-scanner').style.display = 'inline-block';
        qrScannerActive = true;

        // Iniciar detección de QR
        detectQRCode(video);
        
    } catch (error) {
        console.error("Error al acceder a la cámara:", error);
        handleCameraError(error);
    }
}

// 9. Función mejorada de logout para móviles
function logout() {
    try {
        // Detener cámara si está activa
        if(qrScannerActive) {
            stopQRScanner();
        }
        
        // Limpiar datos de sesión
        currentEmployee = null;
        
        // Transición suave entre pantallas
        const qrScreen = document.getElementById('qr-screen');
        const empScreen = document.getElementById('employee-screen');
        
        if(qrScreen && empScreen) {
            empScreen.classList.remove('active');
            setTimeout(() => {
                qrScreen.classList.add('active');
            }, 300); // Pequeño retraso para animación
        }
        
    } catch(error) {
        console.error("Error en logout:", error);
        // Forzar recarga como fallback
        window.location.reload();
    }
}

// 10. Generación de PDF con comprobación mejorada
function generatePaymentPDF() {
    // Verificar si estamos en móvil
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if(isMobile) {
        // Mostrar advertencia en móviles
        showMessage(
            "Descarga de PDF", 
            "En dispositivos móviles, el PDF se descargará automáticamente. " +
            "Verifica tu carpeta de descargas."
        );
    }

    try {
        // Verificación de librerías con fallback
        if (!window.jspdf || !window.jspdf.jsPDF) {
            throw new Error("No se pudo cargar la librería PDF. Recarga la página.");
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Resto del código de generación de PDF permanece igual...
        // ... (usar el mismo código que ya tienes para generar el PDF)
        
        // Guardar el PDF con nombre único
        const fileName = `recibo-${currentEmployee.id}-${new Date().toISOString().slice(0,10)}.pdf`;
        doc.save(fileName);
        
    } catch (error) {
        console.error("Error al generar PDF:", error);
        
        // Opción alternativa para móviles
        if(isMobile) {
            showMessage(
                "Alternativa", 
                "Puedes tomar captura de pantalla de la información de pago " +
                "pulsando los botones de volumen y power al mismo tiempo."
            );
        } else {
            showMessage("Error", `No se pudo generar el recibo: ${error.message}`);
        }
    }
}

// 11. Función mejorada para mostrar mensajes en móviles
function showMessage(title, message) {
    const modal = document.getElementById('message-modal');
    if(!modal) return;
    
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    
    // Mostrar modal con animación
    modal.classList.add('active');
    
    // Cierre automático en móviles después de 5 segundos
    if(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        setTimeout(() => {
            modal.classList.remove('active');
        }, 5000);
    }
}

// 12. Código restante permanece igual (pero optimizado para touch)
// ... (las funciones que no se mencionan aquí pueden mantenerse como están)