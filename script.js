/**
 * CHANGELOG
 *
 * Instruções para Revisores:
 * Este bloco de comentários registra as modificações significativas do arquivo.
 * Cada nova modificação deve ser adicionada no topo da lista.
 * Use o formato "Versão [número]: [Descrição da modificação]".
 * Mantenha a lista limitada às 4 últimas alterações para clareza e concisão.
 */
/* * Versão 1.1: Adicionado CHANGELOG no início do arquivo.
 * Versão 1.2: Implementada lógica para mover a foto com o mouse, adicionados JSON para listas suspensas de cursos e locais com opção "Outro (especificar)", reposicionado os campos de texto no crachá e corrigido as dimensões de impressão para 54mm x 85mm.
 */

// Variáveis globais
let userImage = null;
let modelImage = null;
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let models = {}; // Objeto para armazenar a lista de modelos

// Variáveis para controle da imagem e do arrasto
let imagePosition = { x: 0, y: 0 };
let imageZoom = 1;
let isDragging = false;
let startX, startY;
let photoArea = null;

// Configurações de qualidade - Padrão de crachá 54x85mm em 300 DPI
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

// --- INÍCIO: NOVAS FUNCIONALIDADES ---
// Lista de modelos pré-definidos. Preencha os links dos modelos aqui.
// Esta seção será substituída por uma lista com 4 opções de modelos
const modelLinks = {
    // Atenção: Usei o mesmo link fornecido para todos os modelos.
    // Substitua-o pelos links corretos dos seus modelos.
    'Modelo 1': 'https://i.ibb.co/PZQLwy4/cgara-transpp.png',
    'Modelo 2': 'https://i.ibb.co/PZQLwy4/cgara-transpp.png',
    'Modelo 3': 'https://i.ibb.co/PZQLwy4/cgara-transpp.png',
    'Modelo 4': 'https://i.ibb.co/PZQLwy4/cgara-transpp.png'
};

// JSON para cursos e locais
const data = {
    "courses": [
        "TÉCNICO EM ANÁLISES CLÍNICAS",
        "TÉCNICO EM NUTRIÇÃO E DIETÉTICA",
        "TÉCNICO EM SERVIÇOS JURÍDICOS",
        "TÉCNICO EM INFORMÁTICA",
        "TÉCNICO EM AGROECOLOGIA",
        "TÉCNICO EM ADMINISTRAÇÃO"
    ],
    "locations": [
        "HOSPITAL REGIONAL DANTAS BIÃO",
        "VITALIA LAB"
    ]
};

// Função para carregar um modelo a partir de uma URL
function loadModelFromUrl(url) {
    if (!url) {
        return;
    }
    
    modelImage = new Image();
    modelImage.crossOrigin = 'anonymous';
    modelImage.onload = function() {
        console.log('Modelo do crachá carregado com sucesso.');
        photoArea = getTransparentArea(modelImage);
        drawBadge();
    };
    modelImage.onerror = function() {
        alert('Erro ao carregar o modelo da URL. Por favor, tente novamente ou carregue seu próprio modelo.');
    };
    modelImage.src = url;
}

// Função para preencher os dropdowns
function setupDropdowns() {
    const courseSelect = document.getElementById('courseSelect');
    const locationSelect = document.getElementById('locationSelect');
    
    // Preenche o dropdown de Cursos
    data.courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course;
        option.textContent = course;
        courseSelect.appendChild(option);
    });
    const courseOption = document.createElement('option');
    courseOption.value = 'custom';
    courseOption.textContent = 'Outro (especificar)';
    courseSelect.appendChild(courseOption);

    // Preenche o dropdown de Locais
    data.locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        locationSelect.appendChild(option);
    });
    const locationOption = document.createElement('option');
    locationOption.value = 'custom';
    locationOption.textContent = 'Outro (especificar)';
    locationSelect.appendChild(locationOption);

    // Adiciona event listeners para mostrar/esconder o campo de texto customizado
    courseSelect.addEventListener('change', function() {
        const customInput = document.getElementById('courseCustom');
        customInput.style.display = this.value === 'custom' ? 'block' : 'none';
        drawBadge();
    });

    locationSelect.addEventListener('change', function() {
        const customInput = document.getElementById('locationCustom');
        customInput.style.display = this.value === 'custom' ? 'block' : 'none';
        drawBadge();
    });

    // Event listeners para os campos de texto customizados
    document.getElementById('courseCustom').addEventListener('input', drawBadge);
    document.getElementById('locationCustom').addEventListener('input', drawBadge);
}

// Preencher o select de modelos e carregar o modelo padrão
function setupModels() {
    const modelSelect = document.getElementById('modelSelect');
    let defaultModelUrl = null;

    for (const name in modelLinks) {
        if (modelLinks.hasOwnProperty(name)) {
            const option = document.createElement('option');
            option.value = modelLinks[name];
            option.textContent = name;
            modelSelect.appendChild(option);
        }
    }
    
    // Define o valor padrão para a seleção e carrega o primeiro modelo
    if (Object.keys(modelLinks).length > 0) {
        const firstModelName = Object.keys(modelLinks)[0];
        modelSelect.value = modelLinks[firstModelName];
        loadModelFromUrl(modelLinks[firstModelName]);
    }
    
    modelSelect.addEventListener('change', function() {
        loadModelFromUrl(this.value);
    });
}
// --- FIM: NOVAS FUNCIONALIDADES ---


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
                console.log('Modelo do crachá carregado com sucesso.');
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
        // Alerta para carregar o modelo antes da foto do usuário
        if (!modelImage) {
            alert('Por favor, carregue ou selecione um modelo de crachá primeiro.');
            event.target.value = ''; // Limpa o campo de arquivo
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            userImage = new Image();
            userImage.onload = function() {
                console.log('Imagem do usuário carregada com sucesso.');
                processUserImage();
            };
            userImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

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
                const outputIndex = (y * width + x) * 4 + 3;
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
    
    const photoArea = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
    
    console.log('Área transparente detectada:', photoArea);
    return photoArea;
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

// Controles de tamanho de fonte
document.getElementById('nameSize').addEventListener('input', function() {
    document.getElementById('nameSizeValue').textContent = this.value + 'px';
    drawBadge();
});

document.getElementById('courseSize').addEventListener('input', function() {
    document.getElementById('courseSizeValue').textContent = this.value + 'px';
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
    document.getElementById('courseSizeValue').textContent = document.getElementById('courseSize').value + 'px';
    document.getElementById('locationSizeValue').textContent = document.getElementById('locationSize').value + 'px';
}

// Função principal para desenhar o crachá
function drawBadge() {
    console.log('Iniciando o desenho do crachá...');
    ctx.clearRect(0, 0, canvas.width / SCALE_FACTOR, canvas.height / SCALE_FACTOR);

    // Desenha a foto do usuário se existir e a área transparente tiver sido detectada
    if (userImage && photoArea) {
        console.log('Desenhando imagem do usuário. Posição:', imagePosition, 'Zoom:', imageZoom);
        ctx.filter = `brightness(${100 + parseInt(document.getElementById('brightness').value)}%) contrast(${100 + parseInt(document.getElementById('contrast').value)}%)`;
        
        // --- INÍCIO: LÓGICA DE DESENHO MELHORADA ---
        const userAspect = userImage.width / userImage.height;
        const photoAspect = photoArea.width / photoArea.height;
        let imageDrawWidth, imageDrawHeight;

        if (userAspect > photoAspect) {
            // A imagem do usuário é mais larga que a área da foto.
            // A altura é ajustada para preencher a área, e a largura é escalada para manter a proporção.
            imageDrawHeight = photoArea.height * imageZoom;
            imageDrawWidth = imageDrawHeight * userAspect;
        } else {
            // A imagem do usuário é mais alta ou tem a mesma proporção.
            // A largura é ajustada para preencher a área, e a altura é escalada para manter a proporção.
            imageDrawWidth = photoArea.width * imageZoom;
            imageDrawHeight = imageDrawWidth / userAspect;
        }

        // Centraliza a imagem antes de aplicar o posicionamento manual do usuário
        const imageDrawX = photoArea.x + imagePosition.x + (photoArea.width - imageDrawWidth) / 2;
        const imageDrawY = photoArea.y + imagePosition.y + (photoArea.height - imageDrawHeight) / 2;
        // --- FIM: LÓGICA DE DESENHO MELHORADA ---
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(photoArea.x, photoArea.y, photoArea.width, photoArea.height);
        ctx.clip();
        ctx.drawImage(userImage, 
                      0, 
                      0, 
                      userImage.width, 
                      userImage.height,
                      imageDrawX, 
                      imageDrawY, 
                      imageDrawWidth, 
                      imageDrawHeight);
        ctx.restore();
        
        ctx.filter = 'none';
    } else {
        console.log('Não foi possível desenhar a imagem do usuário. Certifique-se de que o modelo do crachá e a imagem do usuário foram carregados.');
    }

    // Desenha o modelo por cima da foto
    if (modelImage) {
        console.log('Desenhando modelo do crachá.');
        ctx.drawImage(modelImage, 0, 0, canvas.width / SCALE_FACTOR, canvas.height / SCALE_FACTOR);
    } else {
        console.log('Modelo do crachá não está disponível.');
    }
    
    // Desenha os textos
    const name = document.getElementById('name').value;
    const courseSelect = document.getElementById('courseSelect').value;
    const courseCustom = document.getElementById('courseCustom').value;
    const course = courseSelect === 'custom' ? courseCustom : courseSelect;
    
    const locationSelect = document.getElementById('locationSelect').value;
    const locationCustom = document.getElementById('locationCustom').value;
    const location = locationSelect === 'custom' ? locationCustom : locationSelect;
    
    const nameSize = parseInt(document.getElementById('nameSize').value);
    const courseSize = parseInt(document.getElementById('courseSize').value);
    const locationSize = parseInt(document.getElementById('locationSize').value);
    
    ctx.fillStyle = '#1e3a8a';
    ctx.textAlign = 'center';

    // Y-coordinates adjusted to move text up
    const nameY = 240; 
    const courseY = 265; 
    const locationY = 290;
    
    ctx.font = `bold ${nameSize}px Arial, sans-serif`;
    ctx.fillText(name, (canvas.width / SCALE_FACTOR) / 2, nameY);
    
    ctx.font = `${courseSize}px Arial, sans-serif`;
    ctx.fillText(course, (canvas.width / SCALE_FACTOR) / 2, courseY);
    
    ctx.font = `${locationSize}px Arial, sans-serif`;
    ctx.fillText(location, (canvas.width / SCALE_FACTOR) / 2, locationY);

    console.log('Desenho do crachá concluído.');
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

        document.getElementById('positionX').value = Math.round(imagePosition.x);
        document.getElementById('positionY').value = Math.round(imagePosition.y);
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

    if (userImage && modelImage) {
        const tempModel = new Image();
        tempModel.src = modelImage.src;
        tempModel.onload = function() {
            printCtx.drawImage(tempModel, 0, 0, printCanvas.width, printCanvas.height);
            
            const area = getTransparentArea(tempModel);
            
            const userAspect = userImage.width / userImage.height;
            const photoAspect = area.width / area.height;
            let imageDrawWidth, imageDrawHeight;
            
            if (userAspect > photoAspect) {
                imageDrawHeight = area.height * imageZoom;
                imageDrawWidth = imageDrawHeight * userAspect;
            } else {
                imageDrawWidth = area.width * imageZoom;
                imageDrawHeight = imageDrawWidth / userAspect;
            }

            const imageDrawX = (area.x + imagePosition.x) * (PRINT_WIDTH_PX / (canvas.width / SCALE_FACTOR));
            const imageDrawY = (area.y + imagePosition.y) * (PRINT_HEIGHT_PX / (canvas.height / SCALE_FACTOR));
            
            printCtx.save();
            printCtx.beginPath();
            printCtx.rect(area.x, area.y, area.width, area.height);
            printCtx.clip();
            printCtx.drawImage(userImage, 0, 0, userImage.width, userImage.height, imageDrawX, imageDrawY, imageDrawWidth, imageDrawHeight);
            printCtx.restore();

            printCtx.filter = 'none';

            const name = document.getElementById('name').value;
            const courseSelect = document.getElementById('courseSelect').value;
            const courseCustom = document.getElementById('courseCustom').value;
            const course = courseSelect === 'custom' ? courseCustom : courseSelect;
            
            const locationSelect = document.getElementById('locationSelect').value;
            const locationCustom = document.getElementById('locationCustom').value;
            const location = locationSelect === 'custom' ? locationCustom : locationSelect;

            const nameSize = parseInt(document.getElementById('nameSize').value) * (PRINT_WIDTH_PX / (canvas.width / SCALE_FACTOR));
            const courseSize = parseInt(document.getElementById('courseSize').value) * (PRINT_WIDTH_PX / (canvas.width / SCALE_FACTOR));
            const locationSize = parseInt(document.getElementById('locationSize').value) * (PRINT_HEIGHT_PX / (canvas.height / SCALE_FACTOR));
            
            printCtx.fillStyle = '#1e3a8a';
            printCtx.textAlign = 'center';
            
            // New Y-coordinates for print
            const namePrintY = 240 * (PRINT_HEIGHT_PX / (canvas.height / SCALE_FACTOR));
            const coursePrintY = 265 * (PRINT_HEIGHT_PX / (canvas.height / SCALE_FACTOR));
            const locationPrintY = 290 * (PRINT_HEIGHT_PX / (canvas.height / SCALE_FACTOR));
            
            printCtx.font = `bold ${nameSize}px Arial, sans-serif`;
            printCtx.fillText(name, PRINT_WIDTH_PX / 2, namePrintY);
            
            printCtx.font = `${courseSize}px Arial, sans-serif`;
            printCtx.fillText(course, PRINT_WIDTH_PX / 2, coursePrintY);
            
            printCtx.font = `${locationSize}px Arial, sans-serif`;
            printCtx.fillText(location, PRINT_WIDTH_PX / 2, locationPrintY);

            const dataURL = printCanvas.toDataURL('image/png');
            const downloadLink = document.getElementById('downloadLink');
            downloadLink.href = dataURL;
        };
    }
}

// Inicializa a configuração dos modelos e os controles
setupModels();
setupDropdowns();
updateSliderValues();
