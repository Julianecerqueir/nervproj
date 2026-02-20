/* ==========================================
   NERVO™ — Member Area Script
   Navigation · Audio Player · Progress · Notes
   ========================================== */

(function () {
  'use strict';

  /* ==========================================
     NAVIGATION
     ========================================== */

  const navItems   = document.querySelectorAll('.nav-item');
  const sections   = document.querySelectorAll('.page-section');
  const sidebar    = document.getElementById('sidebar');
  const overlay    = document.getElementById('sidebarOverlay');
  const burgerBtn  = document.getElementById('burgerBtn');

  function showSection(id) {
    sections.forEach(s => s.classList.remove('active'));
    navItems.forEach(n => n.classList.remove('active'));

    const target = document.getElementById('section-' + id);
    if (target) target.classList.add('active');

    const link = document.querySelector(`.nav-item[data-section="${id}"]`);
    if (link) link.classList.add('active');

    // close mobile sidebar
    closeSidebar();

    // scroll content to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Make available globally for onclick handlers
  window.navigateTo = function (id) { showSection(id); };

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const sec = item.dataset.section;
      if (sec) showSection(sec);
    });
  });

  // Anchor links in hero cards
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').replace('#', '');
      const el = document.getElementById('section-' + id);
      if (el) { e.preventDefault(); showSection(id); }
    });
  });

  /* ==========================================
     MOBILE SIDEBAR
     ========================================== */

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('open');
    burgerBtn.classList.add('open');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    burgerBtn.classList.remove('open');
  }

  burgerBtn.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });

  overlay.addEventListener('click', closeSidebar);

  /* ==========================================
     AUDIO PLAYER
     ========================================== */

  const audioIds = ['audio01', 'audio02', 'audio03'];
  let currentAudio = null;

  audioIds.forEach(id => {
    const audioEl = document.getElementById(id);
    if (!audioEl) return;

    const numStr      = id.slice(-2);
    const placeholder = document.getElementById('placeholder' + numStr);
    const playerUI    = audioEl.parentElement.querySelector('.player-ui');
    const playBtn     = document.querySelector(`[data-audio="${id}"].play-btn`);
    const progressEl  = document.getElementById('progress' + numStr);
    const thumbEl     = document.getElementById('thumb' + numStr);
    const currentEl   = document.getElementById('current' + numStr);
    const totalEl     = document.getElementById('total' + numStr);
    const track       = document.querySelector(`[data-audio="${id}"].progress-track`);
    const volSlider   = document.querySelector(`[data-audio="${id}"].volume-slider`);
    const iconPlay    = playBtn?.querySelector('.icon-play');
    const iconPause   = playBtn?.querySelector('.icon-pause');

    function formatTime(s) {
      if (isNaN(s)) return '--:--';
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return `${m}:${sec.toString().padStart(2, '0')}`;
    }

    // If MP3 not yet uploaded, show placeholder instead of broken player
    audioEl.addEventListener('error', () => {
      if (playerUI)    playerUI.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';
    });

    audioEl.addEventListener('loadedmetadata', () => {
      if (placeholder) placeholder.style.display = 'none';
      if (playerUI)    playerUI.style.display = 'flex';
      if (totalEl) totalEl.textContent = formatTime(audioEl.duration);
    });

    audioEl.addEventListener('timeupdate', () => {
      if (!audioEl.duration) return;
      const pct = (audioEl.currentTime / audioEl.duration) * 100;
      if (progressEl) progressEl.style.width = pct + '%';
      if (thumbEl)    thumbEl.style.left = pct + '%';
      if (currentEl)  currentEl.textContent = formatTime(audioEl.currentTime);

      // Save progress to localStorage for resume
      try {
        localStorage.setItem('nervo_progress_' + id, audioEl.currentTime);
      } catch(e) {}
    });

    audioEl.addEventListener('ended', () => {
      if (iconPlay)  iconPlay.classList.remove('hidden');
      if (iconPause) iconPause.classList.add('hidden');
    });

    // Restore saved position
    try {
      const saved = localStorage.getItem('nervo_progress_' + id);
      if (saved && parseFloat(saved) > 0) {
        audioEl.currentTime = parseFloat(saved);
      }
    } catch(e) {}

    // Play / Pause
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        // Pause any other playing audio
        if (currentAudio && currentAudio !== audioEl) {
          currentAudio.pause();
          document.querySelectorAll('.icon-play').forEach(i => i.classList.remove('hidden'));
          document.querySelectorAll('.icon-pause').forEach(i => i.classList.add('hidden'));
        }

        if (audioEl.paused) {
          audioEl.play();
          currentAudio = audioEl;
          if (iconPlay)  iconPlay.classList.add('hidden');
          if (iconPause) iconPause.classList.remove('hidden');
        } else {
          audioEl.pause();
          if (iconPlay)  iconPlay.classList.remove('hidden');
          if (iconPause) iconPause.classList.add('hidden');
        }
      });
    }

    // Seek on track click
    if (track) {
      track.addEventListener('click', e => {
        const rect = track.getBoundingClientRect();
        const pct  = (e.clientX - rect.left) / rect.width;
        audioEl.currentTime = pct * audioEl.duration;
      });

      // Drag seek
      let dragging = false;
      track.addEventListener('mousedown', () => { dragging = true; });
      document.addEventListener('mousemove', e => {
        if (!dragging) return;
        const rect = track.getBoundingClientRect();
        const pct  = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        audioEl.currentTime = pct * audioEl.duration;
      });
      document.addEventListener('mouseup', () => { dragging = false; });
    }

    // Volume
    if (volSlider) {
      volSlider.addEventListener('input', () => {
        audioEl.volume = parseFloat(volSlider.value);
      });
    }
  });

  /* ==========================================
     PROGRESS TRACKING
     ========================================== */

  const STORAGE_KEY = 'nervo_session_status';

  function getStatus() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch(e) { return {}; }
  }

  function saveStatus(status) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(status)); } catch(e) {}
  }

  function updateProgressUI() {
    const status = getStatus();
    const days   = ['01', '02', '03'];
    let   done   = 0;

    days.forEach(d => {
      const el = document.getElementById('status-day' + d);
      if (status['day' + d]) {
        done++;
        if (el) {
          el.textContent = 'Complete';
          el.classList.remove('pending');
          el.classList.add('complete');
        }
      }
    });

    const pct = Math.round((done / 3) * 100);
    const fill = document.getElementById('progressFill');
    const pctEl = document.getElementById('progressPct');
    if (fill)  fill.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
  }

  window.markComplete = function (dayNum, nextSection) {
    const btn = document.querySelector(`.btn-complete[data-day="${dayNum}"]`);
    const status = getStatus();
    status['day' + dayNum] = true;
    saveStatus(status);
    updateProgressUI();

    if (btn) {
      btn.textContent = 'Complete';
      btn.classList.add('done');
    }

    // Show final completion block on Day 03
    if (dayNum === '03') {
      const block = document.getElementById('completionBlock');
      if (block) block.style.display = 'block';
    }

    // Navigate to next section
    if (nextSection) {
      setTimeout(() => showSection(nextSection), 600);
    }
  };

  // Restore completion states on load
  updateProgressUI();

  const status = getStatus();
  ['01', '02', '03'].forEach(d => {
    if (status['day' + d]) {
      const btn = document.querySelector(`.btn-complete[data-day="${d}"]`);
      if (btn) {
        btn.textContent = 'Complete';
        btn.classList.add('done');
      }
    }
  });

  if (status['day03']) {
    const block = document.getElementById('completionBlock');
    if (block) block.style.display = 'block';
  }

  /* ==========================================
     SESSION NOTES
     ========================================== */

  function loadNotes() {
    ['01', '02', '03'].forEach(d => {
      const area = document.getElementById('notes' + d);
      if (!area) return;
      try {
        const saved = localStorage.getItem('nervo_notes_' + d);
        if (saved) area.value = saved;
      } catch(e) {}

      area.addEventListener('input', () => {
        try { localStorage.setItem('nervo_notes_' + d, area.value); } catch(e) {}
      });
    });
  }

  document.querySelectorAll('.sn-clear').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = btn.dataset.day;
      const area = document.getElementById('notes' + d);
      if (!area) return;
      if (confirm('Clear notes for Day ' + d + '?')) {
        area.value = '';
        try { localStorage.removeItem('nervo_notes_' + d); } catch(e) {}
      }
    });
  });

  loadNotes();

  /* ==========================================
     INIT
     ========================================== */

  // Default section
  showSection('overview');

})();