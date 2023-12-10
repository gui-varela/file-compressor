import express from "express"
import ffmpeg from "fluent-ffmpeg"
import multer from "multer"
import fs from "fs"

const app = express()

app.use(express.json())

const outputPath = "outputdata"

const compressFile = (uploadFile, outputFile) => {
    ffmpeg()
        .input(uploadFile)
        .audioCodec('libmp3lame') // Escolha o codec MP3 (libmp3lame)
        .audioFrequency(44100) // Defina a frequência de amostragem desejada (exemplo: 44100 Hz)
        .audioBitrate(192) // Defina a taxa de bits desejada (exemplo: 192 kbps)
        .save(outputFile)
        .on('end', () => {
            console.log('Conversão para MP3 concluída');
        })
        .on('error', (err) => {
            console.error('Erro ao converter para MP3:', err);
        });
}

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

const upload = multer({ storage: storage })

app.post('/', upload.single('audio'), (req, res) => {
    const uploadFile = req.file

    if (!uploadFile.mimetype.includes("audio")) {
        res.statusCode = 400
        res.send({ 
            error: "são aceitos apenas arquivos de áudio"
        })

        throw new Error("Apenas arquivos de áudio podem ser enviados")
    }

    const fileName = `uploads/${uploadFile.originalname}`
    const outputFile = 
        uploadFile.filename.includes(".wav") 
        ? `${outputPath}/${uploadFile.filename}`.replace(".wav", ".mp3")
        : `${outputPath}/${uploadFile.filename}`
   

    try {
        compressFile(fileName, outputFile)
    }
    catch (err) {
        res.statusCode = 500
        res.send({ 
            message: `seu arquivo não pode ser criado. ${err.message}` 
        })
    }

    const destFileStats = fs.statSync(outputFile)

    res.statusCode = 201
    res.json({
        message: "seu arquivo foi criado",
        originalSize: formatFileSize(uploadFile.size),
        compressionSize: formatFileSize(destFileStats.size),
        compressionReason: destFileStats.size/uploadFile.size
    })
})

const formatFileSize = (fileSize) => {
    if (fileSize / (1024*1024) > 1) {
        return {
            size: fileSize / (1024*1024),
            sizeOrder: "MB"
        }
    } else {
        return {
            size: fileSize / 1024,
            sizeOrder: "KB"
        }
    }
}


app.listen(3333, () => { console.log('Server running on 3333!') })