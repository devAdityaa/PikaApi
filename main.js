// Import required modules
const express = require('express');
const request = require('request');
const sel = require('./index');

// Initialize the sel module
sel.initialize();

// Create an Express application
const app = express();

// Set the port number for the server
const port = process.env.PORT || 4000;

// Define a route for streaming video
app.get('/generateVideo', async (req, res) => {
  try {
    // Log the received request query parameters
    ////console.log("Received", req.query);

    // Call the sel wrapper function to get the video URL
    const videoUrl = await sel.wrapper(req.query);

    // Check if video URL is null, send an error response if so
    if (videoUrl === 0) {
      res.status(442).send("Error Occured");
    } 
    else if(videoUrl === -1){
      res.status(443).send("Error Generating Video");
    }
    else if(videoUrl === -2){
      res.status(444).send("Forbidden Content Not Allowed!");
    }
    
    else {
      // Set appropriate headers for video streaming
      res.setHeader('Content-Type', 'text/plain');

      // Pipe the video directly to the response
      res.send(videoUrl);
    }
  } catch (error) {
    // Handle any unexpected errors and send a 500 response
    console.error("Error processing video streaming request:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server and listen on the specified port
app.listen(port,'0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});
