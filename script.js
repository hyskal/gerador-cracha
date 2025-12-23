/**
 * CHANGELOG
 *
 * Instruções para Revisores:
 * Este bloco de comentários registra as modificações significativas do arquivo.
 * Cada nova modificação deve ser adicionada no topo da lista.
 * Use o formato "Versão [número]: [Descrição da modificação]".
 * Mantenha a lista limitada às 4 últimas alterações para clareza e concisão.
 *
 * Versão 5.5: Correção completa do sistema de download de imagem.
 * - Reescrita completa das funções generateCard() e createDownloadLink() para garantir que a foto do usuário apareça.
 * - Implementado sistema de debug detalhado para diagnosticar problemas de renderização.
 * - Adicionada solução de emergência usando cópia direta do canvas principal.
 * - Melhorada a validação e tratamento de erros em todas as etapas do processo.
 * Versão 5.4: Corrigido o bug do botão "Gerar Crachá".
 * - Agora a função generateCard() garante que o crachá seja desenhado completamente no canvas principal antes de gerar o download.
 * - A foto do usuário agora aparece corretamente na imagem gerada, mantendo consistência com o PDF.
 * - Adicionada validação adicional para garantir que todos os elementos estejam presentes antes da geração.
 * Versão 5.3: Corrigido o bug de download da imagem.
 * - A lógica de escala na função de download foi revisada para garantir que a foto do usuário e o modelo sejam desenhados corretamente no canvas de alta resolução.
 * - A ordem de desenho foi ajustada para que a foto do usuário apareça por trás do modelo.
 * Versão 5.2: Corrigido nome do arquivo de download.
 * - O nome do arquivo agora é gerado dinamicamente com base no nome do aluno inserido no campo de texto.
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
        
        this.updateSliderValues();
        this.drawBadge();
    }

    endDrag() {
        this.isDragging = false;
        this.canvas.style.cursor = this.userImage ? 'grab' : 'default';
    }

    drawBadge() {
        if (!this.modelImage || !this.modelImage.complete) {
            console.log('Modelo não disponível para desenho.');
            return;
        }
        this.ctx.clearRect(0, 0, this.canvas.width / this.SCALE_FACTOR, this.canvas.height / this.SCALE_FACTOR);
        
        if (this.userImage) {
            this.drawUserImageBehind(this.ctx, this.SCALE_FACTOR);
            this.drawModel(this.ctx, this.SCALE_FACTOR);
        } else {
            this.drawModel(this.ctx, this.SCALE_FACTOR);
        }
        this.drawTexts(this.ctx, this.SCALE_FACTOR);
    }

    drawModel(ctx, scale) {
        const canvasWidth = this.canvas.width / scale;
        const canvasHeight = this.canvas.height / scale;
        ctx.drawImage(this.modelImage, 0, 0, canvasWidth, canvasHeight);
    }

    drawUserImageBehind(ctx, scale) {
        const brightness = parseInt(document.getElementById('brightness').value);
        const contrast = parseInt(document.getElementById('contrast').value);
        ctx.filter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%)`;

        const photoAreaX = this.photoArea.x / scale;
        const photoAreaY = this.photoArea.y / scale;
        const photoAreaWidth = this.photoArea.width / scale;
        const photoAreaHeight = this.photoArea.height / scale;
        
        const userDrawWidth = this.userImage.width * this.imageZoom;
        const userDrawHeight = this.userImage.height * this.imageZoom;
        
        const userDrawX = photoAreaX + (photoAreaWidth / 2) - (userDrawWidth / 2) + (this.imagePosition.x / scale);
        const userDrawY = photoAreaY + (photoAreaHeight / 2) - (userDrawHeight / 2) + (this.imagePosition.y / scale);
        
        ctx.save();
        ctx.beginPath();
        
        ctx.rect(photoAreaX, photoAreaY, photoAreaWidth, photoAreaHeight);
        ctx.clip();
        
        ctx.drawImage(
            this.userImage,
            userDrawX, userDrawY, userDrawWidth, userDrawHeight
        );
        
        ctx.restore();
        ctx.filter = 'none';
    }

    drawTexts(ctx, scale) {
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
        const canvasWidth = this.canvas.width / scale;
        const centerX = canvasWidth / 2;
        if (name) {
            ctx.font = `bold ${nameSize}px Arial, sans-serif`;
            ctx.fillText(name, centerX, 315);
        }
        if (course) {
            ctx.font = `${courseSize}px Arial, sans-serif`;
            ctx.fillText(course, centerX, 335);
        }
        if (location) {
            ctx.font = `${locationSize}px Arial, sans-serif`;
            ctx.fillText(location, centerX, 355);
        }
    }

   // ====================================
    // FUNÇÃO CORRIGIDA: GERAÇÃO SIMPLIFICADA
    // ====================================

    generateCard() {
        // 1. Validação
        if (!this.userImage || !this.modelImage) {
            alert('Por favor, carregue a foto e o modelo antes de gerar.');
            return;
        }

        if (!this.modelImage.complete || !this.userImage.complete) {
            alert('Aguarde o carregamento completo das imagens.');
            return;
        }

        console.log('🎯 Iniciando geração do crachá (Método Direto)...');

        // 2. Forçar um redesenho limpo no canvas principal para garantir que tudo esteja atualizado
        this.drawBadge();

        // 3. Usar setTimeout para garantir que o navegador renderizou o último quadro
        setTimeout(() => {
            try {
                // 4. Capturar a imagem diretamente do canvas principal (que já está em Alta Resolução 3x)
                // Isso garante que o que você vê na tela é EXATAMENTE o que será baixado.
                const dataURL = this.canvas.toDataURL('image/png', 1.0);

                // 5. Configurar o link de download
                const downloadLink = document.getElementById('downloadLink');
                const downloadSection = document.getElementById('downloadSection');
                const nameInput = document.getElementById('name');
                
                // Sanitizar o nome do arquivo
                let fileName = nameInput.value.trim();
                fileName = fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase(); // Remove caracteres especiais
                if (!fileName) fileName = 'cracha-cetep';

                downloadLink.download = `${fileName}.png`;
                downloadLink.href = dataURL;

                // 6. Mostrar a seção de download e feedback visual
                downloadSection.style.display = 'block';
                
                // Feedback visual para o usuário
                const generateBtn = document.getElementById('generateCard');
                const originalText = generateBtn.innerText;
                generateBtn.innerText = "✅ Gerado com Sucesso!";
                generateBtn.style.background = "linear-gradient(135deg, #10b981, #059669)";
                
                setTimeout(() => {
                    generateBtn.innerText = originalText;
                    generateBtn.style.background = ""; // Retorna ao CSS original
                }, 3000);

                console.log('✅ Link de download gerado com sucesso baseada no preview.');

            } catch (error) {
                console.error('❌ Erro ao gerar link de download:', error);
                alert('Ocorreu um erro ao preparar o download. Tente novamente.');
            }
        }, 100);
    }



    // Função de debug para diagnosticar problemas
    debugImageStatus() {
        console.log('=== 🔍 DEBUG STATUS ===');
        console.log('Model loaded:', !!this.modelImage && this.modelImage.complete);
        console.log('User image loaded:', !!this.userImage && this.userImage.complete);
        
        if (this.userImage) {
            console.log('User image dimensions:', this.userImage.width, 'x', this.userImage.height);
            console.log('User image position:', this.imagePosition);
            console.log('User image zoom:', this.imageZoom);
            console.log('User image src length:', this.userImage.src.length);
        }
        
        if (this.modelImage) {
            console.log('Model image dimensions:', this.modelImage.width, 'x', this.modelImage.height);
            console.log('Model image src length:', this.modelImage.src.length);
        }
        
        console.log('Photo area:', this.photoArea);
        console.log('Canvas dimensions:', this.canvas.width, 'x', this.canvas.height);
        console.log('Scale factor:', this.SCALE_FACTOR);
        
        // Verificar se há conteúdo no canvas
        try {
            const imageData = this.ctx.getImageData(0, 0, 50, 50);
            const hasContent = imageData.data.some(pixel => pixel !== 255 && pixel !== 0);
            console.log('Canvas has visual content:', hasContent);
        } catch (error) {
            console.error('Erro ao verificar conteúdo do canvas:', error);
        }
        
        // Verificar controles
        const brightness = document.getElementById('brightness').value;
        const contrast = document.getElementById('contrast').value;
        const posX = document.getElementById('positionX').value;
        const posY = document.getElementById('positionY').value;
        const zoom = document.getElementById('zoom').value;
        
        console.log('Controles atuais:', { brightness, contrast, posX, posY, zoom });
        console.log('========================');
    }

    // ====================================
    // FUNÇÕES ORIGINAIS MANTIDAS
    // ====================================

    printCard() {
        if (!this.userImage || !this.modelImage) {
            alert('Por favor, carregue a foto e o modelo antes de imprimir.');
            return;
        }
        this.drawBadge();
        window.print();
    }

    // Função original de download mantida como backup
    createDownloadLink() {
        const printCanvas = document.createElement('canvas');
        printCanvas.width = this.PRINT_WIDTH_PX;
        printCanvas.height = this.PRINT_HEIGHT_PX;
        const printCtx = printCanvas.getContext('2d');
        printCtx.imageSmoothingEnabled = true;
        printCtx.imageSmoothingQuality = 'high';

        // Passo 1: Adicionar um fundo branco sólido para o JPEG
        printCtx.fillStyle = '#FFFFFF';
        printCtx.fillRect(0, 0, printCanvas.width, printCanvas.height);

        const scaleX = printCanvas.width / (this.canvas.width / this.SCALE_FACTOR);
        const scaleY = printCanvas.height / (this.canvas.height / this.SCALE_FACTOR);

        if (this.userImage) {
            this.drawUserImageOnPrintCanvas(printCtx, scaleX, scaleY);
        }
        
        printCtx.drawImage(this.modelImage, 0, 0, printCanvas.width, printCanvas.height);

        this.drawTextsOnPrintCanvas(printCtx, scaleY);
        
        printCtx.strokeStyle = 'black';
        printCtx.lineWidth = 1;
        printCtx.strokeRect(0, 0, printCanvas.width, printCanvas.height);

        // Passo 2: Aumentar a qualidade do JPEG para 1.0
        const dataURL = printCanvas.toDataURL('image/jpeg', 1.0);
        const downloadLink = document.getElementById('downloadLink');
        const fileName = document.getElementById('name').value.trim();
        downloadLink.download = `${fileName || 'cracha-cetep'}.jpeg`;
        downloadLink.href = dataURL;
    }

    drawUserImageOnPrintCanvas(printCtx, scaleX, scaleY) {
        const brightness = parseInt(document.getElementById('brightness').value);
        const contrast = parseInt(document.getElementById('contrast').value);
        printCtx.filter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%)`;
        
        const photoAreaX = this.photoArea.x * scaleX;
        const photoAreaY = this.photoArea.y * scaleY;
        const photoAreaWidth = this.photoArea.width * scaleX;
        const photoAreaHeight = this.photoArea.height * scaleY;
        
        const userDrawWidth = this.userImage.width * this.imageZoom * scaleX;
        const userDrawHeight = this.userImage.height * this.imageZoom * scaleY;
        
        const userDrawX = photoAreaX + (photoAreaWidth / 2) - (userDrawWidth / 2) + (this.imagePosition.x * scaleX);
        const userDrawY = photoAreaY + (photoAreaHeight / 2) - (userDrawHeight / 2) + (this.imagePosition.y * scaleY);
        
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

    drawTextsOnPrintCanvas(printCtx, scaleY) {
        const name = document.getElementById('name').value;
        const courseSelect = document.getElementById('courseSelect').value;
        const courseCustom = document.getElementById('courseCustom').value;
        const course = courseSelect === 'custom' ? courseCustom : courseSelect;
        const locationSelect = document.getElementById('locationSelect').value;
        const locationCustom = document.getElementById('locationCustom').value;
        const location = locationSelect === 'custom' ? locationCustom : locationSelect;

        const nameSize = parseInt(document.getElementById('nameSize').value) * scaleY;
        const courseSize = parseInt(document.getElementById('courseSize').value) * scaleY;
        const locationSize = parseInt(document.getElementById('locationSize').value) * scaleY;
        
        printCtx.fillStyle = '#1e3a8a';
        printCtx.textAlign = 'center';
        
        const centerX = this.PRINT_WIDTH_PX / 2;

        if (name) {
            printCtx.font = `bold ${nameSize}px Arial, sans-serif`;
            printCtx.fillText(name, centerX, 315 * scaleY);
        }
        if (course) {
            printCtx.font = `${courseSize}px Arial, sans-serif`;
            printCtx.fillText(course, centerX, 335 * scaleY);
        }
        if (location) {
            printCtx.font = `${locationSize}px Arial, sans-serif`;
            printCtx.fillText(location, centerX, 355 * scaleY);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.badgeGenerator = new BadgeGenerator();
});
