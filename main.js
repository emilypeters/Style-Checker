// Get buttons
let captureButton = document.getElementById("capturebutton");
let disclaimerButton = document.getElementById("disclaimerbutton");

let sortButton = document.getElementById("sortbutton");
let nameSortAscButton = document.getElementById("namesortascbutton");
let dateSortAscButton = document.getElementById("datesortascbutton");
let nameSortDescButton = document.getElementById("namesortdescbutton");
let dateSortDescButton = document.getElementById("datesortdescbutton");

let confirmDeleteButton = document.getElementById("confirmdeletebutton");
let cancelDeleteButton = document.getElementById("canceldeletebutton");

// Various display windows
const styleDisplay = document.getElementById("saved-styles");
const searchBar = document.getElementById("searchbar");
const deletePopup = document.getElementById("deletepopup");
const copyPopup = document.getElementById("copypopup");
const disclaimer = document.getElementById("disclaimer");

// Allow access to session storage
chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });

// Check session storage for whether highlighting is active
chrome.storage.session.get(["highlightingActive"]).then((result) => {
    if (result.highlightingActive) {
        captureButton.classList.add('active');
    }
});

// Toggle disclaimer
disclaimerButton.addEventListener("click", async() => {
    if (disclaimer.hidden) {
        disclaimerButton.innerText = "Hide Disclaimer"
        disclaimer.hidden = false;
    } else {
        disclaimerButton.innerText = "Show Disclaimer"
        disclaimer.hidden = true;
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

            // TODO: Temporary fix for issue where user has to click twice on element they want to capture
            window.close();

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
                    function highlighter(e) {
                        let targetHighlight = e.target;
                                
                        if (prevHighlight != targetHighlight) {
                            if (prevHighlight != null) {
                                prevHighlight.classList.remove('highlight-sc'); // Remove highlight from element that user's mouse "left"
                            }
                    
                            targetHighlight.classList.add('highlight-sc'); // Add highlighting to current element
                    
                            prevHighlight = targetHighlight;
                        } 
                    }
        
                    // Highlighting listener (if mouse moves over element)
                    document.addEventListener('mousemove', highlighter, false);
        
                    document.addEventListener('click', function (e) {
                        let element = e.target;
        
                        var capturePopup = window.open("", "", "width=350,height=400,toolbar=no,menubar=no");
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
                                    body {
                                        max-width: 350px;
                                        min-width: 300px;
                                    }
                                    .styling {
                                        background-color: #e7e7e7;
                                        padding: 10px;
                                        border: 1px solid #ccc;
                                        border-radius: 4px;
                                        text-align: left;
                                        overflow: auto;
                                        max-height: 300px;
                                    }
                                    .button-simple {
                                        margin-left: 5px;
                                        padding: 4px;
                                        background-color: royalblue;
                                        border-radius: 6px;
                                        border-width: 0;
                                        border-style: none;
                                        color: white;
                                    } 
                                    .button-simple:hover {
                                        background-color: rgb(65, 105, 175);
                                    }
                                    .button-simple:active {
                                        background-color: rgb(65, 105, 145);
                                    }
                                    .buttoncontainer {
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        padding: 5px;
                                        height: 50px;
                                    }
                                </style>
                            </head>
                            <body>
                                <div id="styling" class="styling">
                                    <p style="font-weight: bold;">PREVIEW:</p>
                                    <div id="preview" class="preview">
                                        Sample Text.
                                    </div>
                                </div>
                                <div class="buttoncontainer">
                                    <input id="name" type="text" placeholder="Enter style name...">
                                    <button id="save-style" class="button-simple">Save Styling</button>
                                </div>
                            </body>
                            </html>
                        `;
        
                        // Remove all visible highlighting from page
                        document.querySelectorAll("*").forEach((element) => {
                            element.classList.remove('highlight-sc')
                        });
        
                        if (element != null) {
                            var styles = window.getComputedStyle(element);
                            // TODO: Maintain inline styles?
                            //var inlineStyles = element.getAttribute('style')

                            // Get all CSS descriptors
                            var cssDescriptors = {};
                            for (var i = 0; i < styles.length; i++) {
                                var key = styles[i];
                                var value = styles.getPropertyValue(key);
                                cssDescriptors[key] = value;
                            }

                            // Core font CSS
                            let fontCss = [
                                `font-family: ${cssDescriptors["font-family"]};`,
                                `font-size: ${cssDescriptors["font-size"]};`,
                                `font-style: ${cssDescriptors["font-style"]};`,
                                `font-weight: ${cssDescriptors["font-weight"]};`
                            ];
                            let fontPure = "";

                            // Core coloring CSS
                            let coloringCss = [
                                `background-color: ${cssDescriptors["background-color"]};`,
                                `color: ${cssDescriptors["color"]};`
                            ];
                            let coloringPure = "";

                            // Core border CSS
                            // TODO: Border capture fairly simple (assumes top border properties apply to entire border)
                            let borderCss = [
                                `border-width: ${cssDescriptors["border-top-width"]};`,
                                `border-color: ${cssDescriptors["border-top-color"]};`,
                                `border-style: ${cssDescriptors["border-top-style"]};`,
                                `border-radius: ${cssDescriptors["border-top-right-radius"]};`
                            ];
                            let borderPure = "";

                            // Core positioning CSS
                            let positioningCss = [
                                `text-align: ${cssDescriptors["text-align"]};`,
                                `display: ${cssDescriptors["display"]};`
                            ];
                            let positioningPure = "";

                            let positioningregex = /^align-[^\s]+$|^margin-[^\s^-]+$|^padding-[^\s^-]+$|^justify-[^\s]+$/m;

                            for (const key in cssDescriptors){
                                let descriptor = `${key}: ${cssDescriptors[key]};`;
                                let value = cssDescriptors[key];
                            
                                if (positioningregex.test(key)) {
                                    // Ignore descriptors that are just defaults or zero
                                    if (value === "0" || value === "0px" || value === "auto" || value === "none" || value === "normal") continue;
                                    positioningCss.push(descriptor);
                                }
                            }

                            // Output CSS to window

                            const cssDisplay = capturePopup.document.getElementById('styling');

                            cssDisplay.innerHTML += "<p> <p style='font-weight: bold;'>FONTS:</p>";
                            
                            fontCss.forEach((cssDescriptor) => {
                                cssDisplay.innerHTML += cssDescriptor + "<br>";
                                fontPure += cssDescriptor + "\n";
                            });
                            
                            cssDisplay.innerHTML += "<p style='font-weight: bold;'>COLORING:</p>"; 
                            
                            coloringCss.forEach((cssDescriptor) => {
                                cssDisplay.innerHTML += cssDescriptor + "<br>";
                                coloringPure += cssDescriptor + "\n";
                            });

                            cssDisplay.innerHTML += "<p style='font-weight: bold;'>BORDER:</p>"; 
                            
                            borderCss.forEach((cssDescriptor) => {
                                cssDisplay.innerHTML += cssDescriptor + "<br>";
                                borderPure += cssDescriptor + "\n";
                            });

                            cssDisplay.innerHTML += "<p style='font-weight: bold;'>POSITIONING:</p>"; 
                            
                            positioningCss.forEach((cssDescriptor) => {
                                cssDisplay.innerHTML += cssDescriptor + "<br>";
                                positioningPure += cssDescriptor + "\n";
                            });

                            cssDisplay.innerHTML += "</p>"; 

                            capturePopup.document.getElementById("preview").style = fontPure + coloringPure + borderPure + positioningPure;

                            // Button to save styling
                            let saveButton = capturePopup.document.getElementById("save-style");
                            
                            saveButton.addEventListener('click', async() => {
                                let styleName = capturePopup.document.getElementById("name").value;
                                let currentDate = new Date().toISOString();

                                if (!styleName.length) return;
        
                                // Store style info in JSON
                                let style = { name: styleName, dateSaved: currentDate, fontCss: fontPure, coloringCss: coloringPure, borderCss: borderPure, positioningCss: positioningPure };
                
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

                                //close window
                                capturePopup.close()
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

function displayStylesSorted(target, direction) {
    chrome.storage.local.get(null, async function(items) { // Start by getting all the keys of the database
        // Empty style display div
        styleDisplay.innerHTML = "";
        
        const allKeys = Object.keys(items);

        const results = [];

        // Get all styles
        for (const key in allKeys) {
            const keyCopy = allKeys[key];
            const result = { key: keyCopy, result: items[keyCopy] }
            results.push(result);
        }

        if (results.length === 0) {
            styleDisplay.innerHTML = "<p style='text-align: center;'>No saved styles</p>"
            return;
        }

        //Sort the styles
        if (direction === "asc") {
            results.sort((a, b) => JSON.parse(a.result)[target].localeCompare(JSON.parse(b.result)[target]));
        } else if (direction === "desc") {
            results.sort((a, b) => JSON.parse(b.result)[target].localeCompare(JSON.parse(a.result)[target]));
        }
    
        // Display the styles
        for (const result of results) {
            let resultParsed = JSON.parse(result.result); //for edit to update, had to change to let
            const key = result.key;

            // Create div with the style's name
            // TODO: extrapolate this and other styling to the dedicated CSS file (homepage.css)
            const styleDiv = document.createElement("div");
            styleDiv.classList.add("style");
            styleDiv.style = "display: flex; align-items: center;";
            
            // Add style name
            const text = document.createElement("p");
            text.innerText = resultParsed.name
            text.style = "text-align: left; display: inline-block; width: 50%;";

            const buttonContainer = document.createElement("div");
            buttonContainer.style = "text-align: right; display: inline-block; width: 50%;";

            // Add edit button
            const editButton = document.createElement("button");
            editButton.innerHTML = `
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
               </svg>
            `;
            editButton.classList.add("button-simple");
            editButton.addEventListener("click", async () => {
                var editPopup = window.open("", "", "width=350,height=400,toolbar=no,menubar=no");
                editPopup.document.body.innerHTML = `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <title>Edit Style</title>
                        <meta charset="utf-8">
                        <style>
                            body {
                                min-width: 300px;
                                max-width: 350px;
                            }
                            .styling {
                                background-color: #e7e7e7;
                                padding: 10px;
                                border: 1px solid #ccc;
                                border-radius: 4px;
                                text-align: left;
                                overflow: auto;
                                max-height: 300px;
                            }
                            .button-simple {
                                margin-left: 5px;
                                padding: 4px;
                                background-color: royalblue;
                                border-radius: 6px;
                                border-width: 0;
                                border-style: none;
                                color: white;
                            } 
                            .button-simple:hover {
                                background-color: rgb(65, 105, 175);
                            }
                            .button-simple:active {
                                background-color: rgb(65, 105, 145);
                            }
                            .buttoncontainer {
                                padding: 5px;
                                display: flex;
                                justify-content: center;
                            }
                       </style>
                    </head>
                    <body>
                         <div id="content" class="styling"></div>
                         <div class="buttoncontainer">
                            <button id="save" class="button-simple">Keep Selected Only</button>
                         </div>
                    </body>
                    </html>
                `;

                //if it contains <br> tag
                // if (!resultParsed.fontCss.includes("<br>")) {
                //     resultParsed.fontCss = resultParsed.fontCss.replace(new RegExp(";", "g"), ';<br>');
                //     resultParsed.coloringCss = resultParsed.coloringCss.replace(new RegExp(";", "g"), ';<br>');
                //     resultParsed.borderCss = resultParsed.borderCss.replace(new RegExp(";", "g"), ';<br>');
                //     resultParsed.positioningCss = resultParsed.positioningCss.replace(new RegExp(";", "g"), ';<br>');
                // }

                const editDisplay = editPopup.document.getElementById("content");

                // Fonts

                editDisplay.innerHTML += "<p> <p style='font-weight: bold;'>FONTS:</p>";
                
                let fontDescriptors = resultParsed.fontCss.split("\n");
                let newFontCss = resultParsed.fontCss;

                for (const descriptorKey in fontDescriptors) {
                    let descriptor = fontDescriptors[descriptorKey];
                    if (descriptor === "") continue;
                    editDisplay.innerHTML += `<div style="display: flex; align-items: center;"><input checked key='${descriptorKey}' type='checkbox' css='fonts'>${descriptor}</div>`;
                }

                // Coloring

                editDisplay.innerHTML += "<p> <p style='font-weight: bold;'>COLORING:</p>";
                
                let coloringDescriptors = resultParsed.coloringCss.split("\n");
                let newColoringCss = resultParsed.coloringCss;

                for (const descriptorKey in coloringDescriptors) {
                    let descriptor = coloringDescriptors[descriptorKey];
                    if (descriptor === "") continue;
                    editDisplay.innerHTML += `<div style="display: flex; align-items: center;"><input checked key='${descriptorKey}' type='checkbox' css='coloring'>${descriptor}</div>`;
                }

                // Border

                editDisplay.innerHTML += "<p> <p style='font-weight: bold;'>BORDER:</p>";
                
                let borderDescriptors = resultParsed.borderCss.split("\n");
                let newBorderCss = resultParsed.borderCss;

                for (const descriptorKey in borderDescriptors) {
                    let descriptor = borderDescriptors[descriptorKey];
                    if (descriptor === "") continue;
                    editDisplay.innerHTML += `<div style="display: flex; align-items: center;"><input checked key='${descriptorKey}' type='checkbox' css='border'>${descriptor}</div>`;
                }

                // Positioning

                editDisplay.innerHTML += "<p> <p style='font-weight: bold;'>POSITIONING:</p>";
                
                let positioningDescriptors = resultParsed.positioningCss.split("\n");
                let newPositioningCss = resultParsed.positioningCss;

                for (const descriptorKey in positioningDescriptors) {
                    let descriptor = positioningDescriptors[descriptorKey];
                    if (descriptor === "") continue;
                    editDisplay.innerHTML += `<div style="display: flex; align-items: center;"><input checked key='${descriptorKey}' type='checkbox' css='positioning'>${descriptor}</div>`;
                }

                // Save button

                let saveButton = editPopup.document.getElementById("save");
                saveButton.addEventListener("click", async () => {
                    let fontCheckBoxes = editPopup.document.querySelectorAll('input[type="checkbox"][css="fonts"]');
                    fontCheckBoxes.forEach((checkBox) => {
                        const descriptorKey = checkBox.getAttribute("key");
                        if (!checkBox.checked) {
                            newFontCss = newFontCss.replace(fontDescriptors[descriptorKey] + "\n", "");
                        }
                    });

                    let coloringCheckBoxes = editPopup.document.querySelectorAll('input[type="checkbox"][css="coloring"]');
                    coloringCheckBoxes.forEach((checkBox) => {
                        const descriptorKey = checkBox.getAttribute("key");
                        if (!checkBox.checked) {
                            newColoringCss = newColoringCss.replace(coloringDescriptors[descriptorKey] + "\n", "");
                        }
                    });

                    let borderCheckBoxes = editPopup.document.querySelectorAll('input[type="checkbox"][css="border"]');
                    borderCheckBoxes.forEach((checkBox) => {
                        const descriptorKey = checkBox.getAttribute("key");
                        if (!checkBox.checked) {
                            newBorderCss = newBorderCss.replace(borderDescriptors[descriptorKey] + "\n", "");
                        }
                    });

                    let positioningCheckBoxes = editPopup.document.querySelectorAll('input[type="checkbox"][css="positioning"]');
                    positioningCheckBoxes.forEach((checkBox) => {
                        const descriptorKey = checkBox.getAttribute("key");
                        if (!checkBox.checked) {
                            newPositioningCss = newPositioningCss.replace(positioningDescriptors[descriptorKey] + "\n", "");
                        }
                    });

                    let styleNew = { name: resultParsed.name, dateSaved: resultParsed.dateSaved, fontCss: newFontCss, coloringCss: newColoringCss, borderCss: newBorderCss, positioningCss: newPositioningCss };
                    var obj= {};
                    obj[key] = JSON.stringify(styleNew);
                    chrome.storage.local.set(obj);

                    editPopup.close();
                });

                //colors

                // editPopup.document.getElementById("content").innerHTML += "<p style='font-weight: bold;'>COLORING:</p>";
                // editPopup.document.getElementById("content").innerHTML += resultParsed.coloringCss;

                // //border

                // editPopup.document.getElementById("content").innerHTML += "<p style='font-weight: bold;'>BORDER:</p>";
                // editPopup.document.getElementById("content").innerHTML += resultParsed.borderCss;

                // //positioning

                // editPopup.document.getElementById("content").innerHTML += "<p style='font-weight: bold;'>POSITIONING:</p>";
                // editPopup.document.getElementById("content").innerHTML += resultParsed.positioningCss;

                //clean out all the added <br>
                // resultParsed.fontCss = resultParsed.fontCss.replace(new RegExp(";<br>", "g"), ';');
                // resultParsed.coloringCss = resultParsed.coloringCss.replace(new RegExp(";<br>", "g"), ';');
                // resultParsed.borderCss = resultParsed.borderCss.replace(new RegExp(";<br>", "g"), ';');
                // resultParsed.positioningCss = resultParsed.positioningCss.replace(new RegExp(";<br>", "g"), ';');

                // let input_answer = editPopup.document.getElementById("delete_txt");
                // let submitButton = editPopup.document.getElementById("submit_btn");

                // submitButton.addEventListener("click", async () => {
                //     editPopup.close();

                //     // function escapeRegex(string) {
                //     //    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&'); //doesn't account for ""?
                //     // }

                //     // function escapeQuotes(string) {
                //     //     return string.replace(/\"/g, '\\"');
                //     // }

                //     // const deleteInputField = input_answer.value; 
                //     // var match_delete_regex = new RegExp(escapeQuotes(escapeRegex(deleteInputField)));
                //     // let result_parsed_string = JSON.stringify(resultParsed);
                //     // var modified_style = result_parsed_string;

                //     // //if the user enters a valid css element to delete
                //     // if (match_delete_regex.test(result_parsed_string)) {
                //     //     modified_style = modified_style.replace(match_delete_regex, "");
                //     //     chrome.storage.local.get(key, function (val) {
                //     //         val[key] = modified_style;
                //     //         // Save data
                //     //         chrome.storage.local.set(val);
                //     //         resultParsed = JSON.parse(val[key]);
                //     //     });
                //     // }
                // });
            });

            //Add a preview button to the div
            const previewButton = document.createElement("button");
            previewButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-image" viewBox="0 0 16 16">
                    <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                    <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
                </svg>
            `;
            previewButton.classList.add("button-simple");
            previewButton.addEventListener("click", async () => {
                // When the preview button is clicked, show preview window
                var previewPopup = window.open("", "", "width=400,height=400,toolbar=no,menubar=no");
                previewPopup.document.body.innerHTML = `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <title>Preview Style</title>
                        <meta charset="utf-8">
                        <style>
                            body {
                                padding: 20px;
                                --margin: 20px;
                                max-width: 400px;
                                min-width: 200px;
                            }
                            .label {
                                font-weight: bold;
                                text-align: left;
                                display: inline-block;
                                width: 50%;
                            }
                            .button-container {
                                text-align: right;
                                display: inline-block;
                                width: 50%;
                            }
                            .header {
                                display: flex;
                                align-items: center;
                            }
                            .button-simple {
                                padding: 5px;
                                background-color: white;
                                border-radius: 6px;
                                border-width: 0;
                                border-style: none;
                            }
                            .button-simple:hover {
                                background-color: rgb(222, 222, 222);
                            }
                            .button-simple:active {
                                background-color: rgb(198, 198, 198);
                            }
                            .dropdown {
                                position: absolute;
                                transition: all 0.1s cubic-bezier(0.16, 1, 0.5, 1);
                                background-color: white;
                                border-color: black;
                                border-style: solid;
                                border-width: 1px;
                                border-radius: 4px;
                                padding: 4px;
                                transform: translateY(0.5rem);
                                visibility: hidden;
                                opacity: 0;
                            }
                            .dropdown-copy {
                                width: 80px;
                                top: 10px;
                                left: 0;
                                right: 0;
                                margin: 0 auto;
                                text-align: center;
                            }  
                            .show {
                                transform: translateY(0rem);
                                visibility: visible;
                                opacity: 1;
                            }
                            .fonts {
                                ${resultParsed.fontCss}
                            }
                            .colors {
                                ${resultParsed.coloringCss}
                            }
                            .bordering {
                                ${resultParsed.borderCss}
                            }
                            .positioning {
                                ${resultParsed.positioningCss}
                                border-width: 1px;
                                border-color: black;
                                border-style: solid;
                            }
                            .box {
                                border-width: 1px;
                                border-color: black;
                                border-style: solid;
                                height: 20px;
                                width: 100%;
                                background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' preserveAspectRatio='none' viewBox='0 0 100 100'><path d='M100 0 L0 100 ' stroke='black' stroke-width='3'/><path d='M0 0 L100 100 ' stroke='black' stroke-width='3'/></svg>");
                                background-repeat: no-repeat;
                                background-position: center center;
                                background-size: 100% 100%, auto;
                                background-color: white;
                            }
                            .empty {
                                height: 20px;
                            }
                            .final {
                                ${resultParsed.fontCss}
                                ${resultParsed.coloringCss}
                                ${resultParsed.borderCss}
                                ${resultParsed.positioningCss}
                            }
                        </style>
                    </head>
                    <div id="copypopup" class="dropdown dropdown-copy">
                        CSS copied to clipboard
                    </div>
                    <body>
                        <div class="header">
                            <p class="label">FONTS:</p>
                            <div class="button-container">
                                <button id="copy-fonts" class="button-simple">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16">
                                        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                                        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="fonts">
                            Sample Text.
                        </div>
                        <div class="header">
                            <p class="label">COLORS:</p>
                            <div class="button-container">
                                <button id="copy-colors" class="button-simple">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16">
                                        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                                        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="colors">
                            Sample Text.
                        </div>
                        <div class="header">
                            <p class="label">BORDERING:</p>
                            <div class="button-container">
                                <button id="copy-bordering" class="button-simple">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16">
                                        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                                        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="bordering">
                            <div class="empty"></div>
                        </div>
                        <div class="header">
                            <p class="label">PADDING, MARGINS, AND ALIGNMENT:</p>
                            <div class="button-container">
                                <button id="copy-positioning" class="button-simple">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16">
                                        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                                        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="positioning">
                            <div class="box">
                                Sample Text.
                            </div>
                        </div>
                        <div class="header">
                            <p class="label">FINAL RESULT:</p>
                            <div class="button-container">
                                <button id="copy-all" class="button-simple">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16">
                                        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                                        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="final">
                            Sample Text.
                        </div>
                    </body>
                    </html>
                `;

                const copyPopupPreview = previewPopup.document.getElementById("copypopup");

                // Copy font CSS to clipboard
                previewPopup.document.getElementById("copy-fonts").addEventListener("click", async() => {
                    previewPopup.navigator.clipboard.writeText(resultParsed.fontCss);
                    copyPopupPreview.classList.add("show");
                    setTimeout(() => {
                        copyPopupPreview.classList.remove("show");  
                    }, 1500);
                });

                // Copy coloring CSS to clipboard
                previewPopup.document.getElementById("copy-colors").addEventListener("click", async() => {
                    previewPopup.navigator.clipboard.writeText(resultParsed.coloringCss);
                    copyPopupPreview.classList.add("show");
                    setTimeout(() => {
                        copyPopupPreview.classList.remove("show");  
                    }, 1500);
                });

                // Copy bordering CSS to clipboard
                previewPopup.document.getElementById("copy-bordering").addEventListener("click", async() => {
                    previewPopup.navigator.clipboard.writeText(resultParsed.borderCss);
                    copyPopupPreview.classList.add("show");
                    setTimeout(() => {
                        copyPopupPreview.classList.remove("show");  
                    }, 1500);
                });

                // Copy positioning CSS to clipboard
                previewPopup.document.getElementById("copy-positioning").addEventListener("click", async() => {
                    previewPopup.navigator.clipboard.writeText(resultParsed.positioningCss);
                    copyPopupPreview.classList.add("show");
                    setTimeout(() => {
                        copyPopupPreview.classList.remove("show");  
                    }, 1500);
                });

                // Copy all CSS to clipboard
                previewPopup.document.getElementById("copy-all").addEventListener("click", async() => {
                    previewPopup.navigator.clipboard.writeText(resultParsed.fontCss + resultParsed.coloringCss + resultParsed.borderCss + resultParsed.positioningCss);
                    copyPopupPreview.classList.add("show");
                    setTimeout(() => {
                        copyPopupPreview.classList.remove("show");  
                    }, 1500);
                });
            });

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
                navigator.clipboard.writeText(resultParsed.fontCss + resultParsed.coloringCss + resultParsed.borderCss + resultParsed.positioningCss);
                copyPopup.classList.add("show");
                setTimeout(() => {
                    copyPopup.classList.remove("show");  
                }, 1500);
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
                confirmDeleteButton.addEventListener("click", async() => {
                    chrome.storage.local.remove([key]);
                    styleDiv.remove();
                    deletePopup.classList.remove("show");
                });

                cancelDeleteButton.addEventListener("click", async() => {
                    deletePopup.classList.remove("show");
                });

                deletePopup.classList.add("show");
            });

            styleDiv.appendChild(text);
            buttonContainer.appendChild(copyButton);
            buttonContainer.appendChild(deleteButton);
            buttonContainer.appendChild(previewButton);
            buttonContainer.appendChild(editButton);
            styleDiv.appendChild(buttonContainer);
            styleDisplay.appendChild(styleDiv);
        }
    });
}

// Initial display of styles when extension window is opened (sorted by most recent first)
displayStylesSorted("dateSaved", "desc");

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
    e.stopPropagation();
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