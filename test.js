// Get button
let btn1 = document.getElementById("btn1")
let btn2 = document.getElementById("btn2")

// Run on click
btn1.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true }) // Find current tab

    chrome.scripting.executeScript({ // Run the following script on our tab
        target: { tabId: tab.id },
        function: () => {
            var myWindow = window.open("", "", "width=400,height=400"); //open a new window for displaying styles
            let elems = document.querySelectorAll("*"); // Grab all elements
            for (var i = 0; i < elems.length; i++) {
                if (!(elems[i].style.backgroundColor === undefined) && !(elems[i].style.backgroundColor === null) && !(elems[i].style.backgroundColor === '')) { //don't grab empty values
                    myWindow.document.write("<p> color: " + elems[i].style.backgroundColor + "</p>"); //write info to window
                }
            }
        }
    })
})

// Button to allow user to highlight an element, and when they click it will open window with CSS
// TODO: Clicking or pressing button again will deactivate highlighting
btn2.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
            // Highlighting referenced from https://hospodarets.com/highlight_element_with_page_fading
            // Referenced from this stack overflow: https://stackoverflow.com/questions/4445102/google-chrome-extension-highlight-the-div-that-the-mouse-is-hovering-over
            
            var prevHighlight = null;

            // TODO: Highlighting behavior not consistent
            document.addEventListener('mousemove', function (e) { // On mouse over
                let targetHighlight = e.target;

                if (prevHighlight != targetHighlight) {
                    if (prevHighlight != null) {
                        prevHighlight.classList.remove('highlight'); // Remove highlight from element that user's mouse "left"
                    }

                    targetHighlight.classList.add('highlight'); // Add highlighting to current element

                    prevHighlight = targetHighlight;
                }
            }, false);

            // TODO: Make it so clicking wont activate buttons or hyperlinks on the website
            // TODO: List of CSS styling is too long, also it uses computed styling which might not be ideal
            document.addEventListener('click', function (e) {
                let element = e.target;

                var myWindow = window.open("", "", "width=400,height=400"); // Open new window
                myWindow.document.body.innerHTML += "<div style='font-family: sans-serif;'></div>"

                if (element != null) {
                    const styling = window.getComputedStyle(element, null); // Extract styling

                    var cssOutput = "";

                    for (var j = 0; j < styling.length; j++) {
                        cssOutput += styling[j] + ": " + styling.getPropertyValue(styling[j]) + "<br>"; // Put styling in readable format
                    }

                    myWindow.document.querySelector('div').innerHTML = "<p> STYLING: <br>" + cssOutput + "</p>"; // Print styling to window
                }
            }, false);
        }
    });
});