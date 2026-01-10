document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIGURACIÓN DE SONIDOS ---
    const radioSiren = new Audio('/static/sounds/sirena.mp3');
    const soundDing = new Audio('/static/sounds/ding-dong.mp3'); 
    
    // Configuración inicial de audio
    radioSiren.loop = true;   // La sirena no para hasta que el guardia atienda
    soundDing.loop = false;   // El timbre suena una sola vez

    // --- 2. VARIABLES GLOBALES ---
    let socket = null;
    let selectedUsers = new Set(); // Almacena IDs únicos
    
    // URL dinámica segura
    const wsUrl = window.APP_CONFIG ? window.APP_CONFIG.wsUrl : 
                  (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host + '/ws/alerta';

    // --- 3. GESTIÓN DE CONEXIÓN (El Semáforo) ---
    function updateConnectionStatus(isOnline) {
        const statusText = document.getElementById('status-text');
        const box = document.getElementById('status-box');
        
        if (isOnline) {
            statusText.innerHTML = '<span class="text-green-400">●</span> Sistema Online';
            box.classList.remove('border-red-500', 'opacity-50');
        } else {
            statusText.innerHTML = '<span class="text-red-500 animate-pulse">●</span> DESCONECTADO - Reintentando...';
            box.classList.add('border-red-500', 'opacity-50');
        }
    }

    function connect() {
        if (socket && socket.readyState === WebSocket.OPEN) return;

        console.log("🔄 Conectando a:", wsUrl);
        socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
            console.log("🟢 WS Conectado");
            updateConnectionStatus(true);
            logSystem("Conexión Centinela Establecida.", "text-green-500");
        };
        
        socket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            handleMessage(data);
        };
        
        socket.onclose = () => {
            console.log("🔴 WS Cerrado");
            updateConnectionStatus(false);
            // Reintentar en 3 segundos
            setTimeout(connect, 3000);
        };

        socket.onerror = (err) => {
            console.error("WS Error:", err);
            socket.close();
        };
    }

    // --- 4. MANEJO DE MENSAJES (El Cerebro) ---
    function handleMessage(data) {
        if (data.type === "ALERTA_CRITICA") {
            // ROJO: Pánico
            triggerVisual(data, "bg-red-600", "⚠️ PÁNICO", radioSiren, true);
        } 
        else if (data.type === "PRE_ARRIVAL") {
            // AMARILLO: Llegada
            triggerVisual(data, "bg-yellow-600", "🚶 LLEGANDO", soundDing, false);
        }
        else if (data.type === "INFO_ACCESS") {
            // VERDE: Transición inteligente (Actualiza la tarjeta amarilla si existe)
            actualizarLlegada(data);
        }
        else if (data.type === "GPS_UPDATE") {
            updateLogWithGPS(data);
        }
    }

    // --- 5. FUNCIONES VISUALES Y DE LOG ---

    // A. Lógica visual principal (Colores y Sonidos)
    function triggerVisual(data, colorClass, titlePrefix, soundObj, isLoop) {
        const box = document.getElementById('status-box');
        const statusText = document.getElementById('status-text');
        
        // A. CAMBIO DE COLOR FORZADO (Inline Style para evitar fallos de Tailwind)
        if (colorClass.includes('red')) {
            box.style.backgroundColor = '#dc2626'; // Rojo Intenso
            box.style.borderColor = '#fee2e2';
            statusText.style.color = '#ffffff';
            // Mostrar botón atender solo si es rojo
            document.getElementById('btn-silenciar').classList.remove('hidden');
        } 
        else if (colorClass.includes('yellow')) {
            box.style.backgroundColor = '#ca8a04'; // Amarillo Oscuro
            box.style.borderColor = '#fef08a';
            statusText.style.color = '#ffffff';
        }
        else {
            // Reset (Volver al gris original)
            box.style.backgroundColor = ''; 
            box.style.borderColor = '';
            statusText.style.color = '';
        }
        
        // Animación y Texto
        box.classList.add('animate-pulse');
        statusText.innerText = `${titlePrefix}: ${data.user}`;

        // B. CREAR TARJETA DE LOG
        // ID único para tracking de llegada (log-user-123)
        const divId = data.user_id ? `id="log-user-${data.user_id}"` : '';
        
        // Mapear color para el borde del log
        let logBg = 'rgba(255,255,255,0.1)';
        let logBorder = '#64748b'; // Gris
        if (colorClass.includes('red')) { logBg = 'rgba(220, 38, 38, 0.3)'; logBorder = '#ef4444'; }
        if (colorClass.includes('yellow')) { logBg = 'rgba(202, 138, 4, 0.3)'; logBorder = '#eab308'; }

        const html = `
            <div ${divId} style="background: ${logBg}; border-left: 4px solid ${logBorder};" class="p-2 text-white mb-2 fade-me-in cursor-pointer" title="Clic para detalles">
                <strong>${titlePrefix}: ${data.user} (${data.unit || ''})</strong><br>
                <span class="text-xs opacity-90">${data.msg || ''}</span>
            </div>
        `;
        appendToLog(html);

        // C. SONIDO
        if (soundObj) {
            soundObj.currentTime = 0;
            soundObj.loop = isLoop;
            soundObj.play().catch(e => console.log("Audio bloqueado:", e));
        }
        
        if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
    }

    // B. Transición de Amarillo a Verde
    function actualizarLlegada(data) {
        // Reset cabecera si estaba mostrando llegada
        const headerText = document.getElementById('status-text').innerText;
        if (headerText.includes("LLEGANDO") || headerText.includes(data.user)) {
            window.silenciarAlarma(); // Reset visual de cabecera
        }

        const existingLog = document.getElementById(`log-user-${data.user_id}`);
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        if (existingLog) {
            // Actualizar tarjeta existente (Efecto visual)
            // Forzamos estilos verdes inline
            existingLog.style.background = 'rgba(22, 163, 74, 0.3)'; // Verde
            existingLog.style.borderLeftColor = '#22c55e';
            
            existingLog.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <strong class="text-green-400">✔ YA LLEGÓ: ${data.user}</strong>
                        <div class="text-xs text-slate-300 mt-1">Confirmado por: <strong>${data.method || 'Sistema'}</strong></div>
                    </div>
                    <span class="text-xs text-green-500 font-mono">${time}</span>
                </div>
            `;
            // Sonido suave
            const soundOk = new Audio('/static/audio/ding-dong.mp3');
            soundOk.play().catch(e=>{});
        } else {
            // Si no había tarjeta previa, log normal verde
            logSystem(`✅ INGRESO: ${data.user} (${data.unit || ''})`, "text-green-400 font-bold");
        }
    }

    // C. Resetear Alarma / Cabecera (Global)
    window.silenciarAlarma = function() {
        radioSiren.pause();
        radioSiren.currentTime = 0;
        
        // Reset Visual Cabecera
        const box = document.getElementById('status-box');
        box.style.backgroundColor = ''; // Quitar color inline
        box.style.borderColor = '';
        box.classList.remove('animate-pulse'); // Quitar animación
        
        document.getElementById('status-text').innerText = "Sistema Online";
        document.getElementById('status-text').style.color = '';
        
        document.getElementById('btn-silenciar').classList.add('hidden');
        logSystem("Alerta atendida/reseteada.", "text-blue-400");
    };

    // --- 6. BOTÓN PÁNICO DEL GUARDIA ---
    const btnPanicoGuardia = document.getElementById('btn-panico-centinela');
    
    if (btnPanicoGuardia) {
        btnPanicoGuardia.addEventListener('click', () => {
            // Verificar conexión antes de confirmar
            if (!socket || socket.readyState !== WebSocket.OPEN) {
                alert("⚠️ SIN CONEXIÓN: Intentando reconectar...");
                connect(); 
                return;
            }

            if(!confirm("¿ACTIVAR ALERTA GENERAL?")) return;

            // Enviar señal
            socket.send(JSON.stringify({
                type: "PANIC_BUTTON",
                user: "SEGURIDAD",
                location: "Activado por Guardia",
                coords: null,
                user_id: 0
            }));
            
            // Feedback Visual Inmediato (Local)
            triggerVisual(
                {user: 'SEGURIDAD', msg: 'Activación Manual'}, 
                'bg-red-600', '⚠️ PÁNICO', radioSiren, true
            );
        });
    }

    // --- 7. FUNCIONES DEL BUSCADOR (Cards de Vecinos) ---

    // Toggle Selección (Click en tarjeta)
    window.toggleSelection = function(id, name, unit) {
        const card = document.getElementById(`card-${id}`);
        const check = document.getElementById(`check-${id}`);
        const actionBar = document.getElementById('action-bar');
        
        if (selectedUsers.has(id)) {
            selectedUsers.delete(id);
            card.classList.remove('ring-2', 'ring-green-500', 'bg-slate-800');
            card.classList.add('bg-slate-900');
            check.classList.add('hidden');
        } else {
            selectedUsers.add(id);
            card.classList.add('ring-2', 'ring-green-500', 'bg-slate-800');
            card.classList.remove('bg-slate-900');
            check.classList.remove('hidden');
        }

        const counter = document.getElementById('count-selected');
        if (counter) counter.innerText = selectedUsers.size;
        
        if (selectedUsers.size > 0) actionBar.classList.remove('hidden');
        else actionBar.classList.add('hidden');
    };

    // Registrar Seleccionados
    window.registrarSeleccionados = async function() {
        if (selectedUsers.size === 0) return;

        const btn = document.querySelector('#action-bar button');
        btn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Procesando...';
        btn.disabled = true;

        const ids = Array.from(selectedUsers);
        for (const id of ids) {
            await enviarRegistroBackend(id);
        }

        selectedUsers.clear();
        
        // Mensaje Éxito
        document.getElementById('search-results').innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-green-500 fade-in-up mt-10">
                <i class="ph ph-check-circle text-8xl mb-4 drop-shadow-lg scale-in"></i>
                <p class="text-2xl font-bold">Ingreso Registrado</p>
            </div>
        `;
        
        document.querySelector('input[name="query"]').value = "";
        document.getElementById('action-bar').classList.add('hidden');
        
        setTimeout(() => {
            document.getElementById('search-results').innerHTML = "";
            document.querySelector('input[name="query"]').focus();
        }, 1500);
    };

    async function enviarRegistroBackend(id) {
        const formData = new FormData();
        formData.append('tipo', 'RESIDENTE');
        formData.append('detalle', 'Validado por Centinela');
        formData.append('member_id', id);

        try {
            const response = await fetch('/centinela/log', { method: 'POST', body: formData });
            if (response.ok) {
                const html = await response.text();
                // Loguear arriba
                const log = document.getElementById('security-log');
                log.insertAdjacentHTML('afterbegin', html);
            }
        } catch (e) { console.error(e); }
    }

    // --- 8. HELPERS ---
    function updateLogWithGPS(data) {
        const html = `
            <div class="bg-blue-900/30 border-l-4 border-blue-500 p-2 text-blue-300 ml-4 mb-2 text-[10px] fade-me-in">
                📡 GPS RECIBIDO <a href="https://maps.google.com/?q=${data.coords.lat},${data.coords.lon}" target="_blank" class="underline text-white ml-2 font-bold cursor-pointer">VER MAPA</a>
            </div>
        `;
        appendToLog(html);
    }

    function logSystem(text, colorClass) {
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        // Mapeo simple de color para log del sistema (estilos inline)
        let colorStyle = 'color: #94a3b8;'; 
        if (colorClass.includes('green')) colorStyle = 'color: #4ade80;';
        if (colorClass.includes('red')) colorStyle = 'color: #ef4444;';
        if (colorClass.includes('orange')) colorStyle = 'color: #fb923c;';
        
        const html = `<div style="border-left: 2px solid #334155; padding-left: 8px; margin-bottom: 4px; font-size: 10px; color: #64748b;">
            <span style="${colorStyle}">●</span> [${time}] ${text}
        </div>`;
        appendToLog(html);
    }

    function appendToLog(htmlString) {
        const log = document.getElementById('security-log');
        log.insertAdjacentHTML('afterbegin', htmlString);
    }

    // Función global para el buscador (limpiar)
    window.limpiarForm = function() {
        setTimeout(() => {
            document.getElementById('input-detalle').value = "";
            document.getElementById('input-unidad').value = "";
            document.getElementById('search-results').innerHTML = "";
        }, 100);
    };

    // --- INICIAR ---
    connect();
});