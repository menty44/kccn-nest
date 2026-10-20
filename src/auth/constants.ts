export const jwtConstants = {
	secret: process.env.JWT_SECRET ?? 'development-only-secret-change-before-production',
};
