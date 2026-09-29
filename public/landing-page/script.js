// Chat 120 - Static Landing Page JavaScript
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const cloneBtn = document.getElementById('copyCloneBtn');
  const cloneText = document.getElementById('cloneCommandText');
  const repoModal = document.getElementById('repoModal');
  const openModalBtns = document.querySelectorAll('.open-repo-modal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const shareBtn = document.getElementById('shareAppBtn');
  const tryLiveBtns = document.querySelectorAll('.try-live-btn');

  // Git clone copy handler
  if (cloneBtn && cloneText) {
    cloneBtn.addEventListener('click', () => {
      const textToCopy = cloneText.textContent.trim();
      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalHtml = cloneBtn.innerHTML;
        cloneBtn.innerHTML = '<span>✓ Copied!</span>';
        cloneBtn.style.color = '#00a884';
        setTimeout(() => {
          cloneBtn.innerHTML = originalHtml;
          cloneBtn.style.color = '';
        }, 2000);
      }).catch(err => {
        console.warn('Clipboard write failed:', err);
      });
    });
  }

  // Share app link handler
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const origin = window.location.origin;
      navigator.clipboard.writeText(origin).then(() => {
        const originalText = shareBtn.innerHTML;
        shareBtn.innerHTML = '<span>✓ Link Copied</span>';
        setTimeout(() => {
          shareBtn.innerHTML = originalText;
        }, 2000);
      });
    });
  }

  // Open modal
  openModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (repoModal) {
        repoModal.classList.add('active');
      }
    });
  });

  // Close modal
  if (closeModalBtn && repoModal) {
    closeModalBtn.addEventListener('click', () => {
      repoModal.classList.remove('active');
    });

    repoModal.addEventListener('click', (e) => {
      if (e.target === repoModal) {
        repoModal.classList.remove('active');
      }
    });
  }

  // ESC key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && repoModal) {
      repoModal.classList.remove('active');
    }
  });

  // Direct try live buttons: navigate to application root
  tryLiveBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.href = '/';
    });
  });

  // Live countdown demonstration in mockup
  const countdownEl = document.getElementById('liveMockupCountdown');
  if (countdownEl) {
    let secondsLeft = 119 * 60 + 45;
    setInterval(() => {
      if (secondsLeft > 0) {
        secondsLeft--;
        const mins = Math.floor(secondsLeft / 60);
        const secs = secondsLeft % 60;
        countdownEl.textContent = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
      }
    }, 1000);
  }
});
