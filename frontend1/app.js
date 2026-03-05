// CONFIGURACIÓN DE LA APP DE FACEBOOK
// NOTA: Asegúrate de que este sea el App ID (numérico) y NO un Token de acceso.
const FACEBOOK_APP_ID = '1256644736404295'; // Reemplaza con tu App ID real si este es incorrecto

// Elementos del DOM
const btnLogin = document.getElementById('btn-login');
const btnPublish = document.getElementById('btn-publish');
const loginSection = document.getElementById('login-section');
const publishSection = document.getElementById('publish-section');
const statusText = document.getElementById('status');
const publishStatus = document.getElementById('publish-status');
const fileInput = document.getElementById('post-image');
const imagePreview = document.getElementById('image-preview');
const previewImg = imagePreview.querySelector('img');

// Desactivar botón inicialmente hasta que el SDK esté listo
btnLogin.disabled = true;
statusText.innerText = 'Cargando SDK de Facebook...';

let isFbInitialized = false;

// Inicialización del SDK
window.fbAsyncInit = function () {
    console.log('Inicializando Facebook SDK...');
    FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: false, // Desactivado para evitar intentos de renderizado en frames
        version: 'v18.0',
        status: true,
    });

    isFbInitialized = true;
    btnLogin.disabled = false;
    statusText.innerText = 'SDK listo. Por favor, inicia sesión.';

    // Verificar estado de conexión inicial
    FB.getLoginStatus(function (response) {
        statusChangeCallback(response);
    });
};

function statusChangeCallback(response) {
    if (response.status === 'connected') {
        // Usuario ya logueado
        statusText.innerText = 'Conectado como usuario de Facebook';
        loginSection.classList.add('hidden');
        publishSection.classList.remove('hidden');
    } else {
        // Usuario no logueado
        statusText.innerText = 'No conectado';
        loginSection.classList.remove('hidden');
        publishSection.classList.add('hidden');
    }
}

// Evento: Botón de Login
btnLogin.addEventListener('click', () => {
    if (!isFbInitialized) {
        alert('El SDK de Facebook aún no se ha cargado. Por favor, espera un momento.');
        return;
    }

    FB.login(function (response) {
        statusChangeCallback(response);
    }, { scope: 'public_profile,email,pages_manage_posts,ages_manage_metadata' }); // Permisos necesarios
// }, { scope: 'public_profile,email,pages_manage_posts,publish_video' }); // Permisos necesarios
});

// Evento: Previsualización de imagen
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            previewImg.src = event.target.result;
            imagePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

// Evento: Botón de Publicar
btnPublish.addEventListener('click', () => {
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;

    if (!content) {
        alert('Por favor, escribe algo para compartir.');
        return;
    }

    const fullMessage = `${title}\n\n${content}`;

    // IMPORTANTE: Facebook no puede "leer" localhost para generar una vista previa.
    // Para probar, usaremos una URL pública si estamos en localhost.
    const shareUrl = window.location.hostname === 'adolfo-martin.github.io' || window.location.hostname === '188.76.228.209' 
        ? 'adomargon.abrdns.com' // Cambia esto por tu sitio web real cuando esté en línea
        : window.location.href;

    console.log('Intentando compartir URL:', shareUrl);

    FB.ui({
        method: 'share',
        display: 'popup',
        href: shareUrl,
        quote: fullMessage,
    }, function (response) {
        // Log detallado en la consola del navegador
        console.log('Respuesta completa de Facebook:', response);

        if (response && !response.error_message) {
            publishStatus.innerText = '¡Compartido con éxito!';
            publishStatus.className = 'success-message';
            // Limpiar formulario
            document.getElementById('post-title').value = '';
            document.getElementById('post-content').value = '';
            fileInput.value = '';
            imagePreview.classList.add('hidden');
        } else {
            const errorMsg = response?.error_message || 'El usuario canceló o el App ID no está configurado para este dominio.';
            console.error('Error detallado:', errorMsg);
            publishStatus.innerText = 'Error: ' + errorMsg;
            publishStatus.className = 'error-message';
        }
    });
});

// Nota: Las funciones publishTextOnly y publishWithPhoto ya no son necesarias 
// para perfiles personales y han sido reemplazadas por la lógica anterior.

function handleResponse(response) {
    if (!response || response.error) {
        console.error(response.error);
        publishStatus.innerText = 'Error: ' + (response.error ? response.error.message : 'No se pudo publicar');
        publishStatus.classList.add('error-message');
    } else {
        publishStatus.innerText = '¡Publicado con éxito! ID: ' + response.id;
        publishStatus.classList.add('success-message');
        // Limpiar formulario
        document.getElementById('post-title').value = '';
        document.getElementById('post-content').value = '';
        fileInput.value = '';
        imagePreview.classList.add('hidden');
    }
}
