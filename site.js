/* Shared by the public pages: mobile menu, FAQ search, contact form validation. */
const $ = (selector) => document.querySelector(selector);
const menu = $('#menu');
const nav = $('#nav');

if (menu) {
  menu.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', isOpen);
  });
}

const query = $('#faq-q');
if (query) {
  query.addEventListener('input', () => {
    const term = query.value.toLowerCase().trim();
    let matches = 0;

    document.querySelectorAll('#faq details').forEach((detail) => {
      const isMatch = detail.textContent.toLowerCase().includes(term);
      detail.hidden = !isMatch;
      if (isMatch) matches++;
    });

    $('#faq-n').textContent = matches
      ? `${matches} answer${matches > 1 ? 's' : ''} found`
      : 'No match. Try another word, or contact us.';
  });
}

const form = $('#contact');
if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    let isValid = true;

    const rules = {
      name: (value) => value.trim().length >= 2 || 'Enter your name.',
      email: (value) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Enter a valid email address.',
      role: (value) => !!value || 'Choose your role.',
      msg: (value) =>
        value.trim().length >= 15 || 'Write at least 15 characters so we can help.',
    };

    for (const key in rules) {
      const element = form.elements[key];
      const result = rules[key](element.value);
      $(`#e-${key}`).textContent = result === true ? '' : result;
      element.setAttribute('aria-invalid', result !== true);
      if (result !== true) isValid = false;
    }

    const output = $('#sent');
    if (isValid) {
      const messages = JSON.parse(localStorage.rs_msgs || '[]');
      messages.push({
        d: new Date().toISOString(),
        n: form.elements.name.value,
        e: form.elements.email.value,
        r: form.elements.role.value,
        m: form.elements.msg.value,
      });
      localStorage.rs_msgs = JSON.stringify(messages);
      form.reset();
      output.className = 'ok';
      output.textContent =
        'Thank you. Your message was saved. (This school demo has no mail server yet, so nothing is emailed.)';
    } else {
      output.className = 'bad';
      output.textContent = 'Please fix the highlighted fields.';
    }
  });
}
