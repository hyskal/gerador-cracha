// Variáveis globais
let userImage = null;
let modelImage = null;
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

// Variáveis para controle da imagem
let imagePosition = { x: 0, y: 0 };
let imageZoom = 1;
let originalImageDimensions = null;

// Configurações de qualidade - Padrão de crachá 85x54mm em 300 DPI
const PRINT_WIDTH_MM = 85;
const PRINT_HEIGHT_MM = 54;
const DPI = 300;
const PIXELS_PER_MM = DPI / 25.4;

// Dimensões em pixels para impressão de qualidade
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
        // Verificar se é PNG
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
                // Processar imagem para qualidade otimizada
                processUserImage();
            };
            userImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Processar imagem para qualidade otimizada - VERSÃO CORRIGIDA
function processUserImage() {
    // Criar canvas temporário para processamento
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // Manter proporções originais mas em alta resolução
    const aspectRatio = userImage.width / userImage.height;
    const targetWidth = 800; // Resolução adequada
    const targetHeight = Math.round(targetWidth / aspectRatio);
    
    tempCanvas.width = targetWidth;
    tempCanvas.height = targetHeight;
    
    // Configurar para alta qualidade
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';
    
    // Desenhar imagem redimensionada
    tempCtx.drawImage(userImage, 0, 0, targetWidth, targetHeight);
    
    // Aplicar filtro de nitidez sutil
    const imageData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
    const sharpened = applySharpenFilter(imageData);
    tempCtx.putImageData(sharpened, 0, 0);
    
    // Criar nova imagem processada
    const processedImage = new Image();
    processedImage.onload = function() {
        userImage = processedImage;
        originalImageDimensions = { width: targetWidth, height: targetHeight };
        
        // Resetar controles
        resetImageControls();
        
        // Mostrar controles de imagem - GARANTIR que aparecem
        const imageControls = document.getElementById('imageControls');
        if (imageControls) {
            imageControls.style.display = 'block';
            console.log('Controles de imagem ativados'); // Debug
        }
        
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
    
    // Kernel de sharpening suave
    const kernel = [
        0, -0.3, 0,
        -0.3, 2.2, -0.3,
        0, -0.3, 0
    ];
    
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
            // Alpha channel
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

// Event listeners para campos de texto
document.getElementById('name').addEventListener('input', drawBadge);
document.getElementById('role').addEventListener('input', drawBadge);
document.getElementById('location').addEventListener('input', drawBadge);

// Atualizar valores dos sliders
function updateSliderValues() {
    document.getElementById('brightnessValue').textContent = document.getElementById('brightness').value;
    document.getElementById('contrastValue').textContent = document.getElementById('contrast').value;
    document.getElementById('positionXValue').textContent = document.getElementById('positionX').value;
    document.getElementById('positionYValue').textContent = document.getElementById('positionY').value;
    document.getElementById('zoomValue').textContent = document.getElementById('zoom').value + '%';
}

// Função principal para desenhar o crachá
function drawBadge() {
    // Limpar canvas
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // PRIMEIRO: Desenhar foto do usuário (atrás do modelo PNG)
    if (userImage) {
        ctx.save();
        
        // Aplicar filtros de brilho e contraste
        const brightness = document.getElementById('brightness').value;
        const contrast = document.getElementById('contrast').value;
        ctx.filter = `brightness(${100 + parseInt(brightness)}%) contrast(${100 + parseInt(contrast)}%)`;
        
        // Configurar para máxima qualidade
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Calcular dimensões com zoom aplicado
        const baseScale = 0.3; // Escala base para a imagem
        const scaledWidth = (userImage.width * baseScale * imageZoom);
        const scaledHeight = (userImage.height * baseScale * imageZoom);
        
        // Centro do canvas (300x400)
        const centerX = 150;
        const centerY = 200;
        
        // Aplicar posicionamento X/Y (multiplicador para controle mais preciso)
        const drawX = centerX - scaledWidth / 2 + (imagePosition.x * 1.5);
        const drawY = centerY - scaledHeight / 2 + (imagePosition.y * 1.5);
        
        // Desenhar imagem do usuário
        ctx.drawImage(userImage, drawX, drawY, scaledWidth, scaledHeight);
        ctx.restore();
    }

    // SEGUNDO: Desenhar modelo PNG com transparência (por cima da foto)
    if (modelImage) {
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        // O modelo PNG deve ter áreas transparentes onde a foto deve aparecer
        ctx.drawImage(modelImage, 0, 0, 300, 400);
        ctx.restore();
    }

    // TERCEIRO: Desenhar textos (se necessário, por cima de tudo)
    drawTexts();
}

// Função para desenhar textos
function drawTexts() {
    const name = document.getElementById('name').value;
    const role = document.getElementById('role').value;
    const location = document.getElementById('location').value;
    
    if (!name && !role && !location) return;
    
    ctx.filter = 'none';
    ctx.imageSmoothingEnabled = true;
    ctx.textRenderingOptimization = 'optimizeQuality';
    ctx.fillStyle = '#1e3a8a';
    ctx.textAlign = 'center';
    
    // Sombra sutil
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 1;
    ctx.shadowOffsetY = 0.5;
    
    // Nome
    if (name) {
        ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
        ctx.fillText(name, 150, 330);
    }
    
    // Função
    if (role) {
        ctx.font = '14px "Segoe UI", Arial, sans-serif';
        ctx.fillText(role, 150, 355);
    }
    
    // Local
    if (location) {
        ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#3b82f6';
        ctx.fillText(location, 150, 380);
    }
    
    // Reset sombra
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
}

// Gerar crachá para download
document.getElementById('generateCard').addEventListener('click', function() {
    if (!modelImage) {
        alert('Por favor, carregue um modelo PNG com transparência primeiro.');
        return;
    }
    
    // Criar canvas de exportação com dimensões padrão de crachá (85x54mm)
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    
    // Calcular proporção para manter aspectos do design
    const designRatio = 300 / 400; // Proporção atual do design
    const cardRatio = PRINT_WIDTH_PX / PRINT_HEIGHT_PX; // Proporção do crachá padrão
    
    let canvasWidth, canvasHeight;
    
    if (designRatio > cardRatio) {
        // Design é mais largo - ajustar pela altura
        canvasHeight = PRINT_HEIGHT_PX;
        canvasWidth = Math.round(canvasHeight * designRatio);
    } else {
        // Design é mais alto - ajustar pela largura
        canvasWidth = PRINT_WIDTH_PX;
        canvasHeight = Math.round(canvasWidth / designRatio);
    }
    
    exportCanvas.width = canvasWidth;
    exportCanvas.height = canvasHeight;
    
    // Configurar para máxima qualidade
    exportCtx.imageSmoothingEnabled = true;
    exportCtx.imageSmoothingQuality = 'high';
    exportCtx.textRenderingOptimization = 'optimizeQuality';
    
    // Calcular escala para o novo canvas
    const scaleX = canvasWidth / 300;
    const scaleY = canvasHeight / 400;
    
    // Desenhar foto do usuário
    if (userImage) {
        exportCtx.save();
        
        const brightness = document.getElementById('brightness').value;
        const contrast = document.getElementById('contrast').value;
        exportCtx.filter = `brightness(${100 + parseInt(brightness)}%) contrast(${100 + parseInt(contrast)}%)`;
        
        const scaledWidth = userImage.width * imageZoom * 0.7 * scaleX;
        const scaledHeight = userImage.height * imageZoom * 0.7 * scaleY;
        
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        
        const drawX = centerX - scaledWidth / 2 + (imagePosition.x * 2 * scaleX);
        const drawY = centerY - scaledHeight / 2 + (imagePosition.y * 2 * scaleY);
        
        exportCtx.drawImage(userImage, drawX, drawY, scaledWidth, scaledHeight);
        exportCtx.restore();
    }
    
    // Desenhar modelo PNG
    if (modelImage) {
        exportCtx.drawImage(modelImage, 0, 0, canvasWidth, canvasHeight);
    }
    
    // Desenhar textos
    const name = document.getElementById('name').value;
    const role = document.getElementById('role').value;
    const location = document.getElementById('location').value;
    
    if (name || role || location) {
        exportCtx.filter = 'none';
        exportCtx.fillStyle = '#1e3a8a';
        exportCtx.textAlign = 'center';
        exportCtx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        exportCtx.shadowBlur = 1 * Math.min(scaleX, scaleY);
        exportCtx.shadowOffsetY = 0.5 * Math.min(scaleX, scaleY);
        
        if (name) {
            exportCtx.font = `bold ${18 * Math.min(scaleX, scaleY)}px "Segoe UI", Arial, sans-serif`;
            exportCtx.fillText(name, canvasWidth / 2, 330 * scaleY);
        }
        
        if (role) {
            exportCtx.font = `${14 * Math.min(scaleX, scaleY)}px "Segoe UI", Arial, sans-serif`;
            exportCtx.fillText(role, canvasWidth / 2, 355 * scaleY);
        }
        
        if (location) {
            exportCtx.font = `bold ${16 * Math.min(scaleX, scaleY)}px "Segoe UI", Arial, sans-serif`;
            exportCtx.fillStyle = '#3b82f6';
            exportCtx.fillText(location, canvasWidth / 2, 380 * scaleY);
        }
    }
    
    // Gerar imagem final
    const dataURL = exportCanvas.toDataURL('image/png', 1.0);
    const downloadLink = document.getElementById('downloadLink');
    downloadLink.href = dataURL;
    document.getElementById('downloadSection').style.display = 'block';
});

// Função de impressão otimizada para crachá 85x54mm
document.getElementById('printCard').addEventListener('click', function() {
    if (!modelImage) {
        alert('Por favor, carregue um modelo PNG primeiro.');
        return;
    }

    // Criar canvas específico para impressão em 85x54mm
    const printCanvas = document.createElement('canvas');
    const printCtx = printCanvas.getContext('2d');
    
    // Usar dimensões exatas do crachá padrão em 300 DPI
    printCanvas.width = PRINT_WIDTH_PX;
    printCanvas.height = PRINT_HEIGHT_PX;
    
    // Configurar para impressão de alta qualidade
    printCtx.imageSmoothingEnabled = true;
    printCtx.imageSmoothingQuality = 'high';
    printCtx.textRenderingOptimization = 'optimizeQuality';
    
    // Calcular escala para o formato de crachá
    const scaleX = PRINT_WIDTH_PX / 300;
    const scaleY = PRINT_HEIGHT_PX / 400;
    const scale = Math.min(scaleX, scaleY);
    
    // Centralizar o conteúdo no canvas de impressão
    const offsetX = (PRINT_WIDTH_PX - 300 * scale) / 2;
    const offsetY = (PRINT_HEIGHT_PX - 400 * scale) / 2;
    
    printCtx.translate(offsetX, offsetY);
    printCtx.scale(scale, scale);
    
    // Desenhar foto do usuário
    if (userImage) {
        printCtx.save();
        
        const brightness = document.getElementById('brightness').value;
        const contrast = document.getElementById('contrast').value;
        printCtx.filter = `brightness(${100 + parseInt(brightness)}%) contrast(${100 + parseInt(contrast)}%)`;
        
        const scaledWidth = userImage.width * imageZoom * 0.7;
        const scaledHeight = userImage.height * imageZoom * 0.7;
        
        const centerX = 150;
        const centerY = 200;
        
        const drawX = centerX - scaledWidth / 2 + (imagePosition.x * 2);
        const drawY = centerY - scaledHeight / 2 + (imagePosition.y * 2);
        
        printCtx.drawImage(userImage, drawX, drawY, scaledWidth, scaledHeight);
        printCtx.restore();
    }
    
    // Desenhar modelo PNG
    if (modelImage) {
        printCtx.drawImage(modelImage, 0, 0, 300, 400);
    }
    
    // Desenhar textos
    const name = document.getElementById('name').value;
    const role = document.getElementById('role').value;
    const location = document.getElementById('location').value;
    
    if (name || role || location) {
        printCtx.filter = 'none';
        printCtx.fillStyle = '#1e3a8a';
        printCtx.textAlign = 'center';
        printCtx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        printCtx.shadowBlur = 1;
        printCtx.shadowOffsetY = 0.5;
        
        if (name) {
            printCtx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
            printCtx.fillText(name, 150, 330);
        }
        
        if (role) {
            printCtx.font = '14px "Segoe UI", Arial, sans-serif';
            printCtx.fillText(role, 150, 355);
        }
        
        if (location) {
            printCtx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
            printCtx.fillStyle = '#3b82f6';
            printCtx.fillText(location, 150, 380);
        }
    }
    
    // Converter para imagem e criar janela de impressão
    const imageData = printCanvas.toDataURL('image/png', 1.0);
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Impressão do Crachá - 85x54mm</title>
            <style>
                @page {
                    size: 85mm 54mm;
                    margin: 0;
                }
                
                body { 
                    margin: 0; 
                    padding: 0;
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    min-height: 100vh; 
                    background: white;
                }
                
                .card-container {
                    width: 85mm;
                    height: 54mm;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                }
                
                img { 
                    width: 85mm;
                    height: auto;
                    max-height: 54mm;
                    object-fit: contain;
                }
                
                @media screen {
                    body {
                        background: #f0f0f0;
                        padding: 20px;
                    }
                    
                    .card-container {
                        background: white;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                        border-radius: 8px;
                    }
                }
                
                @media print {
                    @page {
                        size: 85mm 54mm;
                        margin: 0;
                    }
                    
                    body {
                        background: white;
                        padding: 0;
                    }
                    
                    .card-container {
                        width: 85mm;
                        height: 54mm;
                        box-shadow: none;
                        border-radius: 0;
                    }
                    
                    img {
                        width: 85mm;
                        height: 54mm;
                        object-fit: cover;
                    }
                }
            </style>
        </head>
        <body>
            <div class="card-container">
                <img src="${imageData}" alt="Crachá">
            </div>
            <script>
                window.onload = function() {
                    // Aguardar carregamento da imagem
                    const img = document.querySelector('img');
                    img.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 1000);
                    };
                    
                    // Se a imagem já estiver carregada
                    if (img.complete) {
                        setTimeout(function() {
                            window.print();
                        }, 1000);
                    }
                }
                
                // Fechar janela após impressão (opcional)
                window.addEventListener('afterprint', function() {
                    // window.close(); // Descomente se quiser fechar automaticamente
                });
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
});

// Inicializar valores dos sliders
updateSliderValues();
