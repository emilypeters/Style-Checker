

// Get buttons
let btn2 = document.getElementById("btn2")
let btn3 = document.getElementById("btn3")

// Button to allow user to highlight an element, and when they click it will open window with CSS
btn2.addEventListener("click", async () => {
    // TODO: Issue with button visualization, see btn3 below
    btn3.hidden = false;
    btn2.hidden = true;

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

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

                var myWindow = window.open("", "", "width=400,height=400");
                myWindow.document.body.innerHTML += "<div class = 'container' style='\
                font-family: sans-serif;\
                background-color: #e7e7e7;\
                padding: 10px;\
                border: 1px solid #ccc;\
                text-align: center;\
                '></div>";
                


                //This block of code is supposed to allow for the window.css file to be used but for some reason I can't get the window to access it
                // myWindow.document.head.innerHTML += "<link rel = 'stylesheet' href = './window.css'>"; 

                // var link = myWindow.document.createElement("link");
                // link.setAttribute("rel", "stylesheet");
                // link.setAttribute("type","text/css");
                // link.setAttribute("href",'window.css');
                // link.rel = "stylesheet";
                // myWindow.document.head.appendChild(link);

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

                    var rules = getAppliedCss(element);
                    
                    for (var i = 0; i < rules.length; i++) {
                        cssOutputMain += rules[i] + "<br><br>"; 
                    }		

                    // Get styling of element's parents 

                    var cssOutputParents = "";

                    let parentElement = element.parentElement;
                    while (parentElement) {
                        var rules = getAppliedCss(parentElement);
                    
                        for (var i = 0; i < rules.length; i++) {
                            cssOutputParents += rules[i] + "<br><br>"; 
                        }		
                        
                        parentElement = parentElement.parentElement;
                    }

                    // TODO: Display styling in more true to life form
                    myWindow.document.querySelector('div').innerHTML = "<p> <p style='font-weight: bold;'>STYLING:</p>" + cssOutputMain + "<p style='font-weight: bold;'>STYLING FROM PARENTS:</p>" + cssOutputParents + "</p>"; // Print styling to window
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
});

// Button to cancel styling capture
// TODO: Cancel button disappears/resets if user closes then reopens extension window, need a global variable to keep track of highlighting state
btn3.addEventListener("click", async () => {
    btn3.hidden = true;
    btn2.hidden = false;

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {            
            // Reloading the webpage to cancel the highlighting works but seems a bit hacky
            location.reload();
        }
    });
});