// Variáveis globais
let userImage = null;
let modelImage = null;
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

// Variáveis para controle da imagem e do arrasto
let imagePosition = { x: 0, y: 0 };
let imageZoom = 1;
let isDragging = false;
let startX, startY;
let photoArea = null;

// Configurações de qualidade - Padrão de crachá 85x54mm em 300 DPI
const PRINT_WIDTH_MM = 85;
const PRINT_HEIGHT_MM = 54;
const DPI = 300;
const PIXELS_PER_MM = DPI / 25.4;
const PRINT_WIDTH_PX = Math.round(PRINT_WIDTH_MM * PIXELS_PER_MM);
const PRINT_HEIGHT_PX = Math.round(PRINT_HEIGHT_MM * PIXELS_PER_MM);

// Configurar canvas com alta resolução
const SCALE_FACTOR = 3;
canvas.width = 300 * SCALE_FACTOR;
canvas.height = 400 * SCALE_FACTOR;
canvas.style.width = '300px';
canvas.style.height = '400px';

// Configurar contexto para alta qualidade
ctx.scale(SCALE_FACTOR, SCALE_FACTOR);
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';
ctx.textRenderingOptimization = 'optimizeQuality';

// Event Listeners para upload de arquivos
document.getElementById('uploadModel').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.type !== 'image/png') {
            alert('Por favor, selecione apenas arquivos PNG com transparência.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            modelImage = new Image();
            modelImage.onload = function() {
                // Ao carregar um novo modelo, recalculamos a área transparente
                photoArea = getTransparentArea(modelImage);
                drawBadge();
            };
            modelImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('uploadImage').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            userImage = new Image();
            userImage.onload = function() {
                processUserImage();
            };
            userImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Carregar modelo via URL
document.getElementById('loadModelUrl').addEventListener('click', function() {
    const url = document.getElementById('modelUrl').value.trim();
    if (!url) {
        alert('Por favor, insira uma URL válida.');
        return;
    }
    
    modelImage = new Image();
    modelImage.crossOrigin = 'anonymous';
    modelImage.onload = function() {
        photoArea = getTransparentArea(modelImage);
        drawBadge();
    };
    modelImage.onerror = function() {
        alert('Erro ao carregar a imagem da URL. Verifique se a URL está correta e se permite acesso externo.');
    };
    modelImage.src = url;
});

// Controle do select de função/curso
document.getElementById('roleSelect').addEventListener('change', function() {
    const customInput = document.getElementById('roleCustom');
    if (this.value === 'custom') {
        customInput.style.display = 'block';
        customInput.focus();
    } else {
        customInput.style.display = 'none';
        customInput.value = '';
    }
    drawBadge();
});

document.getElementById('roleCustom').addEventListener('input', drawBadge);

// Função para processar a imagem do usuário (aplica nitidez)
function processUserImage() {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    const aspectRatio = userImage.width / userImage.height;
    const targetWidth = 800;
    const targetHeight = Math.round(targetWidth / aspectRatio);
    
    tempCanvas.width = targetWidth;
    tempCanvas.height = targetHeight;
    
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';
    tempCtx.drawImage(userImage, 0, 0, targetWidth, targetHeight);
    
    const imageData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
    const sharpened = applySharpenFilter(imageData);
    tempCtx.putImageData(sharpened, 0, 0);
    
    const processedImage = new Image();
    processedImage.onload = function() {
        userImage = processedImage;
        resetImageControls();
        drawBadge();
    };
    processedImage.src = tempCanvas.toDataURL('image/png', 0.95);
}

// Função de filtro de nitidez
function applySharpenFilter(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const output = new ImageData(width, height);
    const outputData = output.data;
    
    const kernel = [0, -0.3, 0, -0.3, 2.2, -0.3, 0, -0.3, 0];
    
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            for (let c = 0; c < 3; c++) {
                let sum = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const pixelIndex = ((y + ky) * width + (x + kx)) * 4 + c;
                        const kernelIndex = (ky + 1) * 3 + (kx + 1);
                        sum += data[pixelIndex] * kernel[kernelIndex];
                    }
                }
                const outputIndex = (y * width + x) * 4 + c;
                outputData[outputIndex] = Math.min(255, Math.max(0, sum));
            }
            const alphaIndex = (y * width + x) * 4 + 3;
            outputData[alphaIndex] = data[alphaIndex];
        }
    }
    return output;
}

// Resetar controles de imagem
function resetImageControls() {
    imagePosition = { x: 0, y: 0 };
    imageZoom = 1;
    document.getElementById('positionX').value = 0;
    document.getElementById('positionY').value = 0;
    document.getElementById('zoom').value = 100;
    updateSliderValues();
}

// Função para encontrar a área transparente no modelo
function getTransparentArea(image) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    tempCtx.drawImage(image, 0, 0);
    
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    
    let minX = tempCanvas.width, minY = tempCanvas.height;
    let maxX = 0, maxY = 0;
    
    for (let y = 0; y < tempCanvas.height; y++) {
        for (let x = 0; x < tempCanvas.width; x++) {
            const alpha = data[((y * tempCanvas.width) + x) * 4 + 3];
            if (alpha === 0) {
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
            }
        }
    }
    
    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
}

// Event Listeners para controles
document.getElementById('brightness').addEventListener('input', function() {
    document.getElementById('brightnessValue').textContent = this.value;
    drawBadge();
});

document.getElementById('contrast').addEventListener('input', function() {
    document.getElementById('contrastValue').textContent = this.value;
    drawBadge();
});

document.getElementById('positionX').addEventListener('input', function() {
    imagePosition.x = parseInt(this.value);
    document.getElementById('positionXValue').textContent = this.value;
    drawBadge();
});

document.getElementById('positionY').addEventListener('input', function() {
    imagePosition.y = parseInt(this.value);
    document.getElementById('positionYValue').textContent = this.value;
    drawBadge();
});

document.getElementById('zoom').addEventListener('input', function() {
    imageZoom = parseInt(this.value) / 100;
    document.getElementById('zoomValue').textContent = this.value + '%';
    drawBadge();
});

// Botões de zoom
document.getElementById('zoomIn').addEventListener('click', function() {
    const zoomSlider = document.getElementById('zoom');
    const currentValue = parseInt(zoomSlider.value);
    const newValue = Math.min(200, currentValue + 10);
    zoomSlider.value = newValue;
    imageZoom = newValue / 100;
    document.getElementById('zoomValue').textContent = newValue + '%';
    drawBadge();
});

document.getElementById('zoomOut').addEventListener('click', function() {
    const zoomSlider = document.getElementById('zoom');
    const currentValue = parseInt(zoomSlider.value);
    const newValue = Math.max(50, currentValue - 10);
    zoomSlider.value = newValue;
    imageZoom = newValue / 100;
    document.getElementById('zoomValue').textContent = newValue + '%';
    drawBadge();
});

// Event listeners para campos de texto e controles de fonte
document.getElementById('name').addEventListener('input', drawBadge);
document.getElementById('location').addEventListener('input', drawBadge);

// Controles de tamanho de fonte
document.getElementById('nameSize').addEventListener('input', function() {
    document.getElementById('nameSizeValue').textContent = this.value + 'px';
    drawBadge();
});

document.getElementById('roleSize').addEventListener('input', function() {
    document.getElementById('roleSizeValue').textContent = this.value + 'px';
    drawBadge();
});

document.getElementById('locationSize').addEventListener('input', function() {
    document.getElementById('locationSizeValue').textContent = this.value + 'px';
    drawBadge();
});

// Atualizar valores dos sliders
function updateSliderValues() {
    document.getElementById('brightnessValue').textContent = document.getElementById('brightness').value;
    document.getElementById('contrastValue').textContent = document.getElementById('contrast').value;
    document.getElementById('positionXValue').textContent = document.getElementById('positionX').value;
    document.getElementById('positionYValue').textContent = document.getElementById('positionY').value;
    document.getElementById('zoomValue').textContent = document.getElementById('zoom').value + '%';
    document.getElementById('nameSizeValue').textContent = document.getElementById('nameSize').value + 'px';
    document.getElementById('roleSizeValue').textContent = document.getElementById('roleSize').value + 'px';
    document.getElementById('locationSizeValue').textContent = document.getElementById('locationSize').value + 'px';
}

// **Função principal para desenhar o crachá**
function drawBadge() {
    ctx.clearRect(0, 0, canvas.width / SCALE_FACTOR, canvas.height / SCALE_FACTOR);
    
    // Desenha a foto do usuário se existir
    if (userImage) {
        ctx.filter = `brightness(${100 + parseInt(document.getElementById('brightness').value)}%) contrast(${100 + parseInt(document.getElementById('contrast').value)}%)`;
        
        // Define as dimensões e posição para a imagem do usuário
        const aspectRatio = userImage.width / userImage.height;
        let imageDrawWidth = photoArea.width;
        let imageDrawHeight = photoArea.width / aspectRatio;

        if (imageDrawHeight < photoArea.height) {
            imageDrawHeight = photoArea.height;
            imageDrawWidth = photoArea.height * aspectRatio;
        }

        imageDrawWidth *= imageZoom;
        imageDrawHeight *= imageZoom;

        const imageDrawX = photoArea.x + imagePosition.x;
        const imageDrawY = photoArea.y + imagePosition.y;

        // Adiciona um clipe para garantir que a imagem não saia da área transparente
        ctx.save();
        ctx.beginPath();
        ctx.rect(photoArea.x, photoArea.y, photoArea.width, photoArea.height);
        ctx.clip();
        ctx.drawImage(userImage, 
                      imageDrawX, 
                      imageDrawY, 
                      imageDrawWidth, 
                      imageDrawHeight);
        ctx.restore();
        
        ctx.filter = 'none';
    }

    // Desenha o modelo por cima da foto
    if (modelImage) {
        ctx.drawImage(modelImage, 0, 0, canvas.width / SCALE_FACTOR, canvas.height / SCALE_FACTOR);
    }
    
    // Desenha os textos
    const name = document.getElementById('name').value;
    const roleSelect = document.getElementById('roleSelect').value;
    const roleCustom = document.getElementById('roleCustom').value;
    const role = roleSelect === 'custom' ? roleCustom : roleSelect;
    const location = document.getElementById('location').value;
    
    const nameSize = parseInt(document.getElementById('nameSize').value);
    const roleSize = parseInt(document.getElementById('roleSize').value);
    const locationSize = parseInt(document.getElementById('locationSize').value);
    
    ctx.fillStyle = '#1e3a8a';
    ctx.textAlign = 'center';
    
    ctx.font = `bold ${nameSize}px Arial, sans-serif`;
    ctx.fillText(name, (canvas.width / SCALE_FACTOR) / 2, 280);
    
    ctx.font = `${roleSize}px Arial, sans-serif`;
    ctx.fillText(role, (canvas.width / SCALE_FACTOR) / 2, 305);
    
    ctx.font = `${locationSize}px Arial, sans-serif`;
    ctx.fillText(location, (canvas.width / SCALE_FACTOR) / 2, 330);
}

// Event Listeners para arrastar a imagem
canvas.addEventListener('mousedown', function(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * (canvas.width / SCALE_FACTOR);
    const mouseY = ((e.clientY - rect.top) / rect.height) * (canvas.height / SCALE_FACTOR);

    if (photoArea && mouseX >= photoArea.x && mouseX <= photoArea.x + photoArea.width &&
        mouseY >= photoArea.y && mouseY <= photoArea.y + photoArea.height) {
        isDragging = true;
        startX = mouseX - imagePosition.x;
        startY = mouseY - imagePosition.y;
        canvas.style.cursor = 'grabbing';
    }
});

canvas.addEventListener('mousemove', function(e) {
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * (canvas.width / SCALE_FACTOR);
        const mouseY = ((e.clientY - rect.top) / rect.height) * (canvas.height / SCALE_FACTOR);
        
        imagePosition.x = mouseX - startX;
        imagePosition.y = mouseY - startY;

        // Atualiza os sliders para refletir o arrasto
        document.getElementById('positionX').value = imagePosition.x;
        document.getElementById('positionY').value = imagePosition.y;
        updateSliderValues();
        
        drawBadge();
    }
});

canvas.addEventListener('mouseup', function() {
    isDragging = false;
    canvas.style.cursor = 'grab';
});

canvas.addEventListener('mouseleave', function() {
    isDragging = false;
    canvas.style.cursor = 'default';
});

// Event Listeners para gerar e imprimir
document.getElementById('generateCard').addEventListener('click', function() {
    if (userImage && modelImage) {
        document.getElementById('downloadSection').style.display = 'block';
        createDownloadLink();
    } else {
        alert('Por favor, carregue a foto do usuário e o modelo do crachá antes de gerar.');
    }
});

document.getElementById('printCard').addEventListener('click', function() {
    if (userImage && modelImage) {
        drawBadge();
        window.print();
    } else {
        alert('Por favor, carregue a foto do usuário e o modelo do crachá antes de imprimir.');
    }
});

function createDownloadLink() {
    const printCanvas = document.createElement('canvas');
    printCanvas.width = PRINT_WIDTH_PX;
    printCanvas.height = PRINT_HEIGHT_PX;
    const printCtx = printCanvas.getContext('2d');
    
    printCtx.imageSmoothingEnabled = true;
    printCtx.imageSmoothingQuality = 'high';
    printCtx.filter = `brightness(${100 + parseInt(document.getElementById('brightness').value)}%) contrast(${100 + parseInt(document.getElementById('contrast').value)}%)`;

    if (userImage) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = modelImage.width;
        tempCanvas.height = modelImage.height;
        tempCtx.drawImage(modelImage, 0, 0);
        const area = getTransparentArea(tempCanvas);

        const aspectRatio = userImage.width / userImage.height;
        let imageDrawWidth = area.width;
        let imageDrawHeight = area.width / aspectRatio;

        if (imageDrawHeight < area.height) {
            imageDrawHeight = area.height;
            imageDrawWidth = area.height * aspectRatio;
        }

        imageDrawWidth *= imageZoom;
        imageDrawHeight *= imageZoom;

        const imageDrawX = (area.x + imagePosition.x) * (PRINT_WIDTH_PX / (canvas.width / SCALE_FACTOR));
        const imageDrawY = (area.y + imagePosition.y) * (PRINT_HEIGHT_PX / (canvas.height / SCALE_FACTOR));
        
        printCtx.save();
        printCtx.beginPath();
        printCtx.rect(area.x * (PRINT_WIDTH_PX / (canvas.width / SCALE_FACTOR)), area.y * (PRINT_HEIGHT_PX / (canvas.height / SCALE_FACTOR)), area.width * (PRINT_WIDTH_PX / (canvas.width / SCALE_FACTOR)), area.height * (PRINT_HEIGHT_PX / (canvas.height / SCALE_FACTOR)));
        printCtx.clip();
        printCtx.drawImage(userImage, imageDrawX, imageDrawY, imageDrawWidth, imageDrawHeight);
        printCtx.restore();
    }

    printCtx.filter = 'none';

    if (modelImage) {
        printCtx.drawImage(modelImage, 0, 0, printCanvas.width, printCanvas.height);
    }
    
    const name = document.getElementById('name').value;
    const roleSelect = document.getElementById('roleSelect').value;
    const roleCustom = document.getElementById('roleCustom').value;
    const role = roleSelect === 'custom' ? roleCustom : roleSelect;
    const location = document.getElementById('location').value;
    
    const nameSize = parseInt(document.getElementById('nameSize').value) * (PRINT_WIDTH_PX / (canvas.width / SCALE_FACTOR));
    const roleSize = parseInt(document.getElementById('roleSize').value) * (PRINT_WIDTH_PX / (canvas.width / SCALE_FACTOR));
    const locationSize = parseInt(document.getElementById('locationSize').value) * (PRINT_WIDTH_PX / (canvas.width / SCALE_FACTOR));
    
    printCtx.fillStyle = '#1e3a8a';
    printCtx.textAlign = 'center';
    
    printCtx.font = `bold ${nameSize}px Arial, sans-serif`;
    printCtx.fillText(name, PRINT_WIDTH_PX / 2, 280 * (PRINT_HEIGHT_PX / (canvas.height / SCALE_FACTOR)));
    
    printCtx.font = `${roleSize}px Arial, sans-serif`;
    printCtx.fillText(role, PRINT_WIDTH_PX / 2, 305 * (PRINT_HEIGHT_PX / (canvas.height / SCALE_FACTOR)));
    
    printCtx.font = `${locationSize}px Arial, sans-serif`;
    printCtx.fillText(location, PRINT_WIDTH_PX / 2, 330 * (PRINT_HEIGHT_PX / (canvas.height / SCALE_FACTOR)));

    const dataURL = printCanvas.toDataURL('image/png');
    const downloadLink = document.getElementById('downloadLink');
    downloadLink.href = dataURL;
}

updateSliderValues();
