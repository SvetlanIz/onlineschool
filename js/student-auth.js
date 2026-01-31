(function() {
  var form = document.getElementById('student-login-form');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var loginInput = document.getElementById('student-login');
    var passwordInput = document.getElementById('student-password');
    var errorEl = document.getElementById('student-error');

    var login = (loginInput && loginInput.value) ? loginInput.value.trim() : '';
    var password = (passwordInput && passwordInput.value) ? passwordInput.value : '';

    var credentials = (window.getStudentCredentials && window.getStudentCredentials()) || window.STUDENT_CREDENTIALS || [];
    var found = credentials.some(function(c) {
      return c.login === login && (c.password === password);
    });

    if (found) {
      sessionStorage.setItem('studentAuth', '1');
      sessionStorage.setItem('studentLogin', login);
      window.location.href = 'student-cabinet.html';
      return;
    }

    if (errorEl) {
      errorEl.textContent = 'Неверный логин или пароль. Проверьте данные или обратитесь к учителю.';
      errorEl.style.display = 'block';
    }
  });
})();
