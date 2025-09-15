import { v2 as cloudinary } from 'cloudinary';
import { ENV } from './env.js';

cloudinary.config({
    cloud_name: ENV.CLOUDINARRY_CLOUD_NAME,
    api_key: ENV.CLOUDINARRY_API_KEY,
    api_secret: ENV.CLOUDINARRY_API_SECRET,
});

export default cloudinary;