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