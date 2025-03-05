require('dotenv').config()
const express = require('express')
const multer = require('multer')
const cors = require('cors')
const OpenAI = require('openai')
const Tesseract = require('tesseract.js')
const path = require('path')
const fs = require('fs')

const app = express()
const port = process.env.PORT || 3000

// 配置Azure OpenAI
const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_ENDPOINT,
  defaultQuery: { 'api-version': '2023-05-15' },
  defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY }
})

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/'
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir)
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage })

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static('uploads'))

// 处理图片上传
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有上传文件' })
  }
  
  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
  res.json({ url: imageUrl })
})

// 生成文案
app.post('/generate', async (req, res) => {
  try {
    const { type, content, imageUrl } = req.body
    console.log("test1");
    let prompt = ''
    if (type === 'text') {
      prompt = `请根据以下内容生成一段富有创意的营销文案：\n${content}`
    } else if (type === 'image') {
      // 使用Tesseract进行OCR
      const result = await Tesseract.recognize(
        imageUrl,
        'chi_sim+eng',
        { logger: m => console.log(m) }
      )
      
      prompt = `请根据这张图片中的文字内容："${result.data.text}"生成一段富有创意的营销文案。`
    }

    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: "你是一位专业的文案撰写专家，擅长创作富有创意和吸引力的营销文案。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    res.json({ content: completion.choices[0].message.content.trim() })
  } catch (error) {
    console.error('生成文案失败:', error)
    res.status(500).json({ error: '生成文案失败' })
  }
})

// 清理上传的文件
const cleanupUploads = () => {
  const uploadDir = 'uploads/'
  if (fs.existsSync(uploadDir)) {
    fs.readdir(uploadDir, (err, files) => {
      if (err) throw err
      
      for (const file of files) {
        fs.unlink(path.join(uploadDir, file), err => {
          if (err) throw err
        })
      }
    })
  }
}

// 定期清理上传的文件（每小时）
setInterval(cleanupUploads, 3600000)

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`)
}) 