class BadgeGenerator {
    constructor() {
        this.initializeProperties();
        this.setupCanvas();
        this.loadInternalData(); 
        this.bindEvents();
        this.loadDefaultModel();
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
        this.SCALE_FACTOR = 3;
        this.pica = window.pica();
    }

    setupCanvas() {
        this.canvas.width = 300 * this.SCALE_FACTOR;
        this.canvas.height = 400 * this.SCALE_FACTOR;
        this.ctx.scale(this.SCALE_FACTOR, this.SCALE_FACTOR);
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    loadInternalData() {
        this.data = {
            courses: [
                "Técnico em Análises Clínicas",
                "Técnico em Nutrição e Dietética",
                "Técnico em Serviços Jurídicos",
                "Técnico em Informática",
                "Técnico em Agroecologia",
                "Técnico em Administração",
                "Técnico em Enfermagem"
            ],
            locations: [
                "Hospital Regional Dantas Bião",
                "VITALIA LAB",
                "ESTÁGIO INTERNO",
                "HOSPITAL MUNICIPAL",
                "CLÍNICA ESCOLA"
            ],
            modelLinks: {
                "Modelo Padrão": "https://i.ibb.co/PZQLwy4t/cgara-transpp.png"
            }
        };
        
        this.setupDropdowns();
        this.updateSliderValues();
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
        window.addEventListener('mousemove', (e) => this.handleDrag(e)); 
        window.addEventListener('mouseup', () => this.endDrag());

        document.getElementById('generateCard').addEventListener('click', () => this.generateCard());
        document.getElementById('printCard').addEventListener('click', () => this.printCard());
    }

    setupDropdowns() {
        const courseSelect = document.getElementById('courseSelect');
        const locationSelect = document.getElementById('locationSelect');
        
        courseSelect.innerHTML = '<option value="">Selecione...</option>';
        locationSelect.innerHTML = '<option value="">Selecione...</option>';
        
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
        
        [courseSelect, locationSelect].forEach(select => {
            const option = document.createElement('option');
            option.value = 'custom';
            option.textContent = 'Outro (Digitar...)';
            select.appendChild(option);
        });
    }

    toggleCustomInput(type) {
        const select = document.getElementById(`${type}Select`);
        const customInput = document.getElementById(`${type}Custom`);
        
        if (select.value === 'custom') {
            customInput.style.display = 'block';
            customInput.focus();
        } else {
            customInput.style.display = 'none';
        }
        this.drawBadge();
    }

    updateControl(event, valueId, suffix = '') {
        const value = event.target.value;
        const display = document.getElementById(valueId);
        if(display) display.textContent = value + suffix;
        this.drawBadge();
    }

    updatePosition(event, axis) {
        this.imagePosition[axis] = parseInt(event.target.value);
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
        const newValue = Math.max(20, Math.min(200, currentValue + delta));
        
        zoomSlider.value = newValue;
        this.imageZoom = newValue / 100;
        document.getElementById('zoomValue').textContent = newValue + '%';
        this.drawBadge();
    }

    updateSliderValues() {
        document.getElementById('nameSizeValue').textContent = document.getElementById('nameSize').value + 'px';
        document.getElementById('courseSizeValue').textContent = document.getElementById('courseSize').value + 'px';
        document.getElementById('locationSizeValue').textContent = document.getElementById('locationSize').value + 'px';
    }

    async loadDefaultModel() {
        const defaultModelUrl = this.data.modelLinks['Modelo Padrão'];
        if (defaultModelUrl) {
            await this.loadModelFromUrl(defaultModelUrl);
        }
    }

    loadModelFromUrl(url) {
        return new Promise((resolve, reject) => {
            this.modelImage = new Image();
            this.modelImage.crossOrigin = 'anonymous';
            this.modelImage.onload = () => {
                this.drawBadge();
                resolve();
            };
            this.modelImage.onerror = reject;
            this.modelImage.src = url;
        });
    }

    handleModelUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            this.modelImage = new Image();
            this.modelImage.onload = () => this.drawBadge();
            this.modelImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            this.userImage = new Image();
            this.userImage.onload = () => {
                this.resetImageControls();
                this.drawBadge();
            };
            this.userImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    resetImageControls() {
        this.imagePosition = { x: 0, y: 0 };
        this.imageZoom = 1;
        document.getElementById('positionX').value = 0;
        document.getElementById('positionY').value = 0;
        document.getElementById('zoom').value = 100;
        document.getElementById('zoomValue').textContent = '100%';
    }

    startDrag(event) {
        if (!this.userImage) return;
        this.isDragging = true;
        this.dragStart = {
            x: event.clientX,
            y: event.clientY
        };
        this.canvas.style.cursor = 'grabbing';
    }

    handleDrag(event) {
        if (!this.isDragging) return;
        
        const deltaX = event.clientX - this.dragStart.x;
        const deltaY = event.clientY - this.dragStart.y;
        
        this.imagePosition.x += deltaX * (this.SCALE_FACTOR / 2);
        this.imagePosition.y += deltaY * (this.SCALE_FACTOR / 2);
        
        this.dragStart = { x: event.clientX, y: event.clientY };
        
        document.getElementById('positionX').value = Math.max(-100, Math.min(100, this.imagePosition.x));
        document.getElementById('positionY').value = Math.max(-100, Math.min(100, this.imagePosition.y));
        
        this.drawBadge();
    }

    endDrag() {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }

    drawBadge() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.modelImage || !this.modelImage.complete) return;

        if (this.userImage) {
            this.drawUserImageBehind(this.ctx, this.SCALE_FACTOR);
        }
        
        this.drawModel(this.ctx, this.SCALE_FACTOR);
        this.drawTexts(this.ctx, this.SCALE_FACTOR);
    }

    drawModel(ctx, scale) {
        const canvasWidth = this.canvas.width / scale;
        const canvasHeight = this.canvas.height / scale;
        ctx.drawImage(this.modelImage, 0, 0, Math.ceil(canvasWidth), Math.ceil(canvasHeight));
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
        
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(photoAreaX, photoAreaY, photoAreaWidth, photoAreaHeight);

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

    generateCard() {
        if (!this.userImage || !this.modelImage) {
            alert('Carregue as imagens primeiro!');
            return;
        }

        this.drawBadge();

        setTimeout(() => {
            try {
                const dataURL = this.canvas.toDataURL('image/png', 1.0);
                
                // MUDANÇA AQUI: Pegamos o botão de download direto e mudamos o display
                const downloadLink = document.getElementById('downloadLink');
                
                let fileName = document.getElementById('name').value.trim();
                fileName = fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'cracha';

                downloadLink.download = `${fileName}.png`;
                downloadLink.href = dataURL;
                
                // Torna visível como "inline-block" ou flex item
                downloadLink.style.display = 'inline-block'; 

                const btn = document.getElementById('generateCard');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-check me-2"></i>';
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-success');
                
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.classList.remove('btn-success');
                    btn.classList.add('btn-primary');
                }, 2000);

            } catch (error) {
                console.error('Erro:', error);
            }
        }, 100);
    }

    printCard() {
        this.drawBadge();
        window.print();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.badgeGenerator = new BadgeGenerator();
});
