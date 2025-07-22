import React, { useState} from "react";
import "./App.css";

import { Pose } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";

export default function App() {
  const [gatePassed, setGatePassed] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [score, setScore] = useState(null);
  const [tip, setTip] = useState("");
  const [error, setError] = useState(null);



  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch("/.netlify/functions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone }),
      });
  
      const result = await response.json();
  
      if (!result.success) {
        throw new Error(result.error || "Submission failed");
      }
  
      setGatePassed(true);
      setEmail("");
      setPhone("");
      setError(null);
    } catch (err) {
      console.error("Client error:", err);
      setError("Something went wrong. Please try again.");
    }
  };
  

  async function enableCamera() {
    const video = document.getElementById("video");
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    startPose();
    document.getElementById("viewer").style.display = "block";
  }

  function startPose() {
    const video = document.getElementById("video");

    const pose = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });
    pose.setOptions({ modelComplexity: 0 });
    pose.onResults(onResults);

    const cam = new Camera(video, {
      onFrame: async () => {
        await pose.send({ image: video });
      },
      width: 320,
      height: 240,
    });
    cam.start();
  }

  function onResults(results) {
    const canvas = document.getElementById("output");
    const ctx = canvas.getContext("2d");

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.poseLandmarks) {
      ctx.fillStyle = "red";
      const leftEar = results.poseLandmarks[15];
      const leftShoulder = results.poseLandmarks[11];

      [leftEar, leftShoulder].forEach((p) =>
        ctx.fillRect(p.x * 320, p.y * 240, 4, 4)
      );

      const neckDelta = (leftEar.x - leftShoulder.x) * 100;
      let pct = Math.max(0, 100 - Math.abs(neckDelta * 300));
      pct = Math.round(pct);

      setScore(pct);

      if (pct < 70)
        setTip("Pull your head back and lift your chest ⬆️");
      else if (pct < 90)
        setTip("Small tweak: roll shoulders back 🙂");
      else
        setTip("Great posture – keep it up! 🎉");
    }

    ctx.restore();
  }

  return (
    <div className="App">
      {!gatePassed && (
        <section id="landing">
          <h1>Fix Your Posture in 5 Seconds</h1>
          <p>
            Get early access to AlignAI — a posture coach that runs from your camera. No wearables.
          </p>

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="tel"
              name="phone"
              placeholder="Enter your phone number"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button type="submit">Join the Waitlist</button>
            {error && <p style={{ color: "red" }}>{error}</p>}
          </form>
        </section>
      )}

      {gatePassed && (
        <section id="snapshot">
          <h2>Posture Snapshot</h2>
          <button onClick={enableCamera}>Turn On Camera</button>

          <div id="viewer" style={{ display: "none" }}>
            <video id="video" width="320" height="240" autoPlay muted></video>
            <canvas id="output" width="320" height="240"></canvas>

            {score !== null && (
              <>
                <h3>Posture Score: {score}%</h3>
                <p>{tip}</p>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
