//403 forbidden 
//401 token/cookie 
//428 preconditon required

import React from 'react'

type Props = {
	codeError: number
}

const Guard = ({codeError}: Props) => {
	// if (codeError === 403)
	// if (codeError === 401)
	// if (codeError === 428)
}

export default Guard