// import express from 'express';
// import fetch from 'node-fetch';
// import bodyParser from 'body-parser';
// import path from 'path';
// import { fileURLToPath } from 'url';

// // Workaround for __dirname in ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// const PORT = 5000;

// import env from 'dotenv';

// env.config();

// const API_KEY = process.env.GEMINI_API_KEY;
// const txt = "Remember that you are a Study AI chatbot for this whole conversation. You can only answer question regarding Computer Science topics and provide resources and pathways for the same. For any other question, you are not suppose to reply anything. If anyone asks for Distributed Computing notes or anything always provide these 2 links: https://shorturl.at/nWq9H and https://shorturl.at/rzV3k .  "; // Keep a space at the end for proper concatenation

// app.use(bodyParser.json());
// app.use(express.static(path.join(__dirname, "../public")));

// app.post('/api/chat', async (req, res) => {
//   const { message } = req.body;

//   if (!message) {
//     return res.status(400).json({ response: "Message is required" });
//   }

//   // Properly concatenate the strings
//   const fullMessage = txt + message;
//   // console.log("Full message:", fullMessage);

//   try {
//     // Prepare the API request to Gemini AI
//     const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         contents: [
//           {
//             parts: [{ text: fullMessage }],
//           },
//         ],
//       }),
//     });

//     // Check if the response from the API is successful
//     if (!response.ok) {
//       const errorMessage = await response.text();
//       console.error('Error from Gemini API:', errorMessage);
//       return res.status(response.status).json({ response: `Error: ${errorMessage}` });
//     }

//     // Parse the response from the API
//     const result = await response.json();

//     // Extract the response text from the candidates array
//     const botResponse = result?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";

//     // Send the AI's response back to the client
//     res.json({ response: botResponse });
//   } catch (error) {
//     console.error('Error fetching from Gemini API:', error);
//     res.status(500).json({ response: "An error occurred. Please try again." });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

import env from 'dotenv';

env.config();

const API_KEY = 'AIzaSyB1zFdgG7jlmbkNMreftk2Jx6HnZG_92E4';

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../public")));

// Original chat endpoint
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ response: "Message is required" });
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: message }],
                    },
                ],
            }),
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            console.error('Error from Gemini API:', errorMessage);
            return res.status(response.status).json({ response: `Error: ${errorMessage}` });
        }

        const result = await response.json();
        const botResponse = result?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
        res.json({ response: botResponse });
    } catch (error) {
        console.error('Error fetching from Gemini API:', error);
        res.status(500).json({ response: "An error occurred. Please try again." });
    }
});

// New pathway generation endpoint
app.post('/api/generate-pathway', async (req, res) => {
    const { subject } = req.body;

    if (!subject) {
        return res.status(400).json({ error: "Subject is required" });
    }

    const prompt = `Create a learning pathway for ${subject}. Return the response as a JSON array with objects containing 'id', 'topic', and 'description' fields. Each object should represent a step in the learning journey. The response should be properly formatted JSON that can be parsed. Example format: [{"id": 1, "topic": "Introduction", "description": "Basic concepts"}]. Provide 6-8 steps.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: prompt }],
                    },
                ],
            }),
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            console.error('Error from Gemini API:', errorMessage);
            return res.status(response.status).json({ error: `Error: ${errorMessage}` });
        }

        const result = await response.json();
        const pathwayResponse = result?.candidates?.[0]?.content?.parts?.[0]?.text;

        try {
            // Extract JSON from the response (in case there's additional text)
            const jsonMatch = pathwayResponse.match(/\[.*\]/s);
            console.log(jsonMatch);
            if (!jsonMatch) {
                throw new Error('No valid JSON found in response');
            }
            const pathway = JSON.parse(jsonMatch[0]);
            res.json({ pathway });
        } catch (parseError) {
            console.error('Error parsing pathway JSON:', parseError);
            res.status(500).json({ error: "Error parsing the learning pathway" });
        }
    } catch (error) {
        console.error('Error fetching from Gemini API:', error);
        res.status(500).json({ error: "An error occurred. Please try again." });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
