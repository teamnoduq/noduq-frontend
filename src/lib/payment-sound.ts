const BELOW_30 = [
  "cero",
  "uno",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "once",
  "doce",
  "trece",
  "catorce",
  "quince",
  "dieciséis",
  "diecisiete",
  "dieciocho",
  "diecinueve",
  "veinte",
  "veintiuno",
  "veintidós",
  "veintitrés",
  "veinticuatro",
  "veinticinco",
  "veintiséis",
  "veintisiete",
  "veintiocho",
  "veintinueve",
];

const TENS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const HUNDREDS = [
  "",
  "ciento",
  "doscientos",
  "trescientos",
  "cuatrocientos",
  "quinientos",
  "seiscientos",
  "setecientos",
  "ochocientos",
  "novecientos",
];

function under100(value: number, leading: boolean): string {
  if (value < 30) {
    if (value === 1) return leading ? "un" : "uno";
    if (value === 21) return leading ? "veintiún" : "veintiuno";
    return BELOW_30[value] ?? String(value);
  }
  const ten = Math.floor(value / 10);
  const unit = value % 10;
  if (!unit) return TENS[ten] ?? String(value);
  const name = unit === 1 ? (leading ? "un" : "uno") : BELOW_30[unit];
  return `${TENS[ten]} y ${name}`;
}

function under1000(value: number, leading: boolean): string {
  if (value < 100) return under100(value, leading);
  if (value === 100) return "cien";
  const hundred = Math.floor(value / 100);
  const rest = value % 100;
  const head = HUNDREDS[hundred] ?? String(value);
  return rest ? `${head} ${under100(rest, leading)}` : head;
}

export function pesosEnPalabras(value: number): string {
  const amount = Math.max(0, Math.round(value));
  if (amount === 0) return "cero";
  if (amount === 1_000_000) return "un millón";
  const millions = Math.floor(amount / 1_000_000);
  const thousands = Math.floor((amount % 1_000_000) / 1000);
  const rest = amount % 1000;
  const parts: string[] = [];
  if (millions === 1) parts.push("un millón");
  else if (millions > 1) parts.push(`${under1000(millions, true)} millones`);
  if (thousands === 1) parts.push("mil");
  else if (thousands > 1) parts.push(`${under1000(thousands, true)} mil`);
  if (rest) parts.push(under1000(rest, false));
  return parts.join(" ");
}

type Queued = { id: string; amount: number | null };

const heard = new Set<string>();
const queue: Queued[] = [];
let playing = false;

function spanishVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith("es-co")) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("es-mx")) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("es"))
  );
}

function playSenal(): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio("/senal.wav");
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error("sound"));
    const started = audio.play();
    if (!started) {
      reject(new Error("sound"));
      return;
    }
    started.catch(reject);
  });
}

function speakAmount(amount: number | null): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) return Promise.resolve();
  const text =
    amount == null || !Number.isFinite(amount)
      ? "Llegó un pago."
      : `Llegó un pago de ${pesosEnPalabras(amount)}.`;
  return new Promise((resolve) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "es-CO";
    const voice = spanishVoice();
    if (voice) utter.voice = voice;
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      window.clearInterval(kick);
      window.clearTimeout(cap);
      resolve();
    };
    const kick = window.setInterval(() => window.speechSynthesis.resume(), 250);
    const cap = window.setTimeout(done, 8000);
    utter.onend = done;
    utter.onerror = done;
    window.speechSynthesis.speak(utter);
    window.speechSynthesis.resume();
  });
}

async function drain() {
  if (playing) return;
  playing = true;
  while (queue.length) {
    const next = queue[0];
    try {
      await playSenal();
      await speakAmount(next.amount);
      queue.shift();
    } catch {
      break;
    }
  }
  playing = false;
}

export function announcePayment(id: string, amount: number | null) {
  if (!id || heard.has(id)) return;
  heard.add(id);
  queue.push({ id, amount });
  void drain();
}

export function primePaymentSound() {
  if (queue.length) {
    void drain();
    return;
  }
  const audio = new Audio("/senal.wav");
  audio.muted = true;
  const started = audio.play();
  if (!started) return;
  void started
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
    })
    .catch(() => {});
}

export function resumePaymentSound() {
  void drain();
}
