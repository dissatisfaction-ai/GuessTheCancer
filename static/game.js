let selections = [];
let total_correct = 0;
let total_incorrect = 0;
let correctAnswersByRound = [];
const totalImages = 3; // Total number of images per round



window.onload = function() {
    fetch('/reset', {method: 'POST'})
        .then(() => {
            document.getElementById("startButton").addEventListener("click", startNewGame);
        });
}

function startNewGame() {
    document.getElementById("results").style.display = "none"; // Hide results if shown
    fetch('/start', {method: 'POST'})
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
                // col.className = "col-6 col-md-4 mb-4";  // Bootstrap classes for responsive design
            
                let img = document.createElement("img");
                img.src = '/static/' + image;
                img.classList.add("image-box");
                img.addEventListener("click", function() {
                    this.classList.toggle("selected");
                    if (this.classList.contains("selected")) {
                        selections.push(image);
                    } else {
                        let index = selections.indexOf(image);
                        if (index !== -1) selections.splice(index, 1);
                    }
                });
                col.appendChild(img);  // Add the img to the col element
                imageArea.appendChild(col);  // Add the col to the imageArea
            });

            // Hide the chart container when not needed
            document.getElementById('chartContainer').style.display = 'none';

            // Hide the next round and finish game buttons if they're visible
            document.getElementById("nextRoundButton").style.display = "none";
            document.getElementById("finishGameButton").style.display = "none";

            // Show the submit button
            document.getElementById("submitButton").style.display = "block";
            document.getElementById("submitButton").addEventListener("click", submitAnswers);
            
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
                let imgName = image.src.split('/').slice(-2).join('/'); // ensure that we are comparing the correct path
                if (results.correct_guesses.includes(imgName)) {
                    image.classList.add("correct");
                }
                // if image was fake but not selected, mark as incorrect
                if (!selections.includes(imgName) && results.fake_images.includes(imgName)) {
                    image.classList.add("incorrect");
                }
                
            });

            correctAnswersByRound.push((results.correct_guesses.length / totalImages) * 100);

            // Calculate score based on difference between correctly picked as fake and all fakes
            total_correct = results.total_correct;
            total_incorrect = results.total_incorrect;

            // Hide the submit button
            document.getElementById("submitButton").style.display = "none";

            if (results.round < 10) {
                // Show the next round button
                document.getElementById("nextRoundButton").style.display = "block";
                document.getElementById("nextRoundButton").classList.remove("d-none");
            } 
            
            // Always display the finish game button after each submission
            document.getElementById("finishGameButton").style.display = "block";
            document.getElementById("finishGameButton").classList.remove("d-none");


            // In the submitAnswers function, when the round is less than 5, show the next round button
            if (results.round < 5) {
                document.getElementById("nextRoundButton").classList.remove("d-none");
            // If the round is not less than 5, show the finish game button
            document.getElementById("finishGameButton").classList.remove("d-none");
            }
            

        });
}




document.getElementById("nextRoundButton").addEventListener("click", startNewGame);

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
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
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