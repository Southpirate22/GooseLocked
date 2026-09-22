document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const targetUrl = urlParams.get('url') || "Blocked Site";
  
  const blockedElement = document.getElementById('blockedUrl');
  if (blockedElement) {
    blockedElement.textContent = targetUrl;
  }
});