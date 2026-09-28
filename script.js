document.addEventListener('DOMContentLoaded', () => {
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const toolCards = [...document.querySelectorAll('.tool-card')];
  const searchInput = document.querySelector('#tool-search');
  const emptyState = document.querySelector('#empty-state');
  let activeFilter = 'all';

  function filterTools() {
    if (!toolCards.length) return;
    const query = (searchInput?.value || '').trim().toLowerCase();
    let visibleCount = 0;
    for (const card of toolCards) {
      const categoryMatches = activeFilter === 'all' || card.dataset.category === activeFilter;
      const queryMatches = !query || `${card.dataset.name} ${card.textContent}`.toLowerCase().includes(query);
      card.hidden = !(categoryMatches && queryMatches);
      if (!card.hidden) visibleCount += 1;
    }
    if (emptyState) emptyState.hidden = visibleCount > 0;
  }

  for (const button of filterButtons) {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.filter;
      for (const item of filterButtons) {
        const selected = item === button;
        item.classList.toggle('selected', selected);
        item.setAttribute('aria-pressed', String(selected));
      }
      filterTools();
    });
  }
  searchInput?.addEventListener('input', filterTools);

  const page = document.querySelector('[data-tool]');
  if (!page) return;
  const tool = page.dataset.tool;
  const result = document.querySelector('#result');
  const resultValue = document.querySelector('#result-value');
  const resultDetail = document.querySelector('#result-detail');
  const showResult = (value, detail = '') => {
    if (!result || !resultValue) return;
    resultValue.textContent = value;
    if (resultDetail) resultDetail.textContent = detail;
    result.classList.add('visible');
  };
  const numberFrom = (form, name) => Number(new FormData(form).get(name));
  const money = (value, currency = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);

  if (tool === 'age') {
    document.querySelector('#age-form')?.addEventListener('submit', event => {
      event.preventDefault();
      const birth = new Date(`${document.querySelector('#birth-date').value}T00:00:00`);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (Number.isNaN(birth.getTime()) || birth > today) return showResult('Check the date', 'Enter a valid date in the past.');
      let years = today.getFullYear() - birth.getFullYear();
      let months = today.getMonth() - birth.getMonth();
      let days = today.getDate() - birth.getDate();
      if (days < 0) { months -= 1; days += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
      if (months < 0) { years -= 1; months += 12; }
      let next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
      if (next <= today) next.setFullYear(today.getFullYear() + 1);
      const daysToBirthday = Math.ceil((next - today) / 86400000);
      showResult(`${years} years, ${months} months, ${days} days`, `Your next birthday is in ${daysToBirthday} ${daysToBirthday === 1 ? 'day' : 'days'}.`);
    });
  }

  if (tool === 'percentage') {
    document.querySelector('#percentage-form')?.addEventListener('submit', event => {
      event.preventDefault();
      const form = event.currentTarget;
      const mode = new FormData(form).get('mode');
      const first = numberFrom(form, 'first');
      const second = numberFrom(form, 'second');
      if (!Number.isFinite(first) || !Number.isFinite(second)) return showResult('Check your numbers', 'Enter a value in both fields.');
      if (mode === 'of') return showResult(String((first / 100 * second).toLocaleString(undefined, { maximumFractionDigits: 4 })), `${first}% of ${second}`);
      if (mode === 'change') {
        if (first === 0) return showResult('Cannot calculate', 'The starting value cannot be zero.');
        const change = (second - first) / Math.abs(first) * 100;
        return showResult(`${change > 0 ? '+' : ''}${change.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`, `${second >= first ? 'Increase' : 'Decrease'} from ${first} to ${second}`);
      }
      if (second === 0) return showResult('Cannot calculate', 'The total cannot be zero.');
      showResult(`${(first / second * 100).toLocaleString(undefined, { maximumFractionDigits: 4 })}%`, `${first} is what percentage of ${second}`);
    });
  }

  if (tool === 'gst') {
    const rateSelect = document.querySelector('#gst-rate');
    const customRateField = document.querySelector('#custom-rate-field');
    const customRateInput = document.querySelector('#gst-custom-rate');
    rateSelect?.addEventListener('change', () => {
      const useCustomRate = rateSelect.value === 'custom';
      customRateField.hidden = !useCustomRate;
      customRateInput.required = useCustomRate;
    });
    document.querySelector('#gst-form')?.addEventListener('submit', event => {
      event.preventDefault();
      const form = event.currentTarget;
      const amount = numberFrom(form, 'amount');
      const rate = rateSelect.value === 'custom' ? numberFrom(form, 'custom-rate') : numberFrom(form, 'rate');
      const included = new FormData(form).get('tax-mode') === 'inclusive';
      if (!Number.isFinite(amount) || !Number.isFinite(rate) || amount < 0 || rate < 0) return showResult('Check your values', 'Enter non-negative amount and tax rate.');
      const base = included ? amount / (1 + rate / 100) : amount;
      const tax = included ? amount - base : amount * rate / 100;
      const total = included ? amount : amount + tax;
      showResult(money(total), `Base amount ${money(base)} · GST ${money(tax)} at ${rate}%`);
    });
  }

  if (tool === 'emi') {
    document.querySelector('#emi-form')?.addEventListener('submit', event => {
      event.preventDefault();
      const form = event.currentTarget;
      const principal = numberFrom(form, 'principal');
      const annualRate = numberFrom(form, 'rate');
      const years = numberFrom(form, 'years');
      if (![principal, annualRate, years].every(Number.isFinite) || principal <= 0 || annualRate < 0 || years <= 0) return showResult('Check your values', 'Enter a loan amount and term above zero, and a non-negative rate.');
      const months = Math.round(years * 12);
      const monthlyRate = annualRate / 1200;
      const payment = monthlyRate === 0 ? principal / months : principal * monthlyRate * (1 + monthlyRate) ** months / ((1 + monthlyRate) ** months - 1);
      const total = payment * months;
      showResult(money(payment), `${months} monthly payments · total interest ${money(total - principal)} · total paid ${money(total)}`);
    });
  }

  if (tool === 'word-counter') {
    const text = document.querySelector('#text-to-count');
    const words = document.querySelector('#word-count');
    const chars = document.querySelector('#char-count');
    const charsNoSpace = document.querySelector('#char-no-space-count');
    const updateCounts = () => {
      const value = text.value;
      const wordList = value.trim().match(/\S+/g) || [];
      const sentenceList = value.trim().match(/[^.!?]+[.!?]*/g) || [];
      words.textContent = wordList.length.toLocaleString();
      chars.textContent = value.length.toLocaleString();
      charsNoSpace.textContent = value.replace(/\s/g, '').length.toLocaleString();
      result?.classList.toggle('visible', value.length > 0);
      if (value.length) {
        resultValue.textContent = `${wordList.length.toLocaleString()} words`;
        resultDetail.textContent = `${sentenceList.filter(sentence => sentence.trim()).length} sentences · about ${Math.max(1, Math.ceil(wordList.length / 200))} min reading time`;
      }
    };
    text?.addEventListener('input', updateCounts);
    updateCounts();
  }

  if (tool === 'qr-generator') {
    const form = document.querySelector('#qr-form');
    const output = document.querySelector('#qr-output');
    const image = document.querySelector('#qr-image');
    const download = document.querySelector('#qr-download');
    form?.addEventListener('submit', event => {
      event.preventDefault();
      const value = document.querySelector('#qr-content').value.trim();
      if (!value) return showResult('Add some content', 'Enter a web address or short text to create its QR code.');
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(value)}`;
      image.onload = () => { output.classList.add('visible'); download.href = url; download.classList.add('visible'); showResult('Your QR code is ready', 'Scan it with a phone camera or download the image.'); };
      image.onerror = () => showResult('Could not create the QR code', 'Check your internet connection and try again.');
      image.src = url;
      image.alt = `QR code for ${value.slice(0, 70)}`;
    });
  }

  if (tool === 'image-resizer' || tool === 'image-compressor') {
    const upload = document.querySelector('#image-file');
    const preview = document.querySelector('#image-preview');
    const form = document.querySelector('#image-form');
    const download = document.querySelector('#image-download');
    let sourceImage;
    let sourceName = 'image';
    let sourceSize = 0;
    const qualityInput = document.querySelector('#quality');
    const qualityValue = document.querySelector('#quality-value');
    qualityInput?.addEventListener('input', () => { qualityValue.textContent = qualityInput.value; });
    upload?.addEventListener('change', () => {
      const file = upload.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) return showResult('Choose an image file', 'Select a JPG, PNG, or WebP image.');
      sourceName = file.name.replace(/\.[^.]+$/, '') || 'image';
      sourceSize = file.size;
      const reader = new FileReader();
      reader.onload = () => {
        sourceImage = new Image();
        sourceImage.onload = () => {
          preview.src = reader.result;
          preview.classList.add('visible');
          document.querySelector('#source-dimensions').textContent = `${sourceImage.naturalWidth} × ${sourceImage.naturalHeight}px · ${(sourceSize / 1024).toFixed(0)} KB`;
          if (tool === 'image-resizer') {
            document.querySelector('#image-width').value = sourceImage.naturalWidth;
            document.querySelector('#image-height').value = sourceImage.naturalHeight;
          }
          result?.classList.remove('visible');
        };
        sourceImage.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
    if (tool === 'image-resizer') {
      const widthInput = document.querySelector('#image-width');
      const heightInput = document.querySelector('#image-height');
      const ratio = document.querySelector('#keep-ratio');
      widthInput?.addEventListener('input', () => {
        if (ratio.checked && sourceImage?.naturalWidth) heightInput.value = Math.max(1, Math.round(Number(widthInput.value) * sourceImage.naturalHeight / sourceImage.naturalWidth));
      });
      heightInput?.addEventListener('input', () => {
        if (ratio.checked && sourceImage?.naturalHeight) widthInput.value = Math.max(1, Math.round(Number(heightInput.value) * sourceImage.naturalWidth / sourceImage.naturalHeight));
      });
    }
    form?.addEventListener('submit', event => {
      event.preventDefault();
      if (!sourceImage) return showResult('Choose an image first', 'Select an image from your device to continue.');
      const canvas = document.createElement('canvas');
      if (tool === 'image-resizer') {
        canvas.width = Number(document.querySelector('#image-width').value);
        canvas.height = Number(document.querySelector('#image-height').value);
        if (!canvas.width || !canvas.height || canvas.width > 10000 || canvas.height > 10000) return showResult('Check the dimensions', 'Choose a width and height between 1 and 10,000 pixels.');
      } else {
        canvas.width = sourceImage.naturalWidth;
        canvas.height = sourceImage.naturalHeight;
      }
      const context = canvas.getContext('2d');
      if (tool === 'image-compressor' && document.querySelector('#output-format').value !== 'image/png') {
        context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
      const mime = tool === 'image-resizer' ? 'image/png' : document.querySelector('#output-format').value;
      const quality = tool === 'image-compressor' ? Number(document.querySelector('#quality').value) / 100 : .92;
      canvas.toBlob(blob => {
        if (!blob) return showResult('Could not process this image', 'Try another image or output format.');
        const objectUrl = URL.createObjectURL(blob);
        download.href = objectUrl;
        download.download = `${sourceName}-${tool === 'image-resizer' ? 'resized' : 'compressed'}.${mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'}`;
        download.classList.add('visible');
        const detail = `${canvas.width} × ${canvas.height}px · ${(sourceSize / 1024).toFixed(0)} KB → ${(blob.size / 1024).toFixed(0)} KB`;
        showResult(tool === 'image-resizer' ? 'Your resized image is ready' : 'Your compressed image is ready', detail);
      }, mime, quality);
    });
  }
});
