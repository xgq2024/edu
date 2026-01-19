/**
 * 写作助手专业建议：
 * 1. 采用模块化导入，确保 MediaPipe 依赖版本一致。
 * 2. 增加了逻辑防抖（Cooldown），避免单次触发产生冗余结果。
 * 3. 增强了手势判定的物理参数，提升识别准确率。
 */

import { HandLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const statusText = document.getElementById("status-text");
const divinationText = document.getElementById("divination-text");
const instruction = document.getElementById("instruction");

let handLandmarker = undefined;
let lastVideoTime = -1;
let isCooldown = false; // 防止连续触发

const tarotDeck = [
    "【大阿卡纳 · 愚者】 象征纯真与新的旅程。放下恐惧，未知的世界正等待你探索。",
    "【大阿卡纳 · 女祭司】 象征直觉与潜意识。此刻无需行动，只需静听内心的声音。",
    "【大阿卡纳 · 命运之轮】 象征不可抗拒的转变。顺应时势，好运正在循环而至。",
    "【大阿卡纳 · 星辰】 象征希望与治愈。漫长黑夜已过，星光将指引你的前路。",
    "【大阿卡纳 · 隐士】 象征反省与引导。向内寻求答案，而非向外索取认同。"
];

async function initSystem() {
    try {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 1
        });
        statusText.innerText = "星象引擎已就绪";
        startWebcam();
    } catch (error) {
        statusText.innerText = "初始化失败: " + error;
    }
}

function startWebcam() {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
    });
}

function checkGesture(landmarks) {
    // 核心判定逻辑：食指伸直 (8号点低于6号点)，且中指收起 (12号点高于10号点)
    const indexTip = landmarks[8].y;
    const indexPip = landmarks[6].y;
    const middleTip = landmarks[12].y;
    const middlePip = landmarks[10].y;

    return indexTip < indexPip && middleTip > middlePip;
}

function performDivination() {
    if (isCooldown) return;
    isCooldown = true;

    instruction.style.display = "none";
    divinationText.innerText = "正在感应你的能量...";
    
    setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * tarotDeck.length);
        divinationText.innerText = tarotDeck[randomIndex];
        
        // 设置3秒冷却时间，增加交互的仪式感
        setTimeout(() => {
            isCooldown = false;
        }, 3000);
    }, 1500);
}

async function predictWebcam() {
    if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const results = handLandmarker.detectForVideo(video, performance.now());

        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        
        if (results.landmarks) {
            const drawingUtils = new DrawingUtils(canvasCtx);
            for (const landmarks of results.landmarks) {
                // 绘制视觉反馈
                drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: "#d4af37", lineWidth: 2 });
                drawingUtils.drawLandmarks(landmarks, { color: "#ffffff", radius: 2 });

                // 判定手势
                if (checkGesture(landmarks)) {
                    performDivination();
                }
            }
        }
    }
    window.requestAnimationFrame(predictWebcam);
}

initSystem();