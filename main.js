// Get buttons
let captureButton = document.getElementById("btn2");
let libraryButton = document.getElementById("btn3");

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
                    }, { once: true }, false);
                }
            });
        }
    });
});

// Button to cancel styling capture
// TODO: Cancel button disappears/resets if user closes then reopens extension window, need a global variable to keep track of highlighting state
// btn3.addEventListener("click", async () => {
//     let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
//     chrome.scripting.executeScript({
//         target: { tabId: tab.id },
//         function: () => {            
//             // Reloading the webpage to cancel the highlighting works but seems a bit hacky
//             location.reload();
//         }
//     });
// });

// Button to veiw saved styles (really basic right now)
btn4.addEventListener("click", async() => {
    const display = document.getElementById("saved-styles");

    chrome.storage.local.get(null, function(items) { // Start by getting all the keys of the database
        const allKeys = Object.keys(items);
        for (key in allKeys) {
            const keyCopy = allKeys[key]; // "key" is actually the index of the key in allKeys, keyCopy is actual key (bit weird)
            chrome.storage.local.get([keyCopy]).then((result) => {
                const resultParsed = JSON.parse(result[keyCopy]); // Parse JSON result

                // Create div with the style's name
                const styleDiv = document.createElement("div");
                styleDiv.style = "display: flex;";
                const text = document.createElement("p");
                text.innerHTML = resultParsed.name
                styleDiv.appendChild(text);

                // Add a copy to clipboard button to the siv
                const button = document.createElement("button");
                button.innerText = "Copy";
                button.addEventListener("click", async() => {
                    navigator.clipboard.writeText(resultParsed.cssRaw);
                });

                styleDiv.appendChild(button);
                display.appendChild(styleDiv);
            });
        }
    });
});

// Debug button to clear storage
// btn9.addEventListener("click", async () => {
//     let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
//     chrome.scripting.executeScript({
//         target: { tabId: tab.id },
//         function: () => {            
//             chrome.storage.local.clear();
//         }
//     });
// });
