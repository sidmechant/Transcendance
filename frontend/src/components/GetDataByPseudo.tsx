import React from 'react'
import { useState, useEffect } from 'react'
import { getDataByPseudoApi } from './FetchApi'
import styled from 'styled-components';
import { UserInfoType } from '../../types/Ux';
import { set } from 'math/vec2';

const Input = styled.input`
    padding: 10px;
    margin-top: 20px;
    margin-bottom: 5px;
    border-radius: 4px;
    border: 1px solid #ccc;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: bold;
  border: none;
  background-color: #007bff;
  color: white;
  cursor: pointer;
`;

const ErrorDiv = styled.div`
    color: red;
    `;


const StyledImage = styled.img`
  width: 300px;
  height: 300px;
  object-fit: cover;
`;


const ContainerProfil = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	border: 1px solid black;
	border-radius: 5px;
`;

type Props = {}

const GetDataByPseudo = (props: Props) => {
    const [pseudo, setPseudo] = useState<string>("");
    const [errorPseudo, setErrorPseudo] = useState<string | null>(null);
    const [playerData, setPlayerData] = useState<UserInfoType | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPseudo(e.target.value);
        setErrorPseudo(null);

    };

    const handleSubmit = async () => {
        try {
            const data = await getDataByPseudoApi(pseudo);
            setPlayerData({ pseudo: data.pseudo, urlPhoto: data.urlPhotoProfile });
            setPseudo("");
            setErrorPseudo(null);
        } catch (error) {

            if (typeof error === 'object' && error !== null && 'message' in error) {
                setErrorPseudo("Le joueur \"" + pseudo + "\" n'existe pas");
                setPlayerData(null);
            } else {
                setErrorPseudo("Une erreur est survenue");
            }
        }
    };

    return (
        <>
            <h3>Get Data By Pseudo</h3>
            <Input
                type="text"
                placeholder="Enter pseudo"
                value={pseudo}
                onChange={handleInputChange}
            />
            <Button onClick={handleSubmit}>Get Data</Button>
            {errorPseudo && <ErrorDiv>{errorPseudo}</ErrorDiv>}
            {(!playerData) ? (
                null
            ) : (
                <ContainerProfil>

                    <h2>Pseudo: {playerData.pseudo}</h2>
                    <StyledImage src={playerData.urlPhoto} alt="Profile picture" />
                </ContainerProfil>
            )}
        </>
    )
}

export default GetDataByPseudo