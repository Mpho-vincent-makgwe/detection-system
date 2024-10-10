import { useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

export default function Home() {
    const videoRef = useRef();
    const canvasRef = useRef();

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models'; // Ensure this path is correct for your models
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
            ]);
        };

        loadModels().then(startVideo);
    }, []);

    const startVideo = () => {
        navigator.mediaDevices
            .getUserMedia({ video: {} })
            .then((stream) => {
                videoRef.current.srcObject = stream;
            })
            .catch((err) => console.error('Error accessing video stream:', err));
    };

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.addEventListener('play', async () => {
                const canvas = canvasRef.current;
                const displaySize = {
                    width: videoRef.current.width,
                    height: videoRef.current.height,
                };

                faceapi.matchDimensions(canvas, displaySize);

                setInterval(async () => {
                    const detections = await faceapi
                        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                        .withFaceLandmarks()
                        .withFaceExpressions();
                    const resizedDetections = faceapi.resizeResults(detections, displaySize);
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    faceapi.draw.drawDetections(canvas, resizedDetections);
                    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
                    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
                }, 100);
            });
        }
    }, [videoRef]);

    return (
        <div style={{ position: 'relative', width: '720px', height: '560px' }}>
            <video
                ref={videoRef}
                autoPlay
                muted
                width="720"
                height="560"
                style={{ position: 'absolute', top: 0, left: 0 }}
            />
            <canvas
                ref={canvasRef}
                style={{ position: 'absolute', top: 0, left: 0 }}
            />
        </div>
    );
}
