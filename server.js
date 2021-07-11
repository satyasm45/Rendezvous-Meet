//Hnadle websockets connections
//Establishes Connection to PUSHER api
const express = require('express')
const http = require('http')
var cors = require('cors')
const app = express()
const path = require("path")
var xss = require("xss")
var Pusher = require('pusher');

  
  


var server = http.createServer(app)
var io = require("socket.io")(server, {
	cors: {
	  origin: "*",
	  methods: ["GET", "POST"]
	}
  });


  

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//Online collab editor
app.use('/editor',express.static(__dirname+'/Editor'));


//Pusher Credentials and Authentication
var pusher = new Pusher({
  appId: '1225902',
  key: '74d462616f27ee8c30b0',
  secret:  'fd59909242252c0473f9' 
});


app.post('/pusher/auth', function(req, res) {
  var socketId = req.body.socket_id;
  var channel = req.body.channel_name;
  var auth = pusher.authenticate(socketId, channel);
  res.send(auth);
});



	app.use(express.static(__dirname+"/build"))
	app.use((req, res) => {
		res.sendFile(path.join(__dirname+"/build/index.html"))
	})


app.set('port', (process.env.PORT || 4000))

sanitizeString = (str) => {
	return xss(str)
}

connections = {}
messages = {}
timeOnline = {}

io.on('connection', (socket) => {

	socket.on('join-call', (path) => {
		if(connections[path] === undefined){
			connections[path] = []
		}
		connections[path].push(socket.id)

		timeOnline[socket.id] = new Date()

		for(let a = 0; a < connections[path].length; ++a){
			io.to(connections[path][a]).emit("user-joined", socket.id, connections[path])
		}

		if(messages[path] !== undefined){
			for(let a = 0; a < messages[path].length; ++a){
				io.to(socket.id).emit("chat-message", messages[path][a]['data'], 
					messages[path][a]['sender'], messages[path][a]['socket-id-sender'])
			}
		}

		console.log(path, connections[path])
		socket.on('file-send-room', function (file) {
			for(let a = 0; a < connections[path].length; ++a){
				io.to(connections[path][a]).emit("file-out-room", file,socket.id)
			}
		});
		socket.on('file-send-room-result', function (file) {
			for(let a = 0; a < connections[path].length; ++a){
				io.to(connections[path][a]).emit('file-out-room-result', file,socket.id);
			}
		});
	})

	socket.on('signal', (toId, message) => {
		io.to(toId).emit('signal', socket.id, message)
	})

	socket.on('chat-message', (data, sender) => {
		data = sanitizeString(data)
		sender = sanitizeString(sender)

		var key
		var ok = false
		for (const [k, v] of Object.entries(connections)) {
			for(let a = 0; a < v.length; ++a){
				if(v[a] === socket.id){
					key = k
					ok = true
				}
			}
		}

		if(ok === true){
			if(messages[key] === undefined){
				messages[key] = []
			}
			messages[key].push({"sender": sender, "data": data, "socket-id-sender": socket.id})
			console.log("message", key, ":", sender, data)

			for(let a = 0; a < connections[key].length; ++a){
				io.to(connections[key][a]).emit("chat-message", data, sender, socket.id)
			}
		}
	})

	socket.on('disconnect', () => {
		var diffTime = Math.abs(timeOnline[socket.id] - new Date())
		var key
		for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {
			for(let a = 0; a < v.length; ++a){
				if(v[a] === socket.id){
					key = k

					for(let a = 0; a < connections[key].length; ++a){
						io.to(connections[key][a]).emit("user-left", socket.id)
					}
			
					var index = connections[key].indexOf(socket.id)
					connections[key].splice(index, 1)

					console.log(key, socket.id, Math.ceil(diffTime / 1000))

					if(connections[key].length === 0){
						delete connections[key]
					}
				}
			}
		}
	})


})

server.listen(app.get('port'), () => {
	console.log("listening on", app.get('port'))
})