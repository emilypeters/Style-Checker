/*

  This file for discarded JS code, in case it might be needed/referenced in future

*/

/* This block of code for retrieving computed styles */

// Following code from: https://stackoverflow.com/questions/35156111/get-the-list-of-all-css-styles-applied-to-a-specific-element
// ***********************************************************************************************************	
function getAppliedComputedStyles(element) {
  var styles = window.getComputedStyle(element)
  var inlineStyles = element.getAttribute('style')

  var retval = {}
  for (var i = 0; i < styles.length; i++) {
      var key = styles[i]
      var value = styles.getPropertyValue(key)

      element.style.setProperty(key, 'unset')

      var unsetValue = styles.getPropertyValue(key)

      if (inlineStyles)
          element.setAttribute('style', inlineStyles)
      else
          element.removeAttribute('style')

      if (unsetValue !== value)
          retval[key] = value
  }

  return retval
}
// ***********************************************************************************************************	

// Get computed styles of element

var cssOutputComputed = "";

var computedStyles = getAppliedComputedStyles(element);

for (const key in computedStyles){
  cssOutputComputed += `${key}: ${computedStyles[key]}` + "<br>"
}

/* End code block */

/* Begin code block */

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

/* End code block */

// Following code referenced from this stack overflow: https://stackoverflow.com/questions/42025329/how-to-get-the-applied-style-from-an-element-excluding-the-default-user-agent-s
// ***********************************************************************************************************

// var slice = Function.call.bind(Array.prototype.slice);

// var elementMatchCSSRule = function(element, cssRule) {
//     return element.matches(cssRule.selectorText);
// };

// var cssRules = slice(document.styleSheets).reduce(function(rules, styleSheet) {
//     return rules.concat(slice(styleSheet.cssRules));
// }, []);

// // Returns applied CSS of element (both from CSS files and from inline styles)
// function getAppliedCss(element) {
//     var elementRules = cssRules.filter(elementMatchCSSRule.bind(null, element));
//     var rules =[];

//     if (elementRules.length > 0) { // Get styling from external stylesheets
//         for (var i = 0; i < elementRules.length; i++) {
//             var e = elementRules[i];
//             rules.push(e.cssText)
//         }		
//     }
    
//     if (element.getAttribute('style')) { // Get styling from inline styles
//         rules.push(element.getAttribute('style'))
//     }

//     return rules;
// }

// ***********************************************************************************************************	

// let pureCssMain = []; // CSS descriptors of selected element
// let pureCssParents = []; // CSS descriptors of parent elements
// let pureCssRich = ""; // CSS in a text format (this is what is saved to database)

// let descriptorNames = []; // Keeps track of descriptor names so that the CSS of the main element will take priority

// // Regex for matching CSS descriptors
// let regex = /[^\s]+: [^;]+;/gm; // Previous regex: /((\S*):\s*"*\w*[,*\w ]*"*;)/mg

// // Get styling of element
// var rules = getAppliedCss(element);
// for (var i = 0; i < rules.length; i++) {
//     // Extract only the CSS descriptors
//     for (const match of rules[i].matchAll(regex)) {
//         let cssDescriptor = match[0];
//         if (!pureCssMain.includes(cssDescriptor)) {
//             pureCssMain.push(cssDescriptor);
//             descriptorNames.push(cssDescriptor.slice(0, cssDescriptor.indexOf(':')));
//             pureCssRich += cssDescriptor + "\n";
//         }
//     }
// }

// // Get styling of element's parents
// let parentElement = element.parentElement;
// while (parentElement) {
//     var rules = getAppliedCss(parentElement);

//     for (var i = 0; i < rules.length; i++) {
//         // Extract only the CSS descriptors
//         for (const match of rules[i].matchAll(regex)) {
//             let cssDescriptor = match[0];
//             if (!pureCssParents.includes(cssDescriptor) && !descriptorNames.includes(cssDescriptor.slice(0, cssDescriptor.indexOf(':')))) {
//                 pureCssParents.push(cssDescriptor);
//                 pureCssRich += cssDescriptor + "\n";
//             }
//         }
//     }		
    
//     parentElement = parentElement.parentElement;
// }