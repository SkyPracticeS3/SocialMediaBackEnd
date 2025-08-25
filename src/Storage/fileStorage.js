import multer from "multer";
import path, {dirname} from 'path';
import { fileURLToPath } from "url";

const dirName = dirname(fileURLToPath(import.meta.url));


const storage = multer.diskStorage({
    destination: path.join(dirName, '../pfps'),
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));        
    }
});

export const fileUploader = multer({storage});