// Variáveis globais
let userImage = null;
let modelImage = null;
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

// Variáveis para controle da imagem
let imagePosition = { x: 0, y: 0 };
let imageZoom = 1;

// Configurações de qualidade - Padrão de crachá 85x54mm em 300 DPI
const PRINT_WIDTH_MM = 54;
const PRINT_HEIGHT_MM = 85;
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

// Função para processar a imagem do usuário
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

// **NOVA FUNÇÃO ADICIONADA: Lógica para desenhar o crachá**
function drawBadge() {
    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width / SCALE_FACTOR, canvas.height / SCALE_FACTOR);
    
    // Desenha o modelo
    if (modelImage) {
        ctx.drawImage(modelImage, 0, 0, canvas.width / SCALE_FACTOR, canvas.height / SCALE_FACTOR);
    }

    // Desenha a foto do usuário se existir
    if (userImage) {
        // Aplica ajustes de brilho e contraste
        const brightness = parseInt(document.getElementById('brightness').value);
        const contrast = parseInt(document.getElementById('contrast').value);
        ctx.filter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%)`;
        
        // Define a área da foto com base na transparência do modelo
        if (modelImage) {
            // Cria um canvas temporário para obter a área transparente
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = canvas.width / SCALE_FACTOR;
            tempCanvas.height = canvas.height / SCALE_FACTOR;
            tempCtx.drawImage(modelImage, 0, 0, tempCanvas.width, tempCanvas.height);
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            
            let minX = tempCanvas.width, minY = tempCanvas.height;
            let maxX = 0, maxY = 0;
            const data = imageData.data;
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
            
            const photoWidth = maxX - minX;
            const photoHeight = maxY - minY;

            // Calcula a nova posição e tamanho da imagem do usuário com zoom e posição
            const imageX = minX + imagePosition.x;
            const imageY = minY + imagePosition.y;
            const imageZoomedWidth = photoWidth * imageZoom;
            const imageZoomedHeight = photoHeight * imageZoom;
            const sourceX = userImage.width / 2 - imageZoomedWidth / 2;
            const sourceY = userImage.height / 2 - imageZoomedHeight / 2;

            ctx.save();
            ctx.beginPath();
            ctx.rect(minX, minY, photoWidth, photoHeight);
            ctx.clip();
            ctx.drawImage(userImage, 
                          sourceX, sourceY, imageZoomedWidth, imageZoomedHeight,
                          imageX, imageY, imageZoomedWidth, imageZoomedHeight);
            ctx.restore();
            
        } else {
            // Desenha a imagem do usuário sem o modelo
            ctx.drawImage(userImage, 0, 0, canvas.width / SCALE_FACTOR, canvas.height / SCALE_FACTOR);
        }

        // Reseta o filtro para não afetar o texto
        ctx.filter = 'none';
    }

    // Desenha os textos
    const name = document.getElementById('name').value;
    const roleSelect = document.getElementById('roleSelect').value;
    const roleCustom = document.getElementById('roleCustom').value;
    const role = roleSelect === 'custom' ? roleCustom : roleSelect;
    const location = document.getElementById('location').value;
    
    // Posições e tamanhos de fonte (ajustar conforme o modelo)
    const nameSize = parseInt(document.getElementById('nameSize').value);
    const roleSize = parseInt(document.getElementById('roleSize').value);
    const locationSize = parseInt(document.getElementById('locationSize').value);
    
    ctx.fillStyle = '#1e3a8a';
    ctx.textAlign = 'center';
    
    // Nome
    ctx.font = `bold ${nameSize}px Arial, sans-serif`;
    ctx.fillText(name, (canvas.width / SCALE_FACTOR) / 2, 280);
    
    // Função/Curso
    ctx.font = `${roleSize}px Arial, sans-serif`;
    ctx.fillText(role, (canvas.width / SCALE_FACTOR) / 2, 305);
    
    // Local
    ctx.font = `${locationSize}px Arial, sans-serif`;
    ctx.fillText(location, (canvas.width / SCALE_FACTOR) / 2, 330);
}

// **NOVOS EVENT LISTENERS ADICIONADOS**

// Gerar Crachá (apenas exibe a seção de download)
document.getElementById('generateCard').addEventListener('click', function() {
    if (userImage && modelImage) {
        document.getElementById('downloadSection').style.display = 'block';
        createDownloadLink();
    } else {
        alert('Por favor, carregue a foto do usuário e o modelo do crachá antes de gerar.');
    }
});

// Imprimir Crachá
document.getElementById('printCard').addEventListener('click', function() {
    if (userImage && modelImage) {
        // Redraws the badge one last time before printing
        drawBadge();
        window.print();
    } else {
        alert('Por favor, carregue a foto do usuário e o modelo do crachá antes de imprimir.');
    }
});

// Criar link de download de alta resolução
function createDownloadLink() {
    // Cria um canvas temporário com a resolução de impressão
    const printCanvas = document.createElement('canvas');
    printCanvas.width = PRINT_WIDTH_PX;
    printCanvas.height = PRINT_HEIGHT_PX;
    const printCtx = printCanvas.getContext('2d');
    
    // Desenha o conteúdo do canvas de preview no novo canvas
    printCtx.imageSmoothingEnabled = true;
    printCtx.imageSmoothingQuality = 'high';
    printCtx.filter = `brightness(${100 + parseInt(document.getElementById('brightness').value)}%) contrast(${100 + parseInt(document.getElementById('contrast').value)}%)`;

    // Desenha o modelo e a imagem do usuário
    if (modelImage) {
        printCtx.drawImage(modelImage, 0, 0, printCanvas.width, printCanvas.height);
    }
    
    if (userImage) {
        // A lógica de corte e posicionamento aqui precisa ser ajustada para a alta resolução.
        // Assumindo que a área de foto no modelo é proporcional, podemos usar os mesmos cálculos.
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = modelImage.width;
        tempCanvas.height = modelImage.height;
        tempCtx.drawImage(modelImage, 0, 0);
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        
        let minX = tempCanvas.width, minY = tempCanvas.height;
        let maxX = 0, maxY = 0;
        const data = imageData.data;
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
        
        const photoWidth = maxX - minX;
        const photoHeight = maxY - minY;

        const imageX = minX + (imagePosition.x * (PRINT_WIDTH_PX / (canvas.width / SCALE_FACTOR)));
        const imageY = minY + (imagePosition.y * (PRINT_HEIGHT_PX / (canvas.height / SCALE_FACTOR)));
        const imageZoomedWidth = photoWidth * imageZoom;
        const imageZoomedHeight = photoHeight * imageZoom;
        
        printCtx.save();
        printCtx.beginPath();
        printCtx.rect(minX * (PRINT_WIDTH_PX / tempCanvas.width), minY * (PRINT_HEIGHT_PX / tempCanvas.height), photoWidth * (PRINT_WIDTH_PX / tempCanvas.width), photoHeight * (PRINT_HEIGHT_PX / tempCanvas.height));
        printCtx.clip();
        printCtx.drawImage(userImage, imageX, imageY, imageZoomedWidth, imageZoomedHeight);
        printCtx.restore();
    }

    printCtx.filter = 'none';

    // Desenha os textos
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


    // Gera o link de download
    const dataURL = printCanvas.toDataURL('image/png');
    const downloadLink = document.getElementById('downloadLink');
    downloadLink.href = dataURL;
}

// Chama a função de atualização inicial dos valores
updateSliderValues();
