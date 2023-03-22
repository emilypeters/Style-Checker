// Get buttons
let captureButton = document.getElementById("capturebutton");
let libraryButton = document.getElementById("librarybutton");
let sortButton = document.getElementById("sortbutton");
let nameSortAscButton = document.getElementById("namesortascbutton");
let dateSortAscButton = document.getElementById("datesortascbutton");
let nameSortDescButton = document.getElementById("namesortdescbutton");
let dateSortDescButton = document.getElementById("datesortdescbutton");

// Display for saved styles (button unhides it)
const library = document.getElementById("library");
const styleDisplay = document.getElementById("saved-styles");
const searchBar = document.getElementById("searchbar");

chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });

// Check session storage for whether highlighting is active
chrome.storage.session.get(["highlightingActive"]).then((result) => {
    if (result.highlightingActive) {
        captureButton.classList.add('active');
    }
});

// Button to allow user to highlight an element, and when they click it will open window with CSS
captureButton.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.storage.session.get(["highlightingActive"]).then((result) => {
        if (result.highlightingActive) {
            chrome.storage.session.set({ highlightingActive: false });
            
            captureButton.classList.remove('active');
            
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {            
                    // Reloading the webpage to cancel the highlighting works but seems a bit hacky
                    location.reload();
                }
            });
        } else {
            chrome.storage.session.set({ highlightingActive: true });

            captureButton.classList.add('active');

            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    // Highlighting referenced from https://hospodarets.com/highlight_element_with_page_fading
                    // Also Referenced from this stack overflow: https://stackoverflow.com/questions/4445102/google-chrome-extension-highlight-the-div-that-the-mouse-is-hovering-over
        
                    // Function to disable mouse clicks (or any other behavior)
                    function stopClicks(e) {
                        e.preventDefault();
                        return false;
                    }
        
                    // Disable mouse clicks on all elements
                    document.querySelectorAll("*").forEach((element) => {
                        element.addEventListener('click', stopClicks, false);
                    });
        
                    var prevHighlight = null;
        
                    // Function that defines highlighting behavior
                    // TODO: Highlighting behavior is a bit wonky/jarring (also not great on webpages with dark backgrounds), could use tweaking/rework
                    function highlighter(e) {
                        let targetHighlight = e.target;
                                
                        if (prevHighlight != targetHighlight) {
                            if (prevHighlight != null) {
                                prevHighlight.classList.remove('highlight'); // Remove highlight from element that user's mouse "left"
                            }
                    
                            targetHighlight.classList.add('highlight'); // Add highlighting to current element
                    
                            prevHighlight = targetHighlight;
                        } 
                    }
        
                    // Highlighting listener (if mouse moves over element)
                    document.addEventListener('mousemove', highlighter, false);
        
                    document.addEventListener('click', function (e) {
                        let element = e.target;
        
                        var capturePopup = window.open("", "", "width=400,height=400,toolbar=no,menubar=no");
                        capturePopup.document.body.innerHTML = `
                            <!DOCTYPE html>
                            <html lang="en">
                            <head>
                                <title>Capture Style</title>
                                <meta charset="utf-8">
                                <style>
                                    * {
                                        font-family: Helvetica, sans-serif;
                                    }
                                </style>
                            </head>
                            <div id="styling">
                            </div>
                            <div>
                                <input id="name" type="text">
                                <button id="save-style">Save Styling</button>
                            </div>
                            </html>
                        `;
        
                        // Remove all visible highlighting from page
                        document.querySelectorAll("*").forEach((element) => {
                            element.classList.remove('highlight')
                        });
        
                        if (element != null) {
                            // Following code referenced from this stack overflow: https://stackoverflow.com/questions/42025329/how-to-get-the-applied-style-from-an-element-excluding-the-default-user-agent-s
                            // ***********************************************************************************************************
        
                            var slice = Function.call.bind(Array.prototype.slice);
                            
                            var elementMatchCSSRule = function(element, cssRule) {
                                return element.matches(cssRule.selectorText);
                            };
                            
                            var cssRules = slice(document.styleSheets).reduce(function(rules, styleSheet) {
                                return rules.concat(slice(styleSheet.cssRules));
                            }, []);
                            
                            // Returns applied CSS of element (both from CSS files and from inline styles)
                            function getAppliedCss(element) {
                                var elementRules = cssRules.filter(elementMatchCSSRule.bind(null, element));
                                var rules =[];
        
                                if (elementRules.length > 0) { // Get styling from external stylesheets
                                    for (var i = 0; i < elementRules.length; i++) {
                                        var e = elementRules[i];
                                        rules.push(e.cssText)
                                    }		
                                }
                                
                                if (element.getAttribute('style')) { // Get styling from inline styles
                                    rules.push(element.getAttribute('style'))
                                }
        
                                return rules;
                            }
        
                            // ***********************************************************************************************************	
        
                            // Get styling of element
        
                            var cssOutputMain = "";
                            var cssOutputRaw = ""; // Output raw is what is actually saved
        
                            var rules = getAppliedCss(element);
                            
                            for (var i = 0; i < rules.length; i++) {
                                cssOutputMain += rules[i] + "<br><br>"; 
                                cssOutputRaw += rules[i];
                            }		
        
                            // Get styling of element's parents 
        
                            var cssOutputParents = "";
        
                            let parentElement = element.parentElement;
                            while (parentElement) {
                                var rules = getAppliedCss(parentElement);
                            
                                for (var i = 0; i < rules.length; i++) {
                                    cssOutputParents += rules[i] + "<br><br>"; 
                                    cssOutputRaw += rules[i];
                                }		
                                
                                parentElement = parentElement.parentElement;
                            }
        
                            // Output styling
                            capturePopup.document.getElementById('styling').innerHTML = `
                                <p>
                                    <p style='font-weight: bold;'>STYLING:</p>
                                    ${cssOutputMain}
                                    <p style='font-weight: bold;'>STYLING FROM PARENTS:</p>
                                    ${cssOutputParents}
                                </p>
                            `;
        
                            // Button to save styling
                            let saveButton = capturePopup.document.getElementById("save-style");
                            
                            saveButton.addEventListener('click', async() => {
                                let styleName = capturePopup.document.getElementById("name").value;
                                let currentDate = new Date().toISOString();
        
                                // Store style info in JSON
                                let style = { name: styleName, dateSaved: currentDate, cssRaw: cssOutputRaw };
                
                                chrome.storage.local.get(null, function(items) {
                                    var allKeys = Object.keys(items);
                                    
                                    // Get unique key for style (basically like autoincrement in SQL)
                                    let maxKey = 0;
                                    for (key in allKeys) {
                                        const keyInt = parseInt(allKeys[key]);
                                        if (keyInt > maxKey) maxKey = keyInt;
                                    }
        
                                    // Save style
                                    var obj= {};
                                    obj[maxKey+1] = JSON.stringify(style);
                                    chrome.storage.local.set(obj);
            
                                    // Clear input
                                    capturePopup.document.getElementById("name").value = "";
                                });
                            });                   
                        }
        
                        // Enable mouse clicks again
                        document.querySelectorAll("*").forEach((element) => {
                            element.removeEventListener('click', stopClicks, false);
                        });
        
                        // Remove highlighting listener
                        document.removeEventListener('mousemove', highlighter, false);

                        chrome.storage.session.set({ highlightingActive: false });
                    }, { once: true }, false);
                }
            });
        }
    });
});

// Button to view saved styles
libraryButton.addEventListener("click", async() => {
    libraryButton.classList.toggle('active');
    library.hidden = library.hidden ? false : true;
});

async function getStyleAsync (key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], function (result) {
        const resultParsed = {key:key, result:result[key]}
        resolve(resultParsed);
      });
    });
};

function displayStylesSorted(target, direction) {
    chrome.storage.local.get(null, async function(items) { // Start by getting all the keys of the database
        // Empty style display div
        styleDisplay.innerHTML = "";
        
        const allKeys = Object.keys(items);

        const results = [];

        // Get all styles
        for (key in allKeys) {
            const keyCopy = allKeys[key]; // "key" is actually the index of the key in allKeys, keyCopy is actual key (bit weird)
            const result = await getStyleAsync(keyCopy);
            results.push(result);
        }

        //Sort the styles
        if (direction === "asc") {
            results.sort((a, b) => JSON.parse(a.result)[target].localeCompare(JSON.parse(b.result)[target]));
        } else if (direction === "desc") {
            results.sort((a, b) => JSON.parse(b.result)[target].localeCompare(JSON.parse(a.result)[target]));
        }
    
        // Display the styles
        for (const result of results) {
            const resultParsed = JSON.parse(result.result);
            const key = result.key;

            // Create div with the style's name
            const styleDiv = document.createElement("div");
            styleDiv.classList.add("style");
            styleDiv.style = "display: flex;";
            
            // Add style name
            // TODO: extrapolate this and other styling to the dedicated CSS file
            const text = document.createElement("p");
            text.innerText = resultParsed.name
            text.style = "text-align: left; display: inline-block; width: 50%;";

            const buttonContainer = document.createElement("div");
            buttonContainer.style = "text-align: right; display: inline-block; width: 50%;";

            // Add a copy to clipboard button to the div
            const copyButton = document.createElement("button");
            copyButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16">
                    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                </svg>
            `;
            copyButton.classList.add("button-simple");
            copyButton.addEventListener("click", async() => {
                navigator.clipboard.writeText(resultParsed.cssRaw);
            });

            // Add a delete button to the div
            const deleteButton = document.createElement("button");
            deleteButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
                    <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
                </svg>
            `;
            deleteButton.classList.add("button-simple");
            deleteButton.addEventListener("click", async() => {
                chrome.storage.local.remove([key]);
                styleDiv.remove();
            });

            styleDiv.appendChild(text);
            buttonContainer.appendChild(copyButton);
            buttonContainer.appendChild(deleteButton);
            styleDiv.appendChild(buttonContainer);
            styleDisplay.appendChild(styleDiv);
        }
    });
}

// Initial display of styles when extension window is opened, with no sorting of styles
displayStylesSorted(null, null);

// Search bar (acts as a live search bar)
searchBar.addEventListener("input", async() => {
    const searchTerm = searchBar.value;

    styleDisplay.querySelectorAll("div.style").forEach((element) => {
        // Hide styles with name that does not include search term
        if (!element.querySelector("p").innerText.toLowerCase().includes(searchTerm.toLowerCase())) {
            element.style.display = "none";
        } else {
            element.style.display = "flex";
        }
    });
});

// Reveal sorting dropdown on sort button click
sortButton.addEventListener("click", async(e) => {
    e.stopPropagation(); // TODO: may not be needed
    document.getElementById("dropdown").classList.toggle("show");
});

// Sort by name asc. (a-z)
nameSortAscButton.addEventListener("click", async() => {
    displayStylesSorted("name", "asc");
    document.getElementById("dropdown").classList.toggle("show");
});

// Sort by date asc. (old-new)
dateSortAscButton.addEventListener("click", async() => {
    displayStylesSorted("dateSaved", "asc");
    document.getElementById("dropdown").classList.toggle("show");
});

// Sort by name desc. (z-a)
nameSortDescButton.addEventListener("click", async() => {
    displayStylesSorted("name", "desc");
    document.getElementById("dropdown").classList.toggle("show");
});

// Sort by date desc. (new-old)
dateSortDescButton.addEventListener("click", async() => {
    displayStylesSorted("dateSaved", "desc");
    document.getElementById("dropdown").classList.toggle("show");
});