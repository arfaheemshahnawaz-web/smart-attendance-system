import * as faceapi from "face-api.js";

const MODEL_URL = "/models";

let modelsLoaded = false;

export async function loadFaceModels() {
  if (modelsLoaded) return;

  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

  modelsLoaded = true;
}

export async function getFaceEmbedding(
  video: HTMLVideoElement
): Promise<number[] | null> {
  await loadFaceModels();

  const detection = await faceapi
    .detectSingleFace(
      video,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 224,
        scoreThreshold: 0.5,
      })
    )
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;

  return Array.from(detection.descriptor);
}