import axios from 'axios';
import socket from '../../socket'

axios.defaults.baseURL = import.meta.env['VITE_API_URL']; // Base URL
axios.defaults.withCredentials = true; // Permet d'envoyer les credentials (comme les cookies) lors de chaque requête


class ExtendedError extends Error {
  statusCode?: number;
}

/**
* Vérifie et gère les erreurs de la réponse axios.
* @param {any} error - L'erreur retournée par axios.
* @returns {void} - Lance une erreur adaptée.
*/
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

export function getCookie(name: string) {
	const cookies = document.cookie.split(';');
	for (let i = 0; i < cookies.length; i++) {
	  const cookie = cookies[i].trim();
	  if (cookie.startsWith(name + '=')) {
		return cookie.substring(name.length + 1);
	  }
	}
	return null;
}

interface sendMessageProps {
  channelId: string;
  userId: string;
  message: string;
}

export const newBlocklist = async () => {

  try {
    const response = await axios.get('/friends/blocklist');
    return response.data;
  } catch (error) {
    return ;
  }
}
export const setAdmin = async (channelId: string, pseudo: string) => {

  try {
    const response = await axios.post(`/channel/${channelId}/admin/${pseudo}`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export const removeAdmin = async (channelId: string, pseudo: string) => {

  try {
    const response = await axios.patch(`/channel/${channelId}/remove-admin/${pseudo}`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export const isBlock = async (senderId: number) => {
  
  try {
    const response = await axios.get(`/friends/isBlock/${senderId}`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}
export const setMute = async (channelId: string, pseudo: string) => {

  try {
    const response = await axios.post(`/channel/${channelId}/mute/${pseudo}`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export const removeMute = async (channelId: string, pseudo: string) => {

  try {
    const response = await axios.patch(`/channel/${channelId}/remove-mute/${pseudo}`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export const kick = async (channelId: string, pseudo: string) => {

  try {
    const response = await axios.post(`/channel/${channelId}/kick/${pseudo}`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export const setBan = async (channelId: string, pseudo: string) => {

  try {
    const response = await axios.post(`/channel/${channelId}/ban/${pseudo}`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export const removeBan = async (channelId: string, pseudo: string) => {

  try {
    const response = await axios.patch(`/channel/${channelId}/remove-ban/${pseudo}`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export const leaveChannel = async (channelId: string) => {

  try {
    const response = await axios.post(`/channel/leave-channel2`, {channelId});
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export const blockUser = async (receiverId: string) => {
  try {

    const response = await axios.post(`friends/block-user/${receiverId}`);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

export const unblockUser = async (receiverId: string) => {
  try {

    const response = await axios.post(`friends/unblock-user/${receiverId}`);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

export const sendGameInvitation = (target: string, userId?: number) => {
  const user = JSON.parse(localStorage.getItem('player') as string);
  socket.emit('sendEvent', {target, type: 'game', content: `${user.pseudo} sent you a game invitation.`, userId});
}

export const sendEvent = (target: string, type: 'friend' | 'message' | 'game', content: string, userId?: number) => {

  socket.emit('sendEvent', {target, type, content, userId});
}

export const messageEvent = (target: string, content: string, data: any, userId?: number) => {

  const type = 'message';
  socket.emit('sendEventMessage', {target, type, content, data, userId});
}

export const mpEvent = (target: string, content: string, data: any, userId?: number) => {
  const type = 'mp';

  socket.emit('sendEvent', {target, type, content, data, userId});
}

export const sendEventRoom = (target: string, type: string, content: string, userId?: number) => {
  
  socket.emit('sendEventRoom', {target, type, content, userId});
}

export const sendEventRoomInclude = (target: string, type: string, content: string, userId?: number) => {
  
  socket.emit('sendEventRoomInclude', {target, type, content, userId});
}

export const getUser = async () => {

  const response =  await axios.get('/users/me');

  return response.data;
}

export const sendMessage = async (payload: sendMessageProps) => {

  try {
    const response = await axios.post('/channel/add-message-channel', payload);

    return response;
  } catch (error) {
    handleAxiosError(error);
  }
}

export const listMessages = async (channelId: string) => {

  try {
    const response = await axios.get(`/channel/list-message-channel/${channelId}`);
    return response.data.messages;
  } catch (error) {
    handleAxiosError(error);
  }
}

const sendFriendRequest = async (receiverPseudo : any) => {
    try {
        const response = await axios.post('/friends/friend-request', { receiverPseudo });
        return response.data;
    } catch (error) {
        handleAxiosError(error);
    }
}

const acceptFriendRequest = async (requesterId : any) => {
    try {
      const response = await axios.patch('/friends/friend-request/accept', { requesterId });
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }
  
  const declineFriendRequest = async (requesterId : any) => {
    try {
      const response = await axios.patch('/friends/friend-request/decline', { requesterId });
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  const deleteFriend = async (requesterId : number) => {
    try {
      const response = await axios.patch('/friends/delete', {requesterId});
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }
  
  const searchPseudo = async (pseudo : any) => {
    try {
      const response = await axios.get(`/friends/search-pseudo?pseudo=${pseudo}`);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }
  
  const getFriends = async () => {
    try {
      const response = await axios.get('/friends/friends');
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  export const getMyself = () => {
    const myself = JSON.parse(localStorage.getItem('player') as string);
    return myself;
  }
  
  const getUsersOnline = async () => {
    try {
      const response = await axios.get('/friends/users-online');
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }
  
  const getFriendsOnline = async () => {
    try {
      const response = await axios.get('/friends/friends-online');
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  export const fetcher = async (route: string) => {
    try {
      const response = await axios.get(route);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }

  }

  export const playerFromToken = async (token: string) => {
    try {
      const response = await axios.get(`/players/FromToken/${token}`);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  const getDataByPseudoApi = async (pseudo: string) => {
    try {
        const response = await axios.get(`/players/byPseudo/${pseudo}`, {
            headers: { 'Accept': 'application/json' }
        });
        return response.data;
    } catch (error) {
        handleAxiosError(error);
    }
  }

  const getFriendlist = async () => {
    try {
      const response = await axios.get('/friends/friendlist');
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }
  const getPendingFriends = async () => {
      try {
          const response = await axios.get('/friends/pending');
          return response.data;
      } catch (error) {
          handleAxiosError(error);
      }
  }
  
  const getAcceptedFriends = async () => {
      try {
          const response = await axios.get('/friends/accepted');
          return response.data;
      } catch (error) {
          handleAxiosError(error);
      }
  }

  const getBlockedUsers = async () => {
    try {
        const response = await axios.get('/friends/blocked');
        return response.data;
    } catch (error) {
        handleAxiosError(error);
    }
  }

  export async function createChannel(channelData: any, jwtToken: string | null, sessionToken: string | null) {

    const user = await getUser();

    const data = {
      name: channelData.name,
      username: user.username,
      password: channelData.password,
      type: channelData.type.toLowerCase(),
    };
    const ENDPOINT_URL: string = '/channel/created-channel';
    
    if (!channelData || !jwtToken)
        throw new Error("Missing required parameters.");

    const headers: any = {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
    };

    if (sessionToken)
        headers['Session-Token'] = sessionToken;

    try {
        const response: any = await axios.post(ENDPOINT_URL, data, { headers });
        return response.data;
    } catch (error) {
        handleAxiosError(error);
    }
}

interface CreateMpDto {
  name: string;

  username: string;

  type: 'public' | 'private' | 'protected';

  ownerId?: number;

  password?: string;

  conv?: number;

  oneId: string;

  twoId: string;
}

export const createMp = async (createChannelDto: CreateMpDto) => {

  try {

    const res = await axios.post('/channel/create-channel-mp', createChannelDto);
    return res.data;
  } catch (error: any) {
    handleAxiosError(error);
  }
}

  export const joinChannel = async () => {
    try {
      const response = await axios.get('/channel/add-member-channel');
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  export const getChannels = async () => {
    try {
      const response = await axios.get('/channels/allChannel');
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  export const getMissingChannels = async () => {
    try {
      const response = await axios.get('/channel/available-channels');
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  export const getMyChannels = async () => {
    try {
      const response = await axios.get('/channel/all_from_id');

      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  export const joinPublic = async (channelId: string) => {
    try {
      const response = await axios.patch(`/channel/join-channel/${channelId}`, {channelId});
      return response;
    } catch (error) {
      return false;
      handleAxiosError(error);
    }
  }

  export const joinProtected = async (channelId: string, password: string) => {
    try {
      const response = await axios.patch(`/channel/join-channel-protected/${channelId}`, {channelId, password});
      return response;
    } catch (error) {
      return false;
      handleAxiosError(error);
    }
  }
 
  // Fonction pour obtenir les joueurs depuis le contrôleur Friends
  export const inviteListChannel = async (channelId: string) => {
    try { 
      const response = await axios.get(`friends/channelInviteList/${channelId}`); 
      const players = response.data; 
      return players;
    } catch (error) {
      handleAxiosError(error);
    }
  };

  export const AvailableUsers = async () => {
    try {
      const response = await axios.get('friends/players-excluding-blocked-in-channel');
      const data = response.data;
      return data;
    } catch (error) {
      return ;
    }
  };

  export const newUserList = async () => {
    try {
      const response = await axios.get('friends/allWithStatus');
      const data = response.data;
      return data;
    } catch (error) {
      return ;
    }
  }

  export const AvailableChannels = async () => {
    try {
      const response = await axios.get('friends/channels-user-is-not-in');
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  export const inviteChannel = async (channelId: string, id: string) => {
    try {
      const response = await axios.post(`channel/${channelId}/accept-channel-invite/${id}`);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  export {
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    searchPseudo,
    getFriends,
    getUsersOnline,
    getFriendsOnline,
    getDataByPseudoApi,
    getAcceptedFriends,
    getPendingFriends,
    getBlockedUsers,
    getFriendlist,
    deleteFriend,
  };