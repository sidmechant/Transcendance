import '../Chatbox.scss';
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from 'react';
import { AiOutlineSend } from 'react-icons/ai';
import { BsShieldLock, BsPlusLg, BsMicMuteFill } from 'react-icons/bs';
import { FaUserTie, FaUserAltSlash, FaUserMinus, FaGamepad } from 'react-icons/fa';
import { BiMessageDetail } from 'react-icons/bi';
import { GrStatusGoodSmall } from 'react-icons/gr';
import {
	FormControl,
	FormLabel,
	Select,
	Input,
	Accordion,
	AccordionItem,
	AccordionButton,
	AccordionPanel,
	AccordionIcon,
	Box,
	Button
} from '@chakra-ui/react'
import {
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalFooter,
	ModalBody,
	ModalCloseButton,
	useDisclosure,
} from '@chakra-ui/react'
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card"
import * as API from '../FetchAPiChat';
import socket from '../../../socket';

interface ChatProps {

	selectedChat: any;
	setSelectedChat: React.Dispatch<any>;
	refresh: boolean;
	setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}

interface Channel {
	id: string;
	name: string;
	type: string;
	password: string;
	createdAt: Date;
	ownerId: number;
}

import styled from 'styled-components';
import { fetchIsConnected } from '../../../data/Client';

const HoverContainer = styled.div`
  position: relative;

  .hover-text {
    visibility: hidden;
    position: absolute;
    z-index: 1;
    bottom: 100%;
    left: 50%;
    transform: translate(-50%, 0);
    background-color: #333;
    color: #fff;
    padding: 5px;
    border-radius: 3px;
    white-space: nowrap;
  }

  &:hover .hover-text {
    visibility: visible;
  }
`;


interface userProps {
	user: any
}

function getCookie(name: string) {
	const cookies = document.cookie.split(';');
	for (let i = 0; i < cookies.length; i++) {
		const cookie = cookies[i].trim();
		if (cookie.startsWith(name + '=')) {
			return cookie.substring(name.length + 1);
		}
	}
	return null;
}

function FindConversation({ user }: userProps) {

	const [allConv, setAllConv] = useState<Channel[] | null>(null);
	const [modal, setModal] = useState<any>(null);
	const [password, setPassword] = useState<string>('');
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [error, setError] = useState<boolean>(false);
	const [reload, setReload] = useState<boolean>(false);

	useEffect(() => {

		const handleNewChannel = (channel: Channel) => {

			if (channel.type === 'Private') {
				if (channel.ownerId === user.userId) {
					setReload(!reload);
				}
			} else {
				setReload(!reload);
			}
		};

		socket.on('newChannel', handleNewChannel);

		return () => {
			socket.off('newChannel', handleNewChannel);
		}
	}, []);

	useEffect(() => {

		const getConv = async () => {
			const fetchedConv = await API.getMissingChannels(); //need to replace 1 with userId

			return fetchedConv;
		}

		getConv().then((result: Channel[]) => {
			setAllConv(result);
		});

	}, [reload]);

	const submitPublic = async () => {

		const response = await API.joinPublic(modal.id);

		// console.log("Response = ", response);
		if (response !== undefined && response !== false && response.data === true) {
			API.sendEvent(`${user.userId}`, 'friend', `Joining channel: ${modal.name}.`);
			API.sendEventRoom(`${modal.id}`, 'friend', `${user.pseudo} just joined your channel`, user.userId);
			onClose();
		} else {
			API.sendEvent(`${user.userId}`, 'friend', "You are banned from this channel");
		}
	};

	const submitProtected = async () => {

		const response = await API.joinProtected(modal.id, password);
		if (response === false) {
			API.sendEvent(`${user.userId}`, 'friend', "You are banned from this channel");
		}
		else if (!response || response.data === false) {
			setError(true);
			setPassword('');
		} else {
			setError(false);
			API.sendEvent(`${user.userId}`, 'friend', `Joining channel: ${modal.name}.`);
			API.sendEventRoom(`${modal.id}`, 'friend', `${user.pseudo} just joined your channel`, user.userId);
			onClose();
		}
	};

	const handleChange = (event: any) => {

		setPassword(event.target.value);
	};

	return (
		<>
			<div className="bg-slate-500/30 newMain flex justify-center items-start text-black">
				<Accordion allowToggle className='w-full h-full flex flex-col overflow-auto'>
					<AccordionItem key='public' className='bg-white/70'>
						<h2>
							<AccordionButton>
								<Box as='span' flex='1' textAlign='left'>
									Public channels
								</Box>
								<AccordionIcon />
							</AccordionButton>
						</h2>
						{allConv && allConv.filter((conv: Channel) => conv.type === 'public').map((conv: Channel) => (
							<AccordionPanel className='bg-indigo-700/20 hover:bg-indigo-700/30' id={`${conv.id}`} key={conv.id} pb={4} onClick={() => { setModal(conv); onOpen() }}>
								{conv.name}
							</AccordionPanel>

						))}
					</AccordionItem>

					<AccordionItem key='protected' className='bg-white/70'>
						<h2>
							<AccordionButton>
								<Box as='span' flex='1' textAlign='left'>
									<div className='flex justify-start items-center'>
										<div className='mr-5'>Protected channels</div>
										<BsShieldLock />
									</div>
								</Box>
								<AccordionIcon />
							</AccordionButton>
						</h2>
						{allConv && allConv.filter((conv: Channel) => conv.type === 'protected').map((conv: Channel) => (
							<AccordionPanel className='bg-indigo-700/20 hover:bg-indigo-700/30' id={`${conv.id}`} key={conv.id} pb={4} onClick={() => { setModal(conv); onOpen() }}>
								{conv.name}
							</AccordionPanel>

						))}
					</AccordionItem>
				</Accordion>
			</div>
			{modal && (
				<Modal isOpen={isOpen} onClose={onClose}>
					<ModalOverlay />
					<ModalContent>
						<ModalHeader>{modal.name}</ModalHeader>
						<ModalCloseButton />
						<ModalBody>
							{modal.type === 'protected'
								? (<Input
									id='password'
									bg={'white'}
									placeholder="********"
									name="password"
									type='password'
									value={password}
									errorBorderColor='pink.300'
									isInvalid={error}
									onChange={handleChange}
								/>)
								: ''
							}
						</ModalBody>

						<ModalFooter>
							<Button colorScheme='pink' mr={3} onClick={onClose}>
								Close
							</Button>
							<Button colorScheme='gray' onClick={() => {
								if (modal.type === 'protected')
									submitProtected();
								else
									submitPublic();
							}}>Join Channel</Button>
						</ModalFooter>
					</ModalContent>
				</Modal>
			)}
		</>
	)
}

function CreateConversation({ user }: userProps) {
	const [formData, setFormData] = useState({
		type: 'Public',
		name: '',
		password: '',
		invalid: false,
	});

	const handleSubmit = async (event: any) => {
		event.preventDefault();

		if (formData.name.length < 3) {
			setFormData({
				...formData,
				invalid: true,
			})
			return;
		}
		const jwtToken = getCookie('jwt_token');
		const sessionToken = getCookie('token');
		const test = await API.createChannel(formData, jwtToken, sessionToken);
		if (test.isSuccess) {
			API.sendEvent(`${user.id}`, 'friend', `${formData.name} created.`);
		}
	};

	const handleChange = (event: any) => {
		const { name, value } = event.target;

		if (name === 'name')
			setFormData({
				...formData,
				invalid: false,
			})
		if (name === 'type' && value !== 'Protected') {
			setFormData({
				...formData,
				[name]: value,
				password: '',
			});
		} else {
			setFormData({
				...formData,
				[name]: value,
			});
		}
	};

	const isPasswordInputDisabled = formData.type !== 'Protected';

	return (
		<div className="bg-slate-500/30 newMain flex justify-center items-center text-black">
			<div className="w-5/6 flex flex-col">
				<form onSubmit={handleSubmit}>
					<FormControl>
						<div className="mb-5">
							<FormLabel>Channel Type</FormLabel>
							<Select
								id='select'
								bg={'white'}
								name="type"
								value={formData.type}
								onChange={handleChange}
							>
								<option value="Public">Public</option>
								<option value="Protected">Protected</option>
								<option value="Private">Private</option>
							</Select>
						</div>
						<div className="mb-5">
							<FormLabel>Channel name</FormLabel>
							<Input
								id='name'
								bg={'white'}
								placeholder={formData.invalid ? "Name min size required is 3" : "Name"}
								name="name"
								isInvalid={formData.invalid}
								errorBorderColor={'red.300'}
								value={formData.name}
								onChange={handleChange}
							/>
						</div>
						<div>
							<FormLabel>Password</FormLabel>
							<Input
								id='password'
								bg={'white'}
								placeholder="********"
								name="password"
								type='password'
								value={formData.password}
								disabled={isPasswordInputDisabled}
								onChange={handleChange}
							/>
						</div>
						<div className='flex justify-center'>
							<Input
								type="submit"
								value="Submit"
								bg={'#c53066'}
								className="w-1/2 rounded-md text-white border border-1 my-5 mt-12"
							/>
						</div>
					</FormControl>
				</form>
			</div>
		</div>
	);
}

interface UserRights {
	admin?: boolean;
	muted?: boolean;
	banned?: boolean;
}

interface ChannelOptions {
	[userId: string]: UserRights;
}

interface RightsProps {

	options: ChannelOptions | null;
	channel: any;
	user: any;
	player: any;
	status: string;
	setChannel: React.Dispatch<any>;
}

function Rights({ options, channel, user, player, status, setChannel }: RightsProps) {

	const targetIsOwner: boolean = channel.ownerId === player.id;
	const targetIsAdmin: boolean = (options ? (options[player.id] ? (options[player.id].admin ? true : false) : false) : false);
	const imAdmin: boolean = (options ? (options[user.userId] ? (options[user.userId].admin ? true : false) : false) : false);
	const AdminColor: string = targetIsAdmin ? 'text-emerald-400' : 'text-white';

	if (channel.ownerId === 0) {

		return (
			<HoverCard key={player.id}>
				<HoverCardTrigger>
					<img className="my-5 rounded-full"
						src={player.urlPhotoProfile} alt={player.pseudo}>
					</img>
				</HoverCardTrigger>
				<HoverCardContent className='bg-black/70 text-white'>
					<div key={`${player.id}-container`} className='flex h-7 justify-evenly items-center'>
						{(player.id !== user.userId) && <motion.button className='text-white' key={`${player.id}-game`} onClick={async () => {
							fetchIsConnected(player.pseudo, (isConnected) => {
								(isConnected) && (window.location.href = `/game?pseudo=${player.pseudo}`);
							});
						}}><FaGamepad /></motion.button>}
						<div key={`${player.id}-status`} className={`${status === 'ONLINE' ? 'text-emerald-400' : status === 'OFFLINE' ? 'text-pink-700' : 'text-blue-500'}`}><GrStatusGoodSmall /></div>
					</div >
					<div key={`${player.id}-container2`} className='flex h-7 justify-evenly items-center'>
						<div key={`${player.id}-name`}>{player.pseudo}</div>
					</div>
				</HoverCardContent >
			</HoverCard >

		)
	}
	else if (user && user.userId === player.id) {

		return (

			<HoverCard key={player.id}>
				<HoverCardTrigger>
					<img className="my-5 rounded-full"
						src={player.urlPhotoProfile} alt={player.pseudo}>
					</img>
				</HoverCardTrigger>
				<HoverCardContent className='bg-black/70 text-white'>
					<div key={`${player.id}-container`} className='flex h-7 justify-evenly items-center'>

						<motion.button key={`${player.id}-motion`} onClick={async () => {
							API.sendEvent(`${user.userId}`, 'friend', `You just left the channel: ${channel.channelName}`);
							API.sendEventRoom(`${channel.channelId}`, 'friend', `${user.pseudo} just left your channel`, user.userId);
							socket.emit('leaveChannel', channel.channelId);
							await API.leaveChannel(channel.channelId);
							setChannel(-1);
						}} whileHover={{ scale: 1.25 }}><FaUserMinus /></motion.button>

						<div key={`${player.id}-status`} className={`${status === 'ONLINE' ? 'text-emerald-400' : status === 'OFFLINE' ? 'text-pink-700' : 'text-blue-500'}`}><GrStatusGoodSmall /></div>
					</div>
					<div key={`${player.id}-container2`} className='flex h-7 justify-evenly items-center'>
						<div key={`${player.id}-name`}>{player.pseudo}</div>
					</div>
				</HoverCardContent>
			</HoverCard >
		)

	} else if ((user && user.userId === channel.ownerId) || (imAdmin && !targetIsOwner && !targetIsAdmin)) {

		const isMute: boolean = (options ? (options[player.id] ? (options[player.id].muted ? true : false) : false) : false);
		const muteColor: string = isMute ? 'text-pink-700' : 'text-white';
		return (

			<HoverCard key={player.id}>
				<HoverCardTrigger>
					<img className="my-5 rounded-full"
						src={player.urlPhotoProfile} alt={player.pseudo}>
					</img>
				</HoverCardTrigger>
				<HoverCardContent className='bg-black/70 text-white'>
					<div key={`${player.id}-container`} className='flex h-7 justify-evenly items-center'>
						{!imAdmin && (
							<HoverContainer>
								<motion.button className={AdminColor} key={0} onClick={async () => {

									if (!targetIsAdmin) {
										await API.setAdmin(channel.channelId, player.pseudo);
										API.sendEventRoomInclude(channel.channelId, 'friend', `${player.pseudo} is now an admininistrator of this channel.`);
									} else {
										await API.removeAdmin(channel.channelId, player.pseudo);
										API.sendEventRoomInclude(channel.channelId, 'friend', `${player.pseudo} is no longer an admininistrator of this channel.`);

									}


								}} whileHover={{ scale: 1.25 }}><FaUserTie /></motion.button>
								<div className="hover-text">set or unset Admin rights</div>
							</HoverContainer>
						)}
						<motion.button className='text-white' key={`${player.id}-game`} onClick={async () => {
							fetchIsConnected(player.pseudo, (isConnected) => {
								(isConnected) && (window.location.href = `/game?pseudo=${player.pseudo}`);
							});
						}}><FaGamepad /></motion.button>
						<HoverContainer>
							<motion.button key={`${player.id}-1`} onClick={async () => {
								await API.setBan(channel.channelId, player.pseudo);
								API.sendEventRoomInclude(channel.channelId, 'friend', `${player.pseudo} is now banned from this channel.`);
							}} whileHover={{ scale: 1.25 }}><FaUserAltSlash /></motion.button>
							<div className="hover-text">ban user from this channel</div>
						</HoverContainer>

						<HoverContainer>
							<motion.button key={`${player.id}-2`} onClick={async () => {
								await API.kick(channel.channelId, player.pseudo);
								API.sendEventRoomInclude(channel.channelId, 'friend', `${player.pseudo} have been kicked out from this channel.`);
							}} whileHover={{ scale: 1.25 }}><FaUserMinus /></motion.button>
							<div className="hover-text">kick user from this channel</div>
						</HoverContainer>
						<HoverContainer>

							<motion.button className={muteColor} key={`${player.id}-3`} onClick={async () => {
								if (!isMute) {
									await API.setMute(channel.channelId, player.pseudo);
								} else {
									await API.removeMute(channel.channelId, player.pseudo);
								}
							}} whileHover={{ scale: 1.25 }}><BsMicMuteFill /></motion.button>
							<div className="hover-text">mute this user for 1 minute</div>
						</HoverContainer>
						<div key={`${player.id}-status`} className={`${status === 'ONLINE' ? 'text-emerald-400' : status === 'OFFLINE' ? 'text-pink-700' : 'text-blue-500'}`}><GrStatusGoodSmall /></div>
					</div>
					<div key={`${player.id}-container2`} className='flex h-7 justify-evenly items-center'>
						<div key={`${player.id}-name`}>{player.pseudo}</div>
					</div>
				</HoverCardContent>
			</HoverCard >
		)

	} else {

		return (

			<HoverCard key={player.id}>
				<HoverCardTrigger>
					<img className="my-5 rounded-full"
						src={player.urlPhotoProfile} alt={player.pseudo}>
					</img>
				</HoverCardTrigger>
				<HoverCardContent className='bg-black/70 text-white'>
					<div key={`${player.id}-container`} className='flex h-7 justify-evenly items-center'>
						<div key={`${player.id}-status`} className={`${status === 'ONLINE' ? 'text-emerald-400' : status === 'OFFLINE' ? 'text-pink-700' : 'text-blue-500'}`}><GrStatusGoodSmall /></div>
					</div>
					<div key={`${player.id}-container2`} className='flex h-7 justify-evenly items-center'>
						<div key={`${player.id}-name`}>{player.pseudo}</div>
					</div>
					<motion.button className='text-white' key={`${player.id}-game`} onClick={async () => {
						fetchIsConnected(player.pseudo, (isConnected) => {
							(isConnected) && (window.location.href = `/game?pseudo=${player.pseudo}`);
						});
					}}><FaGamepad /></motion.button>
				</HoverCardContent>
			</HoverCard>
		)
	}


}

export default function MainChat({ selectedChat, setSelectedChat, refresh }: ChatProps) {

	const [value, setValue] = useState<string>('');
	const [inputFocus, setInputFocus] = useState<boolean>(false);
	const user = API.getMyself();
	const [messages, setMessages] = useState<any[]>([]);
	const [sortedMessages, setSortedMessages] = useState<any[]>([]);
	const [channel, setChannel] = useState<any>(null);
	const [, forceRender] = useState<number>(0);
	const chatRef = useRef<HTMLDivElement>(null);
	const [toggleMessage, setToggleMessage] = useState<boolean>(true);
	const [channelStatus, setChannelStatus] = useState<ChannelOptions | null>(null);
	const [invite, setInvite] = useState<any>(null);


	const self = 'columns-1 text-lg my-5 px-5 bg-slate-700/20 text-white min-h-24 mx-3 mr-12 border border-1 border-black rounded-xl inline-flex flex-col';

	const other = 'text-lg my-5 px-5 ml-12 bg-indigo-700/40 text-white min-h-24 inline-flex flex-col mx-3 border border-1 border-black rounded-xl';

	const handleValue = (event: any) => setValue(event.target.value);
	//socket.emit("joinChannel", "30");

	useEffect(() => {
		const elem = document.getElementById('chatmain');
		if (elem) {
		  setTimeout(() => {
			elem.scrollTop = elem.scrollHeight;
		  }, 0);
		}
	  }, [messages]);
	useEffect(() => {


		const handleUpdateChannel = (payload: any) => {
			setChannelStatus(payload);
		};

		socket.on('updateChannel', handleUpdateChannel);

		return () => {
			socket.off('updateChannel', handleUpdateChannel);
		}
	}, []);


	useEffect(() => {

		socket.emit('getConnection');
	}, []);

	useEffect(() => {

		const getInvite = async () => {

			const res = await API.inviteListChannel(selectedChat.channelId);

			return res;
		};
		if (selectedChat) {
			getInvite().then((response: any) => setInvite(response));
		}
	}, [selectedChat, refresh]);

	useEffect(() => {

		const handleConnection = () => {
			forceRender(prev => prev + 1);
		}

		socket.on('updateConnection', handleConnection);

		return () => {
			socket.off('updateConnection', handleConnection);
		}

	}, []);

	useEffect(() => {

		const retrieveMessages = async () => {
			if (selectedChat && selectedChat !== -1 && selectedChat !== -2) {
				const res = await API.listMessages(selectedChat.channelId);
				if (res)
					return res;
			}
		}
		retrieveMessages().then((response: any) => setMessages(response || []));

	}, [selectedChat]);

	useEffect(() => {

		if (selectedChat && selectedChat !== -1 && selectedChat !== -2) {
			socket.emit('joinChannel', selectedChat.channelId);
			setChannel(selectedChat.channelId);
		}

		return () => {
			if (channel) {
				socket.emit('leaveChannel', channel);
			}
			setChannel(null);
		}

	}, []);

	useEffect(() => {

		const handleNewMessage = (payload: any) => {

			if (payload.channelId === channel) {
				setMessages((prevMessages: any) => [...prevMessages, payload.message]);
				if (chatRef.current) {
					chatRef.current.scrollTop = chatRef.current.scrollHeight;
				}
			}
		}
		socket.on('newMessage', handleNewMessage);

		return () => {
			socket.off('newMessage', handleNewMessage);
		}

	}, [channel, messages]);

	useEffect(() => {
		if (Array.isArray(messages)) {
		  const sorted = [...messages].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
		  setSortedMessages(sorted);
		}
	  }, [messages]);
	  

	 const [canSendMessage, setCanSendMessage] = useState(true);

  const submitMessage = async () => {
    if (canSendMessage) {
      setCanSendMessage(false);

      await API.sendMessage({ channelId: selectedChat.channelId, userId: `${user.userId}`, message: value });
      API.messageEvent(selectedChat.channelId, `New message from ${user.pseudo}`, selectedChat, user.userId);

      // Réinitialiser le champ de texte
      setValue('');

      // Réactiver l'envoi de messages après un court délai
      setTimeout(() => {
        setCanSendMessage(true);
      }, 500); // 500 ms de délai
    }
  };

	const handleEnterInput = (event: any) => {

		if (event.key === 'Enter' && inputFocus) {
			submitMessage();
		}
	};

	if (selectedChat === -1) {
		return <CreateConversation user={user} />;
	} else if (selectedChat === -2) {
		return <FindConversation user={user} />;
	}

	const getPlayerFromMessage = (userId: number) => {
		const player = selectedChat.players.find((player: any) => player.userId === userId);
		return player;
	}

	return (
		<>
			<div id='chatmain' ref={chatRef} className='grid newChat overflow-auto'>
				{sortedMessages &&
					sortedMessages.map((message: any, index: number) => {

						const player = getPlayerFromMessage(message.userId);


						if (player && !player.block) {
							return (
								<div key={message.id} className={`flex ${message.userId === user.userId ? '' : 'flex-row-reverse'}`}>
									<div className={message.userId == user.userId ? self : other} key={index}>
										<div className='my-5 flex'>
											<div className='h-12 w-12 min-h-12 min-w-12 rounded-full'>
												<img className='object-fill rounded-full' src={player.urlPhotoProfile} alt="Profile" />
											</div>
											<strong className='flex mx-5 text-start'>{player.pseudo}</strong>
										</div>
										<div className='w-auto my-5 mx-5'>
											<div className='break-words'>{message.content}</div>
										</div>
									</div>
								</div>
							)
						}
					})}
			</div>
			{toggleMessage && (
				<div className="newMessage bg-slate-500/10 flex justify-center items-center">
					<Input
						className='mx-5'
						value={value}
						onChange={handleValue}
						textColor='white'
						placeholder={channelStatus ? (channelStatus[user.userId] ? (channelStatus[user.userId].muted ? 'You are currently muted...' : 'Send a message...') : 'Send a message...') : 'Send a message...'}
						focusBorderColor='teal.400'
						onFocus={() => setInputFocus(true)}
						onBlur={() => setInputFocus(false)}
						onKeyDown={(event) => handleEnterInput(event)}
						isDisabled={channelStatus ? (channelStatus[user.userId] ? channelStatus[user.userId].muted : false) : false}
						size='sm'
					/>
					<motion.button
						whileHover={{ rotate: -90 }}
						onClick={() => {
							if (channelStatus && channelStatus[user.userId] && channelStatus[user.userId].muted)
								return;
							submitMessage();
						}}
						className={`mr-5 h-7 w-10 rounded-full border border-1 ${channelStatus ? (channelStatus[user.userId] ? (channelStatus[user.userId].muted ? 'text-pink-700 border-pink-700' : 'text-white border-white') : 'text-white border-white') : 'text-white border-white'} flex justify-center items-center`}>
						<AiOutlineSend />
					</motion.button>
				</div>
			)}
			{!toggleMessage && (
				<div className="newMessage bg-slate-500/10 flex justify-start items-center overflow-x-auto overflow-y-hidden">
					{invite && invite.map((player: any) => (
						<Box key={`${player.id}-box`} p={2} className='cursor-pointer hover:scale-105 text-white flex h-full flex-col justify-center items-center'>
							<img onClick={async () => {
								await API.inviteChannel(selectedChat.channelId, `${player.id}`);
								API.sendEvent(`${player.id}`, 'friend', `You have been invited to the channel: ${selectedChat.channelName}`);
								API.sendEventRoomInclude(selectedChat.channelId, 'friend', `${player.pseudo} joined your channel`);
							}} className='h-full rounded-full' src={player.urlPhotoProfile} alt={player.pseudo} />
							<p>{player.pseudo}</p>
						</Box>
					))}
				</div>
			)}
			<div className='newUsers overflow-y-auto'>
				{selectedChat && selectedChat.players.map((player: any) => (
					<Rights key={`${player.id}-rights`} options={channelStatus} channel={selectedChat} user={user} player={player} status={player.status} setChannel={setSelectedChat} />
				))}
			</div>
			{selectedChat && selectedChat !== -1 && selectedChat !== -2 && user.userId === selectedChat.ownerId && (
				<div className='newAddUser flex justify-center items-center'>
					<motion.button
						onClick={() => setToggleMessage(!toggleMessage)}
						className='rounded-full bg-black/50 h-7 w-7 border border-white hover:bg-indigo-500/50 text-white flex justify-center items-center'>
						{(toggleMessage ? <BsPlusLg size={'1.5em'} /> : <BiMessageDetail size={'1em'} />)}
					</motion.button>
				</div>
			)}
		</>
	);
}