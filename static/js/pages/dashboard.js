document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIGURACIÓN INICIAL ---
    const config = window.APP_CONFIG;
    const sirena = new Audio('/static/sounds/sirena.mp3');
    sirena.loop = true;

    let socket;
    let isAlertActive = false;

    // --- 2. WEBSOCKET ---
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
            else if (data.type === "BULLETIN") {
                // Si llega una noticia en vivo, activamos la cinta
                if (window.activarTicker) {
                    window.activarTicker(data.title, data.priority);
                }
            }
        };

        socket.onclose = () => {
            console.log("🔴 WS Desconectado. Reintentando...");
            updateConnectionUI('disconnected');
            setTimeout(connectWebSocket, 3000);
        };
        
        socket.onerror = (err) => {
            console.error("WS Error", err);
            socket.close();
        };
    }
    
    // Iniciar conexión
    connectWebSocket();

    // --- 3. LÓGICA DEL TICKER (Cinta de Noticias) ---
    // Definimos la función localmente para usarla
    function activarTickerLocal(texto, prioridad) {
        const ticker = document.getElementById('news-ticker');
        const content = document.getElementById('ticker-text');
        
        if (!ticker || !content) return;

        // Configurar texto
        content.innerText = `📢 ÚLTIMO MINUTO: ${texto} ••• Toque para ver detalles •••`;
        
        // Configurar color (reseteando clases previas)
        ticker.className = 'ticker-wrap'; 
        if (prioridad === 'alert') ticker.classList.add('ticker-alert');
        if (prioridad === 'warning') ticker.classList.add('ticker-warning');
        
        // Mostrar
        ticker.style.display = 'block';
    }

    // HACER GLOBAL (Para que el WebSocket o scripts externos la llamen)
    window.activarTicker = function(texto, prioridad) {
        activarTickerLocal(texto, prioridad);
        // Sonido suave de "Noticia" solo si es en vivo
        const soundNews = new Audio('/static/sounds/ding-dong.mp3'); 
        soundNews.play().catch(e=>{});
    };

    // INICIALIZACIÓN AUTOMÁTICA DEL TICKER (Al cargar)
    // Lee los data-attributes del HTML para mostrar el último boletín guardado
    const tickerEl = document.getElementById('news-ticker');
    if (tickerEl) {
        const initialTitle = tickerEl.dataset.initialTitle;
        const initialPriority = tickerEl.dataset.initialPriority;

        if (initialTitle && initialTitle !== 'None' && initialTitle !== '') {
            activarTickerLocal(initialTitle, initialPriority);
        }
    }

    // Acción al hacer clic en la cinta
    window.verUltimoBoletin = function() {
        alert("Mostrando detalle del comunicado...");
        // Aquí podrías redirigir o abrir un modal
    };


    // --- 4. BOTONES FLOTANTES (Pánico / Llegada / Check-in) ---

    // A. Botón Rojo (Pánico) - Siempre activo
    const btnPanico = document.getElementById('btn-panico');
    if (btnPanico) {
        btnPanico.addEventListener('click', () => {
            sirena.currentTime = 0;
            sirena.play().catch(e => {});

            // Confirmación visual rápida (Vibración)
            if (navigator.vibrate) navigator.vibrate([500, 200, 500]);

            // Enviar WebSocket
            socket.send(JSON.stringify({
                type: "PANIC_BUTTON",
                user: `${config.user.name} (${config.user.unit})`,
                location: "Ubicación pendiente...",
                coords: null,
                user_id: config.user.id
            }));

            // GPS en segundo plano... (tu código existente de GPS)
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(pos => {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({
                            type: "GPS_UPDATE",
                            coords: { lat: pos.coords.latitude, lon: pos.coords.longitude }
                        }));
                    }
                });
            }
        });
    }

    // B. Botón Amarillo (Llegando)
    const btnLlegando = document.getElementById('btn-llegando');
    if (btnLlegando) {
        btnLlegando.addEventListener('click', () => {
            // Sonido suave
            const soundDing = new Audio('/static/sounds/ding-dong.mp3');
            soundDing.play().catch(e => {});

            if (confirm("¿Avisar a portería que estás llegando?")) {
                socket.send(JSON.stringify({
                    type: "PRE_ARRIVAL",
                    user: config.user.name,
                    unit: config.user.unit,
                    user_id: config.user.id
                }));
                
                // LÓGICA DE INTERFAZ: Mostrar botón verde
                const btnGreen = document.getElementById('btn-checkin-container');
                btnGreen.classList.remove('hidden');
                
                // Opcional: Ocultarlo automáticamente después de 10 minutos si no lo usa
                setTimeout(() => {
                    btnGreen.classList.add('hidden');
                }, 600000); 
            }
        });
    }

    // C. Botón Verde (Check-in WiFi)
    const btnCheckin = document.getElementById('btn-checkin');
    if (btnCheckin) {
        btnCheckin.addEventListener('click', async () => {
            // Feedback inmediato: Ocultar botón para que no le den doble clic
            document.getElementById('btn-checkin-container').classList.add('hidden');

            try {
                const response = await fetch('/api/proximity/check-in', { method: 'POST' });
                const result = await response.json();
                
                if (result.status === 'ok') {
                    // Sonido éxito
                    const soundOk = new Audio('/static/sounds/ding-dong.mp3');
                    soundOk.play().catch(e => {});
                    alert("✅ Ingreso registrado. Bienvenido a casa.");
                }
            } catch (error) {
                console.error("Error en check-in", error);
                alert("Error de conexión, pero el aviso fue intentado.");
                // Si falla, volver a mostrar el botón
                document.getElementById('btn-checkin-container').classList.remove('hidden');
            }
        });
    }
    
    // Función placeholder para el micro (futuro)
    window.activarNeural = function() {
        alert("Asistente de voz en construcción 🚧");
    };

    // --- 5. PANTALLA ROJA (Alerta Visual) ---
    function mostrarAlerta(data) {
        if (isAlertActive) return;
        isAlertActive = true;

        const overlay = document.getElementById('alerta-overlay');
        const msg = document.getElementById('alerta-msg');

        if (overlay && msg) {
            msg.innerHTML = `
                <strong style="display:block; margin-bottom:5px; font-size:1.5rem;">${data.user}</strong>
                <span>${data.msg}</span>
            `;
            
            // FORZAR VISIBILIDAD (La clave del éxito)
            overlay.style.display = 'flex'; 
        }
        
        if (navigator.vibrate) navigator.vibrate([1000, 500, 1000, 500, 1000]);
        sirena.currentTime = 0;
        sirena.play().catch(e => console.log("Audio:", e));
    }

    // HACER GLOBAL para que el botón HTML la encuentre
    window.cerrarAlerta = function() {
        console.log("Cerrando alerta desde el Dashboard...");
        sirena.pause();
        sirena.currentTime = 0;
        isAlertActive = false;
        
        const overlay = document.getElementById('alerta-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    };

    // --- 6. PUSH NOTIFICATIONS (Suscripción) ---
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

    // *******************************************************************************
    // --- BOLETÍN DE ÚLTIMO MINUTO (Modal) --- El que apace al hacer clic en la cinta
    // *******************************************************************************

    // Acción al hacer clic en la cinta
    window.verUltimoBoletin = async function() {
        // Mostrar carga
        const modal = document.getElementById('modal-bulletin');
        
        try {
            // Pedir datos frescos al servidor
            const response = await fetch('/api/bulletins/latest');
            const data = await response.json();
            
            if (data.status === 'ok') {
                // Llenar Modal
                document.getElementById('bulletin-title').innerText = data.title;
                document.getElementById('bulletin-content').innerText = data.content;
                
                // Formatear Fecha
                const dateObj = new Date(data.date);
                document.getElementById('bulletin-date').innerText = dateObj.toLocaleString();
                
                // Color de Cabecera según prioridad
                const header = document.getElementById('bulletin-header');
                const badge = document.getElementById('bulletin-priority');
                
                header.className = "p-6 transition-colors duration-300"; // Reset
                if (data.priority === 'alert') {
                    header.classList.add('bg-red-600');
                    badge.innerText = "URGENTE";
                } else if (data.priority === 'warning') {
                    header.classList.add('bg-yellow-600');
                    badge.innerText = "AVISO";
                } else {
                    header.classList.add('bg-indigo-600');
                    badge.innerText = "INFO";
                }

                modal.showModal();
            }
        } catch (e) {
            console.error("Error cargando boletín:", e);
        }
    };

    window.marcarLeido = function() {
        // Aquí podrías llamar al backend para registrar "Visto" en bulletin_events
        document.getElementById('modal-bulletin').close();
    };


    // *******************************************************************************
    // COMPAIRTE BOLETÍN
    // *******************************************************************************
    // --- FUNCIÓN COMPARTIR BOLETÍN INTELIGENTE ---
    // --- COMPARTIR BOLETÍN (Nativo Igual que Mascotas) ---
    window.compartirBoletin = function() {
        const title = document.getElementById('bulletin-title').innerText;
        const content = document.getElementById('bulletin-content').innerText;
        const date = document.getElementById('bulletin-date').innerText;
        
        const textToShare = `📢 *${title}*\n📅 ${date}\n\n${content}\n\n_Vía LeAvisamos.pro_`;

        // Usar API Nativa (Celulares Android/iOS)
        if (navigator.share) {
            navigator.share({
                title: title,
                text: textToShare,
                url: window.location.href
            }).catch(console.error); // Ignora si cancela
        } else {
            // Fallback para PC antigua
            navigator.clipboard.writeText(textToShare).then(() => {
                alert("📋 Texto copiado al portapapeles (Tu PC no tiene menú de compartir nativo).");
            }).catch(err => {
                prompt("Copia este texto:", textToShare);
            });
        }
    };

    // Función auxiliar visual para copiar
    function copiarAlPortapapeles(texto) {
        navigator.clipboard.writeText(texto).then(() => {
            const btn = document.querySelector('button[onclick="compartirBoletin()"]');
            const originalHTML = btn.innerHTML;
            const originalClasses = btn.className; // Guardar clases originales
            
            // Cambio Visual: Éxito Verde
            btn.innerHTML = '<i class="ph ph-check text-xl"></i> <span>¡COPIADO!</span>';
            btn.classList.remove('border-slate-500', 'text-slate-300');
            btn.classList.add('border-green-500', 'text-green-400', 'bg-green-900/20');
            
            // Alerta flotante no intrusiva (Toast) o Alert simple
            // Usamos un alert simple como pediste para ser claros
            alert("✅ Texto copiado.\n\nAhora abre WhatsApp Web o tu correo y pégalo (Ctrl + V).");

            // Restaurar botón después de 3 segundos
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.className = originalClasses;
            }, 3000);
            
        }).catch(err => {
            console.error('Error al copiar', err);
            alert("No se pudo copiar automáticamente. Por favor selecciona el texto y cópialo.");
        });
    }


});