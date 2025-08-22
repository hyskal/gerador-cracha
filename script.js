/**
 * CHANGELOG
 *
 * Instruções para Revisores:
 * Este bloco de comentários registra as modificações significativas do arquivo.
 * Cada nova modificação deve ser adicionada no topo da lista.
 * Use o formato "Versão [número]: [Descrição da modificação]".
 * Mantenha a lista limitada às 4 últimas alterações para clareza e concisão.
 *
 * Versão 3.3: Correção definitiva do posicionamento da imagem na área transparente.
 * - Implementado clipping circular preciso para a área transparente
 * - Correção do cálculo de escala para preencher completamente a área circular
 * - Centralização perfeita da imagem dentro da área circular
 * - Remoção do problema do "quadrado invisível" que limitava a exibição
 * Versão 3.2: Correção de posicionamento e arrasto da imagem.
 * - Refatoração para unificar a lógica de escala, usando as dimensões visuais (300x400) do canvas.
 * - Coordenadas da área de transparência agora são convertidas para a escala visual antes dos cálculos.
 * - A lógica de arrasto foi corrigida para refletir a nova escala de cálculo.
 * Versão 3.1: Implementação de pica.js e correção da lógica de desenho.
 * - Adicionada a biblioteca pica.js para redimensionamento de imagem de alta qualidade.
 * - Refatorada a função processUserImage() para usar pica.js.
 * Versão 3.0: Correção do cálculo de posicionamento e arrasto.
 * - Centralização da imagem do usuário ajustada para dentro do frame de transparência.
 * - Lógica de arrasto (drag and drop) corrigida, usando a escala correta do canvas para converter coordenadas do mouse.
 */

class BadgeGenerator {
    constructor() {
        this.initializeProperties();
        this.setupCanvas();
        this.loadData().then(() => {
            this.bindEvents();
            this.loadDefaultModel();
        });
    }

    initializeProperties() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.userImage = null;
        this.modelImage = null;
        this.photoArea = null;
        this.hasTransparency = false;
        this.imagePosition = { x: 0, y: 0 };
        this.imageZoom = 1;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.SCALE_FACTOR = 3;
        this.PRINT_WIDTH_MM = 54;
        this.PRINT_HEIGHT_MM = 85;
        this.DPI = 300;
        this.PIXELS_PER_MM = this.DPI / 25.4;
        this.PRINT_WIDTH_PX = Math.round(this.PRINT_WIDTH_MM * this.PIXELS_PER_MM);
        this.PRINT_HEIGHT_PX = Math.round(this.PRINT_HEIGHT_MM * this.PIXELS_PER_MM);
        this.data = {};
        this.modelLinks = {};
        this.pica = window.pica(); // Instância do pica.js
    }

    setupCanvas() {
        this.canvas.width = 300 * this.SCALE_FACTOR;
        this.canvas.height = 400 * this.SCALE_FACTOR;
        this.canvas.style.width = '300px';
        this.canvas.style.height = '400px';
        this.ctx.scale(this.SCALE_FACTOR, this.SCALE_FACTOR);
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.ctx.textRenderingOptimization = 'optimizeQuality';
    }

    async loadData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error('Erro ao carregar data.json');
            }
            const data = await response.json();
            this.data.courses = data.courses;
            this.data.locations = data.locations;
            this.modelLinks = data.modelLinks;
            this.setupDropdowns();
            this.updateSliderValues();
        } catch (error) {
            console.error('Falha ao carregar dados:', error);
            this.data = {
                courses: [],
                locations: []
            };
            this.modelLinks = {};
        }
    }

    bindEvents() {
        document.getElementById('uploadModel').addEventListener('change', (e) => this.handleModelUpload(e));
        document.getElementById('uploadImage').addEventListener('change', (e) => this.handleImageUpload(e));
        document.getElementById('brightness').addEventListener('input', (e) => this.updateControl(e, 'brightnessValue'));
        document.getElementById('contrast').addEventListener('input', (e) => this.updateControl(e, 'contrastValue'));
        document.getElementById('positionX').addEventListener('input', (e) => this.updatePosition(e, 'x'));
        document.getElementById('positionY').addEventListener('input', (e) => this.updatePosition(e, 'y'));
        document.getElementById('zoom').addEventListener('input', (e) => this.updateZoom(e));
        document.getElementById('zoomIn').addEventListener('click', () => this.adjustZoom(10));
        document.getElementById('zoomOut').addEventListener('click', () => this.adjustZoom(-10));
        document.getElementById('name').addEventListener('input', () => this.drawBadge());
        document.getElementById('nameSize').addEventListener('input', (e) => this.updateControl(e, 'nameSizeValue', 'px'));
        document.getElementById('courseSize').addEventListener('input', (e) => this.updateControl(e, 'courseSizeValue', 'px'));
        document.getElementById('locationSize').addEventListener('input', (e) => this.updateControl(e, 'locationSizeValue', 'px'));
        document.getElementById('courseSelect').addEventListener('change', () => this.toggleCustomInput('course'));
        document.getElementById('locationSelect').addEventListener('change', () => this.toggleCustomInput('location'));
        document.getElementById('courseCustom').addEventListener('input', () => this.drawBadge());
        document.getElementById('locationCustom').addEventListener('input', () => this.drawBadge());
        this.canvas.addEventListener('mousedown', (e) => this.startDrag(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleDrag(e));
        this.canvas.addEventListener('mouseup', () => this.endDrag());
        this.canvas.addEventListener('mouseleave', () => this.endDrag());
        document.getElementById('generateCard').addEventListener('click', () => this.generateCard());
        document.getElementById('printCard').addEventListener('click', () => this.printCard());
    }

    setupDropdowns() {
        const courseSelect = document.getElementById('courseSelect');
        const locationSelect = document.getElementById('locationSelect');
        courseSelect.innerHTML = '<option value="">Selecione um curso</option>';
        locationSelect.innerHTML = '<option value="">Selecione um local</option>';
        if (this.data.courses) {
            this.data.courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course;
                option.textContent = course;
                courseSelect.appendChild(option);
            });
        }
        if (this.data.locations) {
            this.data.locations.forEach(location => {
                const option = document.createElement('option');
                option.value = location;
                option.textContent = location;
                locationSelect.appendChild(option);
            });
        }
        ['courseSelect', 'locationSelect'].forEach(id => {
            const select = document.getElementById(id);
            const option = document.createElement('option');
            option.value = 'custom';
            option.textContent = 'Outro (especificar)';
            select.appendChild(option);
        });
    }

    toggleCustomInput(type) {
        const select = document.getElementById(`${type}Select`);
        const customInput = document.getElementById(`${type}Custom`);
        customInput.style.display = select.value === 'custom' ? 'block' : 'none';
        this.drawBadge();
    }

    updateControl(event, valueId, suffix = '') {
        const value = event.target.value;
        document.getElementById(valueId).textContent = value + suffix;
        this.drawBadge();
    }

    updatePosition(event, axis) {
        this.imagePosition[axis] = parseInt(event.target.value);
        document.getElementById(`position${axis.toUpperCase()}Value`).textContent = event.target.value;
        this.drawBadge();
    }

    updateZoom(event) {
        this.imageZoom = parseInt(event.target.value) / 100;
        document.getElementById('zoomValue').textContent = event.target.value + '%';
        this.drawBadge();
    }

    adjustZoom(delta) {
        const zoomSlider = document.getElementById('zoom');
        const currentValue = parseInt(zoomSlider.value);
        const newValue = Math.max(50, Math.min(200, currentValue + delta));
        zoomSlider.value = newValue;
        this.imageZoom = newValue / 100;
        document.getElementById('zoomValue').textContent = newValue + '%';
        this.drawBadge();
    }

    updateSliderValues() {
        const sliders = [
            { id: 'brightness', valueId: 'brightnessValue' },
            { id: 'contrast', valueId: 'contrastValue' },
            { id: 'positionX', valueId: 'positionXValue' },
            { id: 'positionY', valueId: 'positionYValue' },
            { id: 'zoom', valueId: 'zoomValue', suffix: '%' },
            { id: 'nameSize', valueId: 'nameSizeValue', suffix: 'px' },
            { id: 'courseSize', valueId: 'courseSizeValue', suffix: 'px' },
            { id: 'locationSize', valueId: 'locationSizeValue', suffix: 'px' }
        ];
        sliders.forEach(slider => {
            const element = document.getElementById(slider.id);
            const valueElement = document.getElementById(slider.valueId);
            if (element && valueElement) {
                valueElement.textContent = element.value + (slider.suffix || '');
            }
        });
    }

    async loadDefaultModel() {
        const defaultModelUrl = this.modelLinks['Modelo Padrão'];
        if (defaultModelUrl) {
            await this.loadModelFromUrl(defaultModelUrl);
        }
    }

    loadModelFromUrl(url) {
        return new Promise((resolve, reject) => {
            console.log('Carregando modelo:', url);
            this.modelImage = new Image();
            this.modelImage.crossOrigin = 'anonymous';
            this.modelImage.onload = () => {
                console.log('Modelo carregado com sucesso.');
                this.analyzeTransparency();
                this.drawBadge();
                resolve();
            };
            this.modelImage.onerror = () => {
                console.error('Erro ao carregar modelo.');
                reject();
            };
            this.modelImage.src = url;
        });
    }

    handleModelUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        if (file.type !== 'image/png') {
            alert('Por favor, selecione apenas arquivos PNG.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            this.modelImage = new Image();
            this.modelImage.onload = () => {
                console.log('Modelo local carregado.');
                this.analyzeTransparency();
                this.drawBadge();
            };
            this.modelImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        if (!this.modelImage) {
            alert('Por favor, carregue um modelo primeiro.');
            event.target.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            this.userImage = new Image();
            this.userImage.onload = () => {
                console.log('Imagem do usuário carregada. Iniciando processamento com pica.js.');
                this.processUserImage();
            };
            this.userImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    async processUserImage() {
        const targetWidth = (this.canvas.width / this.SCALE_FACTOR) * 0.5;
        const targetHeight = targetWidth / (this.userImage.width / this.userImage.height);

        const resizedCanvas = document.createElement('canvas');
        resizedCanvas.width = targetWidth;
        resizedCanvas.height = targetHeight;
        
        try {
            const result = await this.pica.resize(this.userImage, resizedCanvas, {
                quality: 3,
            });

            console.log('[DEBUG-pica] Redimensionamento concluído.');

            const processedImage = new Image();
            processedImage.onload = () => {
                this.userImage = processedImage;
                this.resetImageControls();
                this.drawBadge();
                console.log(`[DEBUG-pica] Nova imagem processada: Largura=${processedImage.width}, Altura=${processedImage.height}`);
            };
            processedImage.src = result.toDataURL('image/png');
        } catch (error) {
            console.error('[ERRO-pica] Falha ao redimensionar a imagem:', error);
            this.userImage.width = targetWidth;
            this.userImage.height = targetHeight;
            this.drawBadge();
        }
    }

    analyzeTransparency() {
        if (!this.modelImage) return;
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = this.modelImage.width;
        tempCanvas.height = this.modelImage.height;
        tempCtx.drawImage(this.modelImage, 0, 0);
        try {
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;
            let minX = tempCanvas.width, minY = tempCanvas.height;
            let maxX = 0, maxY = 0;
            let transparentPixels = 0;
            for (let y = 0; y < tempCanvas.height; y++) {
                for (let x = 0; x < tempCanvas.width; x++) {
                    const alpha = data[((y * tempCanvas.width) + x) * 4 + 3];
                    if (alpha < 128) {
                        transparentPixels++;
                        if (x < minX) minX = x;
                        if (y < minY) minY = y;
                        if (x > maxX) maxX = x;
                        if (y > maxY) maxY = y;
                    }
                }
            }
            if (transparentPixels > 100) {
                this.hasTransparency = true;
                this.photoArea = {
                    x: minX,
                    y: minY,
                    width: maxX - minX,
                    height: maxY - minY
                };
                console.log('Área transparente detectada:', this.photoArea);
            } else {
                this.hasTransparency = false;
                this.photoArea = null;
                console.log('Sem transparência - imagem será desenhada na frente.');
            }
        } catch (error) {
            console.warn('Erro ao analisar transparência:', error);
            this.hasTransparency = false;
            this.photoArea = null;
        }
    }

    resetImageControls() {
        this.imagePosition = { x: 0, y: 0 };
        this.imageZoom = 1;
        document.getElementById('positionX').value = 0;
        document.getElementById('positionY').value = 0;
        document.getElementById('zoom').value = 100;
        this.updateSliderValues();
    }

    startDrag(event) {
        if (!this.userImage) return;
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (event.clientX - rect.left);
        const mouseY = (event.clientY - rect.top);
        
        const scaledPhotoArea = {
            x: this.photoArea.x / this.SCALE_FACTOR,
            y: this.photoArea.y / this.SCALE_FACTOR,
            width: this.photoArea.width / this.SCALE_FACTOR,
            height: this.photoArea.height / this.SCALE_FACTOR
        };

        if (this.hasTransparency && this.photoArea) {
            if (mouseX >= scaledPhotoArea.x && mouseX <= scaledPhotoArea.x + scaledPhotoArea.width &&
                mouseY >= scaledPhotoArea.y && mouseY <= scaledPhotoArea.y + scaledPhotoArea.height) {
                this.isDragging = true;
                this.dragStart = {
                    x: mouseX - this.imagePosition.x,
                    y: mouseY - this.imagePosition.y
                };
                this.canvas.style.cursor = 'grabbing';
                console.log(`[DEBUG-drag] Início do arrasto: Mouse X=${mouseX}, Y=${mouseY}. Imagem X=${this.imagePosition.x}, Y=${this.imagePosition.y}`);
            }
        }
    }

    handleDrag(event) {
        if (!this.isDragging) return;
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (event.clientX - rect.left);
        const mouseY = (event.clientY - rect.top);
        
        this.imagePosition.x = mouseX - this.dragStart.x;
        this.imagePosition.y = mouseY - this.dragStart.y;
        
        this.imagePosition.x = Math.max(-200, Math.min(200, this.imagePosition.x));
        this.imagePosition.y = Math.max(-200, Math.min(200, this.imagePosition.y));
        
        document.getElementById('positionX').value = Math.round(this.imagePosition.x);
        document.getElementById('positionY').value = Math.round(this.imagePosition.y);
        
        console.log(`[DEBUG-drag] Mouse atual X=${mouseX}, Y=${mouseY}. Nova posição da imagem X=${this.imagePosition.x}, Y=${this.imagePosition.y}`);
        
        this.updateSliderValues();
        this.drawBadge();
    }

    endDrag() {
        this.isDragging = false;
        this.canvas.style.cursor = this.userImage ? 'grab' : 'default';
        console.log('Arrasto finalizado.');
    }

    drawBadge() {
        if (!this.modelImage || !this.modelImage.complete) {
            console.log('Modelo não disponível para desenho.');
            return;
        }
        this.ctx.clearRect(0, 0, this.canvas.width / this.SCALE_FACTOR, this.canvas.height / this.SCALE_FACTOR);
        
        if (this.userImage) {
            console.log('Desenhando imagem do usuário.');
            if (this.hasTransparency && this.photoArea) {
                this.drawUserImageBehind();
                this.drawModel();
            } else {
                this.drawModel();
                this.drawUserImageInFront();
            }
        } else {
            console.log('Imagem do usuário não disponível. Desenhando apenas o modelo.');
            this.drawModel();
        }
        this.drawTexts();
    }

    drawModel() {
        const canvasWidth = this.canvas.width / this.SCALE_FACTOR;
        const canvasHeight = this.canvas.height / this.SCALE_FACTOR;
        this.ctx.drawImage(this.modelImage, 0, 0, canvasWidth, canvasHeight);
        console.log('Modelo do crachá desenhado.');
    }

    drawUserImageBehind() {
        const brightness = parseInt(document.getElementById('brightness').value);
        const contrast = parseInt(document.getElementById('contrast').value);
        this.ctx.filter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%)`;

        // Converte as coordenadas da área de transparência para a escala visual do canvas
        const photoAreaX = this.photoArea.x / this.SCALE_FACTOR;
        const photoAreaY = this.photoArea.y / this.SCALE_FACTOR;
        const photoAreaWidth = this.photoArea.width / this.SCALE_FACTOR;
        const photoAreaHeight = this.photoArea.height / this.SCALE_FACTOR;
        
        // Salvar contexto para aplicar clipping circular
        this.ctx.save();
        
        // Criar path circular para clipping (área transparente do template)
        this.ctx.beginPath();
        const centerX = photoAreaX + photoAreaWidth / 2;
        const centerY = photoAreaY + photoAreaHeight / 2;
        const radius = Math.min(photoAreaWidth, photoAreaHeight) / 2;
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.clip();
        
        // Calcular escala para preencher completamente a área circular
        const aspectRatio = this.userImage.width / this.userImage.height;
        const targetSize = Math.max(photoAreaWidth, photoAreaHeight);
        
        let drawWidth, drawHeight;
        if (aspectRatio > 1) {
            // Imagem landscape - escalar pela altura
            drawHeight = targetSize * this.imageZoom;
            drawWidth = drawHeight * aspectRatio;
        } else {
            // Imagem portrait - escalar pela largura  
            drawWidth = targetSize * this.imageZoom;
            drawHeight = drawWidth / aspectRatio;
        }
        
        // Centralizar perfeitamente na área circular com offset do usuário
        const userDrawX = centerX - (drawWidth / 2) + this.imagePosition.x;
        const userDrawY = centerY - (drawHeight / 2) + this.imagePosition.y;

        this.ctx.drawImage(
            this.userImage,
            userDrawX, userDrawY, drawWidth, drawHeight
        );
        
        // Restaurar contexto
        this.ctx.restore();
        this.ctx.filter = 'none';
        console.log('Imagem do usuário desenhada atrás do modelo (com transparência circular corrigida).');
    }

    drawUserImageInFront() {
        const brightness = parseInt(document.getElementById('brightness').value);
        const contrast = parseInt(document.getElementById('contrast').value);
        this.ctx.filter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%)`;
        
        const canvasWidth = this.canvas.width / this.SCALE_FACTOR;
        const userDrawWidth = this.userImage.width * this.imageZoom;
        const userDrawHeight = this.userImage.height * this.imageZoom;
        
        const userDrawX = (canvasWidth / 2) - (userDrawWidth / 2) + this.imagePosition.x;
        const userDrawY = (this.canvas.height / this.SCALE_FACTOR / 2) - (userDrawHeight / 2) + this.imagePosition.y;
        
        this.ctx.drawImage(
            this.userImage,
            userDrawX, userDrawY, userDrawWidth, userDrawHeight
        );
        this.ctx.filter = 'none';
        console.log('Imagem do usuário desenhada na frente do modelo.');
    }

    drawTexts() {
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
        this.ctx.fillStyle = '#1e3a8a';
        this.ctx.textAlign = 'center';
        const canvasWidth = this.canvas.width / this.SCALE_FACTOR;
        const centerX = canvasWidth / 2;
        if (name) {
            this.ctx.font = `bold ${nameSize}px Arial, sans-serif`;
            this.ctx.fillText(name, centerX, 315);
        }
        if (course) {
            this.ctx.font = `${courseSize}px Arial, sans-serif`;
            this.ctx.fillText(course, centerX, 335);
        }
        if (location) {
            this.ctx.font = `${locationSize}px Arial, sans-serif`;
            this.ctx.fillText(location, centerX, 355);
        }
        console.log('Textos do crachá desenhados.');
    }

    generateCard() {
        if (!this.userImage || !this.modelImage) {
            alert('Por favor, carregue a foto e o modelo antes de gerar.');
            return;
        }
        document.getElementById('downloadSection').style.display = 'block';
        this.createDownloadLink();
    }

    printCard() {
        if (!this.userImage || !this.modelImage) {
            alert('Por favor, carregue a foto e o modelo antes de imprimir.');
            return;
        }
        this.drawBadge();
        window.print();
    }

    createDownloadLink() {
        const printCanvas = document.createElement('canvas');
        printCanvas.width = this.PRINT_WIDTH_PX;
        printCanvas.height = this.PRINT_HEIGHT_PX;
        const printCtx = printCanvas.getContext('2d');
        printCtx.imageSmoothingEnabled = true;
        printCtx.imageSmoothingQuality = 'high';
        const scaleX = this.PRINT_WIDTH_PX / (this.canvas.width / this.SCALE_FACTOR);
        const scaleY = this.PRINT_HEIGHT_PX / (this.canvas.height / this.SCALE_FACTOR);
        printCtx.scale(scaleX, scaleY);
        if (this.userImage && this.hasTransparency && this.photoArea) {
            this.drawUserImageOnPrintCanvas(printCtx);
            printCtx.drawImage(this.modelImage, 0, 0, this.canvas.width / this.SCALE_FACTOR, this.canvas.height / this.SCALE_FACTOR);
        } else if (this.userImage && !this.hasTransparency) {
            printCtx.drawImage(this.modelImage, 0, 0, this.canvas.width / this.SCALE_FACTOR, this.canvas.height / this.SCALE_FACTOR);
            this.drawUserImageOnPrintCanvas(printCtx, true);
        } else {
            printCtx.drawImage(this.modelImage, 0, 0, this.canvas.width / this.SCALE_FACTOR, this.canvas.height / this.SCALE_FACTOR);
        }
        this.drawTextsOnPrintCanvas(printCtx);
        const dataURL = printCanvas.toDataURL('image/png');
        const downloadLink = document.getElementById('downloadLink');
        downloadLink.href = dataURL;
    }

    drawUserImageOnPrintCanvas(printCtx, inFront = false) {
        const brightness = parseInt(document.getElementById('brightness').value);
        const contrast = parseInt(document.getElementById('contrast').value);
        printCtx.filter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%)`;
        
        if (this.hasTransparency && !inFront && this.photoArea) {
            // Aplicar o mesmo clipping circular para impressão
            const photoAreaX = this.photoArea.x / this.SCALE_FACTOR;
            const photoAreaY = this.photoArea.y / this.SCALE_FACTOR;
            const photoAreaWidth = this.photoArea.width / this.SCALE_FACTOR;
            const photoAreaHeight = this.photoArea.height / this.SCALE_FACTOR;
            
            printCtx.save();
            printCtx.beginPath();
            const centerX = photoAreaX + photoAreaWidth / 2;
            const centerY = photoAreaY + photoAreaHeight / 2;
            const radius = Math.min(photoAreaWidth, photoAreaHeight) / 2;
            printCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            printCtx.clip();
            
            // Calcular escala para preencher completamente a área circular
            const aspectRatio = this.userImage.width / this.userImage.height;
            const targetSize = Math.max(photoAreaWidth, photoAreaHeight);
            
            let drawWidth, drawHeight;
            if (aspectRatio > 1) {
                drawHeight = targetSize * this.imageZoom;
                drawWidth = drawHeight * aspectRatio;
            } else {
                drawWidth = targetSize * this.imageZoom;
                drawHeight = drawWidth / aspectRatio;
            }
            
            const userDrawX = centerX - (drawWidth / 2) + this.imagePosition.x;
            const userDrawY = centerY - (drawHeight / 2) + this.imagePosition.y;
            
            printCtx.drawImage(
                this.userImage,
                userDrawX, userDrawY, drawWidth, drawHeight
            );
            printCtx.restore();
        } else {
            // Desenho normal para frente ou sem transparência
            const photoAreaX = this.photoArea ? this.photoArea.x / this.SCALE_FACTOR : 0;
            const photoAreaY = this.photoArea ? this.photoArea.y / this.SCALE_FACTOR : 0;
            const photoAreaWidth = this.photoArea ? this.photoArea.width / this.SCALE_FACTOR : this.canvas.width / this.SCALE_FACTOR;
            const photoAreaHeight = this.photoArea ? this.photoArea.height / this.SCALE_FACTOR : this.canvas.height / this.SCALE_FACTOR;
            
            const userDrawWidth = this.userImage.width * this.imageZoom;
            const userDrawHeight = this.userImage.height * this.imageZoom;
            
            const userDrawX = (photoAreaX + photoAreaWidth / 2) - (userDrawWidth / 2) + this.imagePosition.x;
            const userDrawY = (photoAreaY + photoAreaHeight / 2) - (userDrawHeight / 2) + this.imagePosition.y;
            
            printCtx.drawImage(
                this.userImage,
                userDrawX, userDrawY, userDrawWidth, userDrawHeight
            );
        }
        printCtx.filter = 'none';
    }

    drawTextsOnPrintCanvas(printCtx) {
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
        printCtx.fillStyle = '#1e3a8a';
        printCtx.textAlign = 'center';
        const canvasWidth = this.canvas.width / this.SCALE_FACTOR;
        const centerX = canvasWidth / 2;
        if (name) {
            printCtx.font = `bold ${nameSize}px Arial, sans-serif`;
            printCtx.fillText(name, centerX, 315);
        }
        if (course) {
            printCtx.font = `${courseSize}px Arial, sans-serif`;
            printCtx.fillText(course, centerX, 335);
        }
        if (location) {
            printCtx.font = `${locationSize}px Arial, sans-serif`;
            printCtx.fillText(location, centerX, 355);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.badgeGenerator = new BadgeGenerator();
});
