
# ![RENDEZVOUS](Cover.png)
# Rendezvous
<table>
<tr>
<td>
  Rendezvous is a Microsoft Teams Clone built as a part of Engage 2021. It leverages WebRTC and PUSHER to provide various 
  real-time functionalities. Built using ReactJS,Node.js and Socket.io. #Be_Agile.
</td>
</tr>
</table>


## Working Prototype
Rendezvous is live at : 'https://rendezvous-meet.azurewebsites.net'

## Project File/Folder Description

<ul>
  <li><b>/src/Homepage(UI)</b> - Where all the UI of homepage is handled.</li>
  <li><b>/src/App.js</b> - React Routes Handled here.</li>
  <li><b>/src/Homepage.js</b> - The file for rendering the homepage</li>
  <li><b>/src/Video.js</b> - The file for rendering the video-calling experience</li>
  <li><b>/Editor</b> - Static files for the Online Collab Editor.</li>
  <li><b>server.js</b> -Server Side code.
</ul>

## Features
- Hassle-free no sign-up WebApp.
- Supports Video-Calling and 'Chat'.
- Supports Screen-share,File-share and Recording
- Access to white-board for real-time text-sync.
- Access previous meeting 'chats' anytime.

## Tips for Usage
- Works well with two browser tabs or devices on the same network
- Before receiving a file,file-tab must be open before-hand.



## Built with

- [WebRTC API](https://webrtc.org/)-API for Real-time communication capability.
- [PUSHER](https://pusher.com/)-API for Real-time communication capability.
- [Material-UI](https://material-ui.com/) - A popular React UI frame work.
- [Unsplash](https://unsplash.com/) - Source for freely-usable images.

## Local Installation

1. `yarn install`
2. `yarn build`
3. `node server.js`





