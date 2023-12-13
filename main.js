// Import required modules
const express = require('express');
const request = require('request');
const sel = require('./index');

// Initialize the sel module
sel.initialize();

// Create an Express application
const app = express();

// Set the port number for the server
const port = 3500;

// Define a route for streaming video
app.get('/stream-video', async (req, res) => {
  try {
    // Log the received request query parameters
    ////console.log("Received", req.query);

    // Call the sel wrapper function to get the video URL
    const videoUrl = await sel.wrapper(req.query);

    // Check if video URL is null, send an error response if so
    if (videoUrl === null) {
      res.status(500).send("Error Generating Video");
    } else {
      // Set appropriate headers for video streaming
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'inline; filename="video.mp4"');

      // Pipe the video directly to the response
      request(videoUrl).pipe(res);
    }
  } catch (error) {
    // Handle any unexpected errors and send a 500 response
    console.error("Error processing video streaming request:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
