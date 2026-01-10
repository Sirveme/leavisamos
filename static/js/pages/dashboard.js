document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIGURACIÓN INICIAL ---
    const config = window.APP_CONFIG;
    const sirena = new Audio('/static/sounds/sirena.mp3');
    sirena.loop = true;

    let socket;
    let isAlertActive = false;

    // --- 2. WEBSOCKET CON INDICADOR DE ESTADO ---
    function updateConnectionUI(status) {
        const el = document.getElementById('connection-status');
        if (!el) return;

        if (status === 'connected') {
            el.innerHTML = '<span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Online';
            el.classList.remove('text-red-400', 'bg-red-900/30');
            el.classList.add('text-green-400', 'bg-green-900/30');
        } else if (status === 'disconnected') {
            el.innerHTML = '<span class="w-2 h-2 rounded-full bg-red-500"></span> Offline';
            el.classList.remove('text-green-400', 'bg-green-900/30');
            el.classList.add('text-red-400', 'bg-red-900/30');
        } else {
            el.innerHTML = '<span class="w-2 h-2 rounded-full bg-yellow-500 animate-ping"></span> ...';
        }
    }

    function connectWebSocket() {
        if (socket && socket.readyState === WebSocket.OPEN) return;

        updateConnectionUI('connecting');
        socket = new WebSocket(config.wsUrl);

        socket.onopen = () => {
            console.log("🟢 WS Conectado");
            updateConnectionUI('connected');
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "ALERTA_CRITICA") {
                mostrarAlerta(data);
            }
        };

        socket.onclose = () => {
            console.log("🔴 WS Desconectado. Reintentando...");
            updateConnectionUI('disconnected');
            // Reintentar en 3 segundos
            setTimeout(connectWebSocket, 3000);
        };
        
        socket.onerror = (err) => {
            console.error("WS Error", err);
            socket.close();
        };
    }
    
    // Iniciar
    connectWebSocket();

     // --- 3. BOTÓN ROJO (Pánico) ---
    const btnPanico = document.getElementById('btn-panico');
    if (btnPanico) {
        // Usamos mousedown/touchstart para reacción rápida
        btnPanico.addEventListener('click', () => {
            
            // Lógica de "Doble Confirmación" visual en lugar de alert() nativo
            // Para este MVP, dispararemos directo pero con sonido inmediato
            
            // 1. Iniciar Sonido Local Inmediatamente (Feedback al usuario)
            sirena.currentTime = 0;
            sirena.play().catch(e => console.log("Audio:", e));

            // 2. Enviar WebSocket
            socket.send(JSON.stringify({
                type: "PANIC_BUTTON",
                user: `${config.user.name} (${config.user.unit})`,
                location: "Ubicación pendiente...",
                coords: null,
                user_id: config.user.id
            }));

            // 3. Vibrar
            if (navigator.vibrate) navigator.vibrate([500, 200, 500]);

            // 4. GPS en segundo plano (No bloquea el envío)
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        if (socket.readyState === WebSocket.OPEN) {
                            socket.send(JSON.stringify({
                                type: "GPS_UPDATE",
                                coords: {
                                    lat: position.coords.latitude,
                                    lon: position.coords.longitude
                                }
                            }));
                        }
                    },
                    (err) => console.log("GPS Error", err),
                    { enableHighAccuracy: true, timeout: 10000 }
                );
            }
        });
    }

    // --- 4. BOTÓN AMARILLO (Llegando) ---
    const btnLlegando = document.getElementById('btn-llegando');
    if (btnLlegando) {
        btnLlegando.addEventListener('click', () => {
            sirena.play().then(() => sirena.pause()).catch(e => {});

            if (confirm("¿Avisar a portería y familia que estás cerca?")) {
                socket.send(JSON.stringify({
                    type: "PRE_ARRIVAL",
                    user: config.user.name,
                    unit: config.user.unit,
                    user_id: config.user.id
                }));
                alert("Aviso enviado. El guardia está atento.");
            }
        });
    }

    // --- 5. BOTÓN VERDE (Check-in WiFi) ---
    const btnCheckin = document.getElementById('btn-checkin');
    if (btnCheckin) {
        btnCheckin.addEventListener('click', async () => {
            if (confirm("¿Confirmar ingreso seguro?")) {
                try {
                    const response = await fetch('/api/proximity/check-in', { method: 'POST' });
                    const result = await response.json();
                    if (result.status === 'ok') {
                        alert("✅ Ingreso registrado. Bienvenido a casa.");
                    }
                } catch (error) {
                    console.error("Error en check-in", error);
                    alert("Error de conexión");
                }
            }
        });
    }

    // --- 6. FUNCIONES VISUALES ---
    // --- FUNCIONES VISUALES ---
    function mostrarAlerta(data) {
        if (isAlertActive) return;
        isAlertActive = true;

        const overlay = document.getElementById('alerta-overlay');
        const msg = document.getElementById('alerta-msg');

        if (overlay && msg) {
            msg.innerHTML = `
                <strong style="display:block; margin-bottom:5px;">${data.user}</strong>
                <span>${data.msg}</span>
            `;
            
            // FUERZA BRUTA PARA MOSTRAR
            overlay.style.display = 'flex'; 
        }
        
        if (navigator.vibrate) navigator.vibrate([1000, 500, 1000, 500, 1000]);
        sirena.currentTime = 0;
        sirena.play().catch(e => console.log("Audio:", e));
    }

    // Función GLOBAL para cerrar
    window.cerrarAlerta = function() {
        sirena.pause();
        sirena.currentTime = 0;
        isAlertActive = false;
        
        const overlay = document.getElementById('alerta-overlay');
        if (overlay) overlay.style.display = 'none';
    };

    // --- 7. PUSH NOTIFICATIONS ---
    // (Lógica de activación automática o manual)
    window.activarNotificaciones = async function() {
        if (!('serviceWorker' in navigator)) return;

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey)
            });
        }

        const fingerprint = {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            platform: navigator.platform || 'Desconocido',
            is_pwa: window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
        };

        await fetch('/api/push/subscribe', {
            method: 'POST',
            body: JSON.stringify({
                subscription: subscription,
                details: fingerprint
            }),
            headers: { 'Content-Type': 'application/json' }
        });
        alert("Notificaciones activadas.");
    };

    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
});