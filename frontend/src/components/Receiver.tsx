import { useEffect, useRef } from "react";

const Receiver = () => {
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const ownVideoRef = useRef<HTMLVideoElement>(null);
    
    let pc: RTCPeerConnection | null = null
    useEffect(() => {
        const socket = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL)

        socket.onopen = () => {
            socket.send(JSON.stringify({ type: 'receiver' }));
        };

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            if (!pc)  pc = new RTCPeerConnection();

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket?.send(JSON.stringify({ type: 'iceCandidate', candidate: event.candidate }));
                }
            };

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

            if (message.type === "createOffer") {
                await pc.setRemoteDescription(message.sdp);

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.send(JSON.stringify({ type: 'createAnswer', sdp: pc.localDescription }));
            } else if (message.type === "iceCandidate") {
                await pc.addIceCandidate(message.candidate);
            }
        };

        return () => {
            socket.close();
            if (pc) {
                pc.close();
            }
        };
    }, []);

    async function startSendingVideo() {
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
            Receiver Page
            <video ref={videoRef} playsInline></video>
            <video ref={ownVideoRef} autoPlay playsInline width={200}></video>
            <button onClick={() => videoRef.current?.play()}>Start Video</button>
            <button onClick={startSendingVideo}>Send Video</button>

        </div>
    );
};

export default Receiver;
