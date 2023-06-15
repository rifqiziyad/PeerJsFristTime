const roomId = location.pathname.substring(1);
const localStream = new MediaStream();
const remoteStream = new MediaStream();

const btnCamera = document.getElementById("btn-camera");
const btnMic = document.getElementById("btn-mic");

let peerMediaConnection;
const socket = io();
const peer = new Peer(undefined, {
  host: location.hostname,
  port: location.port,
  secure: false,
  path: "peerjs",
});

peer.on("open", (peerId) => {
  socket.emit("new-user", { roomId, peerId });
});

socket.on("another-user", async (remotePeerId) => {
  try {
    const [videoTrack, audioTrack] = await getLocalTracks({
      video: true,
      audio: true,
    });
    localStream.addTrack(videoTrack);
    localStream.addTrack(audioTrack);
    showStream("local");
  } catch (error) {
    alert("gagal menampilkan user media \n \n" + error);
  }
  const call = peer.call(remotePeerId, localStream);
  peerMediaConnection = call.peerConnection;
  call.on("stream", (stream) => {
    remoteStream.addTrack(stream.getVideoTracks()[0]);
    remoteStream.addTrack(stream.getVideoTracks()[0]);
    showStream("remote");
  });
});

peer.on("call", async (call) => {
  try {
    const [videoTrack, audioTrack] = await getLocalTracks({
      video: true,
      audio: true,
    });
    localStream.addTrack(videoTrack);
    localStream.addTrack(audioTrack);
    showStream("local");
  } catch (error) {
    alert("gagal menampilkan user media \n \n" + error);
  }
  call.answer(localStream);
  peerMediaConnection = call.peerConnection;
  call.on("stream", (stream) => {
    remoteStream.addTrack(stream.getVideoTracks()[0]);
    remoteStream.addTrack(stream.getVideoTracks()[0]);
    showStream("remote");
  });
});

function getLocalTracks(constraint) {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices
      .getUserMedia(constraint)
      .then((stream) => {
        if (constraint.video && constraint.audio) {
          resolve([stream.getAudioTracks()[0], stream.getVideoTracks()[0]]);
        }
        if (constraint.video) {
          resolve([stream.getVideoTracks()[0]]);
        }

        if (constraint.audio) {
          resolve([stream.getAudioTracks()[0]]);
        }
      })
      .catch((error) => reject(error));
  });
}

function showStream(type) {
  const videoElement =
    type === "local"
      ? document.getElementById("local-video")
      : document.getElementById("remote-video");
  videoElement.srcObject = type === "local" ? localStream : remoteStream;
  videoElement.onloadedmetadata = () => {
    videoElement.play();
  };
}

function stopTrack({ stream, kind = "both" }) {
  console.log(kind);
  const tracks =
    kind === "both"
      ? stream.getTracks()
      : stream.getTracks().filter((track) => track.kind === kind);
  tracks.forEach((track) => {
    track.enable = false;
    setTimeout(() => {
      track.stop();
      stream.removeTrack(track);
    }, 1000);
  });
}

function replaceTrackBeingSended({ track, kind }) {
  if (!peerMediaConnection) return;
  const rtpSenders = peerMediaConnection.getSender();
  const filteredRtpSenders = rtpSenders.filter(
    (rtpSender) => rtpSender.track.kind === kind
  );
  if (filteredRtpSenders.length === 0) return;
  const rtpSender = filteredRtpSenders[0];
  rtpSender.replaceTraclk(track);
}

async function buttonHandler(e) {
  const element = e.target;
  const kind = element.dataset.kind;
  if (element.dataset.state === "active") {
    stopTrack({ stream: localStream, kind });
    element.dataset.state = "stop";
  } else {
    try {
      const [track] = await getLocalTracks({ [kind]: true });
      localStream.addTrack(track);
    } catch (error) {
      alert(`gagal menampilkan user ${kind} \n \n ${error}`);
    } finally {
      element.dataset.state = "active";
    }
  }
}

btnCamera.addEventListener("click", buttonHandler);
btnMic.addEventListener("click", buttonHandler);
