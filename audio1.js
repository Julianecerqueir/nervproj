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

    closeSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.navigateTo = function (id) { showSection(id); };

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const sec = item.dataset.section;
      if (sec) showSection(sec);
    });
  });

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
     AUDIO PLAYER (Multi instances)
     ========================================== */

  let currentAudio = null;

  document.querySelectorAll('.player-ui[data-audio]').forEach(playerUI => {
    const audioId = playerUI.getAttribute('data-audio');
    const audioEl = document.getElementById(audioId);
    if (!audioEl) return;

    const card = playerUI.closest('.audio-card') || audioEl.parentElement;

    const playBtn   = playerUI.querySelector('.play-btn');
    const iconPlay  = playBtn?.querySelector('.icon-play');
    const iconPause = playBtn?.querySelector('.icon-pause');

    const track     = playerUI.querySelector('[data-role="track"]') || playerUI.querySelector('.progress-track');
    const playedEl  = playerUI.querySelector('[data-role="played"]') || playerUI.querySelector('.progress-played');
    const thumbEl   = playerUI.querySelector('[data-role="thumb"]')  || playerUI.querySelector('.progress-thumb');
    const currentEl = playerUI.querySelector('[data-role="current"]') || playerUI.querySelector('.time-current');
    const totalEl   = playerUI.querySelector('[data-role="total"]')   || playerUI.querySelector('.time-total');
    const volSlider = playerUI.querySelector('[data-role="volume"]')  || playerUI.querySelector('.volume-slider');

    const placeholder = card?.querySelector('.audio-placeholder');

    function formatTime(s) {
      if (isNaN(s)) return '--:--';
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return `${m}:${sec.toString().padStart(2, '0')}`;
    }

    function resetIconsForAll() {
      document.querySelectorAll('.play-btn .icon-play').forEach(i => i.classList.remove('hidden'));
      document.querySelectorAll('.play-btn .icon-pause').forEach(i => i.classList.add('hidden'));
    }

    // If MP3 not found / cannot load
    audioEl.addEventListener('error', () => {
      playerUI.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';
    });

    audioEl.addEventListener('loadedmetadata', () => {
      if (placeholder) placeholder.style.display = 'none';
      playerUI.style.display = 'flex';
      if (totalEl) totalEl.textContent = formatTime(audioEl.duration);
    });

    audioEl.addEventListener('timeupdate', () => {
      if (!audioEl.duration) return;
      const pct = (audioEl.currentTime / audioEl.duration) * 100;

      if (playedEl) playedEl.style.width = pct + '%';
      if (thumbEl)  thumbEl.style.left  = pct + '%';
      if (currentEl) currentEl.textContent = formatTime(audioEl.currentTime);

      try {
        localStorage.setItem('nervo_progress_' + audioId, audioEl.currentTime);
      } catch(e) {}
    });

   audioEl.addEventListener('ended', () => {
  if (iconPlay)  iconPlay.classList.remove('hidden');
  if (iconPause) iconPause.classList.add('hidden');

  // ✅ marca como finalizado
  try { localStorage.setItem('nervo_finished_' + audioId, '1'); } catch(e) {}

  // ✅ revalida o unlock do dia (01/02/03)
  if (audioId.startsWith('audio01')) checkDayUnlock('01');
  if (audioId === 'audio02') checkDayUnlock('02');
  if (audioId === 'audio03') checkDayUnlock('03');
});

    // Restore saved position
    try {
      const saved = localStorage.getItem('nervo_progress_' + audioId);
      if (saved && parseFloat(saved) > 0) {
        audioEl.currentTime = parseFloat(saved);
      }
    } catch(e) {}

    // Play / Pause
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (currentAudio && currentAudio !== audioEl) {
          currentAudio.pause();
          resetIconsForAll();
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

    // Seek on track click + drag
    if (track) {
      track.addEventListener('click', e => {
        const rect = track.getBoundingClientRect();
        const pct  = (e.clientX - rect.left) / rect.width;
        audioEl.currentTime = pct * audioEl.duration;
      });

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
    let done = 0;

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

    if (dayNum === '03') {
      const block = document.getElementById('completionBlock');
      if (block) block.style.display = 'block';
    }

    if (nextSection) {
      setTimeout(() => showSection(nextSection), 600);
    }
  };

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

  showSection('overview');

})();