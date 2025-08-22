/**
 * CHANGELOG
 *
 * Instruções para Revisores:
 * Este bloco de comentários registra as modificações significativas do arquivo.
 * Cada nova modificação deve ser adicionada no topo da lista.
 * Use o formato "Versão [número]: [Descrição da modificação]".
 * Mantenha a lista limitada às 4 últimas alterações para clareza e concisão.
 *
 * Versão 2.9: Correções de posicionamento e funcionalidade de arrasto.
 * - Lógica de cálculo de posição de desenho corrigida para usar coordenadas da fotoArea em alta resolução.
 * - Funcionalidade de arrasto (drag and drop) restaurada e aprimorada para funcionar dentro da área de recorte.
 * - Adicionados logs detalhados para depurar as coordenadas de arrasto e posicionamento da imagem.
 * Versão 2.8: Correção final do posicionamento e adição de logs.
 * - Ajuste do cálculo para centralizar a imagem do usuário DENTRO da área de transparência.
 * - Adicionados 5 novos logs para depuração detalhada, verificando as coordenadas após a correção.
 * - A lógica agora garante que a imagem sempre caia dentro do recorte.
 * Versão 2.7: Correção definitiva da lógica de posicionamento da imagem.
 * - Ajuste do cálculo para centralizar a imagem do usuário usando as coordenadas da área de transparência em alta resolução (com SCALE_FACTOR).
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
                console.log('Imagem do usuário carregada.');
                this.processUserImage();
            };
            this.userImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    processUserImage() {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const aspectRatio = this.userImage.width / this.userImage.height;
        const targetWidth = 800;
        const targetHeight = Math.round(targetWidth / aspectRatio);
        tempCanvas.width = targetWidth;
        tempCanvas.height = targetHeight;
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';
        tempCtx.drawImage(this.userImage, 0, 0, targetWidth, targetHeight);
        const imageData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
        const sharpened = this.applySharpenFilter(imageData);
        tempCtx.putImageData(sharpened, 0, 0);
        const processedImage = new Image();
        processedImage.onload = () => {
            this.userImage = processedImage;
            this.resetImageControls();
            this.drawBadge();
        };
        processedImage.src = tempCanvas.toDataURL('image/png', 0.95);
    }

    applySharpenFilter(imageData) {
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
        const mouseX = (event.clientX - rect.left) * (this.canvas.width / rect.width);
        const mouseY = (event.clientY - rect.top) * (this.canvas.height / rect.height);
        
        let canDrag = false;
        if (this.hasTransparency && this.photoArea) {
            canDrag = mouseX >= this.photoArea.x && mouseX <= this.photoArea.x + this.photoArea.width &&
                     mouseY >= this.photoArea.y && mouseY <= this.photoArea.y + this.photoArea.height;
        } else {
            // Lógica para arrasto em qualquer lugar sem transparência
            const canvasWidth = this.canvas.width / this.SCALE_FACTOR;
            const canvasHeight = this.canvas.height / this.SCALE_FACTOR;
            canDrag = mouseX >= 0 && mouseX <= canvasWidth && mouseY >= 0 && mouseY <= canvasHeight;
        }

        if (canDrag) {
            this.isDragging = true;
            this.dragStart = {
                x: mouseX - this.imagePosition.x * this.SCALE_FACTOR,
                y: mouseY - this.imagePosition.y * this.SCALE_FACTOR
            };
            this.canvas.style.cursor = 'grabbing';
            console.log(`[DEBUG] Arrastando: Início do mouse X=${mouseX}, Y=${mouseY}. Posição inicial da imagem X=${this.imagePosition.x}, Y=${this.imagePosition.y}`);
        }
    }

    handleDrag(event) {
        if (!this.isDragging) return;
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (event.clientX - rect.left) * (this.canvas.width / rect.width);
        const mouseY = (event.clientY - rect.top) * (this.canvas.height / rect.height);
        
        this.imagePosition.x = (mouseX - this.dragStart.x) / this.SCALE_FACTOR;
        this.imagePosition.y = (mouseY - this.dragStart.y) / this.SCALE_FACTOR;

        this.imagePosition.x = Math.max(-200, Math.min(200, this.imagePosition.x));
        this.imagePosition.y = Math.max(-200, Math.min(200, this.imagePosition.y));
        
        document.getElementById('positionX').value = Math.round(this.imagePosition.x);
        document.getElementById('positionY').value = Math.round(this.imagePosition.y);
        
        console.log(`[DEBUG] Arrastando: Mouse atual X=${mouseX}, Y=${mouseY}. Nova posição da imagem X=${this.imagePosition.x}, Y=${this.imagePosition.y}`);
        
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

        const userDrawWidth = (this.canvas.width / this.SCALE_FACTOR) * 0.5 * this.imageZoom;
        const userDrawHeight = userDrawWidth / (this.userImage.width / this.userImage.height);
        
        const photoX = this.photoArea.x / this.SCALE_FACTOR;
        const photoY = this.photoArea.y / this.SCALE_FACTOR;
        const photoWidth = this.photoArea.width / this.SCALE_FACTOR;
        const photoHeight = this.photoArea.height / this.SCALE_FACTOR;
        
        const userDrawX = photoX + (photoWidth / 2) - (userDrawWidth / 2) + this.imagePosition.x;
        const userDrawY = photoY + (photoHeight / 2) - (userDrawHeight / 2) + this.imagePosition.y;

        console.log(`[DEBUG] drawUserImageBehind: photoArea (Canvas): X=${photoX}, Y=${photoY}, W=${photoWidth}, H=${photoHeight}`);
        console.log(`[DEBUG] drawUserImageBehind: userImage (Canvas): X=${userDrawX}, Y=${userDrawY}, W=${userDrawWidth}, H=${userDrawHeight}`);

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(photoX, photoY, photoWidth, photoHeight);
        this.ctx.clip();
        
        this.ctx.drawImage(
            this.userImage,
            userDrawX, userDrawY, userDrawWidth, userDrawHeight
        );
        
        this.ctx.restore();
        this.ctx.filter = 'none';
        console.log('Imagem do usuário desenhada atrás do modelo (com transparência).');
    }

    drawUserImageInFront() {
        const brightness = parseInt(document.getElementById('brightness').value);
        const contrast = parseInt(document.getElementById('contrast').value);
        this.ctx.filter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%)`;
        
        const canvasWidth = this.canvas.width / this.SCALE_FACTOR;
        const userDrawWidth = canvasWidth * 0.5 * this.imageZoom;
        const userDrawHeight = userDrawWidth / (this.userImage.width / this.userImage.height);
        
        const userDrawX = (canvasWidth / 2) - (userDrawWidth / 2) + this.imagePosition.x;
        const userDrawY = (this.canvas.height / this.SCALE_FACTOR / 2) - (userDrawHeight / 2) + this.imagePosition.y;

        console.log(`[DEBUG] drawUserImageInFront: userImage (Canvas): X=${userDrawX}, Y=${userDrawY}, W=${userDrawWidth}, H=${userDrawHeight}`);
        
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
        
        const userDrawWidth = (this.canvas.width / 2) * this.imageZoom;
        const userDrawHeight = userDrawWidth / (this.userImage.width / this.userImage.height);
        
        const photoX = this.photoArea.x;
        const photoY = this.photoArea.y;
        const photoWidth = this.photoArea.width;
        const photoHeight = this.photoArea.height;

        const userDrawX = photoX + (photoWidth / 2) - (userDrawWidth / 2) + (this.imagePosition.x * this.SCALE_FACTOR);
        const userDrawY = photoY + (photoHeight / 2) - (userDrawHeight / 2) + (this.imagePosition.y * this.SCALE_FACTOR);
        
        if (this.hasTransparency && !inFront && this.photoArea) {
            printCtx.save();
            printCtx.beginPath();
            printCtx.rect(this.photoArea.x, this.photoArea.y, this.photoArea.width, this.photoArea.height);
            printCtx.clip();
            printCtx.drawImage(
                this.userImage,
                userDrawX, userDrawY, userDrawWidth, userDrawHeight
            );
            printCtx.restore();
        } else {
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
