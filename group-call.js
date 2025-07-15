let peerConnections = {};
let localStream;
let groupId;
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

async function startCall() {
  groupId = document.getElementById('group_id').value;
  if (!groupId) return alert('Enter group ID');

  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

  const localVideo = document.createElement('video');
  localVideo.srcObject = localStream;
  localVideo.autoplay = true;
  localVideo.muted = true;
  document.getElementById('videoContainer').appendChild(localVideo);

  supabase
    .channel(`group-call-${groupId}`)
    .on('broadcast', { event: 'signal' }, payload => {
      handleSignal(payload.payload);
    })
    .subscribe();

  broadcastSignal({ type: 'join', id: supabase.auth.user().id });
}

function broadcastSignal(message) {
  supabase.channel(`group-call-${groupId}`).send({
    type: 'broadcast',
    event: 'signal',
    payload: { ...message, sender: supabase.auth.user().id }
  });
}

async function handleSignal({ type, sender, sdp, candidate }) {
  if (sender === supabase.auth.user().id) return;

  if (type === 'join') {
    createPeerConnection(sender, true);
  }

  if (type === 'offer') {
    await createPeerConnection(sender, false, sdp);
  }

  if (type === 'answer') {
    await peerConnections[sender].setRemoteDescription(new RTCSessionDescription(sdp));
  }

  if (type === 'candidate') {
    await peerConnections[sender].addIceCandidate(new RTCIceCandidate(candidate));
  }
}

async function createPeerConnection(peerId, initiator, remoteSDP = null) {
  const pc = new RTCPeerConnection(config);
  peerConnections[peerId] = pc;

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  pc.ontrack = (event) => {
    const remoteVideo = document.createElement('video');
    remoteVideo.srcObject = event.streams[0];
    remoteVideo.autoplay = true;
    document.getElementById('videoContainer').appendChild(remoteVideo);
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      broadcastSignal({ type: 'candidate', candidate: event.candidate, to: peerId });
    }
  };

  if (initiator) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    broadcastSignal({ type: 'offer', sdp: offer, to: peerId });
  } else {
    await pc.setRemoteDescription(new RTCSessionDescription(remoteSDP));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    broadcastSignal({ type: 'answer', sdp: answer, to: peerId });
  }
}
