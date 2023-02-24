// Get button
let btn = document.getElementById("btn")

// Run on click
btn.addEventListener("click", async () => {
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