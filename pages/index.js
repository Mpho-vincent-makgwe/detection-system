import { useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import dynamic from 'next/dynamic';

// Dynamically import ml5.js without server-side rendering
const ml5 = dynamic(() => import('ml5'), { ssr: false });

export default function Home() {
    const videoRef = useRef();
    const canvasRef = useRef();
    const objectCanvasRef = useRef(); // For object detection
    let objectDetector;

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models'; // Ensure this path is correct for your models
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
            ]);

            // Load object detection model
            const ml5Loaded = await ml5; // Wait for ml5.js to load

            // Check if objectDetector is a function
            if (typeof ml5Loaded.objectDetector === 'function') {
                objectDetector = await ml5Loaded.objectDetector('cocossd', () => {
                    console.log('Object Detection Model Loaded');
                });
            } else {
                console.error('objectDetector is not a function');
            }
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
                const objectCanvas = objectCanvasRef.current;
                const displaySize = {
                    width: videoRef.current.width,
                    height: videoRef.current.height,
                };

                faceapi.matchDimensions(canvas, displaySize);
                faceapi.matchDimensions(objectCanvas, displaySize); // Match the object canvas

                setInterval(async () => {
                    // Face Detection
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

                    // Object Detection (for animals and objects)
                    if (objectDetector) {
                        objectDetector.detect(videoRef.current, (err, results) => {
                            if (err) {
                                console.error(err);
                                return;
                            }

                            const objectCtx = objectCanvas.getContext('2d');
                            objectCtx.clearRect(0, 0, objectCanvas.width, objectCanvas.height);

                            results.forEach((result) => {
                                const { label, confidence, x, y, width, height } = result;
                                objectCtx.beginPath();
                                objectCtx.rect(x, y, width, height);
                                objectCtx.lineWidth = 2;
                                objectCtx.strokeStyle = 'blue';
                                objectCtx.fillStyle = 'blue';
                                objectCtx.stroke();
                                objectCtx.fillText(
                                    `${label} (${Math.round(confidence * 100)}%)`,
                                    x,
                                    y > 10 ? y - 5 : 10
                                );
                            });
                        });
                    }
                }, 100); // Interval for processing the frames
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
            {/* Face Detection Canvas */}
            <canvas
                ref={canvasRef}
                style={{ position: 'absolute', top: 0, left: 0 }}
            />
            {/* Object Detection Canvas */}
            <canvas
                ref={objectCanvasRef}
                style={{ position: 'absolute', top: 0, left: 0 }}
            />
        </div>
    );
}
