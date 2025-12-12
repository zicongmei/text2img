// text2img.js

let currentApiKey = '';
let selectedModel = 'gemini-2.5-flash-lite'; // Default model, primarily for prompt refinement if used, or just a selector.

// Model names and labels, duplicated from chatbot.js for independence.
// IMPORTANT NOTE: The listed Gemini models (e.g., gemini-2.5-flash, gemini-3-pro-preview)
// are primarily for text generation, understanding, and multimodal tasks (text/image input, text output).
// They do NOT directly generate images from text prompts in the same way DALL-E or Imagen do.
// For actual image generation with Google models, services like Imagen 2 via Google Cloud's Vertex AI
// would typically be used.
// This implementation provides a UI to input a prompt and API key, and will simulate
// an image generation process using a placeholder API call, assuming a conceptual
// "Gemini Image API" might exist or a proxy for it.
const GEMINI_TEXT_MODELS = {
    'gemini-2.5-flash': 'Gemini 2.5 Flash (Text Model)',
    'gemini-2.5-pro': 'Gemini 2.5 Pro (Text Model)',
    'gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite (Text Model)',
    'gemini-3-pro-preview': 'Gemini 3 Pro Preview (Text Model)'
};

// Get DOM elements
const geminiApiKeyInput = document.getElementById('geminiApiKey');
const setApiKeyButton = document.getElementById('setApiKeyButton');
const geminiModelSelect = document.getElementById('geminiModel');
const promptInput = document.getElementById('promptInput');
const generateImageButton = document.getElementById('generateImageButton');
const imageGallery = document.getElementById('imageGallery');
const statusMessage = document.getElementById('statusMessage');
const explanationNote = document.getElementById('explanationNote'); // To display the disclaimer

// Utility functions for localStorage
function setLocalStorageItem(name, value) {
    try {
        localStorage.setItem(name, value);
    } catch (e) {
        console.error(`Error saving to localStorage for ${name}:`, e);
        statusMessage.textContent = `Error saving data locally: ${e.message}`;
        setTimeout(() => statusMessage.textContent = '', 3000);
    }
}

function getLocalStorageItem(name) {
    try {
        return localStorage.getItem(name);
    } catch (e) {
        console.error(`Error loading from localStorage for ${name}:`, e);
        statusMessage.textContent = `Error loading data locally: ${e.message}`;
        setTimeout(() => statusMessage.textContent = '', 3000);
        return null;
    }
}

// Function to validate and store the API key
function setApiKey() {
    const apiKey = geminiApiKeyInput.value.trim();
    if (!apiKey) {
        statusMessage.textContent = 'Please enter your Gemini API Key.';
        currentApiKey = '';
        return false;
    }
    currentApiKey = apiKey;
    setLocalStorageItem('geminiApiKey', apiKey); // Save API key to localStorage
    statusMessage.textContent = 'API Key set successfully and saved!';
    setTimeout(() => statusMessage.textContent = '', 3000);
    console.log('API Key set.');
    return true;
}

// Function to load the API key from localStorage
function loadApiKeyFromLocalStorage() {
    const apiKey = getLocalStorageItem('geminiApiKey');
    if (apiKey) {
        geminiApiKeyInput.value = apiKey;
        currentApiKey = apiKey;
        statusMessage.textContent = 'API Key loaded from local storage!';
        setTimeout(() => statusMessage.textContent = '', 3000);
        console.log('API Key loaded from local storage.');
    }
}

// Function to populate model dropdown and load selected model
function populateModelSelect() {
    geminiModelSelect.innerHTML = ''; // Clear existing options
    for (const modelId in GEMINI_TEXT_MODELS) {
        const option = document.createElement('option');
        option.value = modelId;
        option.textContent = GEMINI_TEXT_MODELS[modelId];
        geminiModelSelect.appendChild(option);
    }

    const storedModel = getLocalStorageItem('selectedModel');
    if (storedModel && GEMINI_TEXT_MODELS[storedModel]) {
        selectedModel = storedModel;
        geminiModelSelect.value = storedModel;
        console.log(`Selected model loaded from local storage: ${selectedModel}`);
    } else {
        geminiModelSelect.value = selectedModel; // Set default if no stored value or invalid
    }
}

// Function to update the selected model
function updateSelectedModel() {
    selectedModel = geminiModelSelect.value;
    setLocalStorageItem('selectedModel', selectedModel); // Save selected model to localStorage
    statusMessage.textContent = `Model set to: ${selectedModel}`;
    setTimeout(() => statusMessage.textContent = '', 3000);
    console.log(`Selected model: ${selectedModel}`);
}

// Function to simulate image generation
async function generateImage() {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        statusMessage.textContent = 'Please enter a prompt.';
        setTimeout(() => statusMessage.textContent = '', 3000);
        return;
    }
    if (!currentApiKey) {
        statusMessage.textContent = 'Please set your Gemini API Key first.';
        setTimeout(() => statusMessage.textContent = '', 3000);
        return;
    }

    imageGallery.innerHTML = ''; // Clear previous images
    statusMessage.textContent = 'Generating images...';
    generateImageButton.disabled = true;

    try {
        // --- STEP 1: (Optional) Use Gemini Text Model for Prompt Enhancement ---
        // This step demonstrates using a Gemini text model to refine the user's prompt.
        // For actual image generation, the *enhanced* prompt would then be sent to an
        // image generation service (e.g., Imagen 2, DALL-E, Stable Diffusion).
        
        let finalPrompt = prompt;
        try {
            const promptEnhancementEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent`;
            const promptEnhancementRequestBody = {
                contents: [{
                    role: 'user',
                    parts: [{ text: `Elaborate on the following image generation prompt to make it more descriptive and suitable for a text-to-image model. Focus on details like style, lighting, setting, and specific elements. Provide only the enhanced prompt, no conversational text. Original prompt: "${prompt}"` }]
                }],
                generationConfig: {
                    maxOutputTokens: 200,
                },
            };

            const promptEnhancementResponse = await fetch(promptEnhancementEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': currentApiKey,
                },
                body: JSON.stringify(promptEnhancementRequestBody),
            });

            if (promptEnhancementResponse.ok) {
                const promptEnhancementData = await promptEnhancementResponse.json();
                if (promptEnhancementData.candidates && promptEnhancementData.candidates.length > 0 &&
                    promptEnhancementData.candidates[0].content && promptEnhancementData.candidates[0].content.parts &&
                    promptEnhancementData.candidates[0].content.parts.length > 0) {
                    finalPrompt = promptEnhancementData.candidates[0].content.parts[0].text;
                    console.log('Enhanced Prompt:', finalPrompt);
                    statusMessage.textContent = 'Prompt enhanced by Gemini. Simulating image generation...';
                }
            } else {
                console.warn('Could not enhance prompt:', await promptEnhancementResponse.json());
                statusMessage.textContent = 'Failed to enhance prompt, using original. Simulating image generation...';
            }
        } catch (promptError) {
            console.error('Error during prompt enhancement:', promptError);
            statusMessage.textContent = 'Error enhancing prompt, using original. Simulating image generation...';
        }


        // --- STEP 2: Simulate Image Generation based on finalPrompt ---
        // This is a SIMULATION. In a real application, you would integrate with an actual
        // image generation API (e.g., DALL-E 3, Stable Diffusion, or Google's Imagen 2 via Vertex AI).
        // For this example, we'll use placeholder images from source.unsplash.com.
        // We generate a predictable URL based on the prompt for demonstration.
        
        // Generate a simple hash from the prompt to get a somewhat consistent placeholder image
        const promptHash = Array.from(finalPrompt).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0);
        const seed = Math.abs(promptHash % 1000); // Use a seed for consistent placeholder images

        const imageUrls = [
            `https://source.unsplash.com/random/512x512?${finalPrompt}&sig=${seed}`,
            `https://source.unsplash.com/random/512x512?${finalPrompt}&sig=${seed + 1}`,
            `https://source.unsplash.com/random/512x512?${finalPrompt}&sig=${seed + 2}`
        ];

        imageUrls.forEach(url => {
            const imgContainer = document.createElement('div');
            imgContainer.classList.add('image-item');
            const img = document.createElement('img');
            img.src = url;
            img.alt = finalPrompt;
            img.onload = () => {
                imgContainer.appendChild(img);
                imageGallery.appendChild(imgContainer);
            };
            img.onerror = () => {
                const errorDiv = document.createElement('div');
                errorDiv.textContent = `Failed to load image for: "${finalPrompt}"`;
                errorDiv.classList.add('image-error');
                imgContainer.appendChild(errorDiv);
                imageGallery.appendChild(imgContainer);
            };
        });

        statusMessage.textContent = 'Images generated (simulated)!';
        // promptInput.value = ''; // Clear prompt - COMMENTED OUT as per user request
    } catch (error) {
        console.error('Error generating images:', error);
        statusMessage.textContent = `Error generating images: ${error.message}`;
    } finally {
        generateImageButton.disabled = false;
        setTimeout(() => statusMessage.textContent = '', 5000);
    }
}

// Event Listeners
setApiKeyButton.addEventListener('click', setApiKey);
geminiModelSelect.addEventListener('change', updateSelectedModel);
generateImageButton.addEventListener('click', generateImage);
promptInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Prevent new line
        generateImage();
    }
});

// Initial setup on page load
document.addEventListener('DOMContentLoaded', () => {
    populateModelSelect();
    loadApiKeyFromLocalStorage();
    // Display the explanation note/disclaimer
    explanationNote.innerHTML = `
        <strong>Note on Gemini for Image Generation:</strong>
        The models listed in the dropdown (e.g., Gemini 2.5 Flash, Gemini 3 Pro Preview) are Google's powerful text-based or multimodal (text/image input, text output) generative AI models.
        They are excellent for tasks like prompt engineering (as demonstrated by the optional prompt enhancement step in this tool) but do not directly generate images from text.
        For actual text-to-image generation, Google offers services like <a href="https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/imagen-2" target="_blank">Imagen 2 via Vertex AI</a>.
        This tool uses a Gemini text model to enhance your prompt and then simulates image generation using random images from Unsplash based on the refined prompt.
    `;
});