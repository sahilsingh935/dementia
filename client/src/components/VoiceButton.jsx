import { useEffect, useState } from "react";

import { useLanguage } from "../i18n/LanguageContext";

import {
  speakText,
  stopSpeaking,
} from "../services/voice";

import "./VoiceButton.css";

export default function VoiceButton({
  text,
  label = "Voice Help",
}) {
  const { language } = useLanguage();

  const [speaking, setSpeaking] =
    useState(false);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  function handleVoice() {
    if (!text) return;

    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }

    setSpeaking(true);

    speakText(text, language);

    window.speechSynthesis.onend = () => {
      setSpeaking(false);
    };

    window.speechSynthesis.onerror = () => {
      setSpeaking(false);
    };
  }

  return (
    <button
      type="button"
      className={`voice-help-button ${
        speaking ? "speaking" : ""
      }`}
      onClick={handleVoice}
      aria-label={label}
      title={label}
    >
      <span className="voice-icon">
        {speaking ? "🔇" : "🔊"}
      </span>

      <span className="voice-label">
        {speaking ? "Stop" : "Help"}
      </span>
    </button>
  );
}