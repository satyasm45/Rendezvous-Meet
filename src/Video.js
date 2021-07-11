//The core video-calling component.
//Defines modules governing the various parts of the meeting room.
//Separate functions for separate functionalities

import React, { Component } from 'react'
import {io} from 'socket.io-client'
import faker from "faker"

import {IconButton, Badge, Input, Button} from '@material-ui/core'
import VideocamIcon from '@material-ui/icons/Videocam'
import VideocamOffIcon from '@material-ui/icons/VideocamOff'
import MicIcon from '@material-ui/icons/Mic'
import MicOffIcon from '@material-ui/icons/MicOff'
import ScreenShareIcon from '@material-ui/icons/ScreenShare'
import StopScreenShareIcon from '@material-ui/icons/StopScreenShare'
import CallEndIcon from '@material-ui/icons/CallEnd'
import ChatIcon from '@material-ui/icons/Chat'
import FileCopyIcon from '@material-ui/icons/FileCopy';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';

import { message } from 'antd'
import 'antd/dist/antd.css'

import { Row } from 'reactstrap'
import Modal from 'react-bootstrap/Modal'
import 'bootstrap/dist/css/bootstrap.css'
import "./Video.css"




//Uncomment during production
//const server_url = process.env.NODE_ENV === 'production' ? 'https://rendezvous-meet.azurewebsites.net' : "http://localhost:4000"

//For development mode
const server_url= "http://localhost:4000"

//Defining free stun servers
var connections = {}
const peerConnectionConfig = {
	'iceServers': [
		// { 'urls': 'stun:stun.services.mozilla.com' },
		{ 'urls': 'stun:stun1.l.google.com:19302' },
	]
}
var socket = null
var socketId = null
var elms = 0

class Video extends Component {
	constructor(props) {
		super(props)
			
		this.localVideoref = React.createRef()

		this.videoAvailable = false
		this.audioAvailable = false


		this.state = {
			video: false,
			audio: false,
			screen: false,
			showModal: false,
			screenAvailable: false,
			messages: [],
			message: "",
			newmessages: 0,
			askForUsername: true,
			username: faker.internet.userName(),
			fileshare_option:false,
			fileshare:false,
			record_option:false,
		}
		connections = {}

		this.getPermissions()
		
	}
	
	
	//Get permissions to access user's camera and microphone
	getPermissions = async () => {
		try{
			await navigator.mediaDevices.getUserMedia({ video: true })
				.then(() => this.videoAvailable = true)
				.catch(() => this.videoAvailable = false)

			await navigator.mediaDevices.getUserMedia({ audio: true })
				.then(() => this.audioAvailable = true)
				.catch(() => this.audioAvailable = false)

			if (navigator.mediaDevices.getDisplayMedia) {
				this.setState({ screenAvailable: true })
			} else {
				this.setState({ screenAvailable: false })
			}

			if (this.videoAvailable || this.audioAvailable) {
				navigator.mediaDevices.getUserMedia({ video: this.videoAvailable, audio: this.audioAvailable })
					.then((stream) => {
						window.localStream = stream
						this.localVideoref.current.srcObject = stream
					})
					.then((stream) => {})
					.catch((e) => console.log(e))
			}
		} catch(e) { console.log(e) }
	}

	getMedia = () => {
		this.setState({
			video: this.videoAvailable,
			audio: this.audioAvailable
		}, () => {
			this.getUserMedia()
			this.connecttoSocketServer()
		})
	}

	getUserMedia = () => {
		if ((this.state.video && this.videoAvailable) || (this.state.audio && this.audioAvailable)) {
			navigator.mediaDevices.getUserMedia({ video: this.state.video, audio: this.state.audio })
				.then(this.getUserMediaSuccess)
				.then((stream) => {})
				.catch((e) => console.log(e))
		} else  {
			try {
				console.log("audio off video off")
				let tracks = this.localVideoref.current.srcObject.getTracks()
				tracks.forEach(track => track.enabled=false)
			} catch (e) {}
		}
	}
	//Upon getting Success exchange the sdp(offer)
	getUserMediaSuccess = (stream) => {
		try {
			window.localStream.getTracks().forEach(track => track.enabled=true)
		} catch(e) { console.log(e) }

		window.localStream = stream
		this.localVideoref.current.srcObject = stream

		for (let id in connections) {
			if (id === socketId) continue

			connections[id].addStream(window.localStream)

			connections[id].createOffer().then((description) => {
				connections[id].setLocalDescription(description)
					.then(() => {
						socket.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
					})
					.catch(e => console.log(e))
			})
		}

		stream.getTracks().forEach(track => track.onended = () => {
			this.setState({
				video: false,
				audio: false,
			}, () => {
				try {
					let tracks = this.localVideoref.current.srcObject.getTracks()
					tracks.forEach(track => track.stop())
				} catch(e) { console.log(e) }

				let blackSilence = (...args) => new MediaStream([this.black(...args), this.silence()])
				window.localStream = blackSilence()
				this.localVideoref.current.srcObject = window.localStream

				for (let id in connections) {
					connections[id].addStream(window.localStream)

					connections[id].createOffer().then((description) => {
						connections[id].setLocalDescription(description)
							.then(() => {
								socket.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
							})
							.catch(e => console.log(e))
					})
				}
			})
		})
	}

	getDislayMedia = () => {
		if (this.state.screen) {
			if (navigator.mediaDevices.getDisplayMedia) {
				navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
					.then(this.getDislayMediaSuccess)
					.then((stream) => {})
					.catch((e) => console.log(e))
			}
		}
	}

	getDislayMediaSuccess = (stream) => {
		try {
			window.localStream.getTracks().forEach(track => track.stop())
		} catch(e) { console.log(e) }

		window.localStream = stream
		this.localVideoref.current.srcObject = stream

		for (let id in connections) {
			if (id === socketId) continue

			connections[id].addStream(window.localStream)

			connections[id].createOffer().then((description) => {
				connections[id].setLocalDescription(description)
					.then(() => {
						socket.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
					})
					.catch(e => console.log(e))
			})
		}

		stream.getTracks().forEach(track => track.onended = () => {
			this.setState({
				screen: false,
			}, () => {
				try {
					let tracks = this.localVideoref.current.srcObject.getTracks()
					tracks.forEach(track => track.stop())
				} catch(e) { console.log(e) }

				let blackSilence = (...args) => new MediaStream([this.black(...args), this.silence()])
				window.localStream = blackSilence()
				this.localVideoref.current.srcObject = window.localStream

				this.getUserMedia()
			})
		})
	}

	gotMessageFromServer = (fromId, message) => {
		var signal = JSON.parse(message)

		if (fromId !== socketId) {
			if (signal.sdp) {
				connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
					if (signal.sdp.type === 'offer') {
						connections[fromId].createAnswer().then((description) => {
							connections[fromId].setLocalDescription(description).then(() => {
								socket.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
							}).catch(e => console.log(e))
						}).catch(e => console.log(e))
					}
				}).catch(e => console.log(e))
			}

			if (signal.ice) {
				connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
			}
		}
	}
	//Function to dynamically adjust the screen as more and more users join.
	changeCssVideos = (main) => {
		let widthMain = main.offsetWidth
		let minWidth = "30%"
		if ((widthMain * 30 / 100) < 300) {
			minWidth = "300px"
		}
		let minHeight = "40%"

		let height = String(100 / elms) + "%"
		let width = ""
		if(elms === 0 || elms === 1) {
			width = "100%"
			height = "100%"
		} else if (elms === 2) {
			width = "45%"
			height = "100%"
		} else if (elms === 3 || elms === 4) {
			width = "35%"
			height = "50%"
		} else {
			width = String(100 / elms) + "%"
		}

		let videos = main.querySelectorAll("video")
		for (let a = 0; a < videos.length; ++a) {
			videos[a].style.minWidth = minWidth
			videos[a].style.minHeight = minHeight
			videos[a].style.setProperty("width", width)
			videos[a].style.setProperty("height", height)
		}

		return {minWidth, minHeight, width, height}
	}

	//Video-Calling Functionality
	connecttoSocketServer=()=>{
		socket = io(server_url,{transports:['websocket']})
		console.log(server_url)

		socket.on('signal', this.gotMessageFromServer)

		socket.on('connect', () => {
			socket.emit('join-call', window.location.href)
			socketId = socket.id

			socket.on('chat-message', this.addMessage)

			socket.on('user-left', (id) => {
				let video = document.querySelector(`[data-socket="${id}"]`)
				if (video !== null) {
					elms--
					video.parentNode.removeChild(video)

					let main = document.getElementById('main')
					this.changeCssVideos(main)
				}
			})

			socket.on('user-joined', (id, clients) => {
				clients.forEach((socketListId) => {
					connections[socketListId] = new RTCPeerConnection(peerConnectionConfig)
					// Wait for their ice candidate       
					connections[socketListId].onicecandidate = function (event) {
						if (event.candidate != null) {
							socket.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
						}
					}

					// Wait for their video stream
					connections[socketListId].ontrack = (event) => {
						
						var searchVidep = document.querySelector(`[data-socket="${socketListId}"]`)
						if (searchVidep !== null) { 
							searchVidep.srcObject = event.streams[0];
						} else {
							elms = clients.length
							let main = document.getElementById('main')
							let cssMesure = this.changeCssVideos(main)

							let video = document.createElement('video')

							let css = {minWidth: cssMesure.minWidth, minHeight: cssMesure.minHeight, maxHeight: "100%", margin: "10px",
								borderStyle: "solid", borderColor: "red", objectFit: "fill"}
							for(let i in css) video.style[i] = css[i]

							video.style.setProperty("width", cssMesure.width)
							video.style.setProperty("height", cssMesure.height)
							video.setAttribute('data-socket', socketListId)
							video.srcObject = event.stream
							video.autoplay = true
							video.playsinline = true

							main.appendChild(video)
						}
					}

					// Add the local video stream
					if (window.localStream !== undefined && window.localStream !== null) {
						connections[socketListId].addStream(window.localStream)
					} else {
						console.log("not found")
						let blackSilence = (...args) => new MediaStream([this.black(...args), this.silence()])
						window.localStream = blackSilence()
						connections[socketListId].addStream(window.localStream)
					}
				})

				if (id === socketId) {
					for (let id2 in connections) {
						if (id2 === socketId) continue
						
						try {
							connections[id2].addStream(window.localStream)
						} catch(e) {}
			
						connections[id2].createOffer().then((description) => {
							connections[id2].setLocalDescription(description)
								.then(() => {
									socket.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
								})
								.catch(e => console.log(e))
						})
					}
				}
			})
		})
	}
	//Silence and black functions to create dummy tracks without audio/video.
	silence = () => {
		let ctx = new AudioContext()
		let oscillator = ctx.createOscillator()
		let dst = oscillator.connect(ctx.createMediaStreamDestination())
		oscillator.start()
		ctx.resume()
		return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
	}
	black = ({ width = 640, height = 480 } = {}) => {
		let canvas = Object.assign(document.createElement("canvas"), { width, height })
		canvas.getContext('2d').fillRect(0, 0, width, height)
		let stream = canvas.captureStream()
		return Object.assign(stream.getVideoTracks()[0], { enabled: false })
	}

	//Functions executed after clicking on the buttons
	handleVideo = () => this.setState({ video: !this.state.video }, () => this.getUserMedia())
	handleAudio = () => this.setState({ audio: !this.state.audio }, () => this.getUserMedia())
	handleScreen = () => this.setState({ screen: !this.state.screen }, () => this.getDislayMedia())
	handleFileSharing=()=>this.setState({fileshare_option:!this.state.fileshare_option,fileshare:!this.state.fileshare},()=>this.sendfile())
	handleRecording=()=>this.setState({record_option:!this.state.record_option},()=>this.record())

	//End-call Functionality
	handleEndCall = () => {
		try {
			let tracks = this.localVideoref.current.srcObject.getTracks()
			tracks.forEach(track => track.stop())
		} catch (e) {}
		window.location.href = "/"
	}

	//Chat Functionality
	openChat = () => this.setState({ showModal: true, newmessages: 0 })
	closeChat = () => this.setState({ showModal: false })
	handleMessage = (e) => this.setState({ message: e.target.value })

	addMessage = (data, sender, socketIdSender) => {
		this.setState(prevState => ({
			messages: [...prevState.messages, { "sender": sender, "data": data }],
		}))
		if (socketIdSender !== socketId) {
			this.setState({ newmessages: this.state.newmessages + 1 })
		}
	}

	handleUsername = (e) => this.setState({ username: e.target.value })

	sendMessage = () => {
		socket.emit('chat-message', this.state.message, this.state.username)
		this.setState({ message: "", sender: this.state.username })
	}
	//Copy URL to send invite links.
	copyUrl = () => {
		let text = window.location.href
		if (!navigator.clipboard) {
			let textArea = document.createElement("textarea")
			textArea.value = text
			document.body.appendChild(textArea)
			textArea.focus()
			textArea.select()
			try {
				document.execCommand('copy')
				message.success("Link copied to clipboard!")
			} catch (err) {
				message.error("Failed to copy")
			}
			document.body.removeChild(textArea)
			return
		}
		navigator.clipboard.writeText(text).then(function () {
			message.success("Link copied to clipboard!")
		}, () => {
			message.error("Failed to copy")
		})
	}

	connect = () => this.setState({ askForUsername: false }, () => this.getMedia())
	
	//Compatibility checking
	isChrome = function () {
		let userAgent = (navigator && (navigator.userAgent || '')).toLowerCase()
		let vendor = (navigator && (navigator.vendor || '')).toLowerCase()
		let matchChrome = /google inc/.test(vendor) ? userAgent.match(/(?:chrome|crios)\/(\d+)/) : null
		// let matchFirefox = userAgent.match(/(?:firefox|fxios)\/(\d+)/)
		// return matchChrome !== null || matchFirefox !== null
		return matchChrome !== null
	}
	
		
	//Routine for file sharing
	sendfile=()=>{
		console.log(this.state.fileshare_option)
			if(this.state.fileshare_option===true){
			const fileInput = document.querySelector('input#fileInput');
			const a = document.querySelector('a#download');
			var file;
            var currentChunk
			var fileReader = new FileReader();
			const chunkSize = 16384;
			let offset=0;

             function readSlice(o) {
                 fileReader.readAsArrayBuffer(file.slice(offset,o+chunkSize));
            }

            fileReader.onload = function () {
                socket.emit('file-send-room-result', fileReader.result);
                //p2pConnection.send( fileReader.result );
                offset+=fileReader.result.byteLength;
                if (offset < file.size) {
                    readSlice(offset);
                }
			}
			fileInput.addEventListener('change',function () {
                file = fileInput.files[0];
                currentChunk = 0;
                // send some metadata about our file
                // to the receiver
                socket.emit('file-send-room', JSON.stringify({
                    fileName: file.name,
                    fileSize: file.size
                }));
                readSlice(0);
				this.setState({fileshare:true})
            }.bind(this));
            var incomingFileInfo;
            var incomingFileData=[];
            var bytesReceived;
            var downloadInProgress = false;
            socket.on('file-out-room', function (data) {
                startDownload(data);

                console.log(data);
            });
            socket.on('file-out-room-result', function (data) {
                progressDownload(data);
                console.log(data);            });
            function startDownload(data) {
                incomingFileInfo = JSON.parse(data.toString());
                incomingFileData = [];
                bytesReceived = 0;
                downloadInProgress = true;
                console.log('incoming file <b>' + incomingFileInfo.fileName + '</b> of ' + incomingFileInfo.fileSize + ' bytes');
            }

            function progressDownload(data) {
                bytesReceived += data.byteLength;
                incomingFileData.push(data);
                console.log('progress: ' + ((bytesReceived / incomingFileInfo.fileSize ) * 100).toFixed(2) + '%');
				console.log(bytesReceived)
                if (bytesReceived === incomingFileInfo.fileSize) {
                    endDownload();
                }
            }

            function endDownload() {
                downloadInProgress = false;
                var blob = new Blob(incomingFileData);
                var url = window.URL.createObjectURL(blob);
                a.href = url;
                a.download = incomingFileInfo.fileName;
				a.textContent =
				`Click to download '${incomingFileInfo.fileName}' (${incomingFileInfo.fileSize} bytes)`;
			     a.style.display = 'block'
                
            }
		
	
		}
	
}
	//Routine for Recording
	record=()=>{
		if(this.state.record_option===true){

			let mediaRecorder;
			let recordedBlobs;

			const codecPreferences = document.querySelector('#codecPreferences');
			const possibleTypes = [
    			'video/webm;codecs=vp9,opus',
    			'video/webm;codecs=vp8,opus',
    			'video/webm;codecs=h264,opus',
    '			video/mp4;codecs=h264,aac',
 								 ];
			possibleTypes.forEach(mimeType => {
    			const option = document.createElement('option');
    			option.value = mimeType;
    			option.innerText = option.value;
    			codecPreferences.appendChild(option);
  				})
  			codecPreferences.disabled = false;


			const recordButton = document.querySelector('button#record');
			recordButton.addEventListener('click', () => {
  			if (recordButton.textContent === 'Start Recording') {
    				startRecording();
  			} else {
    				stopRecording();
    		recordButton.textContent = 'Start Recording';
    		downloadButton.disabled = false;
    		codecPreferences.disabled = false;
  			}
		});



		const downloadButton = document.querySelector('button#download');
		downloadButton.addEventListener('click', () => {
  		const blob = new Blob(recordedBlobs, {type: 'video/webm'});
  		const url = window.URL.createObjectURL(blob);
  		const a = document.createElement('a');
  		a.style.display = 'none';
  		a.href = url;
  		a.download = 'test.webm';
  		document.body.appendChild(a);
  		a.click();
  		setTimeout(() => {
    	document.body.removeChild(a);
    	window.URL.revokeObjectURL(url);
 		 }, 100);
		});

		function handleDataAvailable(event) {
  		console.log('handleDataAvailable', event);
  		if (event.data && event.data.size > 0) {
    	recordedBlobs.push(event.data);
  		}
		}


 
  

		function startRecording() {
  		recordedBlobs = [];
  		const mimeType = codecPreferences.options[codecPreferences.selectedIndex].value;
  		const options = {mimeType};
  		var arrayofstreams=[window.stream]

  		try {
    	mediaRecorder = new MediaRecorder(window.stream,options);
	
  		} catch (e) {
    	console.error('Exception while creating MediaRecorder:', e);
    	return;
  		}

  		console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  		recordButton.textContent = 'Stop Recording';
  		downloadButton.disabled = true;
  		codecPreferences.disabled = true;
  		mediaRecorder.onstop = (event) => {
    	console.log('Recorder stopped: ', event);
    	console.log('Recorded Blobs: ', recordedBlobs);
  		};
  		mediaRecorder.ondataavailable = handleDataAvailable;
 	    mediaRecorder.start(3000);
 		console.log('MediaRecorder started', mediaRecorder);
		}

		function stopRecording() {
 		 mediaRecorder.stop();
		}

		function handleSuccess(stream) {
  		recordButton.disabled = false;
  		console.log('getUserMedia() got stream:', stream);
  		window.stream = stream;

  
  
		}

		async function init(constraints) {
 		try {
    	const stream = await navigator.mediaDevices.getUserMedia(constraints);
    	handleSuccess(stream);
  		} catch (e) {
    	console.error('navigator.getUserMedia error:', e);
  		}
	}
		var mediaConstraints = {
   	 		audio: true,
    		video: true
		};
		init(mediaConstraints);
		}
	}






					


	render() {
		if(this.isChrome() === false){
			return (
				<div style={{background: "white", width: "30%", height: "auto", padding: "20px", minWidth: "400px",
						textAlign: "center", margin: "auto", marginTop: "50px", justifyContent: "center"}}>
					<h1>Sorry, this works only with Google Chrome</h1>
				</div>
			)
		}
		return (
			<div>
				{this.state.askForUsername === true ?
					<div >
						<div style={{background: "white", width: "30%", height: "auto", padding: "20px", minWidth: "400px",
								textAlign: "center", margin: "auto", marginTop: "50px", justifyContent: "center"}}>
							<p style={{ margin: 0, fontWeight: "bold", paddingRight: "50px" }}>Set your username</p>
							<Input placeholder="Username" value={this.state.username} onChange={e => this.handleUsername(e)} />
							<Button variant="contained" color="primary" onClick={this.connect} style={{ margin: "20px" }}>Connect</Button>
						</div>

						<div style={{ justifyContent: "center", textAlign: "center", paddingTop: "30px" }}>
							<video id="my-video" ref={this.localVideoref} autoPlay muted style={{
								borderStyle: "solid",borderColor: "black",objectFit: "fill",width: "50%",height: "5%"}}></video>
						</div>
					</div>
					:
					<div>
						<div className="btn-down" style={{ backgroundColor: "whitesmoke", color: "whitesmoke", textAlign: "center" }}>
							<IconButton style={{ color: "#424242" }} onClick={this.handleVideo}>
								{(this.state.video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
							</IconButton>

							<IconButton style={{ color: "#f44336" }} onClick={this.handleEndCall}>
								<CallEndIcon />
							</IconButton>

							<IconButton style={{ color: "#424242" }} onClick={this.handleAudio}>
								{this.state.audio === true ? <MicIcon /> : <MicOffIcon />}
							</IconButton>

							<IconButton style={{ color: "#424242" }}onClick={this.handleFileSharing}>
								<FileCopyIcon/>
							</IconButton>
							{this.state.fileshare_option===true?
							<div><div><form id="fileInfo">
							<input type="file" id="fileInput" name="files"/>
							</form></div>
							<div><a id="download"></a></div>
							</div>:null}
							<IconButton style={{ color: "red" }} onClick={this.handleRecording}>
								<FiberManualRecordIcon/>
							</IconButton>
							{this.state.record_option===true?
							 <div className="record_btn">
							 <button id="record">Start Recording</button>
							 <button id="download">Download</button>
							 <div>
        					Recording format: <select id="codecPreferences" disabled></select>
    						</div>
						 </div>
					 :null}	
								

							{this.state.screenAvailable === true ?
								<IconButton style={{ color: "#424242" }} onClick={this.handleScreen}>
									{this.state.screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
								</IconButton>
								: null}

							<Badge badgeContent={this.state.newmessages} max={999} color="secondary" onClick={this.openChat}>
								<IconButton style={{ color: "#424242" }} onClick={this.openChat}>
									<ChatIcon />
								</IconButton>
							</Badge>
						</div>

						<Modal show={this.state.showModal} onHide={this.closeChat} style={{ zIndex: "999999" }}>
							<Modal.Header closeButton>
								<Modal.Title>Chat Room</Modal.Title>
							</Modal.Header>
							<Modal.Body style={{ overflow: "auto", overflowY: "auto", height: "400px", textAlign: "left" }} >
								{this.state.messages.length > 0 ? this.state.messages.map((item, index) => (
									<div key={index} style={{textAlign: "left"}}>
										<p style={{ wordBreak: "break-all" }}><b>{item.sender}</b>: {item.data}</p>
									</div>
								)) : <p>No message yet</p>}
							</Modal.Body>
							<Modal.Footer className="div-send-msg">
								<Input placeholder="Message" value={this.state.message} onChange={e => this.handleMessage(e)} />
								<Button variant="contained" color="primary" onClick={this.sendMessage}>Send</Button>
							</Modal.Footer>
						</Modal>

						<div className="container" style={{backgroundImage:`url('https://images.unsplash.com/photo-1584531979583-18c5c4b25efc?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=334&q=80')`}}>
							<div style={{ paddingTop: "20px" }}>
								<Input value={window.location.href} disable="true"></Input>
								<Button style={{backgroundColor: "#3f51b5",color: "whitesmoke",marginLeft: "20px",
									marginTop: "10px",width: "120px",fontSize: "10px"
								}} onClick={this.copyUrl}>Copy invite link</Button>
							</div>

							<Row id="main" className="flex-container" style={{ margin: 0, padding: 0 }}>
								<video id="my-video" ref={this.localVideoref} autoPlay muted style={{
									borderStyle: "solid",borderColor: "blue",margin: "10px",objectFit: "fill",
									width: "100%",height: "100%"}}></video>
							</Row>
						</div>
					</div>
				}
			</div>
		)
	}
}

export default Video
