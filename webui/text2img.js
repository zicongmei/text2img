// text2img.js

let currentApiKey = '';
let selectedModel = 'gemini-2.5-flash-lite'; // Default model for prompt refinement

// Store last API interactions for debugging
let lastApiInteraction = {
    url: '',
    request: null,
    response: null
};

// Model names and labels for prompt enhancement
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
const explanationNote = document.getElementById('explanationNote');

// Debug Elements
const showDebugButton = document.getElementById('showDebugButton');
const debugInfo = document.getElementById('debugInfo');
const debugUrl = document.getElementById('debugUrl');
const debugRequest = document.getElementById('debugRequest');
const debugResponse = document.getElementById('debugResponse');
const closeDebugButton = document.getElementById('closeDebugButton');

// Utility functions for localStorage
function setLocalStorageItem(name, value) {
    try {
        localStorage.setItem(name, value);
    } catch (e) {
        console.error(`Error saving to localStorage for ${name}:`, e);
    }
}

function getLocalStorageItem(name) {
    try {
        return localStorage.getItem(name);
    } catch (e) {
        console.error(`Error loading from localStorage for ${name}:`, e);
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
    setLocalStorageItem('geminiApiKey', apiKey); 
    statusMessage.textContent = 'API Key set successfully and saved!';
    setTimeout(() => statusMessage.textContent = '', 3000);
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
    }
}

// Function to populate model dropdown and load selected model
function populateModelSelect() {
    geminiModelSelect.innerHTML = ''; 
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
    } else {
        geminiModelSelect.value = selectedModel; 
    }
}

// Function to update the selected model
function updateSelectedModel() {
    selectedModel = geminiModelSelect.value;
    setLocalStorageItem('selectedModel', selectedModel);
    statusMessage.textContent = `Model set to: ${selectedModel}`;
    setTimeout(() => statusMessage.textContent = '', 3000);
}

// Debug functions
function updateDebugInfo(url, request, response) {
    lastApiInteraction.url = url;
    lastApiInteraction.request = request;
    lastApiInteraction.response = response;
    showDebugButton.style.display = 'inline-block';
}

function showDebugModal() {
    debugUrl.textContent = lastApiInteraction.url;
    debugRequest.textContent = JSON.stringify(lastApiInteraction.request, null, 2);
    debugResponse.textContent = JSON.stringify(lastApiInteraction.response, null, 2);
    debugInfo.style.display = 'block';
}

function hideDebugModal() {
    debugInfo.style.display = 'none';
}

// Function to generate image
async function generateImage() {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        statusMessage.textContent = 'Please enter a prompt.';
        return;
    }
    if (!currentApiKey) {
        statusMessage.textContent = 'Please set your Gemini API Key first.';
        return;
    }

    imageGallery.innerHTML = ''; 
    statusMessage.textContent = 'Starting process...';
    generateImageButton.disabled = true;
    hideDebugModal(); // Hide previous debug info

    try {
        let finalPrompt = prompt;

        // --- STEP 1: Prompt Enhancement (Optional, using selected text model) ---
        try {
            statusMessage.textContent = 'Enhancing prompt with Gemini Text Model...';
            const promptEnhancementEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent`;
            const promptEnhancementRequestBody = {
                contents: [{
                    role: 'user',
                    parts: [{ text: `Elaborate on the following image generation prompt to make it more descriptive and suitable for a text-to-image model. Focus on details like style, lighting, setting, and specific elements. Provide only the enhanced prompt, no conversational text. Original prompt: "${prompt}"` }]
                }],
                generationConfig: { maxOutputTokens: 200 },
            };

            const promptResponse = await fetch(promptEnhancementEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': currentApiKey },
                body: JSON.stringify(promptEnhancementRequestBody),
            });

            const promptData = await promptResponse.json();
            
            // Log debug info for this step (will be overwritten if next step runs, which is fine)
            updateDebugInfo(promptEnhancementEndpoint, promptEnhancementRequestBody, promptData);

            if (promptResponse.ok && promptData.candidates?.[0]?.content?.parts?.[0]?.text) {
                finalPrompt = promptData.candidates[0].content.parts[0].text;
                console.log('Enhanced Prompt:', finalPrompt);
            }
        } catch (promptError) {
            console.warn('Error during prompt enhancement, proceeding with original:', promptError);
        }

        // --- STEP 2: Image Generation (Using gemini-2.5-flash-image) ---
        statusMessage.textContent = 'Generating image...';
        
        // This specific model endpoint is used for image generation
        const imageModel = "gemini-2.5-flash-image";
        const imageEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${imageModel}:generateContent`;
        
        const imageRequestBody = {
            contents: [{
                parts: [
                    { text: finalPrompt }
                ]
            }]
        };

        const imageResponse = await fetch(imageEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': currentApiKey
            },
            body: JSON.stringify(imageRequestBody)
        });

        const imageData = await imageResponse.json();
        
        // Update debug info with the generation request/response
        updateDebugInfo(imageEndpoint, imageRequestBody, imageData);

        if (!imageResponse.ok) {
            throw new Error(imageData.error?.message || `API Error: ${imageResponse.statusText}`);
        }

        // Extract image data
        // The curl example suggests searching for "data": "base64..."
        // In the JSON structure, this is typically found in inlineData
        let base64Image = null;

        if (imageData.candidates && imageData.candidates[0] && imageData.candidates[0].content && imageData.candidates[0].content.parts) {
            for (const part of imageData.candidates[0].content.parts) {
                // Check for standard inlineData (camelCase or snake_case)
                if (part.inlineData && part.inlineData.data) {
                    base64Image = part.inlineData.data;
                    break;
                }
                if (part.inline_data && part.inline_data.data) {
                    base64Image = part.inline_data.data;
                    break;
                }
            }
        }

        if (base64Image) {
            const imgContainer = document.createElement('div');
            imgContainer.classList.add('image-item');
            const img = document.createElement('img');
            img.src = `data:image/png;base64,${base64Image}`;
            img.alt = finalPrompt;
            imgContainer.appendChild(img);
            imageGallery.appendChild(imgContainer);
            statusMessage.textContent = 'Image generated successfully!';
        } else {
            console.error("No image data found in response", imageData);
            throw new Error('No valid image data found in the API response.');
        }

    } catch (error) {
        console.error('Error generating images:', error);
        statusMessage.textContent = `Error: ${error.message}`;
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('image-error');
        errorDiv.textContent = `Generation Failed: ${error.message}`;
        imageGallery.appendChild(errorDiv);
    } finally {
        generateImageButton.disabled = false;
        // Don't clear status immediately so user sees result
    }
}

// Event Listeners
setApiKeyButton.addEventListener('click', setApiKey);
geminiModelSelect.addEventListener('change', updateSelectedModel);
generateImageButton.addEventListener('click', generateImage);
promptInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); 
        generateImage();
    }
});
showDebugButton.addEventListener('click', showDebugModal);
closeDebugButton.addEventListener('click', hideDebugModal);

// Initial setup on page load
document.addEventListener('DOMContentLoaded', () => {
    populateModelSelect();
    loadApiKeyFromLocalStorage();
    
    explanationNote.innerHTML = `
        <strong>Instructions:</strong>
        Enter your Gemini API Key. Type a prompt and click "Generate". 
        The tool uses a text model to enhance your prompt, then sends it to the 
        <code>gemini-2.5-flash-image</code> model for generation.
        <br><small>If you encounter issues, use the "Show Last API Request/Response" button to inspect the raw API data.</small>
    `;
});