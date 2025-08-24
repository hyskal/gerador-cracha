# 🎫 Gerador de Crachás Profissional

Um gerador de crachás web moderno e responsivo, desenvolvido para criar crachás de identificação em alta qualidade, otimizado para impressão profissional.

![Badge Generator Preview](https://img.shields.io/badge/Status-Ativo-brightgreen) ![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## 🌟 Características Principais

### 📏 **Qualidade Profissional**
- **Canvas otimizado** para impressão em 300 DPI
- **Dimensões precisas**: 85mm x 54mm (padrão internacional de cartões)
- **Exportação em alta resolução** sem perda de qualidade
- **Anti-aliasing avançado** com `imageSmoothingQuality: 'high'`

### 🎨 **Interface Moderna**
- **Design responsivo** que se adapta a diferentes tamanhos de tela
- **Layout em 3 colunas**: Upload (esquerda), Preview (centro), Controles (direita)
- **Interface limpa e intuitiva** com botões de ação centralizados
- **Sistema de zoom** de 50% a 200% para melhor visualização

### 📋 **Modelos e Personalização**
- **4 modelos pré-definidos** prontos para uso
- **Carregamento automático** do Modelo 1 ao iniciar
- **Upload de modelos personalizados** (PNG com transparência)
- **Sistema de verificação** que alerta se a foto for carregada antes do modelo

### 🔧 **Controles Avançados**
- **Posicionamento preciso** com sliders X/Y
- **Ajustes de imagem**: brilho, contraste e zoom
- **Botões de zoom rápido** (+/-)
- **Campos de texto** para nome, função e localização
- **Preview em tempo real** de todas as alterações

### 💾 **Exportação e Impressão**
- **Download em PNG** de alta resolução
- **Impressão em PDF** otimizada para crachás
- **Janela de impressão dedicada** com CSS específico
- **Filtro de nitidez automático** para melhorar a qualidade

## 🚀 Como Usar

### 1. **Selecionar Modelo**
- Escolha um dos 4 modelos pré-definidos disponíveis
- Ou carregue seu próprio modelo PNG personalizado

### 2. **Adicionar Foto**
- Faça upload da foto do usuário
- Formatos suportados: JPG, PNG, WebP, GIF

### 3. **Ajustar Imagem**
- Use os controles deslizantes para posicionamento (X/Y)
- Ajuste brilho, contraste e nível de zoom
- Utilize os botões de zoom rápido quando necessário

### 4. **Preencher Informações**
- **Nome**: Nome completo do portador
- **Função**: Cargo ou função exercida
- **Local**: Departamento ou localização

### 5. **Finalizar**
- Clique em **"Gerar Crachá"** para processar
- Use **"Imprimir"** para impressão direta
- Ou **"Download"** para salvar em PNG

## 📁 Estrutura do Projeto

```
projeto-cracha/
│
├── index.html          # Estrutura HTML principal
├── style.css           # Estilos CSS responsivos
├── script.js           # Lógica JavaScript
└── README.md           # Documentação
```

## 🛠️ Especificações Técnicas

### **Dimensões de Saída**
- **Largura**: 85mm (1004 pixels em 300 DPI)
- **Altura**: 54mm (638 pixels em 300 DPI)
- **Resolução**: 300 DPI para impressão profissional
- **Fator de escala**: 3x para preview de alta qualidade

### **Formatos Suportados**

#### **Entrada:**
- **Modelos**: PNG com transparência (obrigatório)
- **Fotos**: JPG, PNG, WebP, GIF

#### **Saída:**
- **Download**: PNG de alta qualidade
- **Impressão**: PDF otimizado

### **Tecnologias Utilizadas**
- **HTML5 Canvas** para renderização
- **CSS3** com media queries para responsividade
- **JavaScript ES6+** para lógica de processamento
- **CSS Print** específico para impressão

## 🎯 Funcionalidades Técnicas

- **Processamento de imagem** com filtros de nitidez
- **Canvas escalado** para máxima qualidade de exportação
- **Redimensionamento inteligente** mantendo proporções originais
- **Sistema de cache** para otimização de performance
- **Validação de arquivos** e tratamento de erros
- **Responsividade completa** para desktop e mobile

## 🔧 Instalação e Uso

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/hyskal/gerador-cracha.git
   ```

2. **Acesse o diretório**:
   ```bash
   cd gerador-cracha
   ```

3. **Abra o projeto**:
   - Abra o arquivo `index.html` em qualquer navegador moderno
   - Ou utilize um servidor local para desenvolvimento

## 🌐 Compatibilidade

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari, Android Chrome)

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua funcionalidade (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**[@hyskal](https://github.com/hyskal)**

---

⭐ **Deixe uma estrela se este projeto foi útil para você!**