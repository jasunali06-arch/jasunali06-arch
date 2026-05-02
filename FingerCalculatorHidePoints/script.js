// Get HTML elements
var videoElement = document.getElementById('webcam');
var canvasElement = document.getElementById('canvas');
var canvasCtx = canvasElement.getContext('2d');
var resultText = document.getElementById('result');
var checkbox = document.getElementById("myCheckbox");

//hoose mode ("add" or "multiply")
var mode = "multiply";

//multiply
function multiplyHands(left, right) {
    return left * right;
}

//symbol
function getOperationSymbol(mode) {
    if (mode === "add") return "+";
    if (mode === "multiply") return "×";
    return "?";
}

//: clean output
function formatOutput(left, right, result, mode) {
    let symbol = getOperationSymbol(mode);
    return left + " " + symbol + " " + right + " = " + result;
}

// Function to count the number of extended fingers
function countFingers(landmarks, handLabel) {
    var count = 0;
    var tips = [8, 12, 16, 20];
    var base = [6, 10, 14, 18];

    // Thumb logic
    if (handLabel === "Right") {
        if (landmarks[4].x < landmarks[3].x) {
            count++;
        }
    } else {
        if (landmarks[4].x > landmarks[3].x) {
            count++;
        }
    }

    // Count other fingers
    for (var i = 0; i < tips.length; i++) {
        if (landmarks[tips[i]].y < landmarks[base[i]].y) {
            count++;
        }
    }
    return count;
}

// Configure MediaPipe Hands model
var hands = new Hands({
    locateFile: function (file) {
        return "https://cdn.jsdelivr.net/npm/@mediapipe/hands/" + file;
    }
});

hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

// Process results
hands.onResults(function (results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    var leftCount = 0;
    var rightCount = 0;
    var outputText = "";

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (var i = 0; i < results.multiHandLandmarks.length; i++) {
            var landmarks = results.multiHandLandmarks[i];
            var handedness = results.multiHandedness[i].label;

            if (false) {
                drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 3 });
                drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1 });
            }

            var fingerCount = countFingers(landmarks, handedness);

            if (handedness === "Left") {
                leftCount = fingerCount;
            } else if (handedness === "Right") {
                rightCount = fingerCount;
            }

            outputText += handedness + " hand: " + fingerCount + " fingers\n";
        }

        // supports add OR multiply
        var result;

        if (mode === "add") {
            result = leftCount + rightCount;
        } else if (mode === "multiply") {
            result = multiplyHands(leftCount, rightCount);
        }

        //formatted output  
        outputText += "\n" + formatOutput(leftCount, rightCount, result, mode);

    } else {
        outputText = "No hand detected";
    }

    resultText.innerText = outputText;
    canvasCtx.restore();
});

// Camera setup
var camera = new Camera(videoElement, {
    onFrame: async function () {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
});

// Start camera
camera.start();