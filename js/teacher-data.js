(function() {
  var STORAGE_CREDENTIALS = 'studentCredentials';
  var STORAGE_ASSIGNMENTS = 'studentAssignments';
  var STORAGE_GRADES = 'studentGrades';
  var STORAGE_LESSONS = 'teacherLessons';

  function seedCredentials() {
    if (!localStorage.getItem(STORAGE_CREDENTIALS) && window.STUDENT_CREDENTIALS) {
      var list = window.STUDENT_CREDENTIALS.map(function(c) {
        return { login: c.login, password: c.password, name: c.login };
      });
      localStorage.setItem(STORAGE_CREDENTIALS, JSON.stringify(list));
    }
  }

  function getCredentials() {
    seedCredentials();
    var raw = localStorage.getItem(STORAGE_CREDENTIALS);
    return raw ? JSON.parse(raw) : [];
  }

  window.getStudentCredentials = function() {
    return getCredentials();
  };

  window.addStudent = function(login, password, name) {
    var c = getCredentials();
    login = (login || '').trim();
    if (!login || !password) return { ok: false, message: 'Введите логин и пароль' };
    if (c.some(function(x) { return x.login === login; })) {
      return { ok: false, message: 'Такой логин уже есть' };
    }
    c.push({ login: login, password: password, name: (name || login).trim() || login });
    localStorage.setItem(STORAGE_CREDENTIALS, JSON.stringify(c));
    return { ok: true };
  };

  window.getStudents = function() {
    return getCredentials().map(function(x) {
      return { login: x.login, name: x.name || x.login };
    });
  };

  function getAssignmentsData() {
    var raw = localStorage.getItem(STORAGE_ASSIGNMENTS);
    return raw ? JSON.parse(raw) : {};
  }

  window.getAssignments = function(studentLogin) {
    var data = getAssignmentsData();
    return data[studentLogin] || [];
  };

  window.addAssignment = function(studentLogin, text) {
    var data = getAssignmentsData();
    if (!data[studentLogin]) data[studentLogin] = [];
    data[studentLogin].push({
      id: Date.now(),
      text: text,
      date: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_ASSIGNMENTS, JSON.stringify(data));
    return true;
  };

  function getGradesData() {
    var raw = localStorage.getItem(STORAGE_GRADES);
    return raw ? JSON.parse(raw) : {};
  }

  window.getGrades = function(studentLogin) {
    var data = getGradesData();
    return data[studentLogin] || [];
  };

  window.addGrade = function(studentLogin, subject, grade, comment) {
    var data = getGradesData();
    if (!data[studentLogin]) data[studentLogin] = [];
    data[studentLogin].push({
      id: Date.now(),
      subject: subject || '—',
      grade: grade,
      comment: comment || '',
      date: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_GRADES, JSON.stringify(data));
    return true;
  };

  function getLessonsData() {
    var raw = localStorage.getItem(STORAGE_LESSONS);
    return raw ? JSON.parse(raw) : [];
  }

  window.getLessons = function() {
    return getLessonsData();
  };

  window.createLesson = function(name, date, time) {
    var lessons = getLessonsData();
    var id = 'lesson_' + Date.now();
    lessons.push({
      id: id,
      name: name || 'Урок',
      date: date || '',
      time: time || '',
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_LESSONS, JSON.stringify(lessons));
    return { id: id, name: name, date: date, time: time };
  };
})();
