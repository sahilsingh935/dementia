const LANGUAGE_VOICE_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  as: "as-IN",
  brx: "brx-IN",
  mni: "mni-IN",
};

let currentUtterance = null;

export function speakText(
  text,
  language = "en"
) {
  if (!text) return;

  if (
    !("speechSynthesis" in window)
  ) {
    console.warn(
      "Speech synthesis is not supported."
    );
    return;
  }

  stopSpeaking();

  currentUtterance =
    new SpeechSynthesisUtterance(text);

  currentUtterance.lang =
    LANGUAGE_VOICE_MAP[language] ||
    "en-IN";

  currentUtterance.rate = 0.8;
  currentUtterance.pitch = 1;
  currentUtterance.volume = 1;

  window.speechSynthesis.speak(
    currentUtterance
  );
}

export function stopSpeaking() {
  if (
    "speechSynthesis" in window
  ) {
    window.speechSynthesis.cancel();
  }

  currentUtterance = null;
}

export function isSpeechSupported() {
  return (
    "speechSynthesis" in window
  );
}