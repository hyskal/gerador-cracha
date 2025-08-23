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
