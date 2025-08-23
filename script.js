/**
 * CHANGELOG
 *
 * Instruções para Revisores:
 * Este bloco de comentários registra as modificações significativas do arquivo.
 * Cada nova modificação deve ser adicionada no topo da lista.
 * Use o formato "Versão [número]: [Descrição da modificação]".
 * Mantenha a lista limitada às 4 últimas alterações para clareza e concisão.
 *
 * Versão 4.7: Ajuste da área de renderização quadrada para 400x400 pixels.
 * - Largura e altura da área de renderização definidas para 400px.
 * - Posição da área de renderização mantida.
 * Versão 4.6: Ajuste da área de renderização quadrada.
 * - Largura e altura da área de renderização aumentadas em 20%.
 * - Posição da área de renderização mantida.
 * Versão 4.5: Ajuste da área de renderização quadrada.
 * - Área de renderização diminuída em 30%.
 * - Área de renderização movida 50px para a direita.
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
        this.hasTransparency = true;
        
        // Coordenadas e dimensões da área de transparência para a foto do usuário.
        // Os valores abaixo foram ajustados para definir a área em 400x400 pixels.
        this.photoArea = {
            x: 300, // Posição X mantida
            y: 390, // Posição Y mantida
            width: 400, // Nova largura
            height: 400 // Nova altura
        };

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
        this.pica = window.pica();
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
        const squareSize = Math.min(this.photoArea.width, this.photoArea.height);
        
        // Calcula as dimensões mantendo a proporção da imagem original
        let targetWidth, targetHeight;
        const aspectRatio = this.userImage.width / this.userImage.height;
        
        if (aspectRatio >= 1) {
            // Imagem mais larga que alta
            targetWidth = squareSize * 0.9; // 90% do lado para margem de segurança
            targetHeight = targetWidth / aspectRatio;
        } else {
            // Imagem mais alta que larga
            targetHeight = squareSize * 0.9; // 90% do lado para margem de segurança
            targetWidth = targetHeight * aspectRatio;
        }
        
        console.log(`[DEBUG-processamento] Quadrado lado: ${squareSize}, Target: ${targetWidth}x${targetHeight}, Aspect: ${aspectRatio}`);

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
            // Fallback para redimensionamento manual se a biblioteca falhar
            this.userImage.width = targetWidth;
            this.userImage.height = targetHeight;
            this.resetImageControls();
            this.drawBadge();
        }
    }

    analyzeTransparency() {
        console.log('A análise de transparência foi substituída por dados fixos.');
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

    handleDrag(event) {
        if (!this.isDragging) return;
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (event.clientX - rect.left);
        const mouseY = (event.clientY - rect.top);
        
        this.imagePosition.x = mouseX - this.dragStart.x;
        this.imagePosition.y = mouseY - this.dragStart.y;
        
        // Limita o movimento para manter a imagem dentro de limites razoáveis
        const maxOffsetX = this.photoArea.width / 2;
        const maxOffsetY = this.photoArea.height / 2;
        this.imagePosition.x = Math.max(-maxOffsetX, Math.min(maxOffsetX, this.imagePosition.x));
        this.imagePosition.y = Math.max(-maxOffsetY, Math.min(maxOffsetY, this.imagePosition.y));
        
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
            this.drawUserImageBehind();
            this.drawModel();
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

        const photoAreaX = this.photoArea.x / this.SCALE_FACTOR;
        const photoAreaY = this.photoArea.y / this.SCALE_FACTOR;
        const photoAreaWidth = this.photoArea.width / this.SCALE_FACTOR;
        const photoAreaHeight = this.photoArea.height / this.SCALE_FACTOR;
        
        // Calcula as dimensões da imagem com zoom aplicado
        const userDrawWidth = this.userImage.width * this.imageZoom;
        const userDrawHeight = this.userImage.height * this.imageZoom;
        
        // Centraliza a imagem na área de recorte
        const userDrawX = photoAreaX + (photoAreaWidth / 2) - (userDrawWidth / 2) + this.imagePosition.x;
        const userDrawY = photoAreaY + (photoAreaHeight / 2) - (userDrawHeight / 2) + this.imagePosition.y;

        console.log(`[DEBUG-draw] Imagem do usuário (behind): X=${userDrawX}, Y=${userDrawY}, W=${userDrawWidth}, H=${userDrawHeight}`);
        console.log(`[DEBUG-draw] Área de transparência: X=${photoAreaX}, Y=${photoAreaY}, W=${photoAreaWidth}, H=${photoAreaHeight}`);
        
        this.ctx.save();
        this.ctx.beginPath();
        
        // Cria o clipping retangular
        this.ctx.rect(photoAreaX, photoAreaY, photoAreaWidth, photoAreaHeight);
        this.ctx.clip();
        
        // Desenha a imagem dentro do clipping
        this.ctx.drawImage(
            this.userImage,
            userDrawX, userDrawY, userDrawWidth, userDrawHeight
        );
        
        this.ctx.restore();
        this.ctx.filter = 'none';
        console.log('Imagem do usuário desenhada atrás do modelo (com transparência).');
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

        if (this.userImage) {
            this.drawUserImageOnPrintCanvas(printCtx);
        }
        
        printCtx.drawImage(this.modelImage, 0, 0, this.canvas.width / this.SCALE_FACTOR, this.canvas.height / this.SCALE_FACTOR);
        this.drawTextsOnPrintCanvas(printCtx);
        const dataURL = printCanvas.toDataURL('image/png');
        const downloadLink = document.getElementById('downloadLink');
        downloadLink.href = dataURL;
    }

    drawUserImageOnPrintCanvas(printCtx) {
        const brightness = parseInt(document.getElementById('brightness').value);
        const contrast = parseInt(document.getElementById('contrast').value);
        printCtx.filter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%)`;
        
        // Desenho atrás com clipping retangular para impressão
        const photoAreaX = this.photoArea.x;
        const photoAreaY = this.photoArea.y;
        const photoAreaWidth = this.photoArea.width;
        const photoAreaHeight = this.photoArea.height;
        
        const userDrawWidth = this.userImage.width * this.imageZoom * this.SCALE_FACTOR;
        const userDrawHeight = this.userImage.height * this.imageZoom * this.SCALE_FACTOR;
        
        const userDrawX = photoAreaX + (photoAreaWidth / 2) - (userDrawWidth / 2) + (this.imagePosition.x * this.SCALE_FACTOR);
        const userDrawY = photoAreaY + (photoAreaHeight / 2) - (userDrawHeight / 2) + (this.imagePosition.y * this.SCALE_FACTOR);
        
        printCtx.save();
        printCtx.beginPath();
        printCtx.rect(photoAreaX, photoAreaY, photoAreaWidth, photoAreaHeight);
        printCtx.clip();
        printCtx.drawImage(
            this.userImage,
            userDrawX, userDrawY, userDrawWidth, userDrawHeight
        );
        printCtx.restore();
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
