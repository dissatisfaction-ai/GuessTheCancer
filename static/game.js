let selections = [];
let total_correct = 0;
let total_incorrect = 0;
let correctAnswersByRound = [];
const totalImages = 6; // Total number of images per round
let selectedTypes = [];


window.onload = function() {
    fetch('/reset', {method: 'POST'})
        .then(() => {
            let cancerTypeForm = document.getElementById("selectionArea");
            let startButton = document.getElementById("startButton");
            startButton.style.display = "block"; 
            cancerTypeForm.style.display = "block";  // Show cancer type form initially

            startButton.addEventListener("click", function() {
                let selectedCancerType = document.querySelector('input[name="cancerType"]:checked').value;
                if (selectedCancerType) {
                    cancerTypeForm.style.display = "none";  // Hide cancer type form when start button is clicked
                    startButton.style.display = "none";  
                    startNewGame(selectedCancerType);
                } else {
                    alert("Please select a cancer type to start the game.");
                }
            });
        });
}
function startNewGame() {
    let selectedType = document.querySelector('input[name="cancerType"]:checked').value;
    fetch('/start', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({cancerType: selectedType})
    })
        .then(response => response.json())
        .then(data => {
            selections = []; // Clear selections
            let images = data.images;
            let round = data.round;

            // Display round number
            let roundNumber = document.getElementById("roundNumber");
            if(roundNumber) roundNumber.innerText = "Round: " + round;

            document.getElementById("startButton").style.display = "none";
            let imageArea = document.getElementById("imageArea");
            imageArea.innerHTML = '';

            let gameArea = document.getElementById("gameArea");
            gameArea.style.display = "block";

            images.forEach(image => {
                let col = document.createElement("div");
            
                let imgContainer = document.createElement("div");
                imgContainer.classList.add("img-container");
            
                let img = document.createElement("img");
                img.src = '/static/' + image;
                img.classList.add("image-box");
            
                let checkMark = document.createElement("div");
                checkMark.classList.add("checkmark");
                checkMark.innerHTML = "&#10003;";  // Unicode character for checkmark
                checkMark.style.display = "none";  // Hidden by default
            
                imgContainer.addEventListener("click", function() {
                    this.classList.toggle("selected");
                    checkMark.style.display = this.classList.contains("selected") ? "block" : "none";
                    if (this.classList.contains("selected")) {
                        selections.push(image);
                    } else {
                        let index = selections.indexOf(image);
                        if (index !== -1) selections.splice(index, 1);
                    }
                });
            
                imgContainer.appendChild(img);
                imgContainer.appendChild(checkMark);
                col.appendChild(imgContainer);
                imageArea.appendChild(col);
            });
            

            // Hide the chart container when not needed
            document.getElementById('chartContainer').style.display = 'none';

            // Hide the next round and finish game buttons if they're visible
            document.getElementById("nextRoundButton").style.display = "none";
            document.getElementById("finishGameButton").style.display = "none";

            // Show the submit button
            document.getElementById("submitButton").style.display = "block";
            document.getElementById("submitButton").addEventListener("click", submitAnswers);
            document.getElementById("guess-indicator").style.display = "none";  // Hide guess indicator

            
            
            // Get the submit button
            let submitButton = document.getElementById("submitButton");

            // Create a new function with the same functionality as submitAnswers,
            // but using a different function reference so it can be removed
            function submitAnswersClone() {
                submitAnswers();
            }

            // Remove all previous event listeners
            let newButton = submitButton.cloneNode(true);
            submitButton.parentNode.replaceChild(newButton, submitButton);

            // Add the event listener to the new button
            newButton.addEventListener("click", submitAnswersClone);

            // Show the submit button
            newButton.style.display = "block";

            
            // At the start of the startNewGame function, hide the buttons
            document.getElementById("submitButton").classList.add("d-none");
            document.getElementById("nextRoundButton").classList.add("d-none");
            document.getElementById("finishGameButton").classList.add("d-none");

            // At the end of the startNewGame function, show the submit button
            document.getElementById("submitButton").classList.remove("d-none");

        });
}

function submitAnswers() {
    fetch('/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(selections)
    })
        .then(response => response.json())
        .then(results => {
            let images = Array.from(document.getElementsByClassName("image-box"));

            images.forEach(image => {
                let imgName = image.src.split('/').slice(-3).join('/'); // ensure that we are comparing the correct pat
                console.log(imgName);
                if (!results.fake_images.includes(imgName)) {
                    image.classList.add("correct");
                    image.parentElement.classList.add("correct");
                }
                // if image was fake but not selected, mark as incorrect
                if (results.fake_images.includes(imgName)) {
                    image.classList.add("incorrect");
                    image.parentElement.classList.add("incorrect");
                }
                
            });

            correctAnswersByRound.push((results.correct_guesses.length / totalImages) * 100);

            // Calculate score based on difference between correctly picked as fake and all fakes
            total_correct = results.total_correct;
            total_incorrect = results.total_incorrect;

            // Hide the submit button
            document.getElementById("submitButton").style.display = "none";
            document.getElementById("guess-indicator").style.display = "block";

            if (results.round < 10) {
                // Show the next round button
                document.getElementById("nextRoundButton").style.display = "block";
                document.getElementById("nextRoundButton").classList.remove("d-none");
            } 
            
            // Always display the finish game button after each submission
            document.getElementById("finishGameButton").style.display = "block";
            document.getElementById("finishGameButton").classList.remove("d-none");
            

        });
}



document.querySelectorAll("input[type='checkbox']:checked").forEach(checkbox => selectedTypes.push(checkbox.value));

document.getElementById("nextRoundButton").addEventListener("click", function() {
    // Hide the other two buttons
    document.getElementById("submitButton").style.display = "none";
    document.getElementById("finishGameButton").style.display = "none";
    startNewGame();
});

document.getElementById("finishGameButton").addEventListener("click", function() {
    let resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = `You got ${total_correct} correct and ${total_incorrect} incorrect.`;
    resultsDiv.style.display = "block";
    // In the click event listener for finishGameButton, hide the buttons when the game ends
    document.getElementById("nextRoundButton").classList.add("d-none");
    // document.getElementById("finishGameButton").classList.add("d-none");

    createChart();
    document.getElementById('chartContainer').style.display = 'block';
    document.getElementById("finishGameButton").classList.remove("hidden");

    // Hide game area
    document.getElementById("gameArea").style.display = "none";
    // Hide the other two buttons
    document.getElementById("submitButton").style.display = "none";
    document.getElementById("nextRoundButton").style.display = "none";
    // Change finish game button text to "Try again"
    let finishGameButton = document.getElementById("finishGameButton");
    finishGameButton.innerText = "Try again";
    // Add click event to reload the page
    finishGameButton.replaceWith(finishGameButton.cloneNode(true));
    document.getElementById("finishGameButton").addEventListener("click", () => location.reload());
});


// Preserve reference to the chart so we can destroy it later.
let chart;

function createChart() {
    // If the chart already exists, destroy it before we create a new one.
    if (chart) {
        chart.destroy();
    }

    const ctx = document.getElementById('myChart').getContext('2d');
    const roundsPlayed = correctAnswersByRound.length;

    // Calculate mean
    const mean = correctAnswersByRound.reduce((a, b) => a + b, 0) / roundsPlayed;
    const meanArray = Array(roundsPlayed).fill(mean);

    // Generate labels
    const labels = Array.from({length: roundsPlayed}, (_, i) => i + 1);

    // Function to determine the aspect ratio
    function getAspectRatio() {
        // Use matchMedia to check if the device is in portrait mode
        const isPortrait = window.matchMedia("(orientation: portrait)").matches;
        return isPortrait ? 1.2 : 1.2; // return 0.75 for portrait mode and 1.33 for landscape mode
    }

    // Event listener for orientation changes
    window.addEventListener("resize", function() {
        chart.options.aspectRatio = getAspectRatio();
        chart.update();
    });

    // When creating the chart
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Correct Answers by Round',
                    data: correctAnswersByRound,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                },
                {
                    label: 'Mean',
                    data: meanArray,
                    borderColor: 'gray',
                    borderDash: [5, 5],
                    fill: false
                }
            ]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Your Game Performance',
                    font: {
                        size: 20,
                    },
                    color: 'black'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            },
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: getAspectRatio() // Call the function to set the initial aspect ratio
        }
    });
    
}

// Listen for resize events
window.addEventListener('resize', () => {
    // Destroy the chart and recreate it
    if (chart) {
        chart.destroy();
        createChart();
    }
});