const fileInput = document.getElementById('fileInput');
const textInput = document.getElementById('textInput');
const applyButton = document.getElementById('applyButton');
const fileList = document.getElementById('fileList');
const saveLocationButton = document.getElementById('saveLocationButton');

let selectedFiles = [];

fileInput.addEventListener('change', () => {
  selectedFiles = selectedFiles.concat(Array.from(fileInput.files));
  updateFileList();
  fileInput.value = null; // Réinitialise l'input de sélection de fichiers
});

function hideTextInImage(imageData, text) {
  let textIndex = 0;

  for (let i = 0; i < imageData.data.length; i += 4) {
    if (textIndex < text.length) {
      const charCode = text.charCodeAt(textIndex);
      imageData.data[i] = (imageData.data[i] & 0xFE) | ((charCode >> 7) & 0x01);
      imageData.data[i + 1] = (imageData.data[i + 1] & 0xFE) | ((charCode >> 6) & 0x01);
      imageData.data[i + 2] = (imageData.data[i + 2] & 0xFE) | ((charCode >> 5) & 0x01);
      imageData.data[i + 3] = (imageData.data[i + 3] & 0xFE) | ((charCode >> 4) & 0x01);
      textIndex++;
    } else {
      break;
    }
  }
}

applyButton.addEventListener('click', async () => {
  const chosenText = textInput.value;

  if (chosenText && selectedFiles.length > 0) {
    selectedFiles.forEach(async file => {
      const reader = new FileReader();
      reader.onload = async function(event) {
        const img = new Image();
        img.onload = async function() {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

          hideTextInImage(imageData, chosenText);

          const hiddenCanvas = document.createElement('canvas');
          hiddenCanvas.width = img.width;
          hiddenCanvas.height = img.height;
          const hiddenContext = hiddenCanvas.getContext('2d');
          hiddenContext.putImageData(imageData, 0, 0);

          // Téléchargement de l'image éditée
          const editedBlob = await hiddenCanvas.convertToBlob();
          const editedUrl = URL.createObjectURL(editedBlob);
          const link = document.createElement('a');
          link.href = editedUrl;
          link.download = file.name.replace(/\.[^/.]+$/, '') + '_edited.png';
          link.click();
          URL.revokeObjectURL(editedUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });

    selectedFiles = [];
    updateFileList();
  }
});
  
  saveLocationButton.addEventListener('click', async () => {
    try {
      const handle = await window.showSaveFilePicker();
      console.log('Emplacement de sauvegarde sélectionné :', handle);
    } catch (err) {
      console.error('Erreur lors de la sélection de l\'emplacement de sauvegarde :', err);
    }
  });
  
  function updateFileList() {
    fileList.innerHTML = '';
    selectedFiles.forEach((file, index) => {
      const li = document.createElement('li');
      li.textContent = `${file.name} (${formatBytes(file.size)})`;
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Supprimer';
      deleteButton.addEventListener('click', () => {
        selectedFiles.splice(index, 1);
        updateFileList();
      });
      li.appendChild(deleteButton);
      fileList.appendChild(li);
    });
  }
  
  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }