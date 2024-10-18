// Constants
const DISPLAY_BLOCK = "█";
const EMPTY_BLOCK = " ";
const DEFAULT_VIDEO = "videos/Bad Apple.mp4";
const COLOUR_THRESHOLD = 128;
const FRAME_RATE = 30;
const MAX_LOAD_TIME = 10;
const DISPLAY_TEXT_SIZE = 16;
const FRAME_TEXT_SIZE = 5;
const FRAME_SIZE = 0.95;

// Variables
var video = document.createElement("video");
var canvas = document.createElement("canvas");
var resolution;
var frames = [];
var playState = "stopped";
var inverted = false;

// Functions
function setResolution(manual = false) {
  // Check for manual resolution
  const widthInput = document.getElementById("widthInput");
  const heightInput = document.getElementById("heightInput");

  // Auto resize based on window size
  if (!manual || (widthInput.value == "0" && heightInput.value == "0")) {
    // Set DOM properties
    const frameBox = document.getElementById("frameBox");
    const frameText = document.getElementById("frameText");
    const maxWidth =
      Math.min(frameBox.offsetWidth, window.innerWidth) * FRAME_SIZE;
    const maxHeight =
      Math.min(frameBox.offsetHeight, window.innerHeight) * FRAME_SIZE;
    const frameContent = frameText.innerHTML;

    // Reset display text size
    const originalFontSize = frameText.style.fontSize;
    frameText.style.fontSize = `${FRAME_TEXT_SIZE}px`;

    // Clear frame
    frameText.innerHTML = "";

    // Add characters to find maximum amount of characters per line in frame
    let text = "";
    let numCharacters = 0;
    while (frameText.offsetWidth < maxWidth) {
      text += DISPLAY_BLOCK;
      frameText.innerHTML = text;
      numCharacters += 1;
    }
    frameText.innerHTML = "";

    // Add line breaks to find maximum amount of lines within frame
    text = "";
    let lineCount = 0;
    while (frameText.offsetHeight < maxHeight) {
      text += "<br>";
      frameText.innerHTML = text;
      lineCount += 1;
    }
    frameText.innerHTML = frameContent;

    // Reset font size
    frameText.style.fontSize = originalFontSize;

    // Adjust for final resolution based on frame size
    resolution = [numCharacters - 1, lineCount - 1];

    // Set canvas for frame processing
    canvas.width = resolution[0];
    canvas.height = resolution[1];
    // Set fixed resolution size
  } else if (manual && widthInput.value != "0" && heightInput.value != "0") {
    widthInput.value = Math.min(widthInput.value, widthInput.max);
    widthInput.value = Math.max(widthInput.value, widthInput.min);
    heightInput.value = Math.min(heightInput.value, heightInput.max);
    heightInput.value = Math.max(heightInput.value, heightInput.min);

    if (widthInput.value != "0" && heightInput.value != "0") {
      resolution = [widthInput.value, heightInput.value];
      canvas.width = resolution[0];
      canvas.height = resolution[1];
    } else if (widthInput.value == "0" && heightInput.value == "0") {
      setResolution();
    }
  }
}

function setFrames(repeat = true) {
  // Set frame and drawing elements
  const frameText = document.getElementById("frameText");
  const context = canvas.getContext("2d");

  // Draw current frame
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Get pixels of frame
  const frameData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = frameData.data;

  // Iterate through pixels
  let currentFrame = "";
  for (let i = 0; i < pixels.length; i += 4) {
    // Set text to display block according to brightness of pixel
    const pixelBrightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    // Account for inverted colours
    if (
      (!inverted && pixelBrightness > COLOUR_THRESHOLD) ||
      (inverted && pixelBrightness < COLOUR_THRESHOLD)
    ) {
      currentFrame += DISPLAY_BLOCK;
    } else {
      currentFrame += EMPTY_BLOCK;
    }
    // Draw next line according to resolution
    if ((i + 4) % (canvas.width * 4) === 0) {
      currentFrame += "\n";
    }
  }

  // Check if video still playing
  if (repeat && playState == "playing") {
    // Update array and text frame
    frames.push(currentFrame);
    frameText.innerHTML = currentFrame;

    // Repeat for next frame
    setTimeout(setFrames, 1000 / FRAME_RATE);
    // Return currently processed frame
  } else {
    return currentFrame;
  }
}

function setupVideo(reset) {
  if (video.src) {
    // Set frame DOMs
    const frameText = document.getElementById("frameText");
    const videoLabel = document.getElementById("videoLabel");

    // Reset/Setup video and frame properties
    if (reset) {
      video.pause();
      video.currentTime = 0;
      videoName = videoLabel.textContent.slice("Video: ".length);

      playState = "ready";
      frameText.innerHTML = `'${videoName}' ready to play`;
      // Set end of video properties
    } else {
      playState = "stopped";
      frameText.innerHTML = "End of Video";
    }

    // Reset Font size
    frameText.style.fontSize = `${DISPLAY_TEXT_SIZE}px`;
  }
}

function playVideo() {
  if (video.src && playState != "loading") {
    // Pause video
    if (playState == "playing") {
      video.pause();
      playState = "paused";
      // Play video once loaded
    } else {
      video.play();
      playState = "playing";

      const frameText = document.getElementById("frameText");
      frameText.style.fontSize = `${FRAME_TEXT_SIZE}px`;

      // Play text frames at set frame rate
      setTimeout(setFrames, 1000 / FRAME_RATE);
    }
  }
}

function handleFileUpload(event) {
  // Check for valid/default video file
  let fileInput;
  if (event == DEFAULT_VIDEO) {
    fileInput = DEFAULT_VIDEO;
  } else {
    fileInput = event.target.files[0];
  }
  if (fileInput) {
    // Set labels
    const videoLabel = document.getElementById("videoLabel");
    const frameText = document.getElementById("frameText");
    // Set video properties
    let videoURL;
    let videoName = "-";
    if (fileInput == DEFAULT_VIDEO) {
      videoURL = fileInput;
      videoName = DEFAULT_VIDEO.replace("videos/", "");
    } else {
      videoURL = URL.createObjectURL(fileInput);
      videoName = fileInput["name"].substring(
        0,
        fileInput["name"].length -
          fileInput["name"].split("").reverse().indexOf(".") -
          1
      );
    }
    video.src = videoURL;
    playState = "loading";

    // Reset frames
    frames = [];

    // Update label states
    videoLabel.innerHTML = `Video: ${videoName}`;
    frameText.innerHTML = "Loading...";
    video.addEventListener("loadeddata", function () {
      setupVideo(true);
    });
    video.addEventListener("ended", function () {
      setupVideo(false);
    });
    setTimeout(function () {
      if (!video.duration) {
        document.getElementById("frameText").innerHTML = "Cannot load file";
      }
    }, 1000 * MAX_LOAD_TIME);
  }
}

function initialiseEvents() {
  // Set DOM properties
  const fileInput = document.getElementById("fileInput");
  const widthInput = document.getElementById("widthInput");
  const heightInput = document.getElementById("heightInput");

  // Set resize events
  window.addEventListener("resize", setResolution);
  setResolution();
  widthInput.max = resolution[0];
  heightInput.max = resolution[1];

  // Set video events
  fileInput.addEventListener("change", handleFileUpload);
  handleFileUpload(DEFAULT_VIDEO);
}

// Initialising events when DOM loaded
document.addEventListener("DOMContentLoaded", initialiseEvents);
