var WebSocket = require('ws');
var http = require('http');

var PORT = process.env.PORT || 3001;
var server = http.createServer();
var wss = new WebSocket.Server({ server: server });

var rooms = {}; // lessonId -> Map(ws -> { id, role, name })

function getRoom(lessonId) {
  if (!rooms[lessonId]) rooms[lessonId] = new Map();
  return rooms[lessonId];
}

function getParticipants(lessonId) {
  var room = getRoom(lessonId);
  var list = [];
  room.forEach(function(p) {
    list.push({ id: p.id, role: p.role, name: p.name });
  });
  return list;
}

function broadcastToRoom(lessonId, data, excludeWs) {
  var room = getRoom(lessonId);
  var msg = JSON.stringify(data);
  room.forEach(function(p, ws) {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}

function sendToRoom(lessonId, data) {
  broadcastToRoom(lessonId, data, null);
}

wss.on('connection', function(ws) {
  var lessonId = null;
  var myId = null;

  ws.on('message', function(raw) {
    try {
      var data = JSON.parse(raw);
      if (!data.type) return;

      if (data.type === 'join') {
        lessonId = data.lessonId || '';
        myId = data.id || 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2);
        var room = getRoom(lessonId);
        room.set(ws, {
          id: myId,
          role: data.role || 'student',
          name: data.name || 'Участник'
        });
        var list = getParticipants(lessonId);
        sendToRoom(lessonId, { type: 'participants', participants: list });
        return;
      }

      if (!lessonId) return;
      data.fromId = myId;
      broadcastToRoom(lessonId, data, ws);
    } catch (e) {
      console.warn('message parse error', e);
    }
  });

  ws.on('close', function() {
    if (lessonId) {
      getRoom(lessonId).delete(ws);
      var list = getParticipants(lessonId);
      sendToRoom(lessonId, { type: 'participants', participants: list });
      if (getRoom(lessonId).size === 0) delete rooms[lessonId];
    }
  });
});

server.listen(PORT, '0.0.0.0', function() {
  console.log('WebSocket server on port', PORT);
});
