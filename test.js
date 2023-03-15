// Get button
let btn1 = document.getElementById("btn1")
let btn2 = document.getElementById("btn2")
let btn3 = document.getElementById("btn3")

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
btn2.addEventListener("click", async () => {
    // TODO: Issue with button visualization, see btn3 below
    btn3.hidden = false;
    btn2.hidden = true;

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
            // Highlighting referenced from https://hospodarets.com/highlight_element_with_page_fading
            // Referenced from this stack overflow: https://stackoverflow.com/questions/4445102/google-chrome-extension-highlight-the-div-that-the-mouse-is-hovering-over

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

            // Function that define highlighting behavior
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

                var myWindow = window.open("", "", "width=400,height=400"); // Open new window
                myWindow.document.body.innerHTML += "<div style='font-family: sans-serif;'></div>"

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

                        if (elementRules.length > 0) {
                            for (i = 0; i < elementRules.length; i++) {
                                var e = elementRules[i];
                                rules.push(e.cssText)
                            }		
                        }
                        
                        if (element.getAttribute('style')) {
                            rules.push(element.getAttribute('style'))
                        }

                        return rules;
                    }

                    // ***********************************************************************************************************	

                    // Get styling of element

                    var cssOutputMain = "";

                    var rules = getAppliedCss(element);
                    
                    for (i = 0; i < rules.length; i++) {
                        cssOutputMain += rules[i] + "<br><br>"; 
                    }		

                    // Get styling of element's parents 

                    var cssOutputParents = "";

                    element = element.parentElement;
                    while (element) {
                        var rules = getAppliedCss(element);
                    
                        for (i = 0; i < rules.length; i++) {
                            cssOutputParents += rules[i] + "<br><br>"; 
                        }		
                        
                        element = element.parentElement;
                    }	

                    // TODO: Display styling in more true to life form
                    myWindow.document.querySelector('div').innerHTML = "<p> <p style='font-weight: bold;'>STYLING:</p>" + cssOutputMain + "<p style='font-weight: bold;'>STYLING FROM PARENTS:</p>" + cssOutputParents + "</p>"; // Print styling to window
                }

                // Remove all visible highlighting from page and enable mouse clicks again
                document.querySelectorAll("*").forEach((element) => {
                    element.classList.remove('highlight')
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
            // Remove all highlighting (not needed if using reload technique, see below)
            // document.querySelectorAll("*").forEach((element) => {
            //     element.classList.remove('highlight')
            // });
            
            // Reloading the webpage to cancel the highlighting works but seems a bit hacky
            location.reload();

            // The method below stopped the highlighting but also prevented it from being reactivated

            // document.addEventListener('mousemove', (e) => {
            //     e.stopImmediatePropagation();
            //     e.stopPropagation();
            // }, true);

            // document.addEventListener('click', (e) => {
            //     e.stopImmediatePropagation();
            //     e.stopPropagation();
            // }, true);
        }
    });
});