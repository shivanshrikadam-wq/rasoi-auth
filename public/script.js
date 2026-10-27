const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginMessage = document.getElementById('login-message');
const registerMessage = document.getElementById('register-message');
function showMessage(node, message, success = false) { node.textContent = message; node.classList.toggle('success', success); }
async function submit(form, messageNode, url, body) {
  const button = form.querySelector('[type="submit"]'); button.disabled = true; showMessage(messageNode, '');
  try { const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Request failed. Please try again.'); return data; }
  catch (error) { showMessage(messageNode, error.message || 'Server unavailable. Please try again.'); return null; }
  finally { button.disabled = false; }
}
registerForm.addEventListener('submit', async event => {
  event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form));
  if (data.password !== data.confirmPassword) return showMessage(registerMessage, 'Passwords do not match.');
  if (data.password.length < 8 || !/[A-Za-z]/.test(data.password) || !/[0-9]/.test(data.password)) return showMessage(registerMessage, 'Use at least 8 characters, including a letter and a number.');
  const result = await submit(form, registerMessage, '/api/auth/register', data);
  if (result) { form.reset(); showMessage(registerMessage, result.message, true); }
});
loginForm.addEventListener('submit', async event => {
  event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form));
  data.rememberMe = document.getElementById('remember-me').checked;
  const result = await submit(form, loginMessage, '/api/auth/login', data);
  if (result) window.location.assign('/dashboard.html');
});
document.querySelector('.forgot-link').addEventListener('click', event => { event.preventDefault(); document.getElementById('forgot-dialog').showModal(); });
