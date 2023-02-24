# Style-Checker

Updated basic extension to have some functionality for retrieving background colors from web pages. Using a js file it gets the current tab and executes a script which queries all elements and if they have a valid background colors, prints it in a new popup window. Does not account for duplicate entries and may not display background colors for all webpages (still examining).

To test it on a site that I used during testing go to:
https://ravimashru.dev/blog/2021-04-14-executescript-chrome-extension/ 

this is the output I got when I clicked on the extension:
![list of background colors returned by the website](https://github.com/emilypeters/Style-Checker/background-colors-extension.png

Anyone can feel free to edit this if you find a more efficient way of fetching this info, have another idea, or want to extend the js file to have more functionality

index.html contains the text that is displayed when the extension icon is clicked\
manifest.json sets up the default icon, what html page is shown, and other specs\
\
you can download / clone my code and use the following tutorial to get the extension working locally on your computers\
https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/ \
the "loading an unpacked extension" section will show you how to work with extensions in developer mode
