const languages = {
      auto: 'Auto Detect',
      en: 'English',
      hi: 'Hindi',
      fr: 'French',
      es: 'Spanish',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      ru: 'Russian',
      ja: 'Japanese',
      ko: 'Korean',
      zh: 'Chinese',
      ar: 'Arabic',
      bn: 'Bengali',
      ta: 'Tamil',
      te: 'Telugu',
      mr: 'Marathi',
      gu: 'Gujarati',
      ur: 'Urdu',
      pa: 'Punjabi'
    };

    const fromLang = document.getElementById('fromLang');
    const toLang = document.getElementById('toLang');
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const inputCount = document.getElementById('inputCount');
    const translateBtn = document.getElementById('translateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const swapBtn = document.getElementById('swapBtn');
    const micBtn = document.getElementById('micBtn');
    const micStatus = document.getElementById('micStatus');
    const translateStatus = document.getElementById('translateStatus');
    const outputInfo = document.getElementById('outputInfo');
    const historyList = document.getElementById('historyList');

    function populateLanguages() {
      Object.entries(languages).forEach(([code, name]) => {
        const option1 = document.createElement('option');
        option1.value = code;
        option1.textContent = `${name} ${code !== 'auto' ? `(${code})` : ''}`;
        fromLang.appendChild(option1);

        if (code !== 'auto') {
          const option2 = document.createElement('option');
          option2.value = code;
          option2.textContent = `${name} (${code})`;
          toLang.appendChild(option2);
        }
      });

      fromLang.value = 'en';
      toLang.value = 'hi';
    }

    populateLanguages();

    inputText.addEventListener('input', () => {
      inputCount.textContent = `${inputText.value.length} characters`;
    });

    async function translateText() {
      const text = inputText.value.trim();
      const source = fromLang.value;
      const target = toLang.value;

      if (!text) {
        outputText.textContent = 'Please enter text to translate.';
        translateStatus.textContent = 'Input required';
        outputInfo.textContent = 'Nothing to translate';
        return;
      }

      translateStatus.innerHTML = '<span class="loader"></span>Translating...';
      outputText.textContent = 'Translating your text...';

      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source === 'auto' ? 'auto' : source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();

        const translated = data[0].map(item => item[0]).join('');
        outputText.textContent = translated;
        translateStatus.textContent = 'Translation complete';
        outputInfo.textContent = `${translated.length} output characters`;
      } catch (error) {
        outputText.textContent = 'Translation failed. Please check your internet connection or try again.';
        translateStatus.textContent = 'Translation failed';
        outputInfo.textContent = 'Error occurred';
      }
    }

    translateBtn.addEventListener('click', translateText);

    clearBtn.addEventListener('click', clearAll);

    function clearAll() {
      inputText.value = '';
      outputText.textContent = 'Your translated text will appear here...';
      inputCount.textContent = '0 characters';
      translateStatus.textContent = 'Waiting for translation';
      outputInfo.textContent = 'Not translated yet';
      micStatus.textContent = 'Ready';
    }

    swapBtn.addEventListener('click', () => {
      if (fromLang.value === 'auto') return;
      const tempLang = fromLang.value;
      fromLang.value = toLang.value;
      toLang.value = tempLang;

      const tempText = inputText.value;
      inputText.value = outputText.textContent === 'Your translated text will appear here...' ? '' : outputText.textContent;
      outputText.textContent = tempText || 'Your translated text will appear here...';
      inputCount.textContent = `${inputText.value.length} characters`;
    });

    document.getElementById('copyInputBtn').addEventListener('click', async () => {
      if (!inputText.value.trim()) return;
      await navigator.clipboard.writeText(inputText.value);
      micStatus.textContent = 'Source copied';
    });

    document.getElementById('copyOutputBtn').addEventListener('click', async () => {
      const text = outputText.textContent.trim();
      if (!text || text === 'Your translated text will appear here...') return;
      await navigator.clipboard.writeText(text);
      outputInfo.textContent = 'Translated text copied';
    });

    function speakText(text, langCode) {
      if (!('speechSynthesis' in window) || !text.trim()) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode === 'auto' ? 'en-US' : langCode;
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    }

    document.getElementById('speakInputBtn').addEventListener('click', () => {
      speakText(inputText.value, fromLang.value);
    });

    document.getElementById('speakOutputBtn').addEventListener('click', () => {
      const text = outputText.textContent;
      if (text === 'Your translated text will appear here...') return;
      speakText(text, toLang.value);
    });

    document.getElementById('downloadBtn').addEventListener('click', () => {
      const text = outputText.textContent;
      if (!text || text === 'Your translated text will appear here...') return;
      const blob = new Blob([text], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'translated-text.txt';
      a.click();
      URL.revokeObjectURL(a.href);
      outputInfo.textContent = 'Downloaded as text file';
    });

    document.getElementById('saveHistoryBtn').addEventListener('click', saveHistory);

    function saveHistory() {
      const sourceText = inputText.value.trim();
      const translatedText = outputText.textContent.trim();

      if (!sourceText || !translatedText || translatedText === 'Your translated text will appear here...') return;

      const history = JSON.parse(localStorage.getItem('translatorHistory')) || [];
      history.unshift({
        sourceText,
        translatedText,
        from: fromLang.value,
        to: toLang.value,
        time: new Date().toLocaleString()
      });

      localStorage.setItem('translatorHistory', JSON.stringify(history.slice(0, 6)));
      renderHistory();
      outputInfo.textContent = 'Saved to history';
    }

    function renderHistory() {
      const history = JSON.parse(localStorage.getItem('translatorHistory')) || [];

      if (!history.length) {
        historyList.innerHTML = '<p style="color: var(--muted); font-size: 14px;">No saved translations yet.</p>';
        return;
      }

      historyList.innerHTML = history.map((item, index) => `
        <div class="history-item" onclick="loadHistory(${index})">
          <small>${item.time} • ${item.from} → ${item.to}</small>
          <strong>${item.sourceText.slice(0, 60)}${item.sourceText.length > 60 ? '...' : ''}</strong>
        </div>
      `).join('');
    }

    window.loadHistory = function(index) {
      const history = JSON.parse(localStorage.getItem('translatorHistory')) || [];
      const item = history[index];
      if (!item) return;
      inputText.value = item.sourceText;
      outputText.textContent = item.translatedText;
      fromLang.value = item.from;
      toLang.value = item.to;
      inputCount.textContent = `${inputText.value.length} characters`;
      translateStatus.textContent = 'Loaded from history';
      outputInfo.textContent = `${item.translatedText.length} output characters`;
      scrollToTranslator();
    }

    renderHistory();

    function scrollToTranslator() {
      document.getElementById('translatorSection').scrollIntoView({ behavior: 'smooth' });
    }

    document.getElementById('pasteBtn').addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        inputText.value = text;
        inputCount.textContent = `${inputText.value.length} characters`;
        micStatus.textContent = 'Pasted from clipboard';
      } catch {
        micStatus.textContent = 'Clipboard access denied';
      }
    });

    document.getElementById('detectBtn').addEventListener('click', () => {
      fromLang.value = 'auto';
      micStatus.textContent = 'Auto detect enabled';
    });

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      micBtn.addEventListener('click', () => {
        recognition.lang = fromLang.value === 'auto' ? 'en-US' : fromLang.value;
        recognition.start();
        micStatus.textContent = 'Listening... speak now';
      });

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        inputText.value = transcript;
        inputCount.textContent = `${inputText.value.length} characters`;
        micStatus.textContent = 'Voice input captured';
      };

      recognition.onerror = () => {
        micStatus.textContent = 'Voice recognition failed';
      };

      recognition.onend = () => {
        if (micStatus.textContent === 'Listening... speak now') {
          micStatus.textContent = 'Voice input stopped';
        }
      };
    } else {
      micBtn.disabled = true;
      micBtn.textContent = '🎤 Not Supported';
      micStatus.textContent = 'Speech recognition unavailable';
    }
