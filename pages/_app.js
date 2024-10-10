import "@/styles/globals.css";
import { useEffect } from "react";

export default function App({ Component, pageProps }) {
    useEffect(() => {
        const loadFaceApiScript = () => {
            return new Promise((resolve) => {
                const script = document.createElement("script");
                script.src = "https://cdn.jsdelivr.net/npm/face-api.js";
                script.async = true;
                script.onload = () => {
                    resolve(); // Resolve when the script loads
                };
                document.body.appendChild(script);
            });
        };

        loadFaceApiScript()
            .then(() => {
                console.log("Face-api.js loaded successfully");
            })
            .catch((error) => {
                console.error("Failed to load Face-api.js:", error);
            });

        // Cleanup function to remove the script if needed
        return () => {
            const existingScript = document.querySelector('script[src="https://cdn.jsdelivr.net/npm/face-api.js"]');
            if (existingScript) {
                document.body.removeChild(existingScript);
            }
        };
    }, []);

    return <Component {...pageProps} />;
}
