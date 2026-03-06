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
const imageInput = document.getElementById('post-image');
const imagePreview = document.getElementById('image-preview');
const previewImg = imagePreview.querySelector('img');

// Desactivar botón inicialmente hasta que el SDK esté listo
btnLogin.disabled = true;
statusText.innerText = 'Cargando SDK de Facebook...';

let isFbInitialized = false;

let pageToken = undefined;
let pageId = undefined;


// Inicialización del SDK
window.fbAsyncInit = function () {
    console.log('Inicializando Facebook SDK...');
    FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: false, // Desactivado para evitar intentos de renderizado en frames
        version: 'v25.0'
    });
    console.log('Facebook SDK inicializado');

    isFbInitialized = true;
    btnLogin.disabled = false;
    statusText.innerText = 'SDK listo. Por favor, inicia sesión.';

    // Verificar estado de conexión inicial
    FB.getLoginStatus(function (response) {
        statusChangeCallback(response);
    });

    obtenerTokenDePagina();
};

function storeInformationIntoStorage(info) {
    window.sessionStorage.setItem('myapp.session-info', JSON.stringify(info));
}

function statusChangeCallback(response) {
    if (response.status === 'connected') {
        console.log('Conectado como usuario de Facebook')
        // Usuario ya logueado
        statusText.innerText = 'Conectado como usuario de Facebook';
        loginSection.classList.add('hidden');
        publishSection.classList.remove('hidden');

        storeInformationIntoStorage(response.authResponse);
    } else {
        // Usuario no logueado
        console.log('No conectado');
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
    }, { scope: 'public_profile,email,pages_manage_posts,pages_read_engagement,pages_show_list' }); // Permisos necesarios
    // }, { scope: 'public_profile,email,pages_manage_posts,publish_video' }); // Permisos necesarios
});


function obtenerTokenDePagina() {
    FB.api('/me/accounts', function (response) {
        if (response && !response.error) {
            // Buscamos la página específica por su nombre o ID
            // const miPagina = response.data.find(page => page.name === "3556235801227788");
            pageToken = response.data[0].access_token;
            pageId = response.data[0].id;
            // console.log('PAGINA ' + JSON.stringify(response.data));

            // if (miPagina) {
            //     const pageToken = miPagina.access_token;
            //     const pageId = miPagina.id;
            //     console.log('Token de Página obtenido:', pageToken);

            //     // 3. Ahora sí, publicamos usando EL TOKEN DE LA PÁGINA
            //     // publicarEnPagina(pageId, pageToken);
            // } else {
            //     console.warn('No se encontró la página buscada entre las administradas.');
            // }
        }
    });
}

// Evento: Previsualización de imagen
imageInput.addEventListener('change', (e) => {
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
btnPublish.addEventListener('click', async () => {
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;

    if (!content) {
        alert('Por favor, escribe algo para compartir.');
        return;
    }

    const fullMessage = `${title}\n\n${content}`;

    // IMPORTANTE: Facebook no puede "leer" localhost para generar una vista previa.
    // Para probar, usaremos una URL pública si estamos en localhost.
    const shareUrl = window.location.hostname === 'adomargon.abrdns.com' || window.location.hostname === '188.76.228.209'
        ? 'adomargon.abrdns.com' // Cambia esto por tu sitio web real cuando esté en línea
        : window.location.href;

    console.log('Intentando compartir URL:', shareUrl);

    try {
        const sessionInfo = JSON.parse(window.sessionStorage.getItem('myapp.session-info'));
        const userAccessToken = sessionInfo.accessToken;

        let postData = {
            message: title ? `${title}\n\n${content}` : content,
            access_token: pageToken,
        };

        // Handle image upload
        if (imageInput.files.length > 0) {
            const imageFile = imageInput.files[0];

            // Convert image to base64
            const base64Image = await fileToBase64(imageFile);
            postData.picture = base64Image;
            postData.link = 'https://adomargon.abrdns.com';
        }

        // Publish to Facebook
        const response = await publishToFacebook(pageId, postData);

        if (response.id) {
            // showSuccess(`Post published successfully!<br>Post ID: ${response.id}`);
            postForm.reset();
            imagePreview.classList.remove('active');
            imagePreview.innerHTML = '';
        } else {
            showError('Failed to publish post. Please check your Page ID and try again.');
        }
    } catch (error) {
        console.log(`Error: ${error.message}`);
        console.error('Publishing error:', error);
    } finally {
        // showLoading(false);
    }

    async function publishToFacebook(pageId, postData) {
        console.log('PAGEID --> ', pageId);
        console.log('POSTDATA --> ', postData);

        return new Promise((resolve, reject) => {
            FB.api(
                `/${pageId}/feed`,
                'POST',
                postData,
                function (response) {
                    if (!response || response.error) {
                        reject(new Error(response?.error?.message || 'Facebook API error'));
                    } else {
                        resolve(response);
                    }
                }
            );
        });
    }

    // FB.ui({
    //     method: 'share',
    //     display: 'popup',
    //     href: shareUrl,
    //     quote: fullMessage,
    // }, function (response) {
    //     // Log detallado en la consola del navegador
    //     console.log('Respuesta completa de Facebook:', response);

    //     if (response && !response.error_message) {
    //         publishStatus.innerText = '¡Compartido con éxito!';
    //         publishStatus.className = 'success-message';
    //         // Limpiar formulario
    //         document.getElementById('post-title').value = '';
    //         document.getElementById('post-content').value = '';
    //         // fileInput.value = '';
    //         imagePreview.classList.add('hidden');
    //     } else {
    //         const errorMsg = response?.error_message || 'El usuario canceló o el App ID no está configurado para este dominio.';
    //         console.error('Error detallado:', errorMsg);
    //         publishStatus.innerText = 'Error: ' + errorMsg;
    //         publishStatus.className = 'error-message';
    //     }
    // });
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
        // fileInput.value = '';
        imagePreview.classList.add('hidden');
    }
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}