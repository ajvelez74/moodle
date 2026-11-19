class LectorContenido {
  /**
   * @param {Object} opciones
   * @param {string} opciones.contenedorId - ID del elemento cuyo texto se va a leer
   * @param {string} opciones.btnLeerId - ID del botón de leer
   * @param {string} [opciones.btnPausarId] - ID del botón de pausar/reanudar (opcional)
   * @param {string} [opciones.btnDetenerId] - ID del botón de detener (opcional)
   * @param {string} [opciones.lang="es-ES"] - Idioma de lectura
   * @param {number} [opciones.rate=1] - Velocidad (0.1 a 10)
   * @param {number} [opciones.pitch=1] - Tono (0 a 2)
   */
  constructor({
    contenedorId,
    btnLeerId,
    btnPausarId = null,
    btnDetenerId = null,
    lang = "es-ES",
    rate = 1,
    pitch = 1,
  }) {
    this.synth = window.speechSynthesis;
    this.contenedor = document.getElementById(contenedorId);
    this.btnLeer = document.getElementById(btnLeerId);
    this.btnPausar = btnPausarId ? document.getElementById(btnPausarId) : null;
    this.btnDetener = btnDetenerId ? document.getElementById(btnDetenerId) : null;

    this.lang = lang;
    this.rate = rate;
    this.pitch = pitch;
    this.estaLeyendo = false;

    if (!this.contenedor || !this.btnLeer) {
      console.warn(
        `LectorContenido: No se encontró el contenedor ("${contenedorId}") o el botón leer ("${btnLeerId}").`
      );
      return;
    }

    this._registrarEventos();
  }

  // Instancia actualmente en reproducción en la página
  static instanciaActiva = null;
  static limpiezaGlobalRegistrada = false;

  obtenerTextoLimpio() {
    return this.contenedor ? this.contenedor.innerText.trim() : "";
  }

  _seleccionarVoz() {
    if (!this.synth) return null;
    const voces = this.synth.getVoices();
    const prefijoIdioma = this.lang.split("-")[0].toLowerCase();

    return (
      voces.find((v) => v.lang.toLowerCase() === this.lang.toLowerCase()) ||
      voces.find((v) => v.lang.toLowerCase().startsWith(prefijoIdioma)) ||
      null
    );
  }

  leer() {
    if (!this.synth || !("SpeechSynthesisUtterance" in window)) {
      alert("Tu navegador no soporta lectura en voz alta.");
      return;
    }

    const texto = this.obtenerTextoLimpio();
    if (!texto) return;

    // Detiene cualquier otra lectura activa en la página o anterior
    if (LectorContenido.instanciaActiva && LectorContenido.instanciaActiva !== this) {
      LectorContenido.instanciaActiva.estaLeyendo = false;
    }
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = this.lang;
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;

    const voz = this._seleccionarVoz();
    if (voz) utterance.voice = voz;

    utterance.onstart = () => {
      this.estaLeyendo = true;
      LectorContenido.instanciaActiva = this;
    };

    utterance.onend = () => {
      this.estaLeyendo = false;
      if (LectorContenido.instanciaActiva === this) {
        LectorContenido.instanciaActiva = null;
      }
    };

    utterance.onerror = () => {
      this.estaLeyendo = false;
      if (LectorContenido.instanciaActiva === this) {
        LectorContenido.instanciaActiva = null;
      }
    };

    this.synth.speak(utterance);
  }

  alternarPausa() {
    if (!this.synth || !this.estaLeyendo || LectorContenido.instanciaActiva !== this) {
      return;
    }

    if (this.synth.paused) {
      this.synth.resume();
    } else if (this.synth.speaking) {
      this.synth.pause();
    }
  }

  detener() {
    if (!this.synth) return;
    if (LectorContenido.instanciaActiva === this) {
      this.synth.cancel();
      this.estaLeyendo = false;
      LectorContenido.instanciaActiva = null;
    }
  }

  _registrarEventos() {
    this.btnLeer.addEventListener("click", () => this.leer());

    if (this.btnPausar) {
      this.btnPausar.addEventListener("click", () => this.alternarPausa());
    }

    if (this.btnDetener) {
      this.btnDetener.addEventListener("click", () => this.detener());
    }

    if (!LectorContenido.limpiezaGlobalRegistrada) {
      window.addEventListener("beforeunload", () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      });
      LectorContenido.limpiezaGlobalRegistrada = true;
    }
  }
}