(function() {
  var params = new URLSearchParams(window.location.search);
  var lessonId = params.get('id');
  var role = params.get('role');

  if (!lessonId || !role) {
    document.body.innerHTML = '<p style="padding:2rem;">Не указан урок или роль. Используйте ссылку из кабинета учителя.</p>';
    return;
  }

  var isTeacher = role === 'teacher';
  var channelName = 'lesson_' + lessonId;
  var channel = null;
  try {
    channel = new BroadcastChannel(channelName);
  } catch (e) {
    console.warn('BroadcastChannel not supported', e);
  }

  var ws = null;
  var wsUrl = null;
  if (typeof window.LESSON_WS_URL !== 'undefined' && window.LESSON_WS_URL) {
    wsUrl = window.LESSON_WS_URL;
  } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    wsUrl = 'ws://localhost:3001';
  }

  var participants = [];
  var localVideo = document.getElementById('local-video');
  var localStream = null;
  var micOn = true;
  var camOn = true;
  var boardVisible = false;
  var strokes = [];
  var canvas, ctx;
  var drawing = false;
  var lastX, lastY;
  var boardColor = '#000000';
  var boardWidth = 3;
  var myName = isTeacher ? 'Учитель' : (sessionStorage.getItem('studentLogin') || 'Ученик');

  document.getElementById('lesson-role-label').textContent = isTeacher ? 'Учитель' : 'Ученик';
  document.getElementById('lesson-title').textContent = 'Онлайн-урок';

  if (isTeacher) {
    document.getElementById('board-toolbar').style.display = 'flex';
    document.getElementById('board-placeholder').classList.add('hidden');
    document.getElementById('board-wrapper').classList.remove('hidden');
  } else {
    document.getElementById('board-placeholder').classList.remove('hidden');
    document.getElementById('board-wrapper').classList.add('hidden');
  }

  function updateParticipantsList(list) {
    participants = list || participants;
    var el = document.getElementById('participants-info');
    if (!el) return;
    if (participants.length === 0) {
      el.textContent = 'Участники: подключение...';
      return;
    }
    var names = participants.map(function(p) { return p.name; }).join(', ');
    el.textContent = 'Участники (' + participants.length + '): ' + names;
  }

  function send(msg) {
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify(msg));
      return;
    }
    if (channel) channel.postMessage(msg);
  }

  function handleMessage(data) {
    if (!data || !data.type) return;
    if (data.type === 'participants') {
      updateParticipantsList(data.participants || []);
      return;
    }
    if (data.type === 'boardVisible') {
      boardVisible = !!data.value;
      if (!isTeacher) {
        document.getElementById('board-placeholder').classList.toggle('hidden', boardVisible);
        document.getElementById('board-wrapper').classList.toggle('hidden', !boardVisible);
        if (boardVisible) {
          strokes = data.strokes || [];
          redrawCanvas();
        }
      }
      return;
    }
    if (data.type === 'boardState' && !isTeacher) {
      strokes = data.strokes || [];
      redrawCanvas();
      return;
    }
    if (data.type === 'draw' && !isTeacher && boardVisible) {
      strokes.push(data.stroke);
      drawStroke(data.stroke);
      return;
    }
    if (data.type === 'clear' && !isTeacher) {
      strokes = [];
      clearCanvas();
      return;
    }
    if (data.type === 'chat') {
      addChatMessage(data.name || 'Участник', data.text);
    }
  }

  if (channel) {
    channel.onmessage = function(e) {
      handleMessage(e.data);
    };
  }

  if (wsUrl) {
    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = function() {
        send({
          type: 'join',
          lessonId: lessonId,
          role: role,
          name: myName,
          id: 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2)
        });
        updateParticipantsList([]);
      };
      ws.onmessage = function(e) {
        try {
          var data = JSON.parse(e.data);
          handleMessage(data);
        } catch (err) {
          console.warn('WS message parse error', err);
        }
      };
      ws.onclose = function() {
        updateParticipantsList([]);
      };
      ws.onerror = function() {
        updateParticipantsList([]);
      };
    } catch (err) {
      console.warn('WebSocket error', err);
    }
  } else {
    participants = [{ role: role, name: myName }];
    updateParticipantsList(participants);
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      var info = document.getElementById('participants-info');
      if (info) info.innerHTML = 'Участники (1): ' + myName + '. <small>Для чата с разных устройств укажите адрес сервера в js/lesson-ws-config.js (см. README).</small>';
    }
  }

  function addChatMessage(name, text) {
    var wrap = document.getElementById('chat-messages');
    var p = document.createElement('p');
    p.innerHTML = '<span class="msg-name">' + escapeHtml(name) + ':</span> ' + escapeHtml(text);
    wrap.appendChild(p);
    wrap.scrollTop = wrap.scrollHeight;
  }

  function escapeHtml(s) {
    if (!s) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  document.getElementById('chat-form').addEventListener('submit', function(e) {
    e.preventDefault();
    var input = document.getElementById('chat-input');
    var text = (input && input.value) ? input.value.trim() : '';
    if (!text) return;
    send({ type: 'chat', name: myName, text: text });
    addChatMessage(myName, text);
    input.value = '';
  });

  function getCanvas() {
    if (!canvas) {
      canvas = document.getElementById('lesson-board');
      if (canvas) ctx = canvas.getContext('2d');
    }
    return canvas;
  }

  function resizeCanvas() {
    var c = getCanvas();
    if (!c) return;
    var wrap = c.parentElement;
    var w = wrap.clientWidth;
    var h = wrap.clientHeight || 280;
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
      redrawCanvas();
    }
  }

  function redrawCanvas() {
    var c = getCanvas();
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    strokes.forEach(function(s) { drawStroke(s); });
  }

  function drawStroke(s) {
    if (!ctx) return;
    ctx.strokeStyle = s.color || '#000000';
    ctx.lineWidth = s.width || 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s.prevX, s.prevY);
    ctx.lineTo(s.x, s.y);
    ctx.stroke();
  }

  function clearCanvas() {
    var c = getCanvas();
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
  }

  if (isTeacher) {
    var boardShowBtn = document.getElementById('board-show');
    boardShowBtn.addEventListener('click', function() {
      boardVisible = !boardVisible;
      boardShowBtn.classList.toggle('active', boardVisible);
      boardShowBtn.textContent = boardVisible ? 'Скрыть доску от учеников' : 'Показать доску ученикам';
      send({ type: 'boardVisible', value: boardVisible, strokes: boardVisible ? strokes : [] });
    });

    document.getElementById('board-clear').addEventListener('click', function() {
      strokes = [];
      clearCanvas();
      if (boardVisible) send({ type: 'clear' });
      send({ type: 'boardVisible', value: true, strokes: [] });
    });

    document.getElementById('board-color').addEventListener('input', function() {
      boardColor = this.value || '#000000';
    });
    document.getElementById('board-width').addEventListener('input', function() {
      boardWidth = parseInt(this.value, 10) || 3;
    });

    var wrap = document.getElementById('board-wrapper');
    if (wrap) {
      canvas = document.getElementById('lesson-board');
      if (canvas) ctx = canvas.getContext('2d');
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      canvas.addEventListener('mousedown', function(e) {
        var r = canvas.getBoundingClientRect();
        var scaleX = canvas.width / r.width;
        var scaleY = canvas.height / r.height;
        lastX = (e.clientX - r.left) * scaleX;
        lastY = (e.clientY - r.top) * scaleY;
        drawing = true;
      });

      canvas.addEventListener('mousemove', function(e) {
        if (!drawing) return;
        var r = canvas.getBoundingClientRect();
        var scaleX = canvas.width / r.width;
        var scaleY = canvas.height / r.height;
        var x = (e.clientX - r.left) * scaleX;
        var y = (e.clientY - r.top) * scaleY;
        var stroke = { prevX: lastX, prevY: lastY, x: x, y: y, color: boardColor, width: boardWidth };
        strokes.push(stroke);
        drawStroke(stroke);
        if (boardVisible) send({ type: 'draw', stroke: stroke });
        lastX = x;
        lastY = y;
      });

      canvas.addEventListener('mouseup', function() { drawing = false; });
      canvas.addEventListener('mouseleave', function() { drawing = false; });
    }
  } else {
    canvas = document.getElementById('lesson-board');
    if (canvas) ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  function initMedia() {
    var constraints = { audio: true, video: { width: 320, height: 240 } };
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
      localStream = stream;
      if (localVideo) {
        localVideo.srcObject = stream;
        localVideo.muted = true;
      }
      setMicState(micOn);
      setCamState(camOn);
    }).catch(function(err) {
      console.warn('getUserMedia error', err);
    });
  }

  function setMicState(on) {
    micOn = on;
    if (localStream) {
      localStream.getAudioTracks().forEach(function(t) { t.enabled = on; });
    }
    var btn = document.getElementById('btn-mic');
    if (btn) {
      btn.textContent = on ? '🎤 Вкл' : '🎤 Выкл';
      btn.classList.toggle('off', !on);
    }
  }

  function setCamState(on) {
    camOn = on;
    if (localStream) {
      localStream.getVideoTracks().forEach(function(t) { t.enabled = on; });
    }
    var btn = document.getElementById('btn-cam');
    if (btn) {
      btn.textContent = on ? '📷 Вкл' : '📷 Выкл';
      btn.classList.toggle('off', !on);
    }
    if (localVideo) localVideo.style.display = on ? 'block' : 'none';
  }

  document.getElementById('btn-mic').addEventListener('click', function() {
    setMicState(!micOn);
  });
  document.getElementById('btn-cam').addEventListener('click', function() {
    setCamState(!camOn);
  });

  initMedia();
  resizeCanvas();
})();
