import { ReactElement, ReactNode, useEffect, useState } from 'react';
import HomeLoading from '../pages/loadingPages/HomeLoading.tsx';
import { AuthInProgress, ButtonAutentification } from '../pages/loadingPages/Authentification.tsx';
import { getPlayerDataApi } from './Profil/FetchApi.tsx';
import socket from '../socket.ts';
import UpdateInfo from './Profil/ChangeInfo.tsx';
import { UserInfosContext, useUserInfos } from './ContextBoard.tsx';
import TwoFA from './Profil/TwoFA.tsx';
import { Socket } from "socket.io-client";

export let client: Socket | undefined = undefined;

type UserInfos = {
	pseudo: string;
	urlPhoto: string;
	role?: string;
};

function getToken(token: string): string | undefined {
	return document.cookie
		.split('; ')
		.find(row => row.startsWith(token + '='))
		?.split('=')[1];
};

export function SetConnection({ children }: { children: ReactNode }): ReactElement {
	const [token, setToken] = useState<string | undefined>(undefined);
	const [jwtToken, setJwtToken] = useState<string | undefined>(undefined);
	const [apiData, setApiData] = useState<any>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isUser, setIsUser] = useState<boolean | undefined>(undefined);
	const [firstLoad, setFirstLoad] = useState<boolean>(true);
	const { userInfo, setUserInfo, isConnected, setIsConnected,
		needToReload, setNeedToReload, is2FAActive, setIs2FAActive,
		needToAuthentified, setNeedToAuthentified } = useUserInfos();

	useEffect(() => {
		if (is2FAActive === undefined) {
			const test = getToken('2fa_token');
			if (test) {
				setIs2FAActive(true);
				setNeedToAuthentified(false);
			}
			else
				setIs2FAActive(false);
		}
	}), [];

	const checkForToken = (closeWindow: Window) => {
		const interval = setInterval(() => {

			let localToken = getToken('token');
			if (localToken) {

				setIsLoading(false);
				clearInterval(interval);
				setToken(localToken);
				try {
					closeWindow.close();
				} catch (err) {
					console.error("Couldn't close the window: ", err);
				}
			}
			else if (closeWindow.closed) {
				setIsConnected(false);
				setIsLoading(false);
				clearInterval(interval);
				// Afficher une notification pour inviter l'utilisateur à essayer de se connecter à nouveau
				alert('Fenêtre fermée. Veuillez essayer de vous connecter à nouveau.');
				return;
			}
		}, 1000);
	};

	const startAuthProcess = () => {

		setIsLoading(true);
		const newWindow = window.open(`${import.meta.env['VITE_API_URL']}/42/login`, '_blank');
		newWindow && checkForToken(newWindow);
	};


	useEffect(() => {
		if (userInfo) {
			if (userInfo.pseudo) {
				setJwtToken(jwtToken);
				client = socket;
				setIsUser(true);
			}
			else
				setIsUser(false);
		}
	}, [userInfo]);

	useEffect(() => {
		if (jwtToken)
			setIsConnected(true);
		else
			setIsConnected(false);
	}, [jwtToken]);

	useEffect(() => {
		if (needToReload) {
			setNeedToReload(false);
			const fetchData = async () => {
				try {

					const data = await getPlayerDataApi();
					setIsConnected(true);
					if (data.role === 'USER') {
						setIsUser(true);
					}
					else
						setIsUser(false);
					setUserInfo({ pseudo: data.player.pseudo, urlPhoto: data.player.urlPhotoProfile });
				} catch (error: any) {
					if (error && error.statusCode === 428) {
						setNeedToAuthentified(true);
					}
					if (error && error.statusCode === 401) {
						setIsUser(false);
						setIsConnected(false);
					}
					if (error && error.statusCode === 403) {
						setIsUser(false);
						setIsConnected(false);
						if (token) {
							setToken(undefined);
							setJwtToken(undefined);
						}
					}
				}
			};
			fetchData();
		}
	}
		, [needToReload]);


	useEffect(() => {
		if (apiData) {
			setNeedToReload(true);
			setJwtToken(getToken('jwt_token'));
		}
	}, [apiData]);

	useEffect(() => {

		if (token) {
			const fetchData = async () => {
				try {
					const response = await fetch(`${import.meta.env['VITE_API_URL']}/42/user`, {
						headers: { 'Authorization': `Bearer ${token}` },
						credentials: 'include'
					});
					const data = await response.json();
					setApiData(data);
				} catch (error) {
					console.error("Erreur lors de l'obtention du JWT:", error);
				}
			}
			fetchData();
		};
	}, [token]);


	useEffect(() => {
		setInterval(() => {
			setFirstLoad(false);
		}
			, 2000);
	}
		, []);

	if (needToAuthentified === true) {
		return (
			<HomeLoading>
				<TwoFA handle2FAActivation={() => { setNeedToAuthentified(false), setIsConnected(true), setIsUser(true) }} isInTheLobby={true}/>
			</HomeLoading>
		)
	}
	return (
		<>
			{(isUser && isConnected) ? (
				children
			) : (
				<HomeLoading>
					{firstLoad ?
						(<></>)
						: !isConnected ?
							(isLoading ?
								(<AuthInProgress />)
								: (<ButtonAutentification startAuthProcess={startAuthProcess} />))
							: (<UpdateInfo name={null} onFirstUpdate={true} />)}
				</HomeLoading>
			)}
		</>
	)
}

export function Connection({ children }: { children: ReactNode }): ReactElement {
	const [isConnected, setIsConnected] = useState<boolean>(false);
	const [userInfo, setUserInfo] = useState<UserInfos | null>(null);
	const [needToReload, setNeedToReload] = useState<boolean>(true);
	const [is2FAActive, setIs2FAActive] = useState<boolean | undefined>(undefined);
	const [is2FAVerified, setIs2FAVerified] = useState<boolean | undefined>(undefined);

	return (
		<>
			<UserInfosContext.Provider value={{
				userInfo: userInfo, setUserInfo: setUserInfo,
				isConnected: isConnected, setIsConnected: setIsConnected,
				needToReload: needToReload, setNeedToReload: setNeedToReload,
				is2FAActive: is2FAActive, setIs2FAActive: setIs2FAActive,
				needToAuthentified: is2FAVerified, setNeedToAuthentified: setIs2FAVerified
			}}>
				<SetConnection>
					{children}
				</SetConnection>
			</UserInfosContext.Provider>
		</>
	)
}