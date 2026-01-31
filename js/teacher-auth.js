(function() {
  var TEACHER_PASSWORD = 'Moscow3!33';

  var form = document.getElementById('teacher-login-form');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var input = document.getElementById('teacher-password');
    var errorEl = document.getElementById('teacher-error');
    var value = (input && input.value) ? input.value : '';

    if (value === TEACHER_PASSWORD) {
      sessionStorage.setItem('teacherAuth', '1');
      window.location.href = 'teacher.html';
      return;
    }

    if (errorEl) {
      errorEl.textContent = 'Неверный пароль. Попробуйте снова.';
      errorEl.style.display = 'block';
    }
  });
})();
