import './styles/App.css';
import { useLocation, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Home from './pages/Home';
import Profil from './pages/Profil';
import Game from './pages/Game';
import { ChatBoxContext } from './components/ContextBoard';
import { GlobalStyle } from './styles/HomeStyles';
import AnimatedPage from './components/AnimatedPage';
import { Connection } from './components/Connection';
import { ChakraProvider } from '@chakra-ui/react'
import NewChatBox from './components/modalChat/Chatbox';
import { useGLTF } from '@react-three/drei';
import { LoadingContext } from './components/ContextBoard';
import HomeLoading from './pages/loadingPages/HomeLoading';
import { useEffect } from 'react';
import { ReadyContext } from './components/ContextBoard';
import ChatConnexion from './components/ChatConnexion';



const ChargingTime = 10;
const intervalTime = 10;

function App() {
	const location = useLocation();
	const [isChatBoxOpen, setChatBoxOpen] = useState<boolean>(false);
	const [ready, setReady] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState(true);
	const [elapsedTime, setElapsedTime] = useState(0);

	useEffect(() => {
		const startTime = Date.now();
		const interval = setInterval(() => {
			const currentelapsedTime = Date.now() - startTime;
			setElapsedTime(prevTime => (prevTime + (intervalTime / (ChargingTime / 100))));
			if (currentelapsedTime >= ChargingTime) {
				clearInterval(interval);
				setIsLoading(false);
			}
		}, intervalTime);

		return () => {
			clearInterval(interval);
			// console.log('Component will unmount');
		}
	}, []);




	if (isLoading) {
		return (
			<LoadingContext.Provider value={elapsedTime.toFixed()}>
				<HomeLoading>
				</HomeLoading>
			</LoadingContext.Provider>
		)
	}

	return (
		<ChakraProvider>
			<GlobalStyle />
			<Connection>
				<ReadyContext.Provider value={{ setReady, ready }}>
					<ChatConnexion isLoading={isLoading} />
					<ChatBoxContext.Provider value={{ isChatBoxOpen, setChatBoxOpen }}>
						<AnimatePresence mode="wait">
							<Routes location={location} key={location.pathname}>
								<Route index element={
									<Home />
								} />

								<Route path="/game" element={
									<Game />
								} />

								<Route path="/profile" element={
									<AnimatedPage endColor="#71ca71">
										<Profil />
									</AnimatedPage>} />

							</Routes>
						</AnimatePresence>
						{ready && <NewChatBox ready={ready} />}
					</ChatBoxContext.Provider>
				</ReadyContext.Provider>
			</Connection>
		</ChakraProvider>
	)
}
export default App



useGLTF.preload('./assets/low_poly_rock-transformed.glb');
useGLTF.preload('./assets/42.gltf');
useGLTF.preload("./assets/font_menu.glb");
useGLTF.preload("./assets/balls&paddles/Balls&Paddles.glb");
useGLTF.preload("./assets/balls&paddles/retroBall.glb");
useGLTF.preload("./assets/maps/MedievalMap.glb");
useGLTF.preload("./assets/maps/RetroMap.glb");
useGLTF.preload("./assets/maps/NinjaMap.glb");
useGLTF.preload("./assets/maps/WesternMap.glb");
useGLTF.preload("./assets/balls&paddles/retroPaddle.glb");

