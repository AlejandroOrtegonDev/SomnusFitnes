(function () {
  function showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
  }

  function showConfirmation(message, onConfirm) {
    const modal = document.getElementById('confirmation-modal');
    const msg = document.getElementById('confirmation-message');
    const yes = document.getElementById('confirm-yes');
    const no = document.getElementById('confirm-no');
    if (!modal || !msg || !yes || !no) return;

    msg.textContent = message;
    modal.classList.remove('hidden');

    const yesHandler = () => {
      if (typeof onConfirm === 'function') onConfirm();
      modal.classList.add('hidden');
      yes.removeEventListener('click', yesHandler);
    };
    const noHandler = () => {
      modal.classList.add('hidden');
      no.removeEventListener('click', noHandler);
    };
    yes.addEventListener('click', yesHandler, { once: true });
    no.addEventListener('click', noHandler, { once: true });
  }

  window.UI = window.UI || {};
  window.UI.showToast = showToast;
  window.UI.showConfirmation = showConfirmation;
})();


