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

// Fonctions de service pour le contrôleur MessageController

export const createMessage = async (createMessageDto : any) => {
  try {
    const response = await axios.post('/message/create', createMessageDto);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export const findAllMessagesChannel = async (getMessageDto : any) => {
  try {
    const response = await axios.get('/message/allMessagesChannel', { data: getMessageDto });
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export const findAllMessages = async () => {
  try {
    const response = await axios.get('/message/myMessages');
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export const findOneMessage = async (getMessageDto : any) => {
  try {
    const response = await axios.get('/message/myMessage', { data: getMessageDto });
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export const updateMessage = async (updateMessageDto : any) => {
  try {
    const response = await axios.patch('/message/updateMessage', updateMessageDto);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export const removeMessage = async (updateMessageDto: any ) => {
  try {
    const response = await axios.delete('/message/delete', { data: updateMessageDto });
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}
