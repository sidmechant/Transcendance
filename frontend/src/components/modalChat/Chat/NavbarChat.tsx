import { useState, useEffect } from 'react';
import * as API from '../FetchAPiChat';
import '../Chatbox.scss';
import { BiSolidCrown } from 'react-icons/bi';
import socket from '../../../socket';
import { Tooltip } from '@chakra-ui/react'

interface ConversationProps {

	onClick: () => void;
	id?: string;
	message: string;
	icon?: React.ReactNode;
	buttonClass?: string;
}

interface ChatProps {
	
	selectedChat: any;
	setSelectedChat: React.Dispatch<any>;
	className?: string;
	refresh: boolean;
}

interface Channel {
    id: string;
    name: string;
    type: string;
    password: string;
    createdAt: Date;
    ownerId: number;
}

function OptionConversation({onClick, message}: ConversationProps) {

	return (
		<button
		onClick={onClick}
		className='hover:bg-black/10 h-10 min-h-[3rem] w-[90%] bg-black/30 border border-1 mt-4 flex items-center justify-center text-white'>
				{message}
		</button>
	)
}

function ButtonConversation({onClick, message, id, icon, buttonClass}: ConversationProps) {

	if (icon) {
		return (
			<button
			id={id}
			key={id}
			onClick={onClick}
			className={buttonClass}>
				<div className='mx-3'>{icon}</div>
				<Tooltip label={message} aria-label='A Tooltip'>
					<p className='truncate'>{message}</p>
				</Tooltip>
			</button>
		)
	}
	return (
		<button
		id={id}
		key={id}
		onClick={onClick}
		className={buttonClass}>
			<div className='mx-5'>{icon}</div>
			<Tooltip label={message} aria-label='A Tooltip'>
				<p className='truncate'>{message}</p>
			</Tooltip>
		</button>
	)
}

export default function NavbarChat({selectedChat, setSelectedChat, className, refresh}: ChatProps) {

	const [ myChannels, setMyChannels ] = useState<Channel[] | null>(null);
	const [ reload, setReload ] = useState<boolean>(false);
	const myUser = API.getMyself();

	useEffect(() => {

		const getMyChannels = async () => {
			const fetchedMyChannels : any = await API.getMyChannels(); //tmp value need real userId

			return fetchedMyChannels;
		}

		getMyChannels().then((result) => {
			setMyChannels(result);
		});

	}, [reload, refresh]);

	useEffect(() => {

		if (myChannels && selectedChat) {

			const matchingChannel = myChannels.find((channel: any) => channel.channelId === selectedChat.channelId);

    		if (matchingChannel) {
     			setSelectedChat(matchingChannel);
    		} else if (selectedChat !== -1) {
				setSelectedChat(-2);
			} else {
				setSelectedChat(-1);
			}
		}	else if (myChannels) {
			setSelectedChat(myChannels[0]);
		}
	}, [myChannels, selectedChat]);


	useEffect(() => {

		const handleNewChannel = (channel: Channel) => {

			if (channel.type === 'Private') {
				if (channel.ownerId === myUser.userId) {
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

	return (
		<div className={`newNavMain bg-black/10 ${className} flex-col items-center overflow-auto`}>
			<OptionConversation
			message='Create'
			onClick={() => {
				setSelectedChat(-1);
			}}/>
			<OptionConversation
			message='Find'
			onClick={() => {
				setSelectedChat(-2);
			}}/>
			{myChannels && myChannels.map((channel: any, index: number) => {

				const pv = channel.ownerId === 0 ? 'bg-sky-500/20 hover:bg-sky-500/10' : 'bg-white/20 hover:bg-white/10';
				const buttonClass = channel.channelId === selectedChat.channelId
				? 'hover:bg-indigo-500/10 h-10 min-h-[4rem] w-[90%] bg-indigo-500/20 border border-1 mt-4 flex items-center justify-start text-white'
				: `h-10 min-h-[4rem] w-[90%]  border border-1 mt-4 flex items-center justify-start text-white ${pv}`;

				let name = channel.channelName;

				if (channel.ownerId === 0)
					name = name.split(';').filter((name: string) => name !== myUser.pseudo);
				return (
					<ButtonConversation
					id={`${index}`}
					key={index}
					message={name}
					icon={channel.ownerId === myUser.id ? <BiSolidCrown /> : undefined}
					onClick={() => {
						socket.emit('leaveChannel', selectedChat.channelId);
						socket.emit('joinChannel', channel.channelId);
						setSelectedChat(channel);
					}}
					buttonClass={buttonClass}
					/>
				)
			})}
		</div>
	)
}