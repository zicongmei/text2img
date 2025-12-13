// text2img.js

let currentApiKey = '';
let selectedModel = 'gemini-2.5-flash-image'; // Default model for image generation
let numOutputImages = 1; // Default number of images to generate
let selectedInputImageBase64 = null; // Store selected image for input

// Store last API interactions for debugging
let lastApiInteraction = {
    url: '',
    request: null,
    response: null
};

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

    // Model-dependent features (Image Size, Google Search) are handled by toggleModelDependentFeatures
    // We explicitly avoid setting them here to ensure toggleModelDependentFeatures applies the correct state
    // based on the *currently selected model*. The raw stored values are handled within toggleModelDependentFeatures.
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
    
    // Scroll up to show the selection
    selectedImageContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearSelectedInputImage() {
    selectedInputImageBase64 = null;
    selectedInputImage.src = '';
    selectedImageContainer.style.display = 'none';
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

// Function to generate image(s)
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

    // Get the number of images to generate from the input field
    const numToGenerate = parseInt(imageCountInput.value, 10);
    if (isNaN(numToGenerate) || numToGenerate < 1) {
        statusMessage.textContent = 'Please enter a valid number of images (1 or more).';
        generateImageButton.disabled = false;
        return;
    }

    let successfulGenerations = 0;
    let lastError = null;

    try {
        const imageModel = selectedModel;
        const imageEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${imageModel}:generateContent`;
        
        for (let i = 0; i < numToGenerate; i++) {
            statusMessage.textContent = `Generating image ${i + 1} of ${numToGenerate}...`;

            // Construct parts array
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
            
            // Only add imageSize if it's enabled (i.e., for Gemini 3 Pro)
            if (!imageSizeSelect.disabled) {
                generationConfig.imageConfig.imageSize = imageSizeSelect.value;
            }
            // For Gemini 2.5 models, imageSize is not supported, so it's omitted when disabled.
            // The default 1K size is applied by the backend if not specified for 2.5 models.

            const imageRequestBody = {
                contents: [{
                    parts: parts
                }],
                generationConfig: generationConfig
            };

            // Only add tools if Google Search is enabled AND checked (i.e., for Gemini 3 Pro)
            if (!useGoogleSearchInput.disabled && useGoogleSearchInput.checked) {
                imageRequestBody.tools = [{ google_search: {} }];
            }

            let imageResponse = null;
            let imageData = null;

            try {
                imageResponse = await fetch(imageEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': currentApiKey
                    },
                    body: JSON.stringify(imageRequestBody)
                });

                imageData = await imageResponse.json();
                
                // Update debug info with the LAST generation request/response of the batch
                updateDebugInfo(imageEndpoint, imageRequestBody, imageData);

                if (!imageResponse.ok) {
                    throw new Error(imageData.error?.message || `API Error: ${imageResponse.statusText}`);
                }

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
                    img.alt = prompt;
                    imgContainer.appendChild(img);

                    const buttonGroup = document.createElement('div');
                    buttonGroup.classList.add('image-item-buttons'); 

                    // Add "Use as Input" button
                    const useInputBtn = document.createElement('button');
                    useInputBtn.textContent = 'Use as Input';
                    useInputBtn.classList.add('use-input-btn');
                    useInputBtn.onclick = () => selectImageAsInput(base64Image);
                    buttonGroup.appendChild(useInputBtn);

                    // Add "Save Image" button
                    const saveImageBtn = document.createElement('button');
                    saveImageBtn.textContent = 'Save Image';
                    saveImageBtn.classList.add('save-image-btn');
                    saveImageBtn.onclick = () => saveGeneratedImage(base64Image, prompt);
                    buttonGroup.appendChild(saveImageBtn);

                    imgContainer.appendChild(buttonGroup); 
                    imageGallery.appendChild(imgContainer); // Appends each generated image to the gallery
                    successfulGenerations++;
                } else {
                    console.error(`No image data found in response for image ${i + 1}`, imageData);
                    throw new Error('No valid image data found in the API response.');
                }
            } catch (innerError) {
                console.error(`Error generating image ${i + 1}:`, innerError);
                lastError = innerError; // Store the last error encountered
                const errorDiv = document.createElement('div');
                errorDiv.classList.add('image-error');
                errorDiv.textContent = `Image ${i + 1} Failed: ${innerError.message}`;
                imageGallery.appendChild(errorDiv);
            }
        }

        if (successfulGenerations === numToGenerate) {
            statusMessage.textContent = `${successfulGenerations} image(s) generated successfully!`;
        } else if (successfulGenerations > 0) {
            statusMessage.textContent = `Generated ${successfulGenerations} of ${numToGenerate} images. Some failed.`;
        } else {
            statusMessage.textContent = `Failed to generate any images. Last error: ${lastError ? lastError.message : 'Unknown error.'}`;
        }

    } catch (error) { // This catch block handles any unexpected outer loop errors
        console.error('An unexpected error occurred during image generation loop:', error);
        statusMessage.textContent = `Error: ${error.message}`;
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('image-error');
        errorDiv.textContent = `Overall Generation Failed: ${error.message}`;
        imageGallery.appendChild(errorDiv);
    } finally {
        generateImageButton.disabled = false;
        // Don't clear status immediately so user sees result
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
    loadSettingsFromLocalStorage(); 
    
    // Now toggle features based on the loaded (or default) model
    toggleModelDependentFeatures();
});