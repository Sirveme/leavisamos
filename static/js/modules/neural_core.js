/**
 * LEAVISAMOS NEURAL CORE v1.0
 * Módulo centralizado para Voz (TTS/STT) y Visión.
 */

class NeuralCore {
    constructor() {
        this.synth = window.speechSynthesis;
        this.recognition = null;
        this.voice = null;
        this.isListening = false;
        
        this.initVoice();
        this.initRecognition();
    }

    // --- 1. TEXT TO SPEECH (Hablar) ---
    initVoice() {
        if (!this.synth) return;
        
        // Esperar a que carguen las voces
        const load = () => {
            const voices = this.synth.getVoices();
            // Priorizar voz de Google Español o Microsoft Helena/Sabina
            this.voice = voices.find(v => v.lang.includes('es-PE')) || 
                         voices.find(v => v.lang.includes('es')) || 
                         voices[0];
            console.log("🗣️ Voz cargada:", this.voice ? this.voice.name : "Default");
        };

        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = load;
        }
        load();
    }

    speak(text, priority = 'normal') {
        if (!text || !this.synth) return;
        
        // Si es urgente, cancelar lo que se esté diciendo
        if (priority === 'high') this.synth.cancel();

        const utter = new SpeechSynthesisUtterance(text);
        utter.voice = this.voice;
        utter.rate = 1.1; // Ligeramente rápido para ser eficiente
        utter.pitch = 1;
        
        this.synth.speak(utter);
    }

    // --- 2. SPEECH TO TEXT (Escuchar) ---
    initRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("⚠️ Reconocimiento de voz no soportado en este navegador.");
            return;
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'es-PE'; // Español Perú
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;
    }

    listen(callback) {
        if (!this.recognition) return;
        
        if (this.isListening) {
            this.recognition.stop();
            return;
        }

        this.recognition.start();
        this.isListening = true;
        
        // Eventos
        this.recognition.onstart = () => {
            console.log("🎤 Escuchando...");
            // Aquí podrías disparar un evento visual global (ej: ícono de micro palpitando)
        };

        this.recognition.onend = () => {
            this.isListening = false;
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log("📝 Texto reconocido:", transcript);
            if (callback) callback(transcript);
        };
        
        this.recognition.onerror = (event) => {
            console.error("Error STT:", event.error);
            this.speak("No te entendí bien, intenta de nuevo.");
        };
    }

    // --- 3. VISION (Analizar Imágenes) ---
    // (Preparado para el futuro)
    async analyzeImage(file) {
        // Aquí conectaremos con el endpoint /api/brain/analyze-image
        console.log("👁️ Analizando imagen...");
    }
}

// Exportar instancia global
window.Neural = new NeuralCore();