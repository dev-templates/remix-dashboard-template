// Check if the password is valid
export function validatePassword(password: string) {
	return typeof password === "string" && password.length > 3;
}

// Check if the username is valid
export function validateUsername(username: string) {
	if (typeof username !== "string") {
		return false;
	}
	if (username.length < 4 || username.length > 64) {
		return false;
	}

	const validCharsRegex = /^[a-zA-Z0-9_-]+$/;
	if (!validCharsRegex.test(username)) {
		return false;
	}

	if (!/^[a-zA-Z]/.test(username)) {
		return false;
	}

	return true;
}
