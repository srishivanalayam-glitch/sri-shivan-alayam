// A failed module download should still leave the visitor a way back to the site.
try {
  await import('./temple.js');
} catch (error) {
  console.error('Temple startup:', error);
  document.getElementById('welcome').hidden = true;
  document.getElementById('loading').hidden = true;
  document.getElementById('fallback').hidden = false;
}
