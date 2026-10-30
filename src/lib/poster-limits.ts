// Poster upload rules (brief §5), shared by the browser form and the server.
// Kept apart from cloudinary.ts, which uses Node's crypto and must stay server-side.

export const POSTER_FOLDER = "camac/posters";
export const POSTER_FORMATS = "jpg,png,webp";
export const POSTER_ACCEPT = "image/jpeg,image/png,image/webp";
export const POSTER_MAX_BYTES = 5 * 1024 * 1024;
