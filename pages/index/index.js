// index.js
const app = getApp()
const API_BASE_URL = 'https://knowledgecreationtime-eparhedpcbgyg8h3.eastasia-01.azurewebsites.net/KCTBackend'

Page({
  data: {
    inputText: '',
    tempImagePath: '',
    generatedContent: '',
    isGenerating: false
  },

  onTextInput(e) {
    this.setData({
      inputText: e.detail.value
    })
  },

  async chooseImage() {
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera']
      })
      
      this.setData({
        tempImagePath: res.tempFiles[0].tempFilePath,
        inputText: '' // 清空文字输入
      })
    } catch (error) {
      console.error('选择图片失败:', error)
      wx.showToast({
        title: '选择图片失败',
        icon: 'none'
      })
    }
  },

  async generateContent() {
    if (!this.data.inputText && !this.data.tempImagePath) {
      wx.showToast({
        title: '请输入文字或上传图片',
        icon: 'none'
      })
      return
    }
    console.log("test1");
    this.setData({ isGenerating: true })
    console.log("test2");
    try {
      let result
      if (this.data.tempImagePath) {
        // 处理图片
        result = await this.processImage()
      } else {
        // 处理文字
        console.log("test3");
        result = await this.processText();
        console.log("test4");
      }

      this.setData({
        generatedContent: result,
        isGenerating: false
      })
    } catch (error) {
      console.error('生成文案失败:', error)
      wx.showToast({
        title: '生成文案失败，请重试',
        icon: 'none'
      })
      this.setData({ isGenerating: false })
    }
  },

  async processImage() {
    // 上传图片到服务器
    const uploadRes = await wx.uploadFile({
      url: `${API_BASE_URL}/upload`,
      filePath: this.data.tempImagePath,
      name: 'image',
      header: {
        'content-type': 'multipart/form-data'
      }
    })

    if (uploadRes.statusCode !== 200) {
      throw new Error('上传图片失败')
    }

    // 调用生成文案API
    const response = await wx.request({
      url: `${API_BASE_URL}`,
      method: 'POST',
      data: {
        type: 'image',
        imageUrl: JSON.parse(uploadRes.data).url
      }
    })

    if (response.statusCode !== 200) {
      throw new Error('生成文案失败')
    }

    return response.data.content
  },

  async processText() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${API_BASE_URL}`,
        method: 'POST',
        header: {
          'content-type': 'application/json'
        },
        data: {
          type: 'Text',
          content: this.data.inputText
        },
        success: function(res) {
          resolve(res.data.content)
        },
        fail: function(err) {
          reject(new Error('生成文案失败, ' + err))
        }
      })
    })
  },

  copyContent() {
    wx.setClipboardData({
      data: this.data.generatedContent,
      success: () => {
        wx.showToast({
          title: '复制成功',
          icon: 'success'
        })
      }
    })
  }
})
