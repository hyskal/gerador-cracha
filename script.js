/**
 * CHANGELOG
 *
 * Instruções para Revisores:
 * Este bloco de comentários registra as modificações significativas do arquivo.
 * Cada nova modificação deve ser adicionada no topo da lista.
 * Use o formato "Versão [número]: [Descrição da modificação]".
 * Mantenha a lista limitada às 4 últimas alterações para clareza e concisão.
 *
/**
 * CHANGELOG
 *
 * Versão 7.0: REFATORAÇÃO COMPLETA - Nova abordagem garantida
 * - MUDANÇA RADICAL: Agora o download captura DIRETAMENTE o canvas visível
 * - Método anterior (recriar o canvas) era fonte de inconsistências
 * - Nova estratégia: capturar o canvas de preview e redimensionar com qualidade
 * - Garantia 100%: O que você vê é EXATAMENTE o que você baixa
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
        
        this.photoArea = {
            x: 300, 
            y: 390, 
            width: 400, 
            height: 400 
        };

        this.imagePosition = { x: 0, y: 0 };
        this.imageZoom = 1;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        
        // Canvas de preview trabalha em escala 3x para qualidade
        this.SCALE_FACTOR = 3;
        
        // Dimensões para impressão/download em 300 DPI
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
        // Canvas interno é 3x maior para qualidade
        this.canvas.width = 300 * this.SCALE_FACTOR;
        this.canvas.height = 400 * this.SCALE_FACTOR;
        
        // CSS mantém tamanho visual de 300x400
        this.canvas.style.width = '300px';
        this.canvas.style.height = '400px';
        
        // Aplicar escala no contexto
        this.ctx.scale(this.SCALE_FACTOR, this.SCALE_FACTOR);
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    async loadData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error('Erro ao carregar data.json');
            
            const data = await response.json();
            this.data.courses = data.courses;
            this.data.locations = data.locations;
            this.modelLinks = data.modelLinks;
            
            this.setupDropdowns();
            this.updateSliderValues();
        } catch (error) {
            console.error('Falha ao carregar dados:', error);
            this.data = { courses: [], locations: [] };
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
        const newValue = Math.max(25, Math.min(200, currentValue + delta));
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
                console.log('Imagem do usuário carregada.');
                this.processUserImage();
            };
            this.userImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    async processUserImage() {
        const squareSize = Math.min(this.photoArea.width, this.photoArea.height);
        
        let targetWidth, targetHeight;
        const aspectRatio = this.userImage.width / this.userImage.height;
        
        if (aspectRatio >= 1) {
            targetWidth = squareSize * 0.9;
            targetHeight = targetWidth / aspectRatio;
        } else {
            targetHeight = squareSize * 0.9;
            targetWidth = targetHeight * aspectRatio;
        }
        
        const resizedCanvas = document.createElement('canvas');
        resizedCanvas.width = targetWidth;
        resizedCanvas.height = targetHeight;
        
        try {
            const result = await this.pica.resize(this.userImage, resizedCanvas, {
                quality: 3,
            });

            const processedImage = new Image();
            processedImage.onload = () => {
                this.userImage = processedImage;
                this.resetImageControls();
                this.drawBadge();
            };
            processedImage.src = result.toDataURL('image/png');
        } catch (error) {
            console.error('Erro ao processar imagem:', error);
            this.resetImageControls();
            this.drawBadge();
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

        if (mouseX >= scaledPhotoArea.x && mouseX <= scaledPhotoArea.x + scaledPhotoArea.width &&
            mouseY >= scaledPhotoArea.y && mouseY <= scaledPhotoArea.y + scaledPhotoArea.height) {
            this.isDragging = true;
            this.dragStart = {
                x: mouseX - this.imagePosition.x,
                y: mouseY - this.imagePosition.y
            };
            this.canvas.style.cursor = 'grabbing';
        }
    }

    handleDrag(event) {
        if (!this.isDragging) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (event.clientX - rect.left);
        const mouseY = (event.clientY - rect.top);
        
        this.imagePosition.x = mouseX - this.dragStart.x;
        this.imagePosition.y = mouseY - this.dragStart.y;
        
        const maxOffsetX = this.photoArea.width / 2;
        const maxOffsetY = this.photoArea.height / 2;
        this.imagePosition.x = Math.max(-maxOffsetX, Math.min(maxOffsetX, this.imagePosition.x));
        this.imagePosition.y = Math.max(-maxOffsetY, Math.min(maxOffsetY, this.imagePosition.y));
        
        document.getElementById('positionX').value = Math.round(this.imagePosition.x);
        document.getElementById('positionY').value = Math.round(this.imagePosition.y);
        
        this.updateSliderValues();
        this.drawBadge();
    }

    endDrag() {
        this.isDragging = false;
        this.canvas.style.cursor = this.userImage ? 'grab' : 'default';
    }

    // ====================================
    // FUNÇÕES DE DESENHO NO PREVIEW
    // ====================================

    drawBadge() {
        if (!this.modelImage || !this.modelImage.complete) {
            return;
        }
        
        // Limpar canvas
        this.ctx.clearRect(0, 0, this.canvas.width / this.SCALE_FACTOR, this.canvas.height / this.SCALE_FACTOR);
        
        // Desenhar foto (se existir)
        if (this.userImage && this.userImage.complete) {
            this.drawUserPhoto();
        }
        
        // Desenhar modelo por cima
        this.drawModel();
        
        // Desenhar textos
        this.drawTexts();
    }

    drawUserPhoto() {
        const brightness = parseInt(document.getElementById('brightness').value || 0);
        const contrast = parseInt(document.getElementById('contrast').value || 0);
        
        // Aplicar filtros
        this.ctx.filter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%)`;

        // Calcular área da foto (dividir por SCALE_FACTOR porque o contexto já está escalado)
        const photoX = this.photoArea.x / this.SCALE_FACTOR;
        const photoY = this.photoArea.y / this.SCALE_FACTOR;
        const photoW = this.photoArea.width / this.SCALE_FACTOR;
        const photoH = this.photoArea.height / this.SCALE_FACTOR;
        
        // Calcular tamanho da imagem com zoom
        const imgW = this.userImage.width * this.imageZoom;
        const imgH = this.userImage.height * this.imageZoom;
        
        // Calcular posição (centralizada + offset)
        const imgX = photoX + (photoW / 2) - (imgW / 2) + (this.imagePosition.x / this.SCALE_FACTOR);
        const imgY = photoY + (photoH / 2) - (imgH / 2) + (this.imagePosition.y / this.SCALE_FACTOR);
        
        // Salvar contexto
        this.ctx.save();
        
        // Criar máscara retangular
        this.ctx.beginPath();
        this.ctx.rect(photoX, photoY, photoW, photoH);
        this.ctx.clip();
        
        // Desenhar imagem
        this.ctx.drawImage(this.userImage, imgX, imgY, imgW, imgH);
        
        // Restaurar
        this.ctx.restore();
        this.ctx.filter = 'none';
    }

    drawModel() {
        const w = this.canvas.width / this.SCALE_FACTOR;
        const h = this.canvas.height / this.SCALE_FACTOR;
        this.ctx.drawImage(this.modelImage, 0, 0, w, h);
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
        const centerX = (this.canvas.width / this.SCALE_FACTOR) / 2;
        
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

    // ====================================
    // NOVA ABORDAGEM: CAPTURA DIRETA DO CANVAS
    // ====================================

    async generateCard() {
        if (!this.userImage || !this.modelImage) {
            alert('Por favor, carregue a foto e o modelo antes de gerar.');
            return;
        }

        if (!this.modelImage.complete || !this.userImage.complete) {
            alert('Aguarde o carregamento completo das imagens.');
            return;
        }

        console.log('🎯 Iniciando geração com NOVA ABORDAGEM...');
        
        // GARANTIR que o canvas esteja atualizado
        this.drawBadge();
        
        // Aguardar próximo frame para garantir renderização
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        try {
            // ETAPA 1: Capturar o canvas atual (já tem tudo renderizado corretamente)
            const sourceCanvas = this.canvas;
            
            // ETAPA 2: Criar canvas de alta resolução
            const highResCanvas = document.createElement('canvas');
            highResCanvas.width = this.PRINT_WIDTH_PX;
            highResCanvas.height = this.PRINT_HEIGHT_PX;
            
            console.log(`📐 Canvas fonte: ${sourceCanvas.width}x${sourceCanvas.height}`);
            console.log(`📐 Canvas destino: ${highResCanvas.width}x${highResCanvas.height}`);
            
            // ETAPA 3: Usar Pica.js para redimensionar com máxima qualidade
            const result = await this.pica.resize(sourceCanvas, highResCanvas, {
                quality: 3,
                alpha: true,
                unsharpAmount: 80,
                unsharpRadius: 0.6,
                unsharpThreshold: 2
            });
            
            console.log('✅ Redimensionamento concluído com Pica.js');
            
            // ETAPA 4: Converter para JPEG com fundo branco
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = highResCanvas.width;
            finalCanvas.height = highResCanvas.height;
            const finalCtx = finalCanvas.getContext('2d');
            
            // Fundo branco
            finalCtx.fillStyle = '#FFFFFF';
            finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
            
            // Desenhar imagem redimensionada
            finalCtx.drawImage(result, 0, 0);
            
            // ETAPA 5: Gerar download
            const dataURL = finalCanvas.toDataURL('image/jpeg', 0.95);
            
            const downloadLink = document.getElementById('downloadLink');
            const fileName = document.getElementById('name').value.trim() || 'cracha-cetep';
            downloadLink.download = `${fileName}.jpeg`;
            downloadLink.href = dataURL;
            
            document.getElementById('downloadSection').style.display = 'block';
            
            console.log('✅ Download pronto!');
            console.log(`📄 Arquivo: ${fileName}.jpeg`);
            console.log(`📊 Tamanho: ${(dataURL.length / 1024 / 1024).toFixed(2)} MB`);
            
        } catch (error) {
            console.error('❌ Erro na geração:', error);
            alert('Erro ao gerar o crachá. Por favor, tente novamente.');
        }
    }

    printCard() {
        if (!this.userImage || !this.modelImage) {
            alert('Por favor, carregue a foto e o modelo antes de imprimir.');
            return;
        }
        this.drawBadge();
        window.print();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.badgeGenerator = new BadgeGenerator();
});
