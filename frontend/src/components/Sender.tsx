import { useEffect, useRef, useState } from "react";

const Sender = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);

    const mediaStreamRef = useRef<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const ownVideoRef = useRef<HTMLVideoElement>(null);

    let pc = new RTCPeerConnection();

    useEffect(() => {
        const socket = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL);
        socket.onopen = () => {
            socket.send(JSON.stringify({type: 'sender'}));

        }
        setSocket(socket);
    }, []); 

    async function startSendingVideo() {
        if(!socket) return;

        pc.onnegotiationneeded = async () => {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket?.send(JSON.stringify({type: 'createOffer', sdp: pc.localDescription}));
        }

        pc.ontrack = (event) => {
            console.log(event.track)
    
            if (!mediaStreamRef.current) {
                mediaStreamRef.current = new MediaStream();
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStreamRef.current;
                }
            }
    
            mediaStreamRef.current.addTrack(event.track);
        };

        pc.onicecandidate = (event) => {
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

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        if (ownVideoRef.current) {
            const videoOnlyStream = new MediaStream([stream.getVideoTracks()[0]]);
            ownVideoRef.current.srcObject = videoOnlyStream;
        }
        
        if (pc) {
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        }

    }
    return (
        <div>
            Sender Page
            <button onClick={startSendingVideo}>Send Video</button>
            <video ref={videoRef} playsInline></video>
            <video ref={ownVideoRef} width={100} autoPlay playsInline></video>
            <button onClick={() => videoRef.current?.play()}>Start Video</button>
        </div>
    );
}

export default Sender;