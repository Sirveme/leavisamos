document.addEventListener('DOMContentLoaded', () => {
    // --- 1. SONIDOS ---
    const radioSiren = new Audio('/static/sounds/siren.mp3');
    radioSiren.loop = true;
    
    // Necesitas un sonido suave para el timbre amarillo
    // Si no tienes archivo, usa uno de internet temporalmente o sube 'ding.mp3'
    const soundDing = new Audio('https://www.soundjay.com/buttons/sounds/button-3.mp3'); 

    // --- 2. WEBSOCKET ---
    let socket;
    
    function connect() {
        socket = new WebSocket(window.APP_CONFIG.wsUrl);
        
        socket.onopen = () => logSystem("Centinela Online.", "text-green-500");
        
        socket.onmessage = function(event) {
            const data = JSON.parse(event.data);
            
            // LÓGICA DE COLORES Y SONIDOS
            if (data.type === "ALERTA_CRITICA") {
                triggerVisual(data, "bg-red-600", "⚠️ PÁNICO", radioSiren, true); // True = Loop
            } 
            else if (data.type === "PRE_ARRIVAL") {
                triggerVisual(data, "bg-yellow-600", "🚶 LLEGANDO", soundDing, false); // False = Una vez
            }
            else if (data.type === "INFO_ACCESS") {
                // Solo Log Verde (Sin alarma sonora intrusiva)
                logSystem(`✅ INGRESO: ${data.user} (${data.unit || 'WiFi'})`, "text-green-400 font-bold");
            }
            else if (data.type === "GPS_UPDATE") {
                updateLogWithGPS(data);
            }
        };
        
        socket.onclose = () => setTimeout(connect, 3000);
    }

    // --- 3. FUNCIONES VISUALES ---
    function triggerVisual(data, colorClass, titlePrefix, soundObj, isLoop) {
        const box = document.getElementById('status-box');
        
        // Limpiar colores anteriores
        box.classList.remove('bg-slate-800', 'bg-red-600', 'bg-yellow-600');
        box.classList.add(colorClass, 'animate-pulse');
        
        document.getElementById('status-text').innerText = `${titlePrefix}: ${data.user}`;
        
        // Mostrar botón de atender solo si es alerta roja
        if (colorClass.includes('red')) {
            document.getElementById('btn-silenciar').classList.remove('hidden');
        }

        // Crear Log Visual
        const html = `
            <div class="${colorClass}/30 border-l-4 border-${colorClass.replace('bg-', '')}-500 p-2 text-white mb-2">
                <strong>${titlePrefix}: ${data.user} (${data.unit || ''})</strong><br>
                ${data.msg || ''}
            </div>
        `;
        appendToLog(html);

        // Reproducir sonido
        if (soundObj) {
            soundObj.currentTime = 0;
            soundObj.loop = isLoop;
            soundObj.play().catch(e=>{});
        }
        
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }

    function updateLogWithGPS(data) {
        const html = `
            <div class="bg-blue-900/30 border-l-4 border-blue-500 p-2 text-blue-300 ml-4 mb-2 text-[10px]">
                📡 GPS RECIBIDO <a href="https://maps.google.com/?q=${data.coords.lat},${data.coords.lon}" target="_blank" class="underline text-white ml-2">VER MAPA</a>
            </div>
        `;
        appendToLog(html);
    }

    // --- 4. UTILIDADES ---
    window.silenciarAlarma = function() {
        radioSiren.pause();
        const box = document.getElementById('status-box');
        box.classList.add('bg-slate-800');
        box.classList.remove('bg-red-600', 'animate-pulse');
        document.getElementById('btn-silenciar').classList.add('hidden');
        document.getElementById('status-text').innerText = "Alerta atendida.";
    };

    // Funciones de Log y Formulario (del código anterior)
    function logSystem(text, color) {
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const html = `<div class="text-[10px] text-slate-500 border-l-2 border-slate-700 pl-2 mb-1"><span class="${color}">●</span> [${time}] ${text}</div>`;
        appendToLog(html);
    }

    function appendToLog(htmlString) {
        const log = document.getElementById('security-log');
        log.insertAdjacentHTML('afterbegin', htmlString);
    }

    // Funciones globales para el formulario HTML (onclick)
    // Función llamada al hacer click en un VECINO encontrado
    window.registrarResidente = async function(id_miembro, nombre) {
        // Llamada directa al backend para registrar ingreso
        // Usamos un endpoint especial o el mismo con flag
        const formData = new FormData();
        formData.append('tipo', 'RESIDENTE');
        formData.append('unidad', 'AUTO'); // El backend lo buscará por ID
        formData.append('detalle', nombre);
        formData.append('member_id', id_miembro); // Necesitamos enviar el ID

        try {
            const response = await fetch('/centinela/log', {
                method: 'POST',
                body: formData
            });
            const html = await response.text();
            // Insertar respuesta en el log
            document.getElementById('security-log').insertAdjacentHTML('afterbegin', html);
            // Limpiar buscador
            document.getElementById('search-results').innerHTML = "";
            document.querySelector('input[name="query"]').value = "";
        } catch (e) {
            console.error(e);
        }
    };

    window.limpiarForm = function() {
        setTimeout(() => {
            document.getElementById('input-detalle').value = "";
            document.getElementById('input-unidad').value = "";
            document.getElementById('search-results').innerHTML = "";
        }, 100);
    };

    // Iniciar
    connect();
});