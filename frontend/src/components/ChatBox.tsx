import styled, { keyframes } from "styled-components";
import { useChatBoxState } from "./ContextBoard";
import { useRef, useEffect, useState } from "react";
import SideMenu from "./ChatBox/SideMenu";

const zoomInOut = keyframes`
  0% {
    right: -500px;
  }
  100% {
    right: 20px;
  }
`;

const Container = styled.div`
  /* position: fixed; */
  right: 20px;
  bottom: 20px;
  z-index: 100;
`;

const ClosedBox = styled.div`
  width: 50px;
  height: 50px;
  background-color: #f1f1f1;
  border: 1px solid #ccc;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  `;

//------------------//

const Icon = styled.div`
    font-size: 24px;
  `;

//------------------//
const OpenBox = styled.div`
  position: relative;
  width: 500px;
  height: 500px;
  background-color: #f1f1f1;
  /* border: 1px solid #000000; */
  /* border-radius: 8px; */
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  animation: ${zoomInOut} 0.5s ease-out;
`;
//------------------ chat side ------------------//

const QuitBox = styled.div`
	width: 30px;
	height: 100%;
	position: absolute;
	right: 0%;
	background-color: #dd1a1a;
	display: flex;
	justify-content: center;
	align-items: center;
	cursor: pointer;
`;

const ChatContainer = styled.div`
  position: absolute;
  top: 0%;
  left: 30%;
  height: 100%;
  width: 70%;
  background-color: #807cc2;
`;

const ChatHeader = styled.div`
  display: flex; //
  justify-content: center; //
  align-items: center; //
  position: absolute;
  top: 0%;
  left: 0%;
  height: 15%;
  width: 100%;
  background-color: #4bd5df;
`;

const ChatBody = styled.div`
  display: flex; //
  justify-content: center; //
  align-items: center; //
  position: absolute;
  top: 15%;
  left: 0%;
  height: 75%;
  width: 100%;
  background-color: #905abb;
`;

const TopBar = styled.div`
	position: absolute;
	top: -2.8%;
  	left: 0;
  	height: 5%;
	z-index: 20;
  	width: 100%;
	/* border: 1px solid #000000; */
  	background-color: #ffe4e4;
`;

const ChatFooter = styled.div`
  display: flex; //
  justify-content: center; //
  align-items: center; //
  position: absolute;
  bottom: 0%;
  left: 0%;
  height: 10%;
  width: 100%;
  background-color: #166166;
`;




//------------------ chat side -- end ------------------//



export const ChatBox = () => {
	const { isChatBoxOpen, setIsChatBoxOpen } = useChatBoxState();
	const chatBoxRef = useRef<HTMLDivElement | null>(null); // Référence au conteneur du chat
	const handleClickOutside = (event: MouseEvent) => {
		if (chatBoxRef.current && !chatBoxRef.current.contains(event.target as Node)) {
			setIsChatBoxOpen(false);
		}
	};

	useEffect(() => {
		if (isChatBoxOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isChatBoxOpen]);

	return (
		<Container ref={chatBoxRef}> {/* Ajout de la référence ici */}
			{isChatBoxOpen ? (
				<OpenBox>
					<TopBar>
						<QuitBox onClick={() => setIsChatBoxOpen(false)}>
							<Icon>x</Icon>
						</QuitBox>
					</TopBar>
					<ChatContainer>
						<ChatHeader >
							ChatHeader
						</ChatHeader>
						<ChatBody>
							ChatBody
						</ChatBody>
						<ChatFooter>
							ChatFooter
						</ChatFooter>
					</ChatContainer>
					<SideMenu />
				</OpenBox>
			) : (
				<ClosedBox onClick={() => setIsChatBoxOpen(true)}>
					<Icon>Chat</Icon>
				</ClosedBox>
			)}
		</Container>
	);
};

