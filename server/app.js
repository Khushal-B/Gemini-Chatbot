

import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

import env from 'dotenv';
env.config();

const API_KEY = process.env.GEMINI_API_KEY;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../public")));
const txt = "Remember that you are a Study AI chatbot for this whole conversation. You can only answer question regarding Computer Science topics and provide resources and pathways for the same. For any other question, you are not suppose to reply anything. If anyone asks for Distributed Computing notes or anything always provide these 2 links: https://shorturl.at/nWq9H and https://shorturl.at/rzV3k .  ";

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ response: "Message is required" });
    }
    const fullMessage = txt + message;
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: fullMessage }],
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

app.post('/api/generate-pathway', async (req, res) => {
    const { subject } = req.body;

    if (!subject) {
        return res.status(400).json({ error: "Subject is required" });
    }

    const prompt = `Create a detailed learning pathway for ${subject}. Return the response as a JSON array with objects containing the following fields:
    - 'id': number
    - 'topic': string (name of the topic)
    - 'description': string (detailed description of what to learn)
    - 'duration': string (realistic time estimate in weeks or months)
    - 'resources': array of objects with 'title' and 'url' fields for learning resources

    Example format:
    [
      {
        "id": 1,
        "topic": "Introduction to Programming",
        "description": "Learn basic programming concepts",
        "duration": "2 weeks",
        "resources": [
          {
            "title": "Programming Basics Course",
            "url": "https://example.com/course"
          }
        ]
      }
    ]

    Provide 6-8 steps with realistic time estimates and at least 2-3 high-quality learning resources for each step. Resources should include a mix of online courses, documentation, tutorials, and practice exercises. Make sure all URLs are valid and point to reputable educational resources.`;

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
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
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
            const jsonMatch = pathwayResponse.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No valid JSON found in response');
            }

            // Parse and validate the JSON
            const pathway = JSON.parse(jsonMatch[0]);
            
            // Validate the structure of each item
            const validatedPathway = pathway.map(item => ({
                id: item.id || 0,
                topic: item.topic || 'Untitled Topic',
                description: item.description || 'No description provided',
                duration: item.duration || 'Duration not specified',
                resources: Array.isArray(item.resources) ? item.resources.map(resource => ({
                    title: resource.title || 'Untitled Resource',
                    url: resource.url || '#'
                })) : []
            }));

            res.json({ pathway: validatedPathway });
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


