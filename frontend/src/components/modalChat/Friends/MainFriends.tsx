import '../Chatbox.scss';
import { motion, AnimatePresence } from "framer-motion"
import React, { useState, useEffect, } from 'react';
import { IoMdPersonAdd } from 'react-icons/io';
import { BiSolidMessageSquareDetail } from 'react-icons/bi';
import { FaUserAltSlash } from 'react-icons/fa';
import { GameRecord, fetchMatches } from '../../Profil/FetchApi';
import * as API from '../FetchAPiChat';
import { Tabs, TabList, TabPanels, Tab, TabPanel, Box } from '@chakra-ui/react'
import ProfilCard from './ProfileCard';
import { useToast } from '@chakra-ui/react'
import './Card.scss';
import socket from '../../../socket';
import { fetchIsConnected } from '../../../data/Client';

interface friendProps {
	selectedFriend: any;
	setSelectedFriend: React.Dispatch<any>;
	refresh: boolean;
	setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}

const flipTransition = {
	type: "",
	ease: "linear",
	bounce: 0.25,
	duration: 0.1
};

interface FriendsOptProps {
	selectedFriend: any;
	setSelectedFriend: React.Dispatch<any>;
	refresh: boolean;
	setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}

function AcceptedFriend({ selectedFriend, setSelectedFriend, refresh, setRefresh }: FriendsOptProps) {
	const player = selectedFriend.player;
	const myUser = API.getMyself();
	const [matches, setMatches] = useState<GameRecord[] | undefined>([]);

	useEffect(() => {
		const fetchData = async () => {
			const res = await fetchMatches(player.id);
			console.log("fetchmatches res: ", res);
			return res;
		};
		fetchData().then((result) => setMatches(result));
	}, []);

	const removeFriend = async () => {
		await API.deleteFriend(player.id);
		setSelectedFriend(null);
		setRefresh(!refresh);
		API.sendEvent(`${myUser.id}`, 'friend', `${player.pseudo} removed from friendlist.`);
		API.sendEvent(`${player.id}`, 'friend', `${myUser.pseudo} removed from your friendlist.`);
	};

	const block = async () => {
		await API.blockUser(player.id);
		API.sendEvent(`${myUser.id}`, 'friend', `${player.pseudo} added to your blocklist`);
		API.sendEvent(`${player.id}`, 'friend', `${myUser.pseudo} blocked you`);
	}

	return (
		<div className='bg-slate-500/ flex flex-col newMain items-start justify-center'>
			<div className='shadow-xl my-5 place-self-center bg-indigo-500/30 w-5/6 h-1/6 rounded-l-[5rem] rounded-r-xl flex'>
				<div className='relative -top-2 -left-3 w-[30%]'>
					<img src={player.urlPhotoProfile} className='rounded-full shadow-xl' />
				</div>
				<p className='text-white'>{selectedFriend.username}</p>
				<strong className='text-white text-xl place-self-center'>{player.pseudo}</strong>
			</div>
			<div className='shadow-xl bg-white/10 w-5/6 h-full place-self-center rounded-xl mb-5 text-white'>
				<Tabs isFitted defaultIndex={0} className='h-full'>
					<TabList>
						<Tab>Game History</Tab>
						<Tab>Options</Tab>
					</TabList>

					<TabPanels className='h-5/6'>
						<TabPanel className='h-full flex flex-col items-center'>
							{matches && matches.map((match: GameRecord) => {

								const targetPseudo = player.pseudo === match.playerA;

								let classColor = targetPseudo ? (match.scoreA > match.scoreB ? 'bg-emerald-500/70' : 'bg-pink-700/70') : (match.scoreB > match.scoreA ? 'bg-emerald-500/70' : 'bg-pink-700/70');
								if (match.scoreA === match.scoreB)
									classColor = 'bg-sky-500/10'
								return (
									<div key={match.id} className={`${classColor} flex flex-row justify-between w-full`}>
										<div>{match.playerA}</div>
										<div>{match.scoreA}:{match.scoreB}</div>
										<div>{match.playerB}</div>
									</div>
								)
							}
							)}
						</TabPanel>
						<TabPanel className='h-full flex flex-col items-center'>
							<button
								onClick={() => {
									fetchIsConnected(player.pseudo, (isConnected) => {
										(isConnected) && (window.location.href = `/game?pseudo=${player.pseudo}`);
									});
								}}
								className='h-10 w-[40%] bg-black/20 border border-1 my-5 flex items-center 
                            justify-center break-all text-ellipsis overflow-hidden text-white hover:bg-blue-500/20'
							>
								INVITE
							</button>
							<button
								onClick={removeFriend}
								className='h-10 w-[40%] bg-black/20 border border-1 my-5 flex items-center 
                            justify-center break-all text-ellipsis overflow-hidden text-white hover:bg-red-500/20'
							>
								REMOVE
							</button>
							<button
								onClick={block}
								className='h-10 w-[40%] bg-black/20 border border-1 my-5 flex items-center 
                            justify-center break-all text-ellipsis overflow-hidden text-white hover:bg-orange-500/20'
							>
								BLOCK
							</button>
						</TabPanel>
					</TabPanels>
				</Tabs>
			</div>
		</div>
	)
}

function PendingFriend({ selectedFriend, setSelectedFriend, refresh, setRefresh }: FriendsOptProps) {

	const player = selectedFriend.player;
	const myUser = API.getMyself();

	const acceptFriend = async () => {
		await API.acceptFriendRequest(player.id);
		const updatedFriend = { ...selectedFriend, status: 'Accepted' };
		setRefresh(!refresh);
		setSelectedFriend(updatedFriend);
		API.sendEvent(`${myUser.id}`, 'friend', `${player.pseudo} added to your friendlist.`);
		API.sendEvent(`${player.id}`, 'friend', `${myUser.pseudo} added to your friendlist.`);
	}

	const declineFriend = async () => {
		await API.declineFriendRequest(player.id);
		setSelectedFriend(null);
		setRefresh(!refresh);
		API.sendEvent(`${myUser.id}`, 'friend', `Declined friend invitation from ${player.pseudo}.`);
	};

	return (
		<div className='bg-slate-500/ flex flex-col newMain items-center justify-center'>
			<div className='-translate-y-1/5 h-1/2 w-1/2 flex flex-col justify-center items-center'>
				<div className='flex w-full justify-around'>

					<AnimatePresence mode='wait'>
						<motion.img
							key={player.id}
							src={player.urlPhotoProfile}
							className='rounded-full shadow-xl'
							initial={{ scale: 0.7 }}
							animate={{ scale: 1 }}
							exit={{ scale: 0.7 }}
							transition={flipTransition}
						/>
					</AnimatePresence>

				</div>
				<strong className='text-white'>{player.pseudo}</strong>
			</div>
			<div className='w-full flex justify-evenly'>
				<button
					onClick={acceptFriend}
					className='h-10 w-[40%] bg-white/20 border border-1 my-5 flex items-center 
                    justify-center break-all text-ellipsis overflow-hidden text-white hover:bg-blue-500/20'
				>
					Accept
				</button>
				<button
					onClick={declineFriend}
					className='h-10 w-[40%] bg-black/20 border border-1 my-5 flex items-center 
                    justify-center break-all text-ellipsis overflow-hidden text-white hover:bg-red-500/20'
				>
					Decline
				</button>
			</div>
		</div>
	)
}

export default function MainFriends({ selectedFriend, setSelectedFriend, refresh, setRefresh }: friendProps) {

	const [users, setUsers] = useState<any>(null);
	const [, forceRender] = useState<number>(0);
	const [slidePosition, setSlidePosition] = useState(63);
	const myUser = API.getMyself();
	const toast = useToast();

	const handleCreateFriendship = async (user: any) => {

		const targetUser = user;

		const res = await API.sendFriendRequest(targetUser.pseudo);

		if (typeof res === 'string') {
			return false;
		}
		API.sendEvent(`${user.id}`, 'friend', `${myUser.pseudo} sent you a friend request`);
		return true;
	};

	const handleRightCardClick = () => {

		const pos = slidePosition;
		let newPosition = slidePosition - 252;


		if (users && newPosition < -((users.length - 1) * 256)) {
			newPosition = pos;
		}


		setSlidePosition(newPosition);
	};

	const handleLeftCardClick = () => {


		const pos = slidePosition;
		let newPosition = slidePosition + 252;


		if (newPosition > 252) {
			newPosition = pos;
		}

		setSlidePosition(newPosition);
	};


	useEffect(() => {

		const getUsers = async () => {
			const AllUsers = await API.newUserList();
			return AllUsers;
		}
		getUsers().then((result) => setUsers(result));

	}, [refresh]);

	useEffect(() => {
		socket.emit('getConnection');

	}, []);

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
		const handleScroll = (e: WheelEvent) => {
			if (e.deltaY > 0) {
				handleRightCardClick();
			} else if (e.deltaY < 0) {
				handleLeftCardClick();
			}
		};

		window.addEventListener('wheel', handleScroll);

		return () => {
			window.removeEventListener('wheel', handleScroll);
		};
	}, [slidePosition]);

	if (!users)
		return <></>

	if (selectedFriend) {

		switch (selectedFriend.status) {
			case 'accepted':
				return <AcceptedFriend selectedFriend={selectedFriend} setSelectedFriend={setSelectedFriend} refresh={refresh} setRefresh={setRefresh} />
			case 'requested':
				return <PendingFriend selectedFriend={selectedFriend} setSelectedFriend={setSelectedFriend} refresh={refresh} setRefresh={setRefresh} />
			default:
				break;
		}
	}

	return (
		<>
			{users &&
				<div style={{}} className='bg-slate-500/ newMain flex justify-center overflow-hidden'>
					<motion.div
						initial={{
							opacity: 0, scale: 0.5,
						}}
						animate={{
							opacity: 1, scale: 1,
							translateX: `${slidePosition}px`,
						}}
						transition={{ duration: 0.5 }}
						className='carousel-wrapper w-full flex items-center'>
						{users.map((user: any, index: number) => {

							if (1 == 1 || index % 3 === 0) {
								return (
									<ProfilCard
										key={user.id}
										dataImage={user.urlPhotoProfile}
										header={<h1 className='ml-20 mb-10'>{user.pseudo}</h1>}
										content={
											<div key={user.id} className='flex h-7 z-10 my-5 justify-evenly items-center'>
												{user.blocked === false && (
													<>
														<motion.button key={0} onClick={async () => {
															const status = await handleCreateFriendship(user);

															let content = !status ? `A friend request has already been sent to ${user.pseudo}.`
																: `A friend request has been sent to ${user.pseudo}.`;

															toast({
																position: 'bottom-right',
																duration: 3000,
																render: () => (
																	<Box className='text-white shadow-2xl bg-black/70 border border-white rounded-xl' p={7}>
																		{content}
																	</Box>
																)
															})
														}} whileHover={{ scale: 1.25 }}><IoMdPersonAdd /></motion.button>

														<motion.button key={1} onClick={async () => {
															const res = await API.createMp({ name: `${myUser.pseudo};${user.pseudo}`, username: myUser.pseudo, type: 'private', conv: 1, oneId: `${myUser.userId}`, twoId: `${user.userId}` });
															API.mpEvent(`${myUser.userId}`, "", res);
														}} whileHover={{ scale: 1.25 }}><BiSolidMessageSquareDetail /></motion.button>
													</>
												)}

												<motion.button key={2} className={`${user.blocked ? 'text-pink-700' : 'text-white'}`} onClick={async () => {

													if (user.blocked) {
														API.sendEvent(`${user.id}`, 'friend', `${myUser.pseudo} unblocked you.`);
														API.sendEvent(`${myUser.userId}`, 'friend', `Sucessfully unblocked ${user.pseudo}.`);
														await API.unblockUser(`${user.userId}`);
													}
													else {
														API.sendEvent(`${user.id}`, 'friend', `${myUser.pseudo} blocked you.`);
														API.sendEvent(`${myUser.userId}`, 'friend', `Sucessfully blocked ${user.pseudo}.`);
														await API.blockUser(`${user.userId}`);
													}
												}}
													whileHover={{ scale: 1.25 }}><FaUserAltSlash /></motion.button>

											</div>
										}
										starter={-100}
										className='flex justify-center items-center h-3/6'
										cardClass={`shadow-md ${user.user.status === 'ONLINE' ? 'shadow-emerald-400' : user.user.status === 'OFFLINE' ? 'shadow-pink-700' : 'shadow-blue-500'}`}
										onClick={async () => {
											const status = await handleCreateFriendship(user);

											let content = !status ? `A friend request has already been sent to ${user.pseudo}.`
												: `A friend request has been sent to ${user.pseudo}.`;

											toast({
												position: 'bottom-right',
												duration: 3000,
												render: () => (
													<Box className='text-white shadow-2xl bg-black/70 border border-white rounded-xl' p={7}>
														{content}
													</Box>
												)
											})
										}}
									/>
								)
							} else if (index % 3 === 1) {
								return (
									<ProfilCard
										key={user.id}
										dataImage={user.urlPhotoProfile}
										header={<h1 className='mb-16 ml-10'>{user.pseudo}</h1>}
										content={<p></p>}
										className='flex justify-center items-center mx-7 h-3/6'
										cardClass={`shadow-md ${user.user.status === 'ONLINE' ? 'shadow-emerald-400' : user.user.status === 'OFFLINE' ? 'shadow-pink-700' : 'shadow-blue-500'}`}
										info='flex flex-col justify-center items-center'
										starter={0}
										onClick={async () => {
											const status = await handleCreateFriendship(user);

											let content = !status ? `A friend request has already been sent to ${user.pseudo}.`
												: `A friend request has been sent to ${user.pseudo}.`;
											toast({
												position: 'bottom-right',
												duration: 3000,
												render: () => (
													<Box className='text-white shadow-2xl bg-black/70 border border-white rounded-xl' p={7}>
														{content}
													</Box>
												)
											})
										}}

									/>
								)
							} else if (index % 3 === 2) {
								return (
									<ProfilCard
										key={user.id}
										dataImage={user.urlPhotoProfile}
										header={<h1 className='mb-16'>{user.pseudo}</h1>}
										content={<p></p>}
										starter={100}
										className='flex justify-center items-center h-3/6'
										cardClass={`shadow-md ${user.user.status === 'ONLINE' ? 'shadow-emerald-400' : user.user.status === 'OFFLINE' ? 'shadow-pink-700' : 'shadow-blue-500'}`}
										onClick={async () => {
											const status = await handleCreateFriendship(user);

											let content = !status ? `A friend request has already been sent to ${user.pseudo}.`
												: `A friend request has been sent to ${user.pseudo}.`;
											toast({
												position: 'bottom-right',
												duration: 3000,
												render: () => (
													<Box className='text-white shadow-2xl bg-black/70 border border-white rounded-xl' p={7}>
														{content}
													</Box>
												)
											})
										}}
									/>
								)
							} else {
								return (
									<ProfilCard
										key={user.id}
										dataImage={user.urlPhotoProfile}
										header={<h1 className='mb-16'>{user.pseudo}</h1>}
										content={<p></p>}
										starter={100}
										className='flex justify-center items-center h-3/6'
										cardClass={`shadow-md ${user.user.status === 'ONLINE' ? 'shadow-emerald-400' : user.user.status === 'OFFLINE' ? 'shadow-pink-700' : 'shadow-blue-500'}`}
										onClick={async () => {
											const status = await handleCreateFriendship(user);

											let content = !status ? `A friend request has already been sent to ${user.pseudo}.`
												: `A friend request has been sent to ${user.pseudo}.`;
											toast({
												position: 'bottom-right',
												duration: 3000,
												render: () => (
													<Box className='text-white shadow-2xl bg-black/70 border border-white rounded-xl' p={7}>
														{content}
													</Box>
												)
											})
										}}

									/>
								)
							}
						})}
					</motion.div>
				</div>
			}
		</>
	)
}