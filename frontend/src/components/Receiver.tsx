import { useEffect, useRef } from "react";

const Receiver = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        const socket = new WebSocket('wss://localhost:8080');
        let pc: RTCPeerConnection | null = null;

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

    

    return (
        <div>
            Receiver Page
            <video ref={videoRef} autoPlay playsInline muted></video>
        </div>
    );
};

export default Receiver;
