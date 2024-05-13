import styled from "styled-components";

const Button = styled.button`
    background-color: #955DDE;
	color: #ffffff;
	border: none;
	border-radius: 5px;
	width: 100px;
	height: 50px;
	font-size: 1.5rem;
	font-family: 'InknutAntiqua', sans-serif;
	
	cursor: pointer;
	margin-top: 20px;
	margin-bottom: 20px;
	&:hover {
		background-color: #b36b89;
	}
`;


export default function Logout() {

    const handleClearData = () => {
        // Remove specific items from localStorage
        localStorage.removeItem('player');
        localStorage.removeItem('jwt_token');

        // Clear all cookies
        document.cookie.split(";").forEach((c) => {
			document.cookie = c
			  .replace(/^ +/, "")
			  .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
		  });

        // Redirect to the desired URL
        window.location.href = import.meta.env['VITE_FRONT_URL'];
    };

    return (
        <>
		<Button onClick={handleClearData}>Logout</Button>
        </>
    );
}