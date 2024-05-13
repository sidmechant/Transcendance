import { useEffect, useRef, useState } from 'react';
import { motion } from "framer-motion"
import { BsFillChatLeftTextFill } from 'react-icons/bs';
import { AiOutlineClose, AiOutlineMenu, AiOutlineCheckCircle, AiOutlineCloseCircle } from 'react-icons/ai';
import { FaUserFriends } from 'react-icons/fa';
import { MdChatBubble, MdMarkChatUnread } from 'react-icons/md';
import { BsToggleOn, BsToggleOff } from 'react-icons/bs';
import './Chatbox.scss';
import { Box, Slider, SliderFilledTrack, SliderThumb, SliderTrack, useToast } from "@chakra-ui/react";
import { IconButton } from '@chakra-ui/react'
import NavbarChat from './Chat/NavbarChat';
import NavbarFriends from './Friends/NavbarFriends';
import NavbarNotif from './Notif/NavbarNotif';
import * as API from './FetchAPiChat';
import MainChat from './Chat/MainChat';
import MainFriends from './Friends/MainFriends';
import MainNotif from './Notif/MainNotif';
import { IEvent } from './interface';
import socket from '../../socket';
import { client } from '../Connection';
import { useChatBoxState } from '../ContextBoard';

interface ChatProps {
	selectedChat: any;
	setSelectedChat: React.Dispatch<any>;
	menu: number;
	setMenu: React.Dispatch<React.SetStateAction<number>>;
	refresh: boolean;
	setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
	openNav: number;
}

function ChatMain({ selectedChat, setSelectedChat, menu, setMenu, refresh, setRefresh, openNav }: ChatProps) {
	const [selectedFriend, setSelectedFriend] = useState<any>(null);
	const [navStyles, setNavStyles] = useState({
		NavOne: 'newNavOne',
		NavTwo: 'newNavTwo'
	});

	useEffect(() => {
		document.documentElement.style.setProperty('--grid-placement', openNav.toString());
	}, [openNav]);

	useEffect(() => {
		switch (menu) {
			case 1:
				setNavStyles({
					NavOne: 'newNavOne bg-black/10 text-white flex justify-center items-center',
					NavTwo: 'newNavTwo text-white flex justify-center items-center'
				});
				break;
			case 2:
				setNavStyles({
					NavOne: 'newNavOne text-white flex justify-center items-center',
					NavTwo: 'newNavTwo bg-black/10 text-white flex justify-center items-center'
				});
				break;
			case 3:
				setNavStyles({
					NavOne: 'newNavOne border-b-2 text-white flex justify-center items-center',
					NavTwo: 'newNavTwo border-b-2 text-white flex justify-center items-center'
				});
				break;
			default:
				break;
		}

	}, [menu]);

	return (
		<>
			<div className="bg-black/70 newNav shadow-md">
				<div className='newNavMenu'>
					<button id='1' onClick={() => setMenu(1)} className={navStyles.NavOne}>
						<BsFillChatLeftTextFill />
					</button>
					<button id='2' onClick={() => setMenu(2)} className={navStyles.NavTwo}>
						<FaUserFriends />
					</button>
				</div>
				{openNav ? (menu === 1
					? <NavbarChat selectedChat={selectedChat} setSelectedChat={setSelectedChat} className={`${openNav === 2 ? 'flex' : 'hidden'}`} refresh={refresh} />
					: (menu === 2 ? <NavbarFriends selectedFriend={selectedFriend} setSelectedFriend={setSelectedFriend} className={`${openNav === 2 ? 'flex' : 'hidden'}`} refresh={refresh} />
						: <NavbarNotif />
					)) : <></>}
			</div>
			{menu === 1
				? <MainChat selectedChat={selectedChat} setSelectedChat={setSelectedChat} refresh={refresh} setRefresh={setRefresh} />
				: (menu === 2 ? <MainFriends selectedFriend={selectedFriend} setSelectedFriend={setSelectedFriend} refresh={refresh} setRefresh={setRefresh} />
					: <MainNotif />
				)}
		</>
	)
}


export default function ChatBox({ ready }: { ready: boolean }) {

	const { isChatBoxOpen, setChatBoxOpen } = useChatBoxState();
	const [notification, setNotification] = useState<boolean>(true);
	const [chatRatio, setChatRatio] = useState<number>(15);
	const [selectedChat, setSelectedChat] = useState<any>(-1);
	const [menu, setMenu] = useState<number>(1);
	const [myUser, setMyUser] = useState<any>(null);
	const [ blocklist, setBlocklist ] = useState<number[] | null>(null);
	const [refresh, setRefresh] = useState<boolean>(false);
	const [openNav, setOpenNav] = useState<number>(2);
	const chatboxRef = useRef<HTMLDivElement | null>(null);


	const chatSize = (17 + chatRatio) < 32 ? 32 : 16 + chatRatio;

	const chatBoxOpener = `${isChatBoxOpen ? 'hidden' : ''} ${notification ? 'text-indigo-700' : 'text-black'} hover:border-white hover:text-white bg-white/70 hover:bg-white/0 
	flex justify-center z-10 items-center shadow-xl fixed left-5 bottom-5 z-5 border border-2 border-slate-500 w-16 h-10`;

	const toast = useToast();

	useEffect(() => {
		
		const getBlocklist = async () => {
			return await API.newBlocklist();
		};

		getBlocklist().then((result) => setBlocklist(result));

	}, [refresh]);

	useEffect(() => {
		const handleEvent = (payload: IEvent) => {
			setRefresh(!refresh);

			if (payload.userId)
				if (blocklist?.includes(payload.userId))
					return ;

			if (notification) {


				if (payload.type === 'friend') {
					toast({
						position: 'bottom-right',
						duration: 3000,
						render: () => (
							<Box className='text-white shadow-2xl bg-black/70 border border-white rounded-xl' p={7}>
								{payload.content}
							</Box>
						)
					});
				} else if (payload.type === 'game') {
					toast({
						position: 'bottom-right',
						duration: null,
						isClosable: true,
						render: ({ onClose }) => {

							const handleAcceptGame = () => {
								window.location.href = `/game?pseudo=${payload.target}&room=${payload.room?.toString()}`;
							}

							const handleRefuseGame = () => {
								client?.emit('joinFriendlyMatch', { room: payload.room, isAccepted: false });
								onClose();
							}

							return <Box className='text-white shadow-2xl bg-black/70 border flex justify-evenly items-center border-white rounded-xl' p={7}>
								<p className='mr-5'>{payload.content}</p>
								<IconButton onClick={handleAcceptGame} isRound={true} fontSize='30px' variant='ghost' colorScheme='teal' aria-label='Check' icon={<AiOutlineCheckCircle />} />
								<IconButton onClick={handleRefuseGame} isRound={true} fontSize='30px' variant='ghost' colorScheme='red' aria-label='Close' icon={<AiOutlineCloseCircle />} />
							</Box>;
						}
					});
				} else if (payload.type === 'info') {
					toast({
						position: 'bottom-right',
						duration: 3000,
						render: () => (
							<Box className='text-white shadow-2xl bg-black/70 border border-white rounded-xl' p={7}>
								{payload.content}
							</Box>
						)
					});
				} else if (payload.type === 'mp') {
					setSelectedChat(payload.data);
					setMenu(1);
				} else if (payload.type === 'message' && (!selectedChat || selectedChat.channelId !== payload.data.channelId)) {

					if (!toast.isActive(payload.content)) {
					toast({
						id: payload.content,
						position: 'bottom-right',
						duration: 5000,
						render: ({ onClose }) => {

							const handleMessage = () => {

								if (selectedChat)
									socket.emit('leaveChannel', selectedChat.channelId);
								socket.emit('joinChannel', payload.data.channelId);
								setSelectedChat(payload.data);
								setMenu(1);
								setChatBoxOpen(true);
								onClose();
							}
							return (
							<Box onClick={handleMessage} className='text-white shadow-2xl bg-black/70 border border-white rounded-xl' p={7}>
								{payload.content}
							</Box>
							)
						}
					})
				}
				} else if (payload.type === 'kick') {
					socket.emit('leaveChannel', payload.data);
				}
			}
		};

		socket.on('newEvent', handleEvent);

		return () => {
			socket.off('newEvent', handleEvent);
		}

	}, [notification, refresh, selectedChat, blocklist]);

	const ToggleChat = () => {
		setChatBoxOpen(!isChatBoxOpen);
		setChatRatio(1);
	}

	const handleClickOutside = (event: MouseEvent) => {

		const target = event.target as Element;

		const hasChakra = Array.from(target.classList).some(className => className.includes('chakra'));

		if (chatboxRef.current && !chatboxRef.current.contains(event.target as Node) && !hasChakra) {
			ToggleChat();
		  }
	};

	useEffect(() => {

		const player = API.getMyself();
		setMyUser(player);

	}, [ready]);

	useEffect(() => {
		if (isChatBoxOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isChatBoxOpen]);

	if (!myUser)
		return <></>

	const constraints = {
		left: 0,
		right: window.innerWidth - 460,
		top: -(window.innerHeight - 510),
		bottom: 0
	};

	const changeDisposition = () => {

		if (openNav === 1)
			setOpenNav(2);
		else
			setOpenNav(1);
	};

	return (
		<div className='z-10'>
			{!isChatBoxOpen && (
				<button
					onClick={() => { setNotification(!notification) }}
					className={`${notification ? 'text-indigo-700' : 'text-black'} hover:border-white hover:text-white bg-white/70 hover:bg-white/0 
				flex justify-center items-center shadow-xl fixed left-40 bottom-5 z-5 border-2 border-slate-500 w-16 h-10`}>
					{notification ? <BsToggleOn /> : <BsToggleOff />}
				</button>
			)}
			<motion.button layout
				whileHover={{ scale: 1.2 }}
				transition={{ duration: 0.3 }}
				className={chatBoxOpener} onClick={() => ToggleChat()}>
				{notification ? <MdMarkChatUnread /> : <MdChatBubble />}
			</motion.button>
			{isChatBoxOpen && (
				<motion.div
					drag
					dragMomentum={false}
					dragConstraints={constraints}
					whileDrag={{ scale: 1.1, boxShadow: "-63px 42px 28px -7px rgba(0,0,0,0.1)" }}
					style={{
						width: chatSize + "rem",
						height: chatSize + "rem",
						position: "fixed",
						left: "0%",
						bottom: "0%",
					}}
					initial={{ opacity: 0, scale: 0.5 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.5 }}
					ref={chatboxRef}
					className="backdrop-blur-sm  drop-shadow-xl newChatBox h-[26rem] w-[26rem] z-10"
				>
					<div className="bg-black/70 drop-shadow-md newMenu flex flex-row-reverse items-center justify-between">
						<motion.button
							whileHover={{ rotate: 90 }}
							className="mr-1 text-white hover:text-red-500"
							onClick={() => setChatBoxOpen(false)}>
							<AiOutlineClose />
						</motion.button>
						<div className="mx-10 w-[100%] flex justify-center items-center">
							<Slider
								value={chatRatio}
								min={17}
								max={65}
								aria-label="slider-chat"
								colorScheme="gray"
								onChange={(val) => setChatRatio(val)}
							>
								<SliderTrack>
									<SliderFilledTrack />
								</SliderTrack>
								<SliderThumb />
							</Slider>
						</div>
						<button onClick={() => changeDisposition()} className='ml-2 flex justify-center items-center'>
							{openNav === 2
								? <div className='text-white'><AiOutlineMenu /></div>
								: <div className='text-white/50'>
									<AiOutlineMenu />
								</div>
							}
						</button>
					</div>
					<ChatMain selectedChat={selectedChat} setSelectedChat={setSelectedChat}
						menu={menu} setMenu={setMenu} refresh={refresh} setRefresh={setRefresh} openNav={openNav} />
				</motion.div>
			)}
		</div>
	);
}
