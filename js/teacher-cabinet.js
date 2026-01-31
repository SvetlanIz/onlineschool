(function() {
  var tabButtons = document.querySelectorAll('.teacher-tab');
  var tabPanels = document.querySelectorAll('.teacher-tab-panel');

  function switchTab(tabId) {
    tabPanels.forEach(function(panel) {
      var isHome = panel.id === 'tab-' + tabId;
      panel.classList.toggle('active', isHome);
      panel.hidden = !isHome;
    });
    tabButtons.forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    if (tabId === 'students') renderStudentsList();
    if (tabId === 'lessons') renderLessonsList();
  }

  tabButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      switchTab(btn.getAttribute('data-tab'));
    });
  });

  var hash = (window.location.hash || '').replace('#', '');
  if (hash === 'tab-students' || hash === 'students') switchTab('students');
  else if (hash === 'tab-lessons' || hash === 'lessons') switchTab('lessons');

  function renderStudentsList() {
    var list = document.getElementById('students-list');
    if (!list) return;
    var students = window.getStudents && window.getStudents() || [];
    list.innerHTML = students.map(function(s) {
      return '<li class="teacher-student-item">' +
        '<span class="teacher-student-name">' + escapeHtml(s.name || s.login) + '</span> ' +
        '<span class="teacher-student-login">(' + escapeHtml(s.login) + ')</span> ' +
        '<a href="teacher-student-profile.html?login=' + encodeURIComponent(s.login) + '" class="teacher-link">Профиль →</a>' +
        '</li>';
    }).join('');
    if (students.length === 0) {
      list.innerHTML = '<li class="teacher-list-empty">Пока нет учеников. Создайте учётную запись выше.</li>';
    }
  }

  function renderLessonsList() {
    var list = document.getElementById('lessons-list');
    if (!list) return;
    var lessons = window.getLessons && window.getLessons() || [];
    var baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
    list.innerHTML = lessons.map(function(lesson) {
      var dateStr = lesson.date || '—';
      var timeStr = lesson.time || '—';
      var studentUrl = baseUrl + 'lesson-room.html?id=' + encodeURIComponent(lesson.id) + '&role=student';
      var teacherUrl = baseUrl + 'lesson-room.html?id=' + encodeURIComponent(lesson.id) + '&role=teacher';
      return '<li class="teacher-lesson-item">' +
        '<div class="teacher-lesson-info">' +
          '<strong>' + escapeHtml(lesson.name) + '</strong> — ' + dateStr + ' ' + timeStr +
        '</div>' +
        '<div class="teacher-lesson-actions">' +
          '<a href="' + teacherUrl + '" class="teacher-link" target="_blank">Войти как учитель</a> ' +
          '| Ссылка для учеников: <a href="' + studentUrl + '" target="_blank">' + studentUrl + '</a>' +
        '</div>' +
        '</li>';
    }).join('');
    if (lessons.length === 0) {
      list.innerHTML = '<li class="teacher-list-empty">Нет запланированных уроков. Создайте урок выше.</li>';
    }
  }

  function escapeHtml(s) {
    if (!s) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  var formStudent = document.getElementById('form-new-student');
  if (formStudent) {
    formStudent.addEventListener('submit', function(e) {
      e.preventDefault();
      var nameEl = document.getElementById('new-student-name');
      var loginEl = document.getElementById('new-student-login');
      var passEl = document.getElementById('new-student-password');
      var msgEl = document.getElementById('new-student-message');
      var resultBox = document.getElementById('new-student-result');
      var resultLogin = document.getElementById('result-login');
      var resultPassword = document.getElementById('result-password');

      var name = nameEl && nameEl.value ? nameEl.value.trim() : '';
      var login = loginEl && loginEl.value ? loginEl.value.trim() : '';
      var password = passEl && passEl.value ? passEl.value : '';

      msgEl.style.display = 'none';
      resultBox.style.display = 'none';

      var result = window.addStudent(login, password, name || login);
      if (!result.ok) {
        msgEl.textContent = result.message || 'Ошибка';
        msgEl.className = 'teacher-message error';
        msgEl.style.display = 'block';
        return;
      }
      resultLogin.textContent = login;
      resultPassword.textContent = password;
      resultBox.style.display = 'block';
      formStudent.reset();
      renderStudentsList();
    });
  }

  var formLesson = document.getElementById('form-new-lesson');
  if (formLesson) {
    formLesson.addEventListener('submit', function(e) {
      e.preventDefault();
      var nameEl = document.getElementById('new-lesson-name');
      var dateEl = document.getElementById('new-lesson-date');
      var timeEl = document.getElementById('new-lesson-time');
      var msgEl = document.getElementById('new-lesson-message');
      var resultBox = document.getElementById('new-lesson-result');
      var linkEl = document.getElementById('lesson-link-for-students');
      var btnStart = document.getElementById('btn-start-lesson');

      var name = nameEl && nameEl.value ? nameEl.value.trim() : 'Урок';
      var date = dateEl && dateEl.value ? dateEl.value : '';
      var time = timeEl && timeEl.value ? timeEl.value : '';

      msgEl.style.display = 'none';
      resultBox.style.display = 'none';

      var created = window.createLesson(name, date, time);
      var baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
      var studentUrl = baseUrl + 'lesson-room.html?id=' + encodeURIComponent(created.id) + '&role=student';
      var teacherUrl = baseUrl + 'lesson-room.html?id=' + encodeURIComponent(created.id) + '&role=teacher';

      linkEl.href = studentUrl;
      linkEl.textContent = studentUrl;
      resultBox.style.display = 'block';

      btnStart.onclick = function() {
        window.open(teacherUrl, '_blank');
      };
      renderLessonsList();
    });
  }

  renderStudentsList();
  renderLessonsList();
})();
