document.addEventListener('DOMContentLoaded', () => {
  const footer = document.querySelector('.site-footer');
  const isToolPage = Boolean(document.querySelector('[data-tool]'));
  if (footer) {
    const footerLinks = document.createElement('nav');
    footerLinks.className = 'footer-links';
    footerLinks.setAttribute('aria-label', 'Site information');
    const prefix = isToolPage ? '../' : '';
    for (const [label, href] of [['All tools', `${prefix}index.html#tool-grid`], ['About', `${prefix}about.html`], ['Contact', `${prefix}contact.html`], ['Privacy', `${prefix}privacy.html`]]) {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      footerLinks.append(link);
    }
    footer.lastElementChild?.replaceWith(footerLinks);
  }

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
  const guides = {
    age: {
      steps: ['Choose your date of birth.', 'Select Calculate age to see your calendar age and days until your next birthday.'],
      method: 'The result compares the birth date with today, then borrows days from the previous month and months from the previous year as needed. Calendar month lengths are used, not an average month length.',
      example: 'If today is 8 April 2025 and the birth date is 10 April 2000, the result is 24 years, 11 months, and 29 days; the next birthday is in 2 days.',
      faqs: [['Does it use today’s date?', 'Yes. It uses the date on your device when you calculate.'], ['Is the result a medical or legal age determination?', 'No. It is a calendar calculation for general reference; use the relevant official rules for formal decisions.'], ['Why can the result differ by a day?', 'The calculation uses the local calendar date on your device, which can differ from another time zone.']]
    },
    percentage: {
      steps: ['Choose “% of a number”, “% change”, or “What percent?”.', 'Enter both values in the order described below the fields, then select Calculate.'],
      method: 'Percent of a number: percent ÷ 100 × number. Percent change: (new − old) ÷ |old| × 100. What percent: part ÷ total × 100. Percent change is undefined when the starting value is zero.',
      example: '15% of 240 = 15 ÷ 100 × 240 = 36. For a change from 120 to 150, the change is (150 − 120) ÷ 120 × 100 = 25%.',
      faqs: [['Which order should I enter values?', 'For “% of a number”, enter the percent first and the number second. For percent change, enter the starting value first. For “What percent?”, enter the part first and the total second.'], ['Can the answer be negative?', 'Yes. A percent change is negative when the new value is below the starting value.'], ['Why can’t I use zero as the starting value or total?', 'Percent change divides by the starting value, and “What percent?” divides by the total. Division by zero is undefined.']]
    },
    gst: {
      steps: ['Choose whether the amount is before GST or already includes GST.', 'Enter the amount and select a preset rate or choose Custom rate and enter one.', 'Select Calculate GST to see the total, base amount, and GST portion.'],
      method: 'For an amount before tax: GST = amount × rate ÷ 100, and total = amount + GST. For a tax-inclusive total: base = total ÷ (1 + rate ÷ 100), and GST = total − base.',
      example: 'At 18%, an amount of ₹1,000 before GST has ₹180 GST and a ₹1,180 total. If ₹1,180 already includes 18% GST, the base is ₹1,000 and the included GST is ₹180.',
      faqs: [['Are the listed rates right for every purchase?', 'No. The presets are common selectable rates, not tax advice. Check which rate applies to your transaction and location.'], ['What does Custom rate do?', 'It lets you enter a non-preset percentage; the same add-tax or extract-tax calculation is used.'], ['Does this handle multiple or compound taxes?', 'No. It applies one percentage rate to a single amount.']]
    },
    emi: {
      steps: ['Enter the loan principal, annual interest rate, and term in years.', 'Select Calculate monthly EMI to see an estimated instalment, total interest, and total paid.'],
      method: 'For a fixed monthly rate, EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), where P is principal, r is annual rate ÷ 12 ÷ 100, and n is the number of monthly payments. At 0% interest, EMI = P ÷ n.',
      example: 'A ₹120,000 loan at 0% for 1 year has 12 payments: ₹120,000 ÷ 12 = ₹10,000 per month, with ₹0 interest. Real loan fees and lender rounding are not included.',
      faqs: [['Does the estimate include fees or changing rates?', 'No. It assumes a fixed annual rate and equal monthly payments; fees and rate changes are not modeled.'], ['Why can my lender’s amount differ?', 'Lenders may use different compounding, payment dates, fees, rounding, or rate conventions.'], ['How is a term in years converted to payments?', 'The entered years are multiplied by 12 and rounded to the nearest whole monthly payment.']]
    },
    'word-counter': {
      steps: ['Type or paste text in the text box.', 'Read the live word, character, and character-without-spaces totals.'],
      method: 'Words are counted as non-whitespace groups. Characters use the text string length and include spaces and line breaks; the no-spaces total removes whitespace. Reading time is estimated at 200 words per minute and rounded up, with a one-minute minimum for non-empty text.',
      example: '“ToolNest makes small tasks easier.” contains 5 whitespace-separated words and 1 sentence. Its estimated reading time is 1 minute.',
      faqs: [['Are punctuation marks counted?', 'Punctuation is included in character totals. A word is a group separated by whitespace, so punctuation attached to a word does not create another word.'], ['Is reading time exact?', 'No. It is a rough estimate based on a fixed 200-words-per-minute pace.'], ['Are line breaks characters?', 'Yes. Line breaks and other whitespace count in the character total and are removed in the no-spaces total.']]
    },
    'qr-generator': {
      steps: ['Enter a web address or short text.', 'Select Generate QR code and wait for the remote image request to complete.', 'Scan the result or download the QR image.'],
      method: 'The entered value is URL-encoded and sent as the data parameter in an image request to api.qrserver.com. That external service returns the QR image; an internet connection is required.',
      example: 'Entering https://example.com requests a QR image containing that address. Scanning the code opens the encoded value, so check it carefully before sharing.',
      faqs: [['Is my entered text sent off this device?', 'Yes. It is sent to api.qrserver.com to generate the image. Do not enter sensitive information unless you are comfortable sharing it with that service.'], ['Can it work offline?', 'No. The QR image is requested from the external service.'], ['What should I check before sharing a QR code?', 'Scan it yourself and confirm the decoded text or destination is correct.']]
    },
    'image-resizer': {
      steps: ['Choose an image file.', 'Enter the desired width and height in pixels. Keep aspect ratio checked to calculate the other dimension proportionally.', 'Select Resize image, then download the PNG output.'],
      method: 'The browser decodes the image and draws it onto a canvas at the chosen dimensions. The canvas is exported as PNG. Resizing changes pixel dimensions; enlarging can make an image look less sharp.',
      example: 'A 1,200 × 800 image resized to 600 pixels wide with aspect ratio kept becomes 600 × 400 pixels.',
      faqs: [['Does the image get uploaded?', 'The current tool reads and processes the selected file in your browser; its code does not upload the image to a ToolNest backend.'], ['What format is downloaded?', 'The resizer exports a PNG file, regardless of the source format.'], ['Can enlarging an image improve its detail?', 'No. Increasing pixel dimensions cannot restore detail that was not present in the source.']]
    },
    'image-compressor': {
      steps: ['Choose an image file.', 'Select JPEG, WebP, or PNG and adjust the quality slider.', 'Select Compress image, then download the browser-generated output.'],
      method: 'The image is drawn at its original pixel dimensions to a browser canvas and re-encoded in the chosen format. The quality value is passed to the browser for JPEG or WebP encoding; PNG encoding does not use this quality setting. JPEG output uses a white background for transparent pixels.',
      example: 'For a 1,200 × 800 image, choosing JPEG at 75% keeps those dimensions and asks the browser to encode at that quality. The final file size depends on the image and browser; compare the displayed input and output sizes.',
      faqs: [['Will compression always make the file smaller?', 'No. Some images or format choices can produce a larger file, especially PNG output. Check the reported sizes.'], ['Does the quality slider affect PNG?', 'No. Browser canvas PNG encoding ignores the quality parameter; choose JPEG or WebP for a quality adjustment.'], ['Will the output dimensions change?', 'No. The compressor keeps the source image’s pixel dimensions; use the image resizer to change them.']]
    }
  };

  const guide = guides[tool];
  if (guide) {
    const guideSection = document.createElement('section');
    guideSection.className = 'tool-guide';
    guideSection.setAttribute('aria-labelledby', 'guide-title');
    guideSection.innerHTML = '<header class="guide-heading"><p class="eyebrow"><span class="eyebrow-line"></span> QUICK GUIDE</p><h2 id="guide-title">How to use this tool</h2></header>';
    const guideGrid = document.createElement('div');
    guideGrid.className = 'guide-grid';
    const addBlock = (title, className, body) => {
      const block = document.createElement('section');
      block.className = `guide-block ${className || ''}`.trim();
      const heading = document.createElement('h3');
      heading.textContent = title;
      block.append(heading, body);
      guideGrid.append(block);
      return block;
    };
    const steps = document.createElement('ol');
    for (const step of guide.steps) {
      const item = document.createElement('li');
      item.textContent = step;
      steps.append(item);
    }
    addBlock('Steps', '', steps);
    const method = document.createElement('p');
    method.textContent = guide.method;
    addBlock('Method', '', method);
    const example = document.createElement('p');
    example.textContent = guide.example;
    addBlock('Worked example', 'guide-example', example);
    const faqBlock = document.createElement('section');
    faqBlock.className = 'guide-block guide-faq';
    const faqHeading = document.createElement('h3');
    faqHeading.textContent = 'FAQs';
    faqBlock.append(faqHeading);
    for (const [question, answer] of guide.faqs) {
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      const response = document.createElement('p');
      summary.textContent = question;
      response.textContent = answer;
      details.append(summary, response);
      faqBlock.append(details);
    }
    guideGrid.append(faqBlock);
    guideSection.append(guideGrid);
    page.querySelector('.tool-layout')?.after(guideSection);
  }
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
