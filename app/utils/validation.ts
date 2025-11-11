// Check if the user is valid
export function isUser(user: unknown): user is { username: string } {
	return (
		typeof user === "object" &&
		user !== null &&
		"username" in user &&
		typeof (user as { username: unknown }).username === "string"
	);
}
