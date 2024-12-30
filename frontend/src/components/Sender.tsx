import { useEffect, useState } from "react";

const Sender = () => {

    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const socket = new WebSocket('wss://localhost:8080');
        socket.onopen = () => {
            socket.send(JSON.stringify({type: 'sender'}));

        }
        setSocket(socket);
    }, []); 

    async function startSendingVideo() {
        if(!socket) return;

        const pc = new RTCPeerConnection();
        pc.onnegotiationneeded = async () => {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket?.send(JSON.stringify({type: 'createOffer', sdp: pc.localDescription}));
        }
        pc.onicecandidate = (event) => {
            console.log(event);
            if(event.candidate) {
                socket?.send(JSON.stringify({type: 'iceCandidate', candidate: event.candidate}));
            };
        }

        socket.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            if(data.type === "createAnswer") {
                await pc.setRemoteDescription(data.sdp);
            } else if(data.type === "iceCandidate") {
                await pc.addIceCandidate(data.candidate);
            }
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        pc.addTrack(stream.getVideoTracks()[0]);
            
    }
    return (
        <div>
            Sender Page
            <button onClick={startSendingVideo}>Send Video</button>
        </div>
    );
}

export default Sender;