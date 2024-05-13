import axios from 'axios';

// Configuration d'axios
axios.defaults.baseURL = import.meta.env['VITE_API_URL']; // Base URL
axios.defaults.withCredentials = true; // Permet d'envoyer les credentials (comme les cookies) lors de chaque requête

class ExtendedError extends Error {
  statusCode?: number;
}

const handleAxiosError = (error: any) => {
  const err = new ExtendedError();
  err.statusCode = error.response ? error.response.status : 500;
  err.message = error.message;

  // Essayons de parser le message d'erreur
  try {
      const parsedMessage = error.response.data;
      if (parsedMessage.statusCode === 428) {
          err.statusCode = 428;
          err.message = parsedMessage.error;
      }
  } catch (e) {
      // Si le parsing échoue, on ne fait rien et on conserve le comportement par défaut
  }

  console.error("Error", error);
  throw err;
}

// Les fonctions pour effectuer les actions spécifiques sur le serveur
// Assurez-vous que ces endpoints correspondent à ceux définis dans votre API côté serveur

// async function setAdmin(channelId: string, pseudo: string) {
//   try {
//     const response = await axios.post(`/${channelId}/admin/${pseudo}`);
//     return response.data; // ou tout traitement spécifique de la réponse
//   } catch (error) {
//     handleAxiosError(error);
//   }
// }

// async function banUser(channelId: string, pseudo: string) {
//   try {
//     const response = await axios.post(`/${channelId}/ban/${pseudo}`);
//     return response.data;
//   } catch (error) {
//     handleAxiosError(error);
//   }
// }

// async function muteUser(channelId: string, pseudo: string) {
//   try {
//     const response = await axios.post(`/${channelId}/mute/${pseudo}`);
//     return response.data;
//   } catch (error) {
//     handleAxiosError(error);
//   }
// }

// async function removeUser(channelId: string, pseudo: string) {
//   try {
//     const response = await axios.post(`/${channelId}/remove/${pseudo}`);
//     return response.data;
//   } catch (error) {
//     handleAxiosError(error);
//   }
// }


export const blockUser = async (receiverPseudo: string) => {
  try {
    // Corps de la requête, vous n'avez besoin que du pseudo de l'utilisateur à bloquer
    const body = JSON.stringify({ receiverPseudo });

    // Envoyer une requête POST au point de terminaison 'block-user'
    // La configuration globale d'axios s'occupe de l'en-tête et de l'authentification
    const response = await axios.post('/block-user', body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data; // { message: 'Utilisateur bloqué avec succès' }
  } catch (error) {
    handleAxiosError(error); // Votre gestionnaire d'erreurs
  }
};
