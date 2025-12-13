// text2img.js

let currentApiKey = '';
let selectedModel = 'gemini-2.5-flash-image'; // Default model for image generation
let numOutputImages = 1; // Default number of images to generate
let selectedInputImageBase64 = null; // Store selected image for input

let abortController = null; // To manage ongoing fetch requests
let allApiInteractions = []; // To store all API calls for debug info

// Model names and labels for image generation
const GEMINI_IMAGE_MODELS = {
    'gemini-2.5-flash-image': 'Gemini 2.5 Flash Image',
    'gemini-2.5-pro-image': 'Gemini 2.5 Pro Image',
    'gemini-3-pro-image-preview': 'Gemini 3 Pro Preview Image'
};

const GEMINI_3_PRO_MODEL_ID = 'gemini-3-pro-image-preview'; // Define the Gemini 3 model ID

// Get DOM elements
const geminiApiKeyInput = document.getElementById('geminiApiKey');
const setApiKeyButton = document.getElementById('setApiKeyButton');
const geminiModelSelect = document.getElementById('geminiModel');
const imageCountInput = document.getElementById('imageCountInput');
const promptInput = document.getElementById('promptInput');
const generateImageButton = document.getElementById('generateImageButton');
const stopGenerationButton = document.getElementById('stopGenerationButton'); // New stop button
const imageGallery = document.getElementById('imageGallery');
const statusMessage = document.getElementById('statusMessage');
const explanationNote = document.getElementById('explanationNote');

// New Options Elements
const aspectRatioSelect = document.getElementById('aspectRatioSelect');
const imageSizeSelect = document.getElementById('imageSizeSelect');
const imageSizeOptionGroup = document.getElementById('imageSizeOptionGroup'); // Get parent div
const useGoogleSearchInput = document.getElementById('useGoogleSearch');
const googleSearchOptionGroup = document.getElementById('googleSearchOptionGroup'); // Get parent div

// Selected Image Elements
const selectedImageContainer = document.getElementById('selectedImageContainer');
const selectedInputImage = document.getElementById('selectedInputImage');
const clearSelectedImageButton = document.getElementById('clearSelectedImageButton');

// New elements for Load Image
const loadImageButton = document.getElementById('loadImageButton');
const imageFileInput = document.getElementById('imageFileInput');

// Debug Elements (modified to show all API calls)
const showApiCallsButton = document.getElementById('showApiCallsButton'); // Renamed debug button
const debugInfo = document.getElementById('debugInfo');
const apiCallsContainer = document.getElementById('apiCallsContainer'); // New container for multiple calls
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

// Function to load values from localStorage (excluding model-dependent features for initial setup)
function loadSettingsFromLocalStorage() {
    // API Key
    const apiKey = getLocalStorageItem('geminiApiKey');
    if (apiKey) {
        geminiApiKeyInput.value = apiKey;
        currentApiKey = apiKey;
        statusMessage.textContent = 'Settings loaded from local storage!';
        setTimeout(() => statusMessage.textContent = '', 3000);
    }

    // Number of Images
    const storedNumImages = getLocalStorageItem('numOutputImages');
    if (storedNumImages !== null) {
        numOutputImages = parseInt(storedNumImages, 10);
        if (isNaN(numOutputImages) || numOutputImages < 1) { 
            numOutputImages = 1;
        }
        imageCountInput.value = numOutputImages;
    }

    // Aspect Ratio
    const storedAspectRatio = getLocalStorageItem('aspectRatio');
    if (storedAspectRatio) {
        aspectRatioSelect.value = storedAspectRatio;
    }

    // Load Prompt
    const storedPrompt = getLocalStorageItem('promptInput');
    if (storedPrompt) {
        promptInput.value = storedPrompt;
    }

    // Load Selected Input Image
    const storedInputImageBase64 = getLocalStorageItem('selectedInputImageBase64');
    if (storedInputImageBase64) {
        selectedInputImageBase64 = storedInputImageBase64;
        selectedInputImage.src = `data:image/png;base64,${storedInputImageBase64}`;
        selectedImageContainer.style.display = 'flex';
    }
}

// Function to populate model dropdown and load selected model
function populateModelSelect() {
    geminiModelSelect.innerHTML = ''; 
    for (const modelId in GEMINI_IMAGE_MODELS) {
        const option = document.createElement('option');
        option.value = modelId;
        option.textContent = GEMINI_IMAGE_MODELS[modelId];
        geminiModelSelect.appendChild(option);
    }

    const storedModel = getLocalStorageItem('selectedModel');
    if (storedModel && GEMINI_IMAGE_MODELS[storedModel]) {
        selectedModel = storedModel;
        geminiModelSelect.value = storedModel;
    } else {
        geminiModelSelect.value = selectedModel; // Set default if no stored or invalid
    }
}

// Function to toggle model-dependent features (Image Size, Google Search)
function toggleModelDependentFeatures() {
    const isGemini3Pro = (selectedModel === GEMINI_3_PRO_MODEL_ID);

    // Toggle Image Size
    if (isGemini3Pro) {
        imageSizeSelect.disabled = false;
        imageSizeOptionGroup.classList.remove('feature-disabled-by-model');
        const storedImageSize = getLocalStorageItem('imageSize');
        if (storedImageSize && imageSizeSelect.options.namedItem(storedImageSize)) {
            imageSizeSelect.value = storedImageSize;
        } else {
            imageSizeSelect.value = '1K'; // Default to 1K if no stored value or invalid
        }
    } else {
        imageSizeSelect.disabled = true;
        imageSizeSelect.value = '1K'; // Force 1K for 2.5 models
        imageSizeOptionGroup.classList.add('feature-disabled-by-model');
    }

    // Toggle Google Search Tool
    if (isGemini3Pro) {
        useGoogleSearchInput.disabled = false;
        googleSearchOptionGroup.classList.remove('feature-disabled-by-model');
        const storedUseSearch = getLocalStorageItem('useGoogleSearch');
        useGoogleSearchInput.checked = (storedUseSearch === 'true');
    } else {
        useGoogleSearchInput.disabled = true;
        useGoogleSearchInput.checked = false; // Force unchecked for 2.5 models
        googleSearchOptionGroup.classList.add('feature-disabled-by-model');
    }

    // Update explanation note to reflect feature status
    updateExplanationNote();
}


// Function to update the selected model
function updateSelectedModel() {
    selectedModel = geminiModelSelect.value;
    setLocalStorageItem('selectedModel', selectedModel);
    toggleModelDependentFeatures(); // Update feature availability based on new model
}

// Function to update the number of output images
function updateNumOutputImages() {
    let value = parseInt(imageCountInput.value, 10);
    if (isNaN(value) || value < 1) {
        value = 1;
    }
    // Cap at the max value defined in HTML (e.g., 8)
    const maxValue = parseInt(imageCountInput.max, 10);
    if (!isNaN(maxValue) && value > maxValue) {
        value = maxValue;
        imageCountInput.value = maxValue;
    }
    numOutputImages = value; // Update global variable
    setLocalStorageItem('numOutputImages', numOutputImages);
}

function updateAspectRatio() {
    setLocalStorageItem('aspectRatio', aspectRatioSelect.value);
}

function updateImageSize() {
    // Only save if the feature is enabled (i.e., for Gemini 3 Pro)
    if (!imageSizeSelect.disabled) {
        setLocalStorageItem('imageSize', imageSizeSelect.value);
    }
}

function updateUseGoogleSearch() {
    // Only save if the feature is enabled (i.e., for Gemini 3 Pro)
    if (!useGoogleSearchInput.disabled) {
        setLocalStorageItem('useGoogleSearch', useGoogleSearchInput.checked);
    }
}

// Input Image Selection Functions
function selectImageAsInput(base64) {
    selectedInputImageBase64 = base64;
    selectedInputImage.src = `data:image/png;base64,${base64}`;
    selectedImageContainer.style.display = 'flex';
    statusMessage.textContent = 'Image selected as input for next generation.';
    
    // Save to localStorage
    setLocalStorageItem('selectedInputImageBase64', base64);

    // Scroll up to show the selection
    selectedImageContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearSelectedInputImage() {
    selectedInputImageBase64 = null;
    selectedInputImage.src = '';
    selectedImageContainer.style.display = 'none';
    
    // Remove from localStorage
    localStorage.removeItem('selectedInputImageBase64');
}

// Function to save a generated image
function saveGeneratedImage(base64Image, prompt) {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64Image}`;
    // Sanitize prompt for filename
    const filename = `gemini_image_${prompt.substring(0, 50).replace(/[^a-z0-9]/gi, '_') || 'generated'}_${Date.now()}.png`;
    link.download = filename;
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link); // Clean up
    statusMessage.textContent = 'Image saved successfully!';
    setTimeout(() => statusMessage.textContent = '', 3000);
}

// Debug functions
function updateDebugButtonText() {
    const count = allApiInteractions.length;
    showApiCallsButton.textContent = `Show ${count} API Call${count !== 1 ? 's' : ''}`;
}

function appendApiCallEntry(interaction, index) {
    const callDiv = document.createElement('div');
    callDiv.classList.add('api-call-entry');
    callDiv.innerHTML = `
        <h4>API Call ${index + 1}</h4>
        <div class="debug-section">
            <h5>Endpoint</h5>
            <div class="debug-content">${interaction.url}</div>
        </div>
        <div class="debug-section">
            <h5>Request Body</h5>
            <div class="debug-content">${JSON.stringify(interaction.request, null, 2)}</div>
        </div>
        <div class="debug-section">
            <h5>Response Body</h5>
            <div class="debug-content">${JSON.stringify(interaction.response, null, 2)}</div>
        </div>
    `;
    apiCallsContainer.appendChild(callDiv);
}

function logApiInteraction(url, request, response) {
    const interaction = { url, request, response };
    allApiInteractions.push(interaction);
    updateDebugButtonText();
    
    // If debug window is visible, append the new entry immediately
    if (debugInfo.style.display !== 'none') {
        // If it was showing "No API calls", clear that first
        const noCallsMsg = apiCallsContainer.querySelector('p');
        if (noCallsMsg && noCallsMsg.textContent.includes('No API calls')) {
            apiCallsContainer.innerHTML = '';
        }
        
        appendApiCallEntry(interaction, allApiInteractions.length - 1);
        // Scroll to bottom
        apiCallsContainer.scrollTop = apiCallsContainer.scrollHeight;
    }
}

function showApiCallsModal() {
    apiCallsContainer.innerHTML = ''; // Clear previous content

    if (allApiInteractions.length === 0) {
        apiCallsContainer.innerHTML = '<p>No API calls recorded yet.</p>';
        debugInfo.style.display = 'block';
        return;
    }

    allApiInteractions.forEach((interaction, index) => {
        appendApiCallEntry(interaction, index);
    });
    debugInfo.style.display = 'block';
    apiCallsContainer.scrollTop = apiCallsContainer.scrollHeight;
}

function hideDebugModal() {
    debugInfo.style.display = 'none';
}

function updateExplanationNote() {
    const isGemini3Pro = (selectedModel === GEMINI_3_PRO_MODEL_ID);
    let noteText = `
        <strong>Instructions:</strong>
        Enter your Gemini API Key. Select options (Model, Aspect Ratio), type a prompt, and click "Generate". 
        <br><small>To use an image as input, click "Use as Input" on a generated result. You can also "Load Image as Input" from your device.</small>
    `;

    if (isGemini3Pro) {
        noteText += `<br><small><strong>Gemini 3 Pro Preview</strong> selected: Image Size and Google Search Tool are available.</small>`;
    } else {
        noteText += `<br><small><strong>Gemini 2.5 models</strong> selected: Image Size and Google Search Tool are disabled as they are only supported by Gemini 3 Pro Preview.</small>`;
    }
    explanationNote.innerHTML = noteText;
}

// Helper to process and display a single image response
function processAndDisplayImage(imageData, prompt) {
    let base64Image = null;
    
    // Check for standard inlineData (camelCase or snake_case)
    if (imageData.candidates && imageData.candidates[0] && imageData.candidates[0].content && imageData.candidates[0].content.parts) {
        for (const part of imageData.candidates[0].content.parts) {
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
        img.alt = prompt;
        imgContainer.appendChild(img);

        const buttonGroup = document.createElement('div');
        buttonGroup.classList.add('image-item-buttons'); 

        const useInputBtn = document.createElement('button');
        useInputBtn.textContent = 'Use as Input';
        useInputBtn.classList.add('use-input-btn');
        useInputBtn.onclick = () => selectImageAsInput(base64Image);
        buttonGroup.appendChild(useInputBtn);

        const saveImageBtn = document.createElement('button');
        saveImageBtn.textContent = 'Save Image';
        saveImageBtn.classList.add('save-image-btn');
        saveImageBtn.onclick = () => saveGeneratedImage(base64Image, prompt);
        buttonGroup.appendChild(saveImageBtn);

        imgContainer.appendChild(buttonGroup); 
        imageGallery.appendChild(imgContainer); 
        return true;
    }
    return false;
}

// Main generation function dispatcher
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
    
    allApiInteractions = [];
    updateDebugButtonText();
    showApiCallsButton.style.display = 'inline-block'; // Show debug button immediately
    debugInfo.style.display = 'none'; // Ensure debug panel is closed initially

    abortController = new AbortController();
    generateImageButton.disabled = true;
    stopGenerationButton.style.display = 'inline-block';

    const numToGenerate = parseInt(imageCountInput.value, 10);
    // Validation is already handled by updateNumOutputImages mostly, but safe to check here
    if (isNaN(numToGenerate) || numToGenerate < 1) {
        statusMessage.textContent = 'Invalid number of images.';
        generateImageButton.disabled = false;
        return;
    }

    try {
        if (numToGenerate > 1) {
            // Use Batch API for multiple images
            await generateBatchImages(prompt, numToGenerate);
        } else {
            // Use standard API for single image
            await generateSingleImage(prompt);
        }
    } catch (error) {
        if (error.name === 'AbortError' || abortController.signal.aborted) {
             statusMessage.textContent = 'Generation cancelled.';
        } else {
             console.error('Generation Error:', error);
             statusMessage.textContent = `Error: ${error.message}`;
             const errorDiv = document.createElement('div');
             errorDiv.classList.add('image-error');
             errorDiv.textContent = `Failed: ${error.message}`;
             imageGallery.appendChild(errorDiv);
        }
    } finally {
        generateImageButton.disabled = false;
        stopGenerationButton.style.display = 'none';
        abortController = null;
    }
}

// Function to generate a single image (Synchronous/Direct)
async function generateSingleImage(prompt) {
    statusMessage.textContent = 'Generating image...';

    const parts = [{ text: prompt }];
    if (selectedInputImageBase64) {
        parts.push({
            inline_data: { mime_type: "image/png", data: selectedInputImageBase64 }
        });
    }

    const generationConfig = {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: { aspectRatio: aspectRatioSelect.value }
    };
    if (!imageSizeSelect.disabled) {
        generationConfig.imageConfig.imageSize = imageSizeSelect.value;
    }

    const requestBody = {
        contents: [{ parts: parts }],
        generationConfig: generationConfig
    };

    if (!useGoogleSearchInput.disabled && useGoogleSearchInput.checked) {
        requestBody.tools = [{ google_search: {} }];
    }
    
    const imageEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent`;

    const response = await fetch(imageEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': currentApiKey
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal
    });

    const data = await response.json();
    logApiInteraction(imageEndpoint, requestBody, data);

    if (!response.ok) {
        throw new Error(data.error?.message || `API Error: ${response.statusText}`);
    }

    if (!processAndDisplayImage(data, prompt)) {
         throw new Error('No valid image data found in response.');
    }
    statusMessage.textContent = 'Image generated successfully!';
}

// Function to generate multiple images using Batch API
async function generateBatchImages(prompt, numToGenerate) {
    statusMessage.textContent = `Preparing batch job for ${numToGenerate} images...`;
    
    const requests = [];
    for (let i = 0; i < numToGenerate; i++) {
        const parts = [{ text: prompt }];
        if (selectedInputImageBase64) {
            parts.push({
                inline_data: {
                    mime_type: "image/png",
                    data: selectedInputImageBase64
                }
            });
        }

        const generationConfig = {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: {
                aspectRatio: aspectRatioSelect.value
            }
        };
        
        if (!imageSizeSelect.disabled) {
            generationConfig.imageConfig.imageSize = imageSizeSelect.value;
        }

        const requestReq = {
            contents: [{ parts: parts }],
            generationConfig: generationConfig
        };

        if (!useGoogleSearchInput.disabled && useGoogleSearchInput.checked) {
            requestReq.tools = [{ google_search: {} }];
        }

        requests.push({
            request: requestReq,
            metadata: { key: `req-${i}` }
        });
    }

    const batchRequestBody = {
        batch: {
            display_name: `img-gen-${Date.now()}`,
            input_config: {
                requests: {
                    requests: requests
                }
            }
        }
    };

    const batchEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:batchGenerateContent`;

    const response = await fetch(batchEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': currentApiKey
        },
        body: JSON.stringify(batchRequestBody),
        signal: abortController.signal
    });

    const data = await response.json();
    logApiInteraction(batchEndpoint, batchRequestBody, data);

    if (!response.ok) {
        throw new Error(data.error?.message || `Batch creation failed: ${response.statusText}`);
    }

    const batchName = data.name;
    statusMessage.textContent = `Batch job submitted. Waiting for results...`;

    // Polling Logic
    const getBatchState = (d) => {
        if (d.state) return d.state;
        if (d.metadata && d.metadata.state) return d.metadata.state;
        return undefined;
    };

    let jobState = getBatchState(data);
    let pollData = data;
    
    // Loop until terminal state. Note: API uses BATCH_STATE prefixes.
    while (jobState !== 'BATCH_STATE_SUCCEEDED' && jobState !== 'BATCH_STATE_FAILED' && jobState !== 'BATCH_STATE_CANCELLED') {
        if (abortController.signal.aborted) {
            throw new Error('Generation cancelled by user.');
        }
        
        await new Promise(resolve => setTimeout(resolve, 3000)); // Poll every 3 seconds
        
        const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${batchName}`;
        const pollResponse = await fetch(pollUrl, {
            headers: { 'X-Goog-Api-Key': currentApiKey },
            signal: abortController.signal
        });
        
        pollData = await pollResponse.json();
        
        // Log every polling query
        logApiInteraction(pollUrl, { method: 'GET (Poll Status)' }, pollData);
        
        jobState = getBatchState(pollData);
        
        // If state is undefined but 'response' exists, it means job succeeded and result is ready
        if (!jobState && pollData.response) {
            jobState = 'BATCH_STATE_SUCCEEDED';
        }
        
        statusMessage.textContent = `Batch Processing... State: ${jobState || 'Unknown'}`;
    }

    if (jobState === 'BATCH_STATE_SUCCEEDED') {
        // Extract results
        // Handle nested structure found in responses
        let results = null;
        if (pollData.response && pollData.response.inlinedResponses && pollData.response.inlinedResponses.inlinedResponses) {
            // Nested array as per user trace
            results = pollData.response.inlinedResponses.inlinedResponses;
        } else if (pollData.dest && pollData.dest.inlinedResponses) {
            // Fallback for previous structure
            results = pollData.dest.inlinedResponses;
        }
        
        if (!results || !Array.isArray(results)) {
            throw new Error('Job succeeded but result format is unexpected (no inlinedResponses).');
        }

        let successCount = 0;
        for (const item of results) {
            // Check for error in individual item
            if (item.status && item.status.code && item.status.code !== 0) {
                 const errDiv = document.createElement('div');
                 errDiv.classList.add('image-error');
                 errDiv.textContent = `Image failed: ${item.status.message}`;
                 imageGallery.appendChild(errDiv);
                 continue;
            }

            // item.response contains the GenerateContentResponse, or the item itself is the response structure
            const resp = item.response || item;
            
            if (processAndDisplayImage(resp, prompt)) {
                successCount++;
            } else {
                 const errDiv = document.createElement('div');
                 errDiv.classList.add('image-error');
                 errDiv.textContent = `Image data missing in batch result.`;
                 imageGallery.appendChild(errDiv);
            }
        }
        
        if (successCount === 0) {
            throw new Error('No valid images were extracted from the batch response.');
        }
        statusMessage.textContent = `Successfully generated ${successCount} images via Batch API.`;

    } else {
        throw new Error(`Batch job ended with state: ${jobState}`);
    }
}

// Function to stop image generation
function stopGeneration() {
    if (abortController) {
        abortController.abort();
        statusMessage.textContent = 'Image generation cancelled by user.';
        generateImageButton.disabled = false;
        stopGenerationButton.style.display = 'none';
        abortController = null; // Reset abortController
    }
}


// Event Listeners
setApiKeyButton.addEventListener('click', setApiKey);
geminiModelSelect.addEventListener('change', updateSelectedModel);
imageCountInput.addEventListener('change', updateNumOutputImages); 
imageCountInput.addEventListener('input', updateNumOutputImages);
aspectRatioSelect.addEventListener('change', updateAspectRatio);
imageSizeSelect.addEventListener('change', updateImageSize);
useGoogleSearchInput.addEventListener('change', updateUseGoogleSearch);
clearSelectedImageButton.addEventListener('click', clearSelectedInputImage);
promptInput.addEventListener('input', () => {
    setLocalStorageItem('promptInput', promptInput.value);
});


// Event listener for Load Image button
loadImageButton.addEventListener('click', () => {
    imageFileInput.click(); // Trigger the hidden file input click
});

// Event listener for hidden file input change
imageFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            statusMessage.textContent = 'Please select an image file.';
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result;
            const base64 = dataUrl.split(',')[1]; // Extract the base64 part
            selectImageAsInput(base64);
            imageFileInput.value = ''; // Clear the input so same file can be loaded again
        };
        reader.onerror = (error) => {
            statusMessage.textContent = `Error loading image: ${error}`;
            console.error('Error loading image:', error);
        };
        reader.readAsDataURL(file);
    }
});


generateImageButton.addEventListener('click', generateImage);
stopGenerationButton.addEventListener('click', stopGeneration); // New event listener for stop button
promptInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); 
        generateImage();
    }
});
showApiCallsButton.addEventListener('click', showApiCallsModal); // Use renamed button and modal function
closeDebugButton.addEventListener('click', hideDebugModal);

// Initial setup on page load
document.addEventListener('DOMContentLoaded', () => {
    populateModelSelect();
    loadSettingsFromLocalStorage(); 
    
    // Now toggle features based on the loaded (or default) model
    toggleModelDependentFeatures();
});