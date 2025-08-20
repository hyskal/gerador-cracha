
# Gerador de Crachá CETEP 

## Estrutura dos Arquivos

```

projeto-cracha/
│
├── index.html      \# Estrutura HTML principal
├── style.css       \# Estilos CSS
├── script.js       \# Lógica JavaScript
└── README.md       \# Este arquivo

```

## Principais Melhorias Implementadas

### 🎯 **Qualidade de Impressão (85x54mm)**
- Canvas otimizado para impressão em **300 DPI**
- Dimensões precisas: **85mm x 54mm** (padrão internacional)
- Exportação em alta resolução sem perda de qualidade
- Janela de impressão dedicada com CSS específico para impressão

### 🖼️ **Processamento de Imagem**
- Filtro de **nitidez automático** para melhorar a qualidade
- Redimensionamento inteligente mantendo proporções
- Controles precisos de **brilho**, **contraste** e **posicionamento**
- Sistema de zoom de 50% a 200%

### 📐 **Layout Otimizado**
- **3 colunas**: Upload (esquerda), Preview (centro), Controles (direita)
- Design responsivo que se adapta a diferentes telas
- Interface limpa e intuitiva
- Botões de ação centralizados

### ⚙️ **Funcionalidades Técnicas**

#### Canvas de Alta Qualidade:
- Fator de escala 3x para preview
- `imageSmoothingQuality: 'high'`
- Anti-aliasing avançado

#### Sistema de Modelos:
- **Modelos pré-definidos**: Opção para selecionar entre 4 modelos
- **Carregamento padrão**: O "Modelo 1" é carregado automaticamente ao iniciar
- **Upload personalizado**: Continua a possibilidade de carregar seu próprio modelo
- **Verificação de ordem**: Um alerta avisa se a foto do usuário for carregada antes do modelo

#### Sistema de Exportação:
- **Download**: PNG em alta resolução
- **Impressão**: PDF otimizado para crachás
- Preservação da qualidade em ambos os formatos

#### Controles Avançados:
- Posicionamento X/Y com sliders precisos
- Botões de zoom (+/-) para ajuste rápido
- Campos de texto para informações do crachá
- Preview em tempo real de todas as alterações

## Como Usar

1. **Selecione o modelo**: Escolha um dos modelos pré-definidos na lista ou use o botão para carregar um modelo PNG personalizado.
2. **Adicione a foto**: Carregue a foto do usuário. Um alerta aparecerá se o modelo não tiver sido carregado antes.
3. **Ajuste a imagem**: Use os controles para posicionar e ajustar brilho, contraste e zoom.
4. **Adicione informações**: Preencha nome, função e local.
5. **Gere o crachá**: Clique em "Gerar Crachá" para finalizar.
6. **Imprima ou baixe**: Use os botões de impressão ou download.

## Especificações Técnicas

### Dimensões de Impressão:
- **Largura**: 85mm (1004 pixels em 300 DPI)
- **Altura**: 54mm (638 pixels em 300 DPI)
- **Resolução**: 300 DPI para impressão profissional

### Formatos Suportados:
- **Modelo**: PNG com transparência (obrigatório)
- **Foto**: JPG, PNG, WebP, GIF
- **Exportação**: PNG de alta qualidade

### Otimizações:
- Processamento de imagem com filtros de nitidez
- Canvas escalado para máxima qualidade
- CSS de impressão específico para crachás
- Responsividade para diferentes dispositivos

O sistema agora oferece qualidade profissional para impressão de crachás no formato padrão internacional, com interface moderna e controles precisos.
```
